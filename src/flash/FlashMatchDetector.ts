/**
 * Match detector for Flash mode.
 * Finds text matches and assigns hint labels.
 */

import { EditorView } from "@codemirror/view";
import { Settings, FlashMatch } from "../../types";
import { escapeRegex } from "../utils/regexp";
import { getVisibleLinesCM6 } from "../utils/common";
import { generateHintLabels } from "../hints/HintGenerator";
import { getLatinForLayoutChar } from "../keyboard/KeyboardMapper";

/**
 * Detects matches in visible content for Flash mode.
 */
export class FlashMatchDetector {
    constructor(
        private editor: EditorView,
        private settings: Settings
    ) {}

    /**
     * Find all matches for the search string in visible content.
     * Returns matches with assigned hint labels.
     */
    findMatches(searchString: string): FlashMatch[] {
        // Handle empty search string
        if (!searchString) {
            return [];
        }

        // Get visible content from editor
        const { index, content } = getVisibleLinesCM6(this.editor);

        // Handle empty content
        if (!content) {
            return [];
        }

        // Escape special regex characters for safe literal matching
        const escapedSearch = escapeRegex(searchString);

        // Pattern matches anywhere - jump position is calculated in controller
        const pattern = escapedSearch;

        // Create regex with appropriate flags
        let regex: RegExp;
        try {
            regex = this.settings.flashCaseSensitive
                ? new RegExp(pattern, 'gu')
                : new RegExp(pattern, 'igu');
        } catch (e) {
            // Fallback to non-unicode regex if needed
            console.warn('Unicode regex failed, using fallback:', e);
            regex = this.settings.flashCaseSensitive
                ? new RegExp(escapedSearch, 'g')
                : new RegExp(escapedSearch, 'ig');
        }

        // Find all matches and collect next characters
        const matches: FlashMatch[] = [];
        const nextChars = new Set<string>();
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            matches.push({
                index: match.index + index,
                matchLength: searchString.length,
                linkText: match[0],
                letter: '', // Assigned below
                type: 'flash'
            });

            // Collect the character immediately after the match (flash.nvim style)
            // This prevents labels from conflicting with search extension
            const nextCharIndex = match.index + match[0].length;
            if (nextCharIndex < content.length) {
                const nextChar = content[nextCharIndex].toLowerCase();
                // Only exclude printable characters (not whitespace or newlines)
                if (nextChar && /\S/.test(nextChar)) {
                    nextChars.add(nextChar);
                    // Also exclude the Latin label letter mapped to this character's
                    // physical key. Works for any non-Latin layout (Russian, Greek, etc.)
                    // via Keyboard Layout Map API, with Cyrillic fallback.
                    const latinEquiv = getLatinForLayoutChar(nextChar);
                    if (latinEquiv) {
                        nextChars.add(latinEquiv);
                    }
                }
            }

            // Protection against infinite loops from zero-length matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        }

        // Filter to only truly visible ranges (viewport includes off-screen buffer)
        // CM6's viewport is larger than the visible screen for smooth scrolling,
        // so we must filter to visibleRanges to avoid assigning labels to off-screen matches
        const visibleRanges = this.editor.visibleRanges;
        const visibleMatches = matches.filter(match => {
            return visibleRanges.some(range =>
                match.index >= range.from && match.index < range.to
            );
        });

        // Generate labels, excluding characters that appear after matches
        // This ensures pressing a "next char" always extends the search rather than jumping
        const labels = generateHintLabels(this.settings.letters, visibleMatches.length, nextChars);

        // Assign labels to visible matches (matches are already in order by index)
        for (let i = 0; i < visibleMatches.length && i < labels.length; i++) {
            visibleMatches[i].letter = labels[i];
        }

        // Return only visible matches that have labels assigned
        return visibleMatches.filter(m => m.letter);
    }
}
