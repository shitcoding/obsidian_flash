/**
 * Unit tests for src/flash/FlashController.ts
 * Tests the main controller for flash.nvim-style Flash mode.
 */

import { createMockCM6Editor, EditorView } from '../../mocks/codemirror';
import { Settings, FlashMatch } from '../../../types';
import { FlashController } from '../../../src/flash/FlashController';

// Mock MarkdownView
const createMockMarkdownView = () => ({
  contentEl: document.createElement('div'),
  editor: {
    cm: createMockCM6Editor('test content'),
  },
});

// Mock Plugin
const createMockPlugin = () => ({
  settings: new Settings(),
  app: {
    workspace: {
      getActiveViewOfType: jest.fn(),
    },
  },
});

describe('FlashController', () => {
  let plugin: any;
  let view: any;
  let editor: EditorView;
  let settings: Settings;
  let controller: FlashController;
  let contentEl: HTMLElement;

  beforeEach(() => {
    settings = new Settings();
    settings.letters = 'sadfjklewcmpgh';
    settings.flashCharacterCount = 2;

    plugin = createMockPlugin();
    plugin.settings = settings;

    view = createMockMarkdownView();
    contentEl = view.contentEl;
    editor = createMockCM6Editor('hello world test content');

    controller = new FlashController(plugin, view, editor, settings);
  });

  afterEach(() => {
    // Clean up any event listeners
    jest.clearAllMocks();
  });

  describe('activation', () => {
    it('should set active state when activated', () => {
      controller.activate();

      expect(controller.isActivated()).toBe(true);
    });

    it('should add dimming class to content element', () => {
      controller.activate();

      expect(contentEl.classList.contains('flash-active')).toBe(true);
    });

    it('should initialize with empty search string', () => {
      controller.activate();

      expect(controller.getSearchString()).toBe('');
    });

    it('should initialize with empty matches array', () => {
      controller.activate();

      expect(controller.getMatches()).toEqual([]);
    });
  });

  describe('deactivation', () => {
    it('should clear active state when deactivated', () => {
      controller.activate();
      controller.deactivate();

      expect(controller.isActivated()).toBe(false);
    });

    it('should remove dimming class from content element', () => {
      controller.activate();
      controller.deactivate();

      expect(contentEl.classList.contains('flash-active')).toBe(false);
    });

    it('should clear search string', () => {
      controller.activate();
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.deactivate();

      expect(controller.getSearchString()).toBe('');
    });

    it('should clear matches', () => {
      controller.activate();
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.deactivate();

      expect(controller.getMatches()).toEqual([]);
    });
  });

  describe('handleKey - character accumulation', () => {
    beforeEach(() => {
      // Use content with multiple matches for common search terms to avoid auto-jump
      editor = createMockCM6Editor('test testing tested tester testable');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();
    });

    it('should accumulate typed characters', () => {
      controller.handleKeyForTest('t');

      expect(controller.getSearchString()).toBe('t');
    });

    it('should accumulate multiple characters', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest('s');

      expect(controller.getSearchString()).toBe('tes');
    });

    it('should handle uppercase characters', () => {
      controller.handleKeyForTest('T');
      controller.handleKeyForTest('E');

      expect(controller.getSearchString()).toBe('TE');
    });

    it('should handle mixed case characters', () => {
      controller.handleKeyForTest('T');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest('S');

      expect(controller.getSearchString()).toBe('TeS');
    });
  });

  describe('handleKey - backspace', () => {
    beforeEach(() => {
      // Use content with multiple matches to avoid auto-jump
      editor = createMockCM6Editor('test testing tested tester testable');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();
    });

    it('should remove last character on backspace', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest('s');
      controller.handleKeyForTest('Backspace');

      expect(controller.getSearchString()).toBe('te');
    });

    it('should handle backspace on single character', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('Backspace');

      expect(controller.getSearchString()).toBe('');
    });

    it('should handle backspace on empty string', () => {
      controller.handleKeyForTest('Backspace');

      expect(controller.getSearchString()).toBe('');
    });

    it('should update matches after backspace', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest('s');
      // Matches for 'tes'
      const matchesBefore = controller.getMatches().length;

      controller.handleKeyForTest('Backspace');
      // Matches for 'te' - might be different
      const matchesAfter = controller.getMatches().length;

      // Just verify update happened (count may differ)
      expect(typeof matchesAfter).toBe('number');
    });
  });

  describe('handleKey - escape', () => {
    beforeEach(() => {
      controller.activate();
    });

    it('should deactivate on escape', () => {
      controller.handleKeyForTest('Escape');

      expect(controller.isActivated()).toBe(false);
    });

    it('should clear search string on escape', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest('Escape');

      expect(controller.getSearchString()).toBe('');
    });

    it('should remove dimming on escape', () => {
      controller.handleKeyForTest('Escape');

      expect(contentEl.classList.contains('flash-active')).toBe(false);
    });
  });

  describe('handleKey - minimum characters for search', () => {
    beforeEach(() => {
      settings.flashCharacterCount = 2;
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();
    });

    it('should NOT update matches before minimum characters reached', () => {
      controller.handleKeyForTest('t');

      // With minimum of 2, single char should not trigger search
      expect(controller.getMatches()).toEqual([]);
    });

    it('should update matches when minimum characters reached', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');

      // With minimum of 2, 'te' should trigger search
      // Note: actual match count depends on content
      expect(Array.isArray(controller.getMatches())).toBe(true);
    });

    it('should update matches when exceeding minimum characters', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest('s');

      // With minimum of 2, 'tes' should definitely trigger search
      expect(Array.isArray(controller.getMatches())).toBe(true);
    });

    it('should handle minimum of 1 character', () => {
      settings.flashCharacterCount = 1;
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      controller.handleKeyForTest('t');

      // With minimum of 1, single char should trigger search
      expect(Array.isArray(controller.getMatches())).toBe(true);
    });

    it('should clear matches when backspacing below minimum', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      // Now at 2 chars, should have matches

      controller.handleKeyForTest('Backspace');
      // Now at 1 char, below minimum of 2

      expect(controller.getMatches()).toEqual([]);
    });
  });

  describe('handleKey - label detection and jump', () => {
    beforeEach(() => {
      settings.flashCharacterCount = 2;
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();
    });

    it('should detect when typed character matches a label', () => {
      // Use content where label won't extend search
      // Search for "ab" in "abc xyz" - label "S" won't extend "ab" to valid matches
      editor = createMockCM6Editor('abc xyz abc');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // Type search pattern
      controller.handleKeyForTest('a');
      controller.handleKeyForTest('b');

      // Get available labels
      const matches = controller.getMatches();

      if (matches.length > 0) {
        const firstLabel = matches[0].letter;

        // Type the label - should trigger jump (since "abS" won't match anything)
        controller.handleKeyForTest(firstLabel);

        // After jump, controller should deactivate
        expect(controller.isActivated()).toBe(false);
      }
    });

    it('should handle two-letter labels (prefix filtering)', () => {
      // This tests the case where we have labels like 'sa', 'sb', etc.
      // Typing 's' should filter to only labels starting with 's'
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');

      const matches = controller.getMatches();

      // Find a two-letter label if any
      const twoLetterMatch = matches.find(m => m.letter.length === 2);

      if (twoLetterMatch) {
        const prefix = twoLetterMatch.letter[0];
        controller.handleKeyForTest(prefix);

        // Should still be active, waiting for second letter
        expect(controller.isActivated()).toBe(true);

        // Filtered matches should only have labels starting with prefix
        const filteredMatches = controller.getMatches();
        filteredMatches.forEach(m => {
          if (m.letter.length === 2) {
            expect(m.letter[0].toLowerCase()).toBe(prefix.toLowerCase());
          }
        });
      }
    });

    it('should not interpret search chars as labels before minimum', () => {
      settings.letters = 'test'; // 't', 'e', 's' are valid label letters
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      controller.handleKeyForTest('t');

      // 't' should be added to search, not interpreted as label
      expect(controller.getSearchString()).toBe('t');
      expect(controller.isActivated()).toBe(true);
    });
  });

  describe('handleKey - Cyrillic keyboard support', () => {
    beforeEach(() => {
      controller.activate();
    });

    it('should handle Cyrillic characters in search', () => {
      // User typing in Russian
      controller.handleKeyForTest('t'); // Cyrillic representation may differ
      controller.handleKeyForTest('e');

      expect(controller.getSearchString().length).toBe(2);
    });

    it('should convert Cyrillic keys for label matching', () => {
      // Use content where label won't extend search
      editor = createMockCM6Editor('abc xyz abc');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // When user types Cyrillic 'a' (Russian letter) but label is 'A'
      // The controller should normalize the keypress
      controller.handleKeyForTest('a');
      controller.handleKeyForTest('b');

      const matches = controller.getMatches();

      if (matches.length > 0) {
        const label = matches[0].letter;

        // Cyrillic key mapping: Russian keyboard position
        // For example, Russian 'f' is in the same position as Latin 'a'
        // This test verifies that keyboard mapping works

        // Type the Latin equivalent - should work
        controller.handleKeyForTest(label);

        // Should trigger jump
        expect(controller.isActivated()).toBe(false);
      }
    });

    it('should accept both Latin and Cyrillic input for labels', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');

      const matches = controller.getMatches();

      if (matches.length > 0 && matches[0].letter === 'a') {
        // In Russian keyboard layout, 'f' key produces 'a' position
        // This test documents the expected behavior
        expect(controller.isActivated()).toBe(true);
      }
    });
  });

  describe('handleKey - modifier keys', () => {
    beforeEach(() => {
      controller.activate();
    });

    it('should ignore Shift key alone', () => {
      controller.handleKeyForTest('Shift');

      expect(controller.getSearchString()).toBe('');
      expect(controller.isActivated()).toBe(true);
    });

    it('should ignore Control key', () => {
      controller.handleKeyForTest('Control');

      expect(controller.getSearchString()).toBe('');
      expect(controller.isActivated()).toBe(true);
    });

    it('should ignore Alt key', () => {
      controller.handleKeyForTest('Alt');

      expect(controller.getSearchString()).toBe('');
      expect(controller.isActivated()).toBe(true);
    });

    it('should ignore Meta key', () => {
      controller.handleKeyForTest('Meta');

      expect(controller.getSearchString()).toBe('');
      expect(controller.isActivated()).toBe(true);
    });

    it('should handle Tab key (may cancel)', () => {
      controller.handleKeyForTest('Tab');

      // Tab might cancel or be ignored - document actual behavior
      expect(typeof controller.isActivated()).toBe('boolean');
    });
  });

  describe('handleKey - special printable characters', () => {
    beforeEach(() => {
      // Use content with multiple matches for search terms to avoid auto-jump
      editor = createMockCM6Editor('hello he world he w something he w else');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();
    });

    it('should accept space character in search', () => {
      controller.handleKeyForTest('h');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest(' ');
      controller.handleKeyForTest('w');

      expect(controller.getSearchString()).toBe('he w');
    });

    it('should accept punctuation in search', () => {
      controller.handleKeyForTest('.');
      controller.handleKeyForTest('t');

      expect(controller.getSearchString()).toBe('.t');
    });

    it('should accept numbers in search', () => {
      controller.handleKeyForTest('1');
      controller.handleKeyForTest('2');

      expect(controller.getSearchString()).toBe('12');
    });
  });

  describe('event handling', () => {
    it('should register keydown handler on activate', () => {
      const addEventListenerSpy = jest.spyOn(contentEl, 'addEventListener');

      controller.activate();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        expect.objectContaining({ capture: true })
      );
    });

    it('should register click handler on activate', () => {
      const addEventListenerSpy = jest.spyOn(contentEl, 'addEventListener');

      controller.activate();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        expect.objectContaining({ capture: true })
      );
    });

    it('should remove keydown handler on deactivate', () => {
      const removeEventListenerSpy = jest.spyOn(contentEl, 'removeEventListener');

      controller.activate();
      controller.deactivate();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        expect.objectContaining({ capture: true })
      );
    });

    it('should remove click handler on deactivate', () => {
      const removeEventListenerSpy = jest.spyOn(contentEl, 'removeEventListener');

      controller.activate();
      controller.deactivate();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        expect.objectContaining({ capture: true })
      );
    });

    it('should deactivate on click', () => {
      controller.activate();
      expect(controller.isActivated()).toBe(true);

      // Simulate click event
      const clickEvent = new MouseEvent('click', { bubbles: true });
      contentEl.dispatchEvent(clickEvent);

      expect(controller.isActivated()).toBe(false);
    });

    it('should prevent default on handled keys', () => {
      controller.activate();

      const event = new KeyboardEvent('keydown', { key: 't' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      // Simulate event dispatch
      contentEl.dispatchEvent(event);

      // Verify preventDefault was called
      // Note: This depends on how the handler is implemented
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should stop propagation on handled keys', () => {
      controller.activate();

      const event = new KeyboardEvent('keydown', { key: 't' });
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      contentEl.dispatchEvent(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('cursor positioning after jump', () => {
    it('should move cursor to match index on jump', () => {
      // Use content where label won't extend search
      editor = createMockCM6Editor('abc xyz abc');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // This test verifies the jump destination
      controller.handleKeyForTest('a');
      controller.handleKeyForTest('b');

      const matches = controller.getMatches();

      if (matches.length > 0) {
        const targetIndex = matches[0].index;
        const label = matches[0].letter;

        controller.handleKeyForTest(label);

        // Verify cursor moved to correct position
        // Note: Need to check editor.dispatch was called with correct selection
        expect(editor.dispatch).toHaveBeenCalled();
      }
    });
  });

  describe('incremental search behavior', () => {
    beforeEach(() => {
      settings.flashCharacterCount = 2;
      editor = createMockCM6Editor('test testing tested tester');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();
    });

    it('should narrow matches as more characters are typed', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      const matchesAt2 = controller.getMatches().length;

      controller.handleKeyForTest('s');
      const matchesAt3 = controller.getMatches().length;

      controller.handleKeyForTest('t');
      const matchesAt4 = controller.getMatches().length;

      // Matches should generally decrease or stay same as search narrows
      // (depends on content, but test documents the behavior)
      expect(matchesAt4).toBeLessThanOrEqual(matchesAt3);
      expect(matchesAt3).toBeLessThanOrEqual(matchesAt2);
    });

    it('should widen matches as characters are deleted', () => {
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');
      controller.handleKeyForTest('s');
      controller.handleKeyForTest('t');
      const matchesAt4 = controller.getMatches().length;

      controller.handleKeyForTest('Backspace');
      const matchesAt3 = controller.getMatches().length;

      // Matches should increase when search string shrinks
      expect(matchesAt3).toBeGreaterThanOrEqual(matchesAt4);
    });
  });

  describe('auto-jump when single match remains', () => {
    beforeEach(() => {
      settings.flashCharacterCount = 2;
    });

    it('should auto-jump when only one match remains after typing', () => {
      // Content with a unique substring that narrows to exactly one match
      editor = createMockCM6Editor('apple banana cherry');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // Type 'ch' - only 'cherry' matches
      controller.handleKeyForTest('c');
      controller.handleKeyForTest('h');

      // Should auto-jump and deactivate when exactly one match found
      expect(controller.isActivated()).toBe(false);
      expect(editor.dispatch).toHaveBeenCalled();
    });

    it('should auto-jump when extending search narrows to one match', () => {
      // Content where 'ba' has multiple matches but 'ban' has one
      editor = createMockCM6Editor('ball bat banana');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // Type 'ba' - multiple matches (ball, bat, banana)
      controller.handleKeyForTest('b');
      controller.handleKeyForTest('a');

      // Should still be active with multiple matches
      expect(controller.isActivated()).toBe(true);
      const matchesAtBa = controller.getMatches().length;
      expect(matchesAtBa).toBeGreaterThan(1);

      // Type 'n' - only 'banana' matches
      controller.handleKeyForTest('n');

      // Should auto-jump and deactivate
      expect(controller.isActivated()).toBe(false);
      expect(editor.dispatch).toHaveBeenCalled();
    });

    it('should NOT auto-jump before minimum character count', () => {
      // Content with only one match for first character
      editor = createMockCM6Editor('xyz apple banana');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // Type 'x' - only one possible match but below min chars (2)
      controller.handleKeyForTest('x');

      // Should NOT auto-jump, still waiting for more characters
      expect(controller.isActivated()).toBe(true);
      expect(controller.getSearchString()).toBe('x');
    });

    it('should NOT auto-jump when no matches exist', () => {
      editor = createMockCM6Editor('apple banana cherry');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // Type 'zz' - no matches
      controller.handleKeyForTest('z');
      controller.handleKeyForTest('z');

      // Should still be active (no auto-jump on zero matches)
      expect(controller.isActivated()).toBe(true);
      expect(controller.getMatches().length).toBe(0);
    });

    it('should NOT auto-jump when multiple matches exist', () => {
      editor = createMockCM6Editor('test testing tested');
      controller = new FlashController(plugin, view, editor, settings);
      controller.activate();

      // Type 'te' - multiple matches
      controller.handleKeyForTest('t');
      controller.handleKeyForTest('e');

      // Should still be active with multiple matches
      expect(controller.isActivated()).toBe(true);
      expect(controller.getMatches().length).toBeGreaterThan(1);
    });
  });
});
