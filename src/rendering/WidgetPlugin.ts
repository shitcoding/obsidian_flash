/**
 * CM6 Plugin for managing hint decorations in the editor.
 */

import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewUpdate,
} from "@codemirror/view";
import {HintWidget} from "./HintWidget";
import {SourceLinkHint} from "../../types";

/**
 * CM6 view plugin that manages hint label decorations.
 * Handles rendering, filtering, and cleanup of hints.
 */
export class WidgetPlugin {
    decorations: DecorationSet;
    links: SourceLinkHint[] = [];
    matchedEventKey: string | undefined = undefined;

    constructor(_view: EditorView) {
        this.links = [];
        this.matchedEventKey = undefined;
        this.decorations = Decoration.none;
    }

    /**
     * Sets the hints to display
     */
    setLinks(links: SourceLinkHint[]): void {
        this.links = links;
        this.matchedEventKey = undefined;
    }

    /**
     * Clears all hints
     */
    clean(): void {
        this.links = [];
        this.matchedEventKey = undefined;
    }

    /**
     * Filters hints by prefix key (for two-letter hint selection)
     */
    filterWithEventKey(eventKey: string): void {
        if (eventKey.length !== 1) return;

        this.links = this.links.filter(v =>
            v.letter.length === 2 &&
            v.letter[0].toUpperCase() === eventKey.toUpperCase()
        );

        this.matchedEventKey = eventKey;
    }

    /**
     * Whether any hints are visible
     */
    get visible(): boolean {
        return this.links.length > 0;
    }

    /**
     * Updates decorations based on current hints
     */
    update(_update: ViewUpdate): void {
        const widgets = this.links.map(x => {
            // Position label at end of link text
            const endPosition = x.index + x.linkText.length;
            return Decoration.widget({
                widget: new HintWidget(x.letter, x.type, this.matchedEventKey),
                side: 1,
            }).range(endPosition);
        });

        this.decorations = Decoration.set(widgets, true); // true for sorting
    }
}

// Backward compatibility alias
export const MarkPlugin = WidgetPlugin;
