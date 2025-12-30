
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  /**
   * Discovers sophisticated palindromes in the Tanakh or analyzes provided context.
   */
  async discoverPalindromes(context?: string) {
    const prompt = context 
      ? `Identify interesting palindromes in the following Hebrew text: "${context}". For each palindrome found that exists in the Tanakh, provide the Book, Chapter, and Verse.`
      : `Search the Hebrew Tanakh and find 5 sophisticated palindromes (over 5 letters). For each, provide the text, book name, chapter number, verse number, and a brief explanation of the context.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            palindromes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "The palindromic Hebrew text" },
                  book: { type: Type.STRING, description: "The Biblical Book name in Hebrew" },
                  chapter: { type: Type.STRING, description: "Chapter number/ID" },
                  verse: { type: Type.STRING, description: "Verse number/ID" },
                  meaning: { type: Type.STRING, description: "Context or meaning" }
                },
                required: ["text", "book", "chapter", "verse"]
              }
            }
          },
          required: ["palindromes"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{"palindromes": []}');
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return { palindromes: [] };
    }
  }

  /**
   * Tries to identify the Biblical source (Book, Chapter, Verse) for a given piece of text.
   */
  async identifySource(text: string) {
    const prompt = `Identify the exact Biblical source (Book, Chapter, and Verse in Hebrew) for this Hebrew text sequence: "${text}". Return only the source details in a structured format.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            book: { type: Type.STRING },
            chapter: { type: Type.STRING },
            verse: { type: Type.STRING },
            found: { type: Type.BOOLEAN }
          },
          required: ["found"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{"found": false}');
    } catch (e) {
      return { found: false };
    }
  }
}
