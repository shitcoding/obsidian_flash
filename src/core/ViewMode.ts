/**
 * View mode detection utilities.
 * Determines the current editor mode for mode-specific processing.
 */

import {App, View, MarkdownView, editorLivePreviewField} from 'obsidian';
import {EditorView} from "@codemirror/view";

/**
 * Editor view modes supported by Flash
 */
export enum ViewMode {
    SOURCE = 'SOURCE',           // CM6 source mode
    PREVIEW = 'PREVIEW',         // Reading view (preview mode)
    LEGACY = 'LEGACY',           // Legacy CM5 editor
    LIVE_PREVIEW = 'LIVE_PREVIEW' // CM6 with live preview
}

// Backward compatibility
export const VIEW_MODE = ViewMode;

/**
 * Detects the current view mode
 *
 * @param app - Obsidian App instance
 * @param view - Current view
 * @returns The detected ViewMode
 */
export function detectViewMode(app: App, view: View): ViewMode {
    // @ts-ignore - legacyEditor is an internal config
    const isLegacy = app.vault.getConfig("legacyEditor");

    const state = view.getState();

    if (state.mode === 'preview') {
        return ViewMode.PREVIEW;
    }

    if (isLegacy) {
        return ViewMode.LEGACY;
    }

    if (state.mode === 'source') {
        // Check if live preview is enabled
        const editorView = (<{ editor?: { cm: EditorView } }><unknown>view).editor?.cm;
        if (editorView) {
            try {
                const isLivePreview = editorView.state.field(editorLivePreviewField);
                if (isLivePreview) {
                    return ViewMode.LIVE_PREVIEW;
                }
            } catch {
                // Field not available, assume source mode
            }
        }
        return ViewMode.SOURCE;
    }

    // Default fallback
    return ViewMode.SOURCE;
}

/**
 * Gets the active markdown view
 */
export function getActiveMarkdownView(app: App): MarkdownView | null {
    return app.workspace.getActiveViewOfType(MarkdownView);
}
