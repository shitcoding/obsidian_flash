/**
 * Mock implementation of CodeMirror 5 & 6 APIs for unit testing.
 * Provides minimal implementations for editor-related testing.
 */

// ===== CodeMirror 5 (Legacy) Mocks =====

export interface Editor {
  getValue(): string;
  setValue(content: string): void;
  getCursor(where?: string): { line: number; ch: number };
  setCursor(pos: { line: number; ch: number } | number): void;
  getLine(line: number): string;
  setLine(line: number, text: string): void;
  lineCount(): number;
  getScrollInfo(): { left: number; top: number; height: number };
  coordsChar(coords: { left: number; top: number }, mode?: string): { line: number; ch: number };
  indexFromPos(pos: { line: number; ch: number }): number;
  posFromIndex(index: number): { line: number; ch: number };
  getRange(from: { line: number; ch: number }, to: { line: number; ch: number }): string;
  scrollTo(x: number, y: number): void;
  focus(): void;
  blur(): void;
  addWidget(pos: { line: number; ch: number }, element: HTMLElement, scrollIntoView: boolean, position?: string): void;
}

/**
 * Creates a mock CM5 Editor instance for testing.
 */
export function createMockCM5Editor(content: string = ''): Editor {
  const lines = content.split('\n');
  let cursor = { line: 0, ch: 0 };

  return {
    getValue: () => lines.join('\n'),
    setValue: (c: string) => {
      lines.length = 0;
      lines.push(...c.split('\n'));
    },
    getCursor: () => ({ ...cursor }),
    setCursor: (pos: any) => {
      if (typeof pos === 'number') {
        // Convert index to position
        let remaining = pos;
        for (let i = 0; i < lines.length; i++) {
          if (remaining <= lines[i].length) {
            cursor = { line: i, ch: remaining };
            return;
          }
          remaining -= lines[i].length + 1;
        }
      } else {
        cursor = { ...pos };
      }
    },
    getLine: (line: number) => lines[line] || '',
    setLine: (line: number, text: string) => { lines[line] = text; },
    lineCount: () => lines.length,
    getScrollInfo: () => ({ left: 0, top: 0, height: 500 }),
    coordsChar: (coords: { left: number; top: number }) => ({ line: 0, ch: 0 }),
    indexFromPos: (pos: { line: number; ch: number }) => {
      let index = 0;
      for (let i = 0; i < pos.line && i < lines.length; i++) {
        index += lines[i].length + 1;
      }
      return index + Math.min(pos.ch, lines[pos.line]?.length || 0);
    },
    posFromIndex: (index: number) => {
      let remaining = index;
      for (let i = 0; i < lines.length; i++) {
        if (remaining <= lines[i].length) {
          return { line: i, ch: remaining };
        }
        remaining -= lines[i].length + 1;
      }
      return { line: lines.length - 1, ch: lines[lines.length - 1]?.length || 0 };
    },
    getRange: (from: { line: number; ch: number }, to: { line: number; ch: number }) => {
      if (from.line === to.line) {
        return lines[from.line]?.substring(from.ch, to.ch) || '';
      }
      let result = lines[from.line]?.substring(from.ch) || '';
      for (let i = from.line + 1; i < to.line; i++) {
        result += '\n' + (lines[i] || '');
      }
      result += '\n' + (lines[to.line]?.substring(0, to.ch) || '');
      return result;
    },
    scrollTo: () => {},
    focus: () => {},
    blur: () => {},
    addWidget: () => {},
  };
}

// ===== CodeMirror 6 Mocks =====

export interface EditorState {
  doc: {
    toString(): string;
    sliceString(from: number, to: number): string;
  };
  sliceDoc(from: number, to: number): string;
}

export interface EditorView {
  state: EditorState;
  viewport: { from: number; to: number };
  visibleRanges: readonly { from: number; to: number }[];
  dom: HTMLElement;
  dispatch: (tr: any) => void;
  destroy: () => void;
}

/**
 * Creates a mock CM6 EditorView instance for testing.
 * @param content - The document content
 * @param options - Optional configuration for viewport and visibleRanges
 */
export function createMockCM6Editor(
  content: string = '',
  options?: {
    viewport?: { from: number; to: number };
    visibleRanges?: { from: number; to: number }[];
  }
): EditorView {
  const doc = {
    toString: () => content,
    sliceString: (from: number, to: number) => content.slice(from, to),
  };

  const state: EditorState = {
    doc,
    sliceDoc: (from: number, to: number) => content.slice(from, to),
  };

  const viewport = options?.viewport ?? { from: 0, to: content.length };
  // By default, visibleRanges equals viewport (no off-screen buffer)
  const visibleRanges = options?.visibleRanges ?? [viewport];

  return {
    state,
    viewport,
    visibleRanges,
    dom: document.createElement('div'),
    dispatch: jest.fn(),
    destroy: jest.fn(),
  };
}

// ===== CM6 View Extension Mocks =====

export const Decoration = {
  widget: jest.fn(() => ({
    range: jest.fn((from: number, to?: number) => ({ from, to })),
  })),
  mark: jest.fn(() => ({
    range: jest.fn((from: number, to?: number) => ({ from, to })),
  })),
  none: { size: 0 },
};

export const WidgetType = class {
  eq(other: any): boolean { return false; }
  toDOM(): HTMLElement { return document.createElement('span'); }
  ignoreEvent(): boolean { return false; }
};

export const ViewPlugin = {
  fromClass: jest.fn((cls: any) => ({})),
  define: jest.fn((create: any) => ({})),
};

export const StateField = {
  define: jest.fn((config: any) => ({})),
};

export const StateEffect = {
  define: jest.fn(() => ({ of: jest.fn() })),
};

export const RangeSetBuilder = class {
  add(from: number, to: number, value: any) {}
  finish() { return { size: 0 }; }
};

// Export view module
export const view = {
  Decoration,
  WidgetType,
  ViewPlugin,
};

// Export state module
export const state = {
  StateField,
  StateEffect,
  RangeSetBuilder,
};
