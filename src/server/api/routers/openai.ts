import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";
import { type AudioData } from "~/types/elevenlabs";
import { env } from "~/env";
import { WebSocket } from "ws";
import { voiceId, model, wsUrl } from "~/server/services/elevenlabs";
import { type Stream } from "openai/streaming.mjs";
import { type ChatCompletionChunk } from "openai/resources/index.mjs";

// create a global event emitter (could be replaced by redis, etc)
const ee = new EventEmitter();

export const openaiRouter = createTRPCRouter({
  streamAudio: publicProcedure.subscription(() => {
    return observable<{ chunk: string }>((emit) => {
      const listener = (chunk: string) => {
        console.log("CHUNK: " + chunk.substring(0, 50));
        emit.next({ chunk });
        //console.log("Received audio chunk", chunk);
      };

      ee.on("audioChunk", listener);

      return () => {
        ee.off("audioChunk", listener);
      };
    });
  }),

  // I think this shit works now
  sendTextAndImages: publicProcedure
    .input(
      z.object({
        audioBase64: z.optional(z.string()),
        imagesBase64: z.array(z.string()),
        // coordinates that come as  [x, y]
        coordinates: z.object({
          lng: z.number(),
          lat: z.number(),
        }),
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
            image_url: {
              url: base64Image,
              detail: "high",
            }, // Assuming JPEG format
          }) as const,
      );

      const content = [...possiblePrompt, ...imageContents];
      // console.log("PROMPT: " + possiblePrompt)
      console.log(possibleText ? `Prompt: ${possibleText}` : "No Prompt");

      const results = await ctx.mapbox.geocodingService
        .forwardGeocode({
          query: "restaurant", // Adjust this keyword for different types of food places if necessary
          proximity: [input.coordinates.lng, input.coordinates.lat], // Encourage results near these coordinates
          limit: 5, // Limit the results to 5
          types: ["poi"], // Point of interest
          // Mapbox does not directly support a distance filter in the geocoding API request,
          // so there's no built-in way to limit results to 5km distance.
        })
        .send();

      const stores = results.body.features.map(
        (feature) =>
          ({
            name: feature.text, // or feature.properties.name based on the API response structure
            address: feature.place_name, // or a more detailed assembly if needed
            coordinates: feature.geometry.coordinates,
          }) as const,
      );

      console.log(`Stores nearby: ${stores.map((s) => s.name).join(" ")}`);

      let response: Stream<ChatCompletionChunk>;

      try {
        response = await ctx.openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          //model: "gpt-3.5-turbo-0125",
          messages: [
            {
              role: "system",
              content:
                `You are acting as the eyes for a blind person. Images from their camera will be provided, and your job is to act as if you're there and describe IMPORTANT things they can see. Don't describe a garbage can off to the side unless they specifically ask about it. It's important you also warn them about potentially hazards, such as walls, water, holes, tripping hazards, etc, as they are BLIND and cannot SEE. If you do not warn them, they might get seriously injured! Be sure to stray on the side of caution when it comes to warning them.
The blind person may also provide a query alongside the camera image, which you should answer using the information in the image. Be sure to still warn them about hazards in the image! 
When describing the camera image, respond in a short passive way. Don't refer to the image directly, like "The image shows ...", instead say "There is a ...". Make sure your responses are short and straight to the point. Do not exceed 2 sentence responses! Do not comment on the quality of the images.

The person can also ask about nearby restaurants, so if asked, here is a list of nearby restaurants (within 5km):
${stores
  .map((store) => `'${store.name}' at ${store.address.split(", ")[1]}`)
  .join("\n")}
Don't mention how you received this information, act as if you searched it up.

If the question doesn't relate to the image, don't mention anything about the image UNLESS a credible threat to the person is present.
`.trim(),
            },
            {
              role: "user",
              content,
            },
          ],
          stream: true,
          max_tokens: 1000,
        });
      } catch (err) {
        console.error(err);
        throw new Error("GPT4 REQUEST FAILED");
      }

      const socket = new WebSocket(wsUrl);

      // 2. Initialize the connection by sending the BOS message
      socket.onopen = function (_event) {
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

          let accum = "";
          for await (const message of response) {
            const chunk = message.choices[0]?.delta.content ?? null;

            // TODO: might want to just not start the elevenlabs connection if there's no text
            // have to start streaming chatgpt earlier then.
            if (chunk === "NOINFO") {
              console.log("no information from chatgpt");
              break;
            }

            if (chunk !== null) {
              accum += chunk;
              const chunks = accum.split(/(?<=[.!?])(?=\s|$)/);
              if (chunks.length > 1) {
                const sentence = chunks[0]!;
                accum = chunks.slice(1).join("");
                console.log(
                  `sending chunk: "${
                    sentence.trim() + " "
                  }" (${chunk}) (${sentence}) (${chunks})`,
                );

                const textMessage = {
                  text: sentence.trim() + " ",
                  try_trigger_generation: true,
                };

                socket.send(JSON.stringify(textMessage));
              }
            }
          }

          if (accum) {
            const textMessage = {
              text: accum.trim() + " ",
              try_trigger_generation: true,
            };

            console.log(`sending final chunk: "${accum.trim() + " "}"`);

            socket.send(JSON.stringify(textMessage));
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
        ee.emit("audioChunk", response.audio);

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
