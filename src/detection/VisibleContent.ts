/**
 * Utilities for extracting visible content from CodeMirror editors.
 * Supports both CM5 (legacy) and CM6 (modern) editor APIs.
 */

import {EditorView} from "@codemirror/view";
import {LegacyEditor} from "../../types";

/**
 * Result of visible content extraction
 */
export interface VisibleContent {
    startIndex: number;
    content: string;
}

/**
 * Get visible content from a Legacy CM5 editor
 * @param editor - CM5 Editor instance
 * @returns Visible content with start index offset
 */
export function getVisibleContentCM5(editor: LegacyEditor): VisibleContent {
    const scrollInfo = editor.getScrollInfo();
    const { line: from } = editor.coordsChar({ left: 0, top: 0 }, 'page');
    const { line: to } = editor.coordsChar({ left: scrollInfo.left, top: scrollInfo.top + scrollInfo.height});
    const startIndex = editor.indexFromPos({ch: 0, line: from});
    const content = editor.getRange({ch: 0, line: from}, {ch: 0, line: to + 1});

    return { startIndex, content };
}

/**
 * Get visible content from a CM6 editor
 * @param editor - CM6 EditorView instance
 * @returns Visible content with start index offset
 */
export function getVisibleContentCM6(editor: EditorView): VisibleContent {
    let { from, to } = editor.viewport;

    // For CM6 get real visible lines top
    // @ts-ignore - accessing internal viewState
    if (editor.viewState?.pixelViewport?.top) {
        // @ts-ignore
        const pixelOffsetTop = editor.viewState.pixelViewport.top;
        // @ts-ignore
        const lines = editor.viewState.viewportLines;
        // @ts-ignore
        from = lines.filter(line => line.top > pixelOffsetTop)[0]?.from ?? from;
    }

    const content = editor.state.sliceDoc(from, to);

    return { startIndex: from, content };
}
