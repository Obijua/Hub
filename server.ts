import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Proxy Route
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
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

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      const isRateLimit = error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || (error?.message && error.message.includes('429'));
      const message = isRateLimit 
        ? "Gemini API free tier rate limit reached (5 requests per minute). Please wait about a minute before trying again."
        : (error.message || "Failed to generate content");
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
