import { DeepgramClient, createClient } from "@deepgram/sdk";

const global = globalThis as unknown as {
  deepgram: DeepgramClient | undefined;
};

export const deepgram = global.deepgram ?? createClient("7fdd90b037fe69ce3675064cb890849c6b8d41eb");
global.deepgram = deepgram;
    