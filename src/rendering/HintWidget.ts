/**
 * CM6 Widget for rendering hint labels in the editor.
 */

import {WidgetType} from "@codemirror/view";

/**
 * Widget that renders a hint label at a specific position in the CM6 editor.
 */
export class HintWidget extends WidgetType {
    constructor(
        readonly mark: string,
        readonly type: string,
        readonly matchedEventKey: string
    ) {
        super();
    }

    eq(other: HintWidget): boolean {
        return other.mark === this.mark && other.matchedEventKey === this.matchedEventKey;
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement('span');
        wrapper.className = 'flash-hint-label';
        wrapper.textContent = this.mark;

        // Add matched class if prefix matches
        if (this.matchedEventKey &&
            this.mark.toUpperCase().startsWith(this.matchedEventKey.toUpperCase())) {
            wrapper.classList.add('matched');
        }

        return wrapper;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

// Backward compatibility alias
export const MarkWidget = HintWidget;
