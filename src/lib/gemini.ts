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

export const generateWithGemini = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        systemInstruction: `You are a professional document builder assistant. 
STRICT RULES FOR YOUR RESPONSE:
- Return ONLY the requested content
- NO explanations, NO preamble, NO "Here is..." sentences
- NO markdown formatting (**bold**, *italic*, # headers)
- NO bullet points with * or - symbols  
- NO numbered lists unless specifically requested
- Clean plain text only
- Do not mention what you are doing or why`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "AI generation failed");
    }

    const data = await response.json();
    if (!data.text) {
      throw new Error("No text returned from Gemini");
    }

    return cleanAIResponse(data.text);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "AI generation failed. Check your internet and try again.");
  }
};
