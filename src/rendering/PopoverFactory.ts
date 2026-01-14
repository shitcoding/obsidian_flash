/**
 * Popover factory for creating hint label DOM elements.
 * Unified popover creation for all rendering contexts.
 */

import {Editor} from "codemirror";
import {SourceLinkHint} from "../../types";

/**
 * Configuration for creating a popover element
 */
export interface PopoverConfig {
    label: string;
    type: string;
    matchedPrefix?: string;
}

/**
 * Creates a popover DOM element for a hint label
 *
 * @param config - Popover configuration
 * @returns HTMLElement for the popover
 */
export function createPopover(config: PopoverConfig): HTMLElement {
    const { label, type, matchedPrefix } = config;

    const popover = activeDocument.createElement('div');
    popover.classList.add('jl');
    popover.classList.add('jl-' + type);
    popover.classList.add('popover');

    if (matchedPrefix && label.toUpperCase().startsWith(matchedPrefix.toUpperCase())) {
        popover.classList.add('matched');
    }

    popover.textContent = label;
    return popover;
}

/**
 * Creates a popover element (legacy signature for backward compatibility)
 */
export function createWidgetElement(content: string, type: string): HTMLElement {
    return createPopover({ label: content, type });
}

/**
 * Renders hint popovers in a CM5 editor
 *
 * @param editor - CM5 Editor instance
 * @param hints - Array of hints to render
 */
export function renderSourceHints(editor: Editor, hints: SourceLinkHint[]): void {
    hints.forEach(hint => {
        const pos = editor.posFromIndex(hint.index);
        const popover = createPopover({ label: hint.letter, type: hint.type });
        // The fourth parameter is undocumented - it specifies widget placement
        (editor as any).addWidget(pos, popover, false, 'over');
    });
}

// Backward compatibility alias
export const displaySourcePopovers = renderSourceHints;
