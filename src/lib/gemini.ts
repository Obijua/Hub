export const cleanAIResponse = (text: string): string => {
  return text
    // Remove "Here is...", "Sure, here are...", etc. preambles
    .replace(/^(Sure, )?Here (is|are) (a |some |the )?.*?(responsibilities|skills|summary|proposal|plan).*?:/gim, '')
    .replace(/^Below (is|are) (a |some |the )?.*?:/gim, '')
    // Remove markdown bold+italic (triple asterisks) - handle unbalanced ones too
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    // Remove bullet points (asterisk, dash, bullet, or dot at start of line)
    .replace(/^[\*\-•\.]\s+/gm, '')
    // Remove numbered lists (e.g., 1. )
    .replace(/^\d+\.\s+/gm, '')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove backticks
    .replace(/`/g, '')
    // Remove extra blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Remove any remaining asterisks that might be used as separators or bullet artifacts
    .replace(/^\s*[\*\-•]\s*$/gm, '')
    .replace(/\*/g, '') // Final sweep for any stray asterisks
    .trim();
};

const SYSTEM_INSTRUCTION = `You are a professional document builder assistant. 
STRICT RULES FOR YOUR RESPONSE:
- Return ONLY the requested content
- NO explanations, NO preamble, NO "Here is..." sentences
- NO markdown formatting (**bold**, *italic*, # headers)
- NO bullet points with * or - symbols  
- NO numbered lists unless specifically requested
- Clean plain text only
- Do not mention what you are doing or why`;

export const generateWithGemini = async (prompt: string): Promise<string> => {
  const executeFetch = async (attempt = 1): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          systemInstruction: SYSTEM_INSTRUCTION,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (e) {
          data = { error: "Invalid JSON response from server" };
        }
      } else {
        const textBody = await response.text();
        data = { error: textBody || "Server returned non-JSON response" };
      }

      if (!response.ok) {
        const status = response.status;
        const errorMessage = data.error || "AI generation failed";

        // Never retry 429 or 400
        const shouldRetry = attempt === 1 && status !== 429 && status !== 400 && (status === 500 || status === 502 || status === 503 || status === 504);
        if (shouldRetry) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return executeFetch(2);
        }

        if (status === 504) {
          throw new Error("The request timed out. Please try again.");
        }
        throw new Error(errorMessage);
      }

      if (!data.text) {
        throw new Error("No text returned from Gemini");
      }

      return cleanAIResponse(data.text);
    } catch (error: any) {
      clearTimeout(timeoutId);

      const isNetworkOrTimeout = error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout');
      if (attempt === 1 && isNetworkOrTimeout) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return executeFetch(2);
      }

      if (error.name === 'AbortError') {
        throw new Error("The request timed out. Please try again.");
      }

      throw error;
    }
  };

  try {
    return await executeFetch(1);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "AI generation failed. Check your internet and try again.");
  }
};
