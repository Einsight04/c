import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";
import { type AudioData } from "~/types/elevenlabs";
import { env } from "~/env";
import { WebSocket } from "ws";

const voiceId = "21m00Tcm4TlvDq8ikWAM"; // replace with your voice_id
const model = "eleven_monolingual_v1";
const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;

// create a global event emitter (could be replaced by redis, etc)
const ee = new EventEmitter();

const textChunker = async function* (chunks: AsyncIterable<string>) {
  const splitters = [
    ".",
    ",",
    "?",
    "!",
    ";",
    ":",
    "—",
    "-",
    "(",
    ")",
    "[",
    "]",
    "}",
    " ",
  ];
  let buffer = "";

  for await (const text of chunks) {
    if (splitters.includes(buffer.slice(-1))) {
      yield buffer + " ";
      buffer = text;
    } else if (splitters.includes(text[0] ?? "")) {
      yield buffer + text[0] + " ";
      buffer = text.slice(1);
    } else {
      buffer += text;
    }
  }

  if (buffer) {
    yield buffer + " ";
  }
};

export const openaiRouter = createTRPCRouter({
  streamAudio: publicProcedure.subscription(() => {
    return observable<{ chunk: string }>((emit) => {
      const listener = (chunk: string) => {
        emit.next({ chunk });
      };

      ee.on("audioChunk", listener);

      return () => {
        ee.off("audioChunk", listener);
      };
    });
  }),
  sendTextAndImages: publicProcedure
    .input(
      z.object({ text: z.optional(z.string()), images: z.array(z.string()) }),
    )
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

      const socket = new WebSocket(wsUrl);

      // 2. Initialize the connection by sending the BOS message
      socket.onopen = function (event) {
        const handleContentChunking = async () => {
          const bosMessage = {
            text: " ",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
            },
            xi_api_key: env.ELEVENLABS_API_KEY,
          };

          socket.send(JSON.stringify(bosMessage));

          for await (const message of response) {
            const chunk = message.choices[0]?.delta.content ?? null;

            // 3. Send the input text message
            if (chunk) {
              contentChunks.push(chunk);

              const textMessage = {
                text: chunk,
                try_trigger_generation: true,
              };

              socket.send(JSON.stringify(textMessage));
            }
          }

          // 4. Send the EOS message with an empty string
          const eosMessage = {
            text: "",
          };

          socket.send(JSON.stringify(eosMessage));
        };

        void handleContentChunking();
      };

      // 5. Handle server responses
      socket.onmessage = function (event) {
        const response = JSON.parse(event.data as string) as AudioData;

        console.log("Server response:", response);

        if (response.audio) {
          // decode and handle the audio data (e.g., play it)
          const audioChunk = atob(response.audio); // decode base64
          console.log("Received audio chunk", audioChunk.length);
          ee.emit("audioChunk", audioChunk.length);
          console.log("Received audio chunk");
        } else {
          console.log("No audio data in the response");
        }

        if (response.isFinal) {
          // the generation is complete
        }

        if (response.normalizedAlignment) {
          // use the alignment info if needed
        }
      };

      // Handle errors
      socket.onerror = function (error) {
        console.error("WebSocket Error:", error);
      };

      // Handle socket closing
      socket.onclose = function (event) {
        if (event.wasClean) {
          console.info(
            `Connection closed cleanly, code=${event.code}, reason=${event.reason}`,
          );
        } else {
          console.warn("Connection died");
        }
      };
    }),
});
