/**
 * Hint label generation utilities.
 * Generates letter sequences for hint labels, supporting prefix-based expansion.
 */

/**
 * Generate hint labels from an alphabet.
 * Uses single letters first, then two-letter prefixes when needed.
 * Labels are generated in lowercase for a cleaner visual appearance.
 *
 * @param alphabet - Letters to use for generating hints (e.g., "sadfjklewcmpgh")
 * @param count - Number of hint labels needed
 * @param excludedChars - Optional set of characters to exclude from labels (e.g., next chars after matches)
 * @returns Array of hint labels (lowercase)
 */
export function generateHintLabels(alphabet: string, count: number, excludedChars?: Set<string>): string[] {
    // Filter out excluded characters from alphabet
    let filteredAlphabet = alphabet.toLowerCase();
    if (excludedChars && excludedChars.size > 0) {
        filteredAlphabet = Array.from(filteredAlphabet)
            .filter(c => !excludedChars.has(c))
            .join('');
    }

    // If all letters are excluded, fall back to original alphabet
    if (filteredAlphabet.length === 0) {
        filteredAlphabet = alphabet.toLowerCase();
    }

    const alphabetLowercase = filteredAlphabet;

    let prefixCount = Math.ceil((count - alphabetLowercase.length) / (alphabetLowercase.length - 1));

    // ensure 0 <= prefixCount <= alphabet.length
    prefixCount = Math.max(prefixCount, 0);
    prefixCount = Math.min(prefixCount, alphabetLowercase.length);

    const prefixes = ['', ...Array.from(alphabetLowercase.slice(0, prefixCount))];

    const labels: string[] = [];
    for (let i = 0; i < prefixes.length; i++) {
        const prefix = prefixes[i];
        for (let j = 0; j < alphabetLowercase.length; j++) {
            if (labels.length < count) {
                const letter = alphabetLowercase[j];
                if (prefix === '') {
                    // Skip letters that are used as prefixes (they need second letter)
                    const hasPrefix = prefixes.includes(letter);
                    if (!hasPrefix) {
                        labels.push(letter);
                    }
                } else {
                    labels.push(prefix + letter);
                }
            } else {
                break;
            }
        }
    }

    return labels;
}

// Backward compatibility alias
export const getLinkHintLetters = generateHintLabels;
