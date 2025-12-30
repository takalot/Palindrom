
/**
 * Normalizes Hebrew text for palindrome checking:
 * 1. Removes Niqqud (vowels) and punctuation.
 * 2. Converts final letters (Sofit) to regular letters.
 * 3. Keeps only Hebrew characters.
 */
export const normalizeHebrew = (text: string): string => {
  // Remove Niqqud (Hebrew vowels range from \u0591 to \u05C7)
  const noVowels = text.replace(/[\u0591-\u05C7]/g, '');
  
  // Normalize final letters to regular letters
  const sofitMap: Record<string, string> = {
    'ך': 'כ',
    'ם': 'מ',
    'ן': 'נ',
    'ף': 'פ',
    'ץ': 'צ'
  };

  let normalized = '';
  for (const char of noVowels) {
    if (sofitMap[char]) {
      normalized += sofitMap[char];
    } else if (char.match(/[\u05D0-\u05EA]/)) {
      normalized += char;
    }
  }
  
  return normalized;
};

/**
 * Checks if a string is a palindrome.
 */
export const isPalindrome = (str: string): boolean => {
  if (str.length < 3) return false;
  const reversed = str.split('').reverse().join('');
  return str === reversed;
};

/**
 * Finds all palindromic sequences within a text while preserving original context.
 * @param text The input text
 * @param minLength Minimum length of sequence (in normalized characters)
 * @param maxLength Maximum length of sequence (in normalized characters)
 */
export const findPalindromes = (text: string, minLength: number = 3, maxLength: number = 50) => {
  const results: { normalized: string; original: string; length: number }[] = [];
  
  // We iterate through substrings of the original text
  // This ensures we can map the normalized palindrome back to the source words.
  for (let i = 0; i < text.length; i++) {
    // Skip if starting with whitespace or non-hebrew
    if (!text[i].match(/[\u05D0-\u05EA]/)) continue;

    for (let j = i + 1; j <= text.length; j++) {
      const originalSub = text.substring(i, j);
      const normalizedSub = normalizeHebrew(originalSub);
      
      if (normalizedSub.length > maxLength) break;
      
      if (normalizedSub.length >= minLength && isPalindrome(normalizedSub)) {
        // Basic check to avoid redundant substrings (like including extra spaces at the end)
        const lastChar = originalSub[originalSub.length - 1];
        if (lastChar.match(/[\u05D0-\u05EA]/)) {
          results.push({
            normalized: normalizedSub,
            original: originalSub,
            length: normalizedSub.length
          });
        }
      }
    }
  }
  
  // Filter duplicates: keep only the most representative match for each unique combination
  const uniqueMatches = new Map<string, { normalized: string; original: string; length: number }>();
  results.forEach(res => {
    const key = `${res.normalized}_${res.original}`;
    if (!uniqueMatches.has(key)) {
      uniqueMatches.set(key, res);
    }
  });

  return Array.from(uniqueMatches.values());
};
