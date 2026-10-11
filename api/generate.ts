import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, systemInstruction } = req.body || {};

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
        systemInstruction: systemInstruction 
      }
    });

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Serverless Function Error:", error);
    const isRateLimit = error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || (error?.message && error.message.includes('429'));
    const message = isRateLimit 
      ? "Gemini API free tier rate limit reached (5 requests per minute). Please wait about a minute before trying again."
      : (error.message || "Failed to generate content");
    return res.status(500).json({ error: message });
  }
}
