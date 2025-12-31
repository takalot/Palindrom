/**
 * שירות לתקשורת עם Gemini AI API
 */

interface PalindromeDiscovery {
  text: string;
  book: string;
  chapter: string;
  verse: string;
  meaning?: string;
}

interface DiscoveryResponse {
  palindromes: PalindromeDiscovery[];
}

interface SourceIdentification {
  found: boolean;
  book: string;
  chapter: string;
  verse: string;
  confidence?: number;
}

export class GeminiService {
  private apiKey: string;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
  private model = 'gemini-pro';

  constructor(apiKey?: string) {
    // קבלת API Key מ-environment או מהפרמטר
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Gemini API key is missing. AI features will not work.');
    }
  }

  /**
   * בדיקת תקינות API Key
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * גילוי פלינדרומים בתנ"ך באמצעות AI
   */
  async discoverPalindromes(userPrompt?: string): Promise<DiscoveryResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = this.buildDiscoveryPrompt(userPrompt);
    
    try {
      const response = await this.makeRequest(prompt);
      return this.parseDiscoveryResponse(response);
    } catch (error) {
      console.error('Error discovering palindromes:', error);
      throw new Error('Failed to discover palindromes. Please try again.');
    }
  }

  /**
   * זיהוי מקור של טקסט בתנ"ך
   */
  async identifySource(text: string): Promise<SourceIdentification> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = this.buildSourcePrompt(text);
    
    try {
      const response = await this.makeRequest(prompt);
      return this.parseSourceResponse(response);
    } catch (error) {
      console.error('Error identifying source:', error);
      throw new Error('Failed to identify source. Please try again.');
    }
  }

  /**
   * בניית prompt לגילוי פלינדרומים
   */
  private buildDiscoveryPrompt(userPrompt?: string): string {
    const basePrompt = `
אתה מומחה לתנ"ך העברי. תפקידך למצוא פלינדרומים (מילים או ביטויים הנקראים זהה קדימה ואחורה) בתנ"ך.

${userPrompt ? `הנחיה מהמשתמש: ${userPrompt}\n` : ''}

מצא 5-10 פלינדרומים מעניינים מהתנ"ך. לכל פלינדרום, ספק:
1. הטקסט המדויק
2. המיקום (ספר, פרק, פסוק)
3. משמעות או הקשר (אופציונלי)

החזר את התשובה בפורמט JSON הבא בלבד, ללא טקסט נוסף:
{
  "palindromes": [
    {
      "text": "אבא",
      "book": "בראשית",
      "chapter": "לב",
      "verse": "יא",
      "meaning": "הופעת המילה 'אבא' בהקשר משפחתי"
    }
  ]
}

חשוב: החזר רק JSON תקין, ללא הסברים או טקסט נוסף.
    `.trim();

    return basePrompt;
  }

  /**
   * בניית prompt לזיהוי מקור
   */
  private buildSourcePrompt(text: string): string {
    return `
אתה מומחה לתנ"ך העברי. זהה את המקור המדויק של הטקסט הבא:

"${text}"

אם הטקסט מופיע בתנ"ך, החזר JSON במבנה הבא:
{
  "found": true,
  "book": "שם הספר",
  "chapter": "מספר הפרק",
  "verse": "מספר הפסוק",
  "confidence": 0.95
}

אם הטקסט לא נמצא או שאתה לא בטוח, החזר:
{
  "found": false,
  "book": "",
  "chapter": "",
  "verse": "",
  "confidence": 0.0
}

החזר רק JSON תקין, ללא הסברים.
    `.trim();
  }

  /**
   * ביצוע קריאת API ל-Gemini
   */
  private async makeRequest(prompt: string): Promise<any> {
    const url = `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * פירוק תשובת AI לגילוי פלינדרומים
   */
  private parseDiscoveryResponse(response: any): DiscoveryResponse {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // ניסיון לחלץ JSON מהתשובה
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // וולידציה
      if (!parsed.palindromes || !Array.isArray(parsed.palindromes)) {
        throw new Error('Invalid response structure');
      }

      return {
        palindromes: parsed.palindromes.map((p: any) => ({
          text: p.text || '',
          book: p.book || 'לא ידוע',
          chapter: p.chapter || '',
          verse: p.verse || '',
          meaning: p.meaning
        }))
      };
    } catch (error) {
      console.error('Error parsing discovery response:', error);
      return { palindromes: [] };
    }
  }

  /**
   * פירוק תשובת AI לזיהוי מקור
   */
  private parseSourceResponse(response: any): SourceIdentification {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        found: parsed.found || false,
        book: parsed.book || '',
        chapter: parsed.chapter || '',
        verse: parsed.verse || '',
        confidence: parsed.confidence
      };
    } catch (error) {
      console.error('Error parsing source response:', error);
      return {
        found: false,
        book: '',
        chapter: '',
        verse: ''
      };
    }
  }
}

// יצירת instance יחיד (Singleton pattern)
let geminiInstance: GeminiService | null = null;

export function getGeminiService(apiKey?: string): GeminiService {
  if (!geminiInstance) {
    geminiInstance = new GeminiService(apiKey);
  }
  return geminiInstance;
}