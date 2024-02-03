import { createTRPCRouter } from "~/server/api/trpc";
import { openaiRouter } from "./routers/openai";
import { transcribeRouter } from "./routers/transcribe";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  openai: openaiRouter,
  transcribe: transcribeRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
