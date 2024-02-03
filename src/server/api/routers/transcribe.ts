import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const transcribeRouter = createTRPCRouter({
  transcribe: publicProcedure
    .input(z.string())
    .output(z.object({
      result: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const audio = Buffer.from(input, "base64");

      const { result, error } = await ctx.deepgram.listen.prerecorded.transcribeFile(
        audio,
        {
          model: "nova-2"
        }
      );

      if (error) {
        console.error("Error with Deepgram API: ", error);
      }

      return {
        result: result?.results.channels[0]?.alternatives[0]?.transcript ?? ''
      }
    }),
});