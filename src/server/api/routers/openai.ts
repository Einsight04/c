import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";

// create a global event emitter (could be replaced by redis, etc)
const ee = new EventEmitter();

export const openaiRouter = createTRPCRouter({
  streamContent: publicProcedure.subscription(() => {
    return observable<{ chunk: string }>((emit) => {
      const listener = (chunk: string) => {
        emit.next({ chunk });
      };

      ee.on("contentChunk", listener);

      return () => {
        ee.off("contentChunk", listener);
      };
    });
  }),
  
  // This shit probably works idk
  sendTextAndImages: publicProcedure
    .input(z.object({ text: z.string(), images: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const possibleText = input.text
        ? [{ type: "text", text: input.text } as const]
        : [];

      const imageContents = input.images.map(
        (base64Image) =>
          ({
            type: "image_url",
            image_url: { url: base64Image }, // Assuming JPEG format
          }) as const,
      );

      const content = [...possibleText, ...imageContents];

      const response = await ctx.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content,
          },
        ],
        stream: true,
      });

      const contentChunks: string[] = [];

      for await (const message of response) {
        const chunk = message.choices[0]?.delta.content ?? null;
        ee.emit("contentChunk", chunk);
        contentChunks.push(chunk ?? "");
      }

      return { message: contentChunks.join("") };
    }),
});
