import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export const config = { maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, systemInstruction } = req.body || {};

    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000) {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API key not configured in process.env.GEMINI_API_KEY");
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: 'low' as any },
      }
    });

    if (!response.text || !response.text.trim()) {
      return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    }

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Serverless Function Error:", error);
    const isRateLimit = error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || (error?.message && (error.message.includes('429') || error.message.includes('Quota exceeded')));
    if (isRateLimit) {
      return res.status(429).json({ error: "The AI is busy right now. Please wait a minute and try again." });
    }
    return res.status(500).json({ error: error.message || "Failed to generate content" });
  }
}
