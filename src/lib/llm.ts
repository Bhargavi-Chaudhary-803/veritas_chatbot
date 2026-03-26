import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import OpenAI from "openai";

type ProviderResult = {
  text: string;
  provider: "gemini" | "groq" | "openai";
  model: string;
};

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite"];
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const OPENAI_MODELS = ["gpt-4o-mini"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: any) {
  const status = String(
    error?.status || error?.code || error?.error?.code || ""
  );
  const message = String(error?.message || error?.error?.message || "");

  return (
    status === "429" ||
    status === "500" ||
    status === "502" ||
    status === "503" ||
    status === "504" ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("quota")
  );
}

async function tryGemini(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text?.trim();
        if (!text) throw new Error(`Empty Gemini response from ${model}`);

        return {
          text,
          provider: "gemini",
          model,
        };
      } catch (error: any) {
        lastError = error;
        if (!isRetryableError(error) || attempt === 1) break;
        await sleep(1200 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("Gemini failed.");
}

async function tryGroq(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing.");

  const groq = new Groq({ apiKey });
  let lastError: any;

  for (const model of GROQ_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        });

        const text = response.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error(`Empty Groq response from ${model}`);

        return {
          text,
          provider: "groq",
          model,
        };
      } catch (error: any) {
        lastError = error;
        if (!isRetryableError(error) || attempt === 1) break;
        await sleep(1200 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("Groq failed.");
}

async function tryOpenAI(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing.");

  const openai = new OpenAI({ apiKey });
  let lastError: any;

  for (const model of OPENAI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        });

        const text = response.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error(`Empty OpenAI response from ${model}`);

        return {
          text,
          provider: "openai",
          model,
        };
      } catch (error: any) {
        lastError = error;
        if (!isRetryableError(error) || attempt === 1) break;
        await sleep(1200 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("OpenAI failed.");
}

export async function generateWithFallback(prompt: string): Promise<ProviderResult> {
  const errors: string[] = [];

  try {
    return await tryGemini(prompt);
  } catch (error: any) {
    errors.push(`Gemini: ${error?.message || "failed"}`);
  }

  try {
    return await tryGroq(prompt);
  } catch (error: any) {
    errors.push(`Groq: ${error?.message || "failed"}`);
  }

  try {
    return await tryOpenAI(prompt);
  } catch (error: any) {
    errors.push(`OpenAI: ${error?.message || "failed"}`);
  }

  throw new Error(errors.join(" | "));
}