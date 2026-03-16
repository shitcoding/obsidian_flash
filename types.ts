/**
 * Flash Plugin Type Definitions
 */

// ===== Legacy CM5 Editor =====

/**
 * Minimal interface for CM5 Editor (legacy support).
 * Used instead of importing from 'codemirror' which lacks type definitions.
 */
export interface LegacyEditor {
    getCursor(): { line: number; ch: number };
    setCursor(pos: { line: number; ch: number }): void;
    posFromIndex(index: number): { line: number; ch: number };
    indexFromPos(pos: { line: number; ch: number }): number;
    listSelections(): Array<{ anchor: { line: number; ch: number } }>;
    getScrollInfo(): { left: number; top: number; height: number; width: number };
    coordsChar(coords: { left: number; top: number }, mode?: string): { line: number; ch: number };
    getRange(from: { ch: number; line: number }, to: { ch: number; line: number }): string;
    addWidget(pos: { line: number; ch: number }, node: HTMLElement, scroll: boolean, position: string): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    state: { vim?: { mode?: string } };
}

// ===== Flash Types =====

/**
 * Match found by Flash mode with position and length tracking
 */
export interface FlashMatch {
    index: number;
    matchLength: number;
    letter: string;
    linkText: string;
    type: 'flash';
}

/**
 * Font information for label rendering with font inheritance
 */
export interface FontInfo {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
}

// ===== Hint Types =====

/**
 * Types of hints that can be detected
 */
export type HintType = 'internal' | 'external' | 'regex';

// Backward compatibility
export type LinkHintType = HintType;

/**
 * Base hint interface - common properties for all hints
 */
export interface BaseHint {
	letter: string;
	type: HintType;
	linkText: string;
}

// Backward compatibility
export type LinkHintBase = BaseHint;

/**
 * Hint with DOM element reference (preview mode)
 */
export interface DOMHint extends BaseHint {
	linkElement: HTMLElement;
	left: number;
	top: number;
}

// Backward compatibility
export type PreviewLinkHint = DOMHint;

/**
 * Hint with document index (source mode)
 */
export interface IndexedHint extends BaseHint {
	index: number;
}

// Backward compatibility
export type SourceLinkHint = IndexedHint;

// ===== Settings =====

/**
 * Plugin settings configuration
 */
export class Settings {
	// Full alphabet with home row priority: asdfghjkl (home) → qwertyuiop (top) → zxcvbnm (bottom)
	letters: string = 'asdfghjklqwertyuiopzxcvbnm';

	// Unicode-aware regex for jump-to-anywhere (iOS-safe, no lookbehind)
	jumpToAnywhereRegex: string = '(?:^|[^\\p{L}\\p{N}_])([\\p{L}\\p{N}]{3,})(?![\\p{L}\\p{N}_])';

	// Jump to Anywhere settings
	jumpAnywhereJumpPosition: 'first-char' | 'last-char' | 'after-last-char' = 'after-last-char';
	jumpAnywhereJumpPositionCapital: 'first-char' | 'last-char' | 'after-last-char' = 'first-char';

	// Flash mode settings
	flashCaseSensitive: boolean = false;
	flashJumpPosition: 'match-start' | 'match-end' | 'after-match-end' | 'word-start' | 'word-end' | 'after-word-end' = 'match-end';
	flashJumpPositionCapital: 'match-start' | 'match-end' | 'after-match-end' | 'word-start' | 'word-end' | 'after-word-end' = 'match-start';
	flashCharacterCount: number = 2;

	// Flash visual settings
	flashLabelBackground: string = '#F47D1A';
	flashLabelColor: string = '#000000';
	flashMatchHighlight: string = '#F47D1A';
	flashDimOpacity: number = 0.4;
	flashInheritFont: boolean = true;

	// Auto-jump when single link
	jumpToLinkIfOneLinkOnly: boolean = true;
}

// ===== Processor Interface =====

/**
 * Interface for hint processors
 */
export interface Processor {
	letters: string;
	init(): BaseHint[];
}
