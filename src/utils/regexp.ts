import {generateHintLabels} from "../hints/HintGenerator";
import {SourceLinkHint} from "../../types";

/**
 * Escapes special regex characters in a string for safe use in RegExp.
 * Does not escape hyphen (-) as user input is not placed inside character classes.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adjusts match index to ensure cursor lands on actual text, not markdown formatting.
 *
 * The regex match index can sometimes point to markdown syntax characters (*, `, _, etc.)
 * instead of the actual matched text. This function verifies the position and corrects it
 * by finding where the matched text actually starts.
 *
 * Works with all Unicode scripts (Latin, Cyrillic, CJK, etc.)
 *
 * @param content - The text content being searched
 * @param matchIndex - The original match index from regex
 * @param matchedText - The text that was matched
 * @returns Corrected index pointing to the first character of the matched text
 */
export function adjustIndexForFormatting(content: string, matchIndex: number, matchedText: string): number {
    if (!matchedText || matchIndex < 0 || matchIndex >= content.length) {
        return matchIndex;
    }

    const firstMatchChar = matchedText[0].toLowerCase();

    // Check if position is already correct
    if (content[matchIndex].toLowerCase() === firstMatchChar) {
        return matchIndex;
    }

    // Position is wrong - search forward to find where the matched text actually starts
    // This handles cases where matchIndex lands on markdown formatting (**, `, _, etc.)
    const maxSearch = Math.min(matchIndex + 20, content.length);

    for (let i = matchIndex; i < maxSearch; i++) {
        if (content[i].toLowerCase() === firstMatchChar) {
            // Found potential start - verify more characters match if possible
            if (matchedText.length > 1) {
                const nextCharsToCheck = Math.min(matchedText.length - 1, content.length - i - 1);
                let matches = true;
                for (let j = 1; j <= nextCharsToCheck; j++) {
                    if (content[i + j].toLowerCase() !== matchedText[j].toLowerCase()) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    return i;
                }
            } else {
                // Single character match
                return i;
            }
        }
    }

    // Also search backward in case the index is after the text
    const minSearch = Math.max(0, matchIndex - 10);
    for (let i = matchIndex - 1; i >= minSearch; i--) {
        if (content[i].toLowerCase() === firstMatchChar) {
            if (matchedText.length > 1) {
                const nextCharsToCheck = Math.min(matchedText.length - 1, content.length - i - 1);
                let matches = true;
                for (let j = 1; j <= nextCharsToCheck; j++) {
                    if (content[i + j].toLowerCase() !== matchedText[j].toLowerCase()) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    return i;
                }
            } else {
                return i;
            }
        }
    }

    // Couldn't find correct position, return original
    return matchIndex;
}

/**
 * Maximum number of matches to prevent performance issues with broad regex patterns.
 */
const MAX_MATCHES = 10000;

/**
 * Dangerous regex patterns that can cause ReDoS or performance issues.
 * These patterns are checked against the raw regex string.
 */
const DANGEROUS_PATTERNS = [
    /(\+|\*|\{[0-9,]+\})\s*(\+|\*|\{[0-9,]+\})/, // Nested quantifiers like .++ or .*+
    /\(\?[^)]*\([^)]*\)[^)]*\)\s*[+*]/, // Nested groups with quantifiers
];

/**
 * Validates a regex pattern for safety and correctness.
 * Returns an error message if invalid, or null if valid.
 */
export function validateRegex(pattern: string): string | null {
    // Check for dangerous patterns that could cause ReDoS
    for (const dangerous of DANGEROUS_PATTERNS) {
        if (dangerous.test(pattern)) {
            return 'Regex pattern contains potentially dangerous nested quantifiers';
        }
    }

    // Check for very long patterns that could be problematic
    if (pattern.length > 1000) {
        return 'Regex pattern is too long (max 1000 characters)';
    }

    // Try to compile the regex to check for syntax errors
    try {
        new RegExp(pattern, 'u');
    } catch {
        // Try without unicode flag as fallback
        try {
            new RegExp(pattern);
        } catch (e2) {
            return `Invalid regex pattern: ${(e2 as Error).message}`;
        }
    }

    return null;
}

export function extractRegexpBlocks(content: string, offset: number, regexp: string, letters: string, caseSensitive: boolean) {
    // Validate regex before use
    const validationError = validateRegex(regexp);
    if (validationError) {
        console.warn('Regex validation failed:', validationError);
        return [];
    }

    let regExUrl: RegExp;

    // Try Unicode mode first, fallback to ASCII mode for backward compatibility
    try {
        regExUrl = caseSensitive ? new RegExp(regexp, 'gu') : new RegExp(regexp, 'igu');
    } catch (e) {
        console.warn('Unicode regex failed, falling back to ASCII mode:', e);
        regExUrl = caseSensitive ? new RegExp(regexp, 'g') : new RegExp(regexp, 'ig');
    }

    let linksWithIndex: {
        index: number;
        type: "regex";
        linkText: string;
    }[] = [];

    let regExResult;
    let lastIndex = -1;
    let matchCount = 0;

    while ((regExResult = regExUrl.exec(content))) {
        // Protection against infinite loops from zero-length matches
        if (regExUrl.lastIndex === lastIndex) {
            regExUrl.lastIndex++;
            continue;
        }
        lastIndex = regExUrl.lastIndex;

        // Limit total matches to prevent performance issues
        if (++matchCount > MAX_MATCHES) {
            console.warn(`Regex matched more than ${MAX_MATCHES} times, stopping early`);
            break;
        }

        // Use capture group if available, otherwise fall back to full match
        const linkText = regExResult[1] ?? regExResult[0];

        // Adjust index to skip markdown formatting characters (`, *, _, etc.)
        // This ensures the cursor lands on actual text, not formatting syntax
        const adjustedIndex = adjustIndexForFormatting(content, regExResult.index, linkText);

        linksWithIndex.push({
            index: adjustedIndex + offset,
            type: "regex",
            linkText,
        });
    }

    const linkHintLetters = generateHintLabels(letters, linksWithIndex.length);

    const linksWithLetter: SourceLinkHint[] = [];
    linksWithIndex
        .sort((x, y) => x.index - y.index)
        .forEach((linkHint, i) => {
            linksWithLetter.push({
                letter: linkHintLetters[i],
                ...linkHint,
            });
        });

    return linksWithLetter.filter(link => link.letter);
}
