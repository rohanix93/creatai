import OpenAI from "openai";

let _client: OpenAI | null = null;

export function openai() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return _client;
}

export const MODELS = {
  analysis: process.env.OPENAI_MODEL_ANALYSIS || "gpt-4o-mini",
  chat: process.env.OPENAI_MODEL_CHAT || "gpt-4o-mini",
  vision: process.env.OPENAI_MODEL_VISION || "gpt-4o-mini", // gpt-4o-mini supports vision
  transcription: "whisper-1",
} as const;
