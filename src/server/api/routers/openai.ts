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

  // This shit probably works idk
  sendTextAndImages: publicProcedure
    .input(
      z.object({
        audioBase64: z.optional(z.string()),
        imagesBase64: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let possibleText = "";

      if (input.audioBase64) {
        const audio = Buffer.from(input.audioBase64, "base64");

        const { result, error } =
          await ctx.deepgram.listen.prerecorded.transcribeFile(audio, {
            model: "nova-2",
          });

        if (error) {
          console.error("Error with Deepgram API: ", error);
        }

        possibleText =
          result?.results.channels[0]?.alternatives[0]?.transcript ?? "";
      }

      const possiblePrompt = possibleText
        ? [{ type: "text", text: possibleText } as const]
        : [];

      const imageContents = input.imagesBase64.map(
        (base64Image) =>
          ({
            type: "image_url",
            image_url: { url: base64Image }, // Assuming JPEG format
          }) as const,
      );

      const content = [...possiblePrompt, ...imageContents];

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

          const sentenceBreaks = [".", "!", "?"];
          let accum = "";
          for await (const message of response) {
            const chunk = message.choices[0]?.delta.content ?? null;

            if (chunk) {
              if (
                sentenceBreaks.some(
                  (punctuation) =>
                    chunk.endsWith(punctuation) ||
                    chunk.includes(punctuation + " "),
                )
              ) {
                const chunks = chunk.split(/(?<=[.!?])(?=\s|$)/);
                const sentences = accum + chunks.slice(0, -1).join("");
                accum = chunks[chunks.length - 1] ?? "";

                const textMessage = {
                  text: sentences.trim() + " ",
                  try_trigger_generation: true,
                };

                socket.send(JSON.stringify(textMessage));
              } else {
                accum += chunk;
              }
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
