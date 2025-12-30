
/**
 * Normalizes Hebrew text for palindrome checking:
 * 1. Removes common Biblical reference patterns (Chapter:Verse markers).
 * 2. Removes Niqqud (vowels) and punctuation.
 * 3. Converts final letters (Sofit) to regular letters.
 * 4. Keeps only Hebrew characters.
 */
export const normalizeHebrew = (text: string): string => {
  // First, identify and remove common Biblical reference patterns (e.g., "מט,י", (מט, י), א:ב)
  // These usually consist of 1-3 Hebrew letters followed by a comma or colon and then 1-3 more letters.
  
  // Pattern 1: "Letters,Letters" or "Letters:Letters" or Letters,Letters
  const refPattern = /["'״׳(]?[\u05D0-\u05EA]{1,3}[,:][\u05D0-\u05EA]{1,3}["'״׳)]?/g;
  let textWithoutRefs = text.replace(refPattern, ' ');

  // Pattern 2: References like (מט י) or [מט י]
  const parenRefPattern = /[(\[][\u05D0-\u05EA]{1,3}\s+[\u05D0-\u05EA]{1,3}[)\]]/g;
  textWithoutRefs = textWithoutRefs.replace(parenRefPattern, ' ');

  // Remove Niqqud (Hebrew vowels range from \u0591 to \u05C7)
  const noVowels = textWithoutRefs.replace(/[\u0591-\u05C7]/g, '');
  
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
  for (let i = 0; i < text.length; i++) {
    // Optimization: find start of a potential sequence
    if (!text[i].match(/[\u05D0-\u05EA"'״׳(]/)) continue;

    for (let j = i + 1; j <= text.length; j++) {
      const originalSub = text.substring(i, j);
      
      // Safety break for extremely long substrings
      if (originalSub.length > maxLength * 4) break; 
      
      const normalizedSub = normalizeHebrew(originalSub);
      
      if (normalizedSub.length > maxLength) break;
      
      if (normalizedSub.length >= minLength && isPalindrome(normalizedSub)) {
        results.push({
          normalized: normalizedSub,
          original: originalSub.trim(),
          length: normalizedSub.length
        });
      }
    }
  }
  
  // Filter duplicates and overlapping sequences
  const uniqueMatches = new Map<string, { normalized: string; original: string; length: number }>();
  
  // Sort results by length descending so we process longer ones first
  results.sort((a, b) => b.length - a.length);

  results.forEach(res => {
    // Use a composite key or normalized text to group
    const key = res.normalized;
    if (!uniqueMatches.has(key)) {
      uniqueMatches.set(key, res);
    } else {
      const existing = uniqueMatches.get(key)!;
      // Prefer shorter original strings for the same normalized sequence (less noise)
      if (res.original.length < existing.original.length) {
         uniqueMatches.set(key, res);
      }
    }
  });

  return Array.from(uniqueMatches.values()).sort((a, b) => b.length - a.length);
};
