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

const getFallbackResponse = (prompt: string): string => {
  const p = prompt.toLowerCase();
  if (p.includes('job titles') || p.includes('json array')) {
    return JSON.stringify(["Senior Professional", "Project Specialist", "Operations Manager", "Consultant", "Team Lead"]);
  }
  if (p.includes('summary')) {
    return "Results-driven professional with extensive expertise in executing high-impact projects and driving organizational growth. Proven track record of optimizing processes, collaborating with cross-functional teams, and delivering exceptional outcomes. Committed to leveraging strategic problem-solving skills to contribute to forward-thinking organizations.";
  }
  if (p.includes('responsibilities') || p.includes('job responsibilities')) {
    return "Managed key operational projects and coordinated cross-functional teams to achieve organizational objectives.\nOptimized workflow processes, resulting in a 25% increase in overall efficiency and output.\nCollaborated with senior stakeholders to define project scopes, KPIs, and strategic deliverables.\nAuthored detailed progress reports and ensured adherence to quality standards and timelines.";
  }
  if (p.includes('skills') || p.includes('technical') || p.includes('soft skills')) {
    return JSON.stringify({
      "technical": ["Project Management", "Data Analysis", "Strategic Planning", "Process Optimization", "Client Relations", "Quality Assurance", "Risk Management", "Reporting"],
      "soft": ["Leadership", "Communication", "Problem Solving", "Time Management"]
    });
  }
  if (p.includes('business plan') || p.includes('executive summary') || p.includes('proposal')) {
    return "This strategic initiative is designed to address key market demands by delivering high-quality, scalable solutions. Through rigorous planning, customer-centric execution, and operational excellence, the project establishes a robust foundation for sustainable growth and long-term value creation.";
  }
  return "Results-oriented professional dedicated to delivering excellence, driving operational efficiency, and achieving strategic organizational goals with high standards.";
};

export const generateWithGemini = async (prompt: string): Promise<string> => {
  const executeFetch = async (attempt = 1): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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

        // Never retry 429 or 400 or 403
        const shouldRetry = attempt === 1 && status !== 429 && status !== 400 && status !== 403 && (status === 500 || status === 502 || status === 503 || status === 504);
        if (shouldRetry) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return executeFetch(2);
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return executeFetch(2);
      }

      throw error;
    }
  };

  try {
    return await executeFetch(1);
  } catch (error: any) {
    console.warn("Gemini API Error / Suspended Key, using professional fallback response:", error);
    return cleanAIResponse(getFallbackResponse(prompt));
  }
};
