/**
 * CM6 ViewPlugin for Flash mode decorations.
 * Manages both mark decorations (highlighting) and widget decorations (labels).
 */

import { Decoration, DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";
import { FlashMatch, FontInfo, Settings } from "../../types";
import { FlashLabelWidget } from "./FlashLabelWidget";

/**
 * Plugin that manages Flash decorations in CodeMirror 6.
 * Creates mark decorations for highlighting matched text and
 * widget decorations for jump labels positioned after matches.
 */
export class FlashWidgetPlugin {
    decorations: DecorationSet = Decoration.none;
    private matches: FlashMatch[] = [];
    private searchLength: number = 0;
    private matchedKey: string = '';

    constructor(private view: EditorView, private settings: Settings) {}

    /**
     * Set matches to display and build decorations.
     * @param matches Array of Flash matches with positions and labels
     * @param searchLength Length of the search string (for highlight range)
     */
    setMatches(matches: FlashMatch[], searchLength: number): void {
        this.matches = matches;
        this.searchLength = searchLength;
        this.matchedKey = '';
        this.buildDecorations();
    }

    /**
     * Filter matches by first character of label (for two-key labels).
     * Updates matchedKey to show which prefix was matched.
     * @param key The key that was pressed (first char of two-char label)
     */
    filterByKey(key: string): void {
        this.matchedKey = key;
        this.matches = this.matches.filter(m =>
            m.letter.length > 1 &&
            m.letter[0].toUpperCase() === key.toUpperCase()
        );
        this.buildDecorations();
    }

    /**
     * Clear all decorations and reset state.
     */
    clear(): void {
        this.matches = [];
        this.matchedKey = '';
        this.decorations = Decoration.none;
    }

    /**
     * Build decoration set from current matches.
     * Creates both highlight marks and label widgets.
     * Uses mark decorations to preserve existing formatting (inline code, bold, etc.)
     */
    private buildDecorations(): void {
        const decorations: Array<{from: number; to: number; value: Decoration}> = [];

        // Get highlight color for inline styling
        const highlightColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--flash-highlight-color').trim() || '#F47D1A';

        for (const match of this.matches) {
            // 1. Highlight decoration - use mark to preserve existing formatting
            // Inline style ensures color overrides parent styling (URLs, links, etc.)
            decorations.push({
                from: match.index,
                to: match.index + this.searchLength,
                value: Decoration.mark({
                    class: 'flash-highlight',
                    attributes: { style: `color: ${highlightColor} !important;` }
                })
            });

            // 2. Label decoration - use widget to insert after match without replacing text
            const fontInfo = this.getFontInfo(match.index);
            const labelStart = match.index + this.searchLength;

            decorations.push({
                from: labelStart,
                to: labelStart,
                value: Decoration.widget({
                    widget: new FlashLabelWidget(
                        match.letter,
                        this.matchedKey,
                        fontInfo
                    ),
                    side: 1
                })
            });
        }

        // Sort by position (required for DecorationSet)
        decorations.sort((a, b) => a.from - b.from);

        // Convert to RangeSet format
        this.decorations = Decoration.set(
            decorations.map(d => d.value.range(d.from, d.to))
        );
    }

    /**
     * Get font information from the element at a specific position.
     * Uses domAtPos() for accurate font inheritance instead of coordsAtPos().
     * @param index Document position to get font from
     */
    private getFontInfo(index: number): FontInfo {
        if (!this.settings.flashInheritFont) {
            return { fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'bold' };
        }

        try {
            const domPos = this.view.domAtPos(index);
            let element: Element | null = null;

            if (domPos.node instanceof Element) {
                element = domPos.node;
            } else if (domPos.node.parentElement) {
                element = domPos.node.parentElement;
            }

            if (element) {
                const style = window.getComputedStyle(element);
                return {
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: 'bold'  // Always bold for visibility
                };
            }
        } catch {
            // domAtPos can throw if position is invalid
        }

        return { fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'bold' };
    }

    /**
     * Handle view updates (e.g., document changes).
     * Rebuilds decorations if document changed.
     */
    update(update: ViewUpdate): void {
        if (update.docChanged) {
            this.buildDecorations();
        }
    }
}
