/**
 * Legacy CM5 source mode link processor.
 * Detects markdown links in visible content.
 */

import {LegacyEditor, Processor, SourceLinkHint} from "../../types";
import {detectMarkdownLinks} from "../detection/LinkDetector";
import {getVisibleContentCM5} from "../detection/VisibleContent";
import {renderSourceHints} from "../rendering/PopoverFactory";

export default class LegacyLinkProcessor implements Processor {
    protected editor: LegacyEditor;
    letters: string;

    constructor(editor: LegacyEditor, letters: string) {
        this.editor = editor;
        this.letters = letters;
    }

    public init(): SourceLinkHint[] {
        const hints = this.detectLinks();
        renderSourceHints(this.editor, hints);
        return hints;
    }

    protected detectLinks(): SourceLinkHint[] {
        const { letters, editor } = this;
        const { startIndex, content } = getVisibleContentCM5(editor);
        return detectMarkdownLinks(content, startIndex, letters);
    }
}

// Named exports for both new and old names
export {LegacyLinkProcessor};
export {LegacyLinkProcessor as LegacySourceLinkProcessor};
