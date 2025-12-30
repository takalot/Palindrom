
export interface PalindromeMatch {
  text: string;
  originalText: string;
  startIndex: number;
  endIndex: number;
  length: number;
}

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface AIResponse {
  palindromes: Array<{
    text: string;
    source: string;
    meaning?: string;
  }>;
}
