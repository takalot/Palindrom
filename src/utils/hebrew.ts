
/**
 * Normalizes Hebrew text for palindrome checking:
 * 1. Removes Biblical reference patterns like "מט,י", "(מט י)", "א:ב" etc.
 * 2. Removes Niqqud (vowels) and punctuation.
 * 3. Converts final letters (Sofit) to regular letters.
 */
export const normalizeHebrew = (text: string): string => {
  // Pattern 1: Handle references like "מט,י" or "א:ב" or (מט, י) or [מט י]
  // Matches 1-3 hebrew chars, followed by , or : or space, followed by 1-3 hebrew chars,
  // potentially wrapped in quotes, parentheses or brackets.
  const citationPattern = /["'״׳(]?[\u05D0-\u05EA]{1,3}[,:\s]+[\u05D0-\u05EA]{1,3}["'״׳)]?/g;
  let cleanText = text.replace(citationPattern, ' ');

  // Remove Niqqud (vowels range \u0591 to \u05C7)
  cleanText = cleanText.replace(/[\u0591-\u05C7]/g, '');
  
  // Normalize final letters
  const sofitMap: Record<string, string> = {
    'ך': 'כ',
    'ם': 'מ',
    'ן': 'נ',
    'ף': 'פ',
    'ץ': 'צ'
  };

  let normalized = '';
  for (const char of cleanText) {
    if (sofitMap[char]) {
      normalized += sofitMap[char];
    } else if (char.match(/[\u05D0-\u05EA]/)) {
      normalized += char;
    }
  }
  
  return normalized;
};

export const isPalindrome = (str: string): boolean => {
  if (str.length < 3) return false;
  const reversed = str.split('').reverse().join('');
  return str === reversed;
};

export const findPalindromes = (text: string, minLength: number = 3, maxLength: number = 50) => {
  const results: { normalized: string; original: string; length: number }[] = [];
  
  for (let i = 0; i < text.length; i++) {
    if (!text[i].match(/[\u05D0-\u05EA]/)) continue;

    for (let j = i + 2; j <= text.length; j++) {
      const originalSub = text.substring(i, j);
      const normalizedSub = normalizeHebrew(originalSub);
      
      if (normalizedSub.length > maxLength) break;
      if (normalizedSub.length < minLength) continue;
      
      if (isPalindrome(normalizedSub)) {
        // Only push if the last char of the original sub is part of the palindrome
        const lastChar = originalSub.trim().slice(-1);
        if (lastChar.match(/[\u05D0-\u05EA]/)) {
          results.push({
            normalized: normalizedSub,
            original: originalSub.trim(),
            length: normalizedSub.length
          });
        }
      }
    }
  }
  
  const unique = new Map<string, { normalized: string; original: string; length: number }>();
  results.sort((a, b) => b.length - a.length);
  results.forEach(res => {
    if (!unique.has(res.normalized)) unique.set(res.normalized, res);
  });

  return Array.from(unique.values());
};
