import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { openai } from "~/server/services/openai";

export const openaiRouter = createTRPCRouter({
  sendTextAndImages: publicProcedure
    .input(z.object({ text: z.string(), images: z.array(z.string()) }))
    .mutation(async ({ input }) => {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content,
          },
        ],
      });

      return response.choices[0]?.message.content ?? null;
    }),
});
