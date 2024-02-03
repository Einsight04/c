import { OpenAI } from "openai";
import { env } from "~/env";

const global = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  global.openai ?? new OpenAI({ apiKey: env.OPEN_AI_API_KEY });
global.openai = openai;
