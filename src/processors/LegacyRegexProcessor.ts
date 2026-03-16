/**
 * Legacy CM5 regex processor.
 * Detects regex matches in visible content.
 */

import {LegacyEditor, Processor, SourceLinkHint} from "../../types";
import {getVisibleContentCM5} from "../detection/VisibleContent";
import {findRegexMatches} from "../detection/RegexMatcher";
import {renderSourceHints} from "../rendering/PopoverFactory";

export default class LegacyRegexProcessor implements Processor {
    private editor: LegacyEditor;
    private pattern: string;
    letters: string;
    private caseSensitive: boolean;

    constructor(editor: LegacyEditor, pattern: string, letters: string, caseSensitive: boolean) {
        this.editor = editor;
        this.pattern = pattern;
        this.letters = letters;
        this.caseSensitive = caseSensitive;
    }

    public init(): SourceLinkHint[] {
        const { startIndex, content } = this.getVisibleContent();
        const hints = this.findMatches(content, startIndex);
        this.render(hints);
        return hints;
    }

    private getVisibleContent() {
        return getVisibleContentCM5(this.editor);
    }

    private findMatches(content: string, offset: number): SourceLinkHint[] {
        const { pattern, letters, caseSensitive } = this;
        return findRegexMatches(content, offset, pattern, letters, caseSensitive);
    }

    private render(hints: SourceLinkHint[]): void {
        renderSourceHints(this.editor, hints);
    }
}

// Named exports for both new and old names
export {LegacyRegexProcessor};
export {LegacyRegexProcessor as LegacyRegexpProcessor};
