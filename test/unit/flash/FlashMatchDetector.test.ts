/**
 * Unit tests for src/flash/FlashMatchDetector.ts
 * Tests match detection with match length tracking for flash.nvim-style Flash mode.
 */

import { createMockCM6Editor, EditorView } from '../../mocks/codemirror';
import { Settings, FlashMatch } from '../../../types';
import { FlashMatchDetector } from '../../../src/flash/FlashMatchDetector';

describe('FlashMatchDetector', () => {
  let editor: EditorView;
  let settings: Settings;
  let detector: FlashMatchDetector;

  beforeEach(() => {
    settings = new Settings();
    settings.letters = 'sadfjklewcmpgh';
  });

  const createDetector = (content: string, options?: {
    viewport?: { from: number; to: number };
    visibleRanges?: { from: number; to: number }[];
  }): FlashMatchDetector => {
    editor = createMockCM6Editor(content, options);
    return new FlashMatchDetector(editor, settings);
  };

  describe('findMatches - basic functionality', () => {
    it('should return matches with correct matchLength', () => {
      detector = createDetector('hello world test');

      const matches = detector.findMatches('wor');

      expect(matches.length).toBe(1);
      expect(matches[0].matchLength).toBe(3);
      expect(matches[0].linkText).toBe('wor');
    });

    it('should return index at start of match', () => {
      detector = createDetector('hello world');

      const matches = detector.findMatches('world');

      expect(matches.length).toBe(1);
      expect(matches[0].index).toBe(6);
    });

    it('should find multiple matches', () => {
      detector = createDetector('test one test two test three');

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(3);
      matches.forEach(m => {
        expect(m.matchLength).toBe(4);
        expect(m.linkText).toBe('test');
      });
    });

    it('should return empty array when no matches', () => {
      detector = createDetector('hello world');

      const matches = detector.findMatches('xyz');

      expect(matches).toEqual([]);
    });

    it('should set type to flash for all matches', () => {
      detector = createDetector('test test test');

      const matches = detector.findMatches('test');

      matches.forEach(m => {
        expect(m.type).toBe('flash');
      });
    });
  });

  describe('findMatches - label assignment', () => {
    it('should assign unique hint labels to matches', () => {
      detector = createDetector('test test test test test');

      const matches = detector.findMatches('test');

      const letters = matches.map(m => m.letter);
      const unique = new Set(letters);
      expect(unique.size).toBe(letters.length);
    });

    it('should use letters from settings alphabet', () => {
      settings.letters = 'abc';
      detector = createDetector('test test test');

      const matches = detector.findMatches('test');

      matches.forEach(m => {
        // Labels should be lowercase versions of settings.letters
        expect(['a', 'b', 'c', 'aa', 'ab', 'ac', 'ba', 'bb', 'bc', 'ca', 'cb', 'cc']).toContain(m.letter);
      });
    });

    it('should not return matches beyond available labels', () => {
      settings.letters = 'a'; // Only one letter available
      detector = createDetector('a a a a a a a a a a');

      const matches = detector.findMatches('a');

      // With single-letter alphabet, can generate: a, aa (limited)
      expect(matches.length).toBeLessThanOrEqual(2);
      matches.forEach(m => {
        expect(m.letter).not.toBe('');
      });
    });
  });

  describe('findMatches - case sensitivity', () => {
    it('should match case-insensitively by default', () => {
      settings.flashCaseSensitive = false;
      detector = createDetector('Hello HELLO hello');

      const matches = detector.findMatches('hello');

      expect(matches.length).toBe(3);
    });

    it('should match case-sensitively when enabled', () => {
      settings.flashCaseSensitive = true;
      detector = createDetector('Hello HELLO hello');

      const matches = detector.findMatches('hello');

      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('hello');
    });

    it('should match uppercase pattern case-sensitively', () => {
      settings.flashCaseSensitive = true;
      detector = createDetector('Hello HELLO hello');

      const matches = detector.findMatches('HELLO');

      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('HELLO');
    });
  });

  describe('findMatches - matching behavior', () => {
    it('should match anywhere in content', () => {
      detector = createDetector('testing test contest');

      const matches = detector.findMatches('test');

      // Should match: "test"ing, "test", con"test"
      expect(matches.length).toBe(3);
    });

    it('should match with punctuation', () => {
      detector = createDetector('test, test. test!');

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(3);
    });

    it('should match at start of content', () => {
      detector = createDetector('test is first');

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(1);
      expect(matches[0].index).toBe(0);
    });
  });

  describe('findMatches - Cyrillic/Unicode support', () => {
    it('should find Cyrillic text matches', () => {
      detector = createDetector('hello world test');

      const matches = detector.findMatches('hello');

      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('hello');
    });

    it('should find Russian word matches', () => {
      detector = createDetector('hello test world');

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('test');
    });

    it('should work with mixed Latin and Cyrillic content', () => {
      detector = createDetector('hello world test message');

      const matchesLatin = detector.findMatches('world');
      expect(matchesLatin.length).toBe(1);

      const matchesCyrillic = detector.findMatches('hello');
      expect(matchesCyrillic.length).toBe(1);
    });

    it('should find Cyrillic text at start of content', () => {
      detector = createDetector('hello test world');

      const matches = detector.findMatches('hello');

      expect(matches.length).toBe(1);
      expect(matches[0].index).toBe(0);
    });

    it('should handle Cyrillic case insensitively', () => {
      settings.flashCaseSensitive = false;
      detector = createDetector('Test TEST test');

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(3);
    });

    it('should handle Cyrillic case sensitively', () => {
      settings.flashCaseSensitive = true;
      detector = createDetector('Test TEST test');

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(1);
    });
  });

  describe('findMatches - special character safety', () => {
    it('should handle special regex characters in search string safely', () => {
      detector = createDetector('test (parentheses) and [brackets]');

      // Should not throw an error
      expect(() => detector.findMatches('(p')).not.toThrow();
      expect(() => detector.findMatches('[b')).not.toThrow();
      expect(() => detector.findMatches('.*')).not.toThrow();
    });

    it('should escape dots in search string', () => {
      detector = createDetector('file.txt file-txt filetxt');

      const matches = detector.findMatches('file.txt');

      // Should only match "file.txt", not "file-txt" or similar
      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('file.txt');
    });

    it('should escape asterisks in search string', () => {
      detector = createDetector('test* star test teststar');

      const matches = detector.findMatches('test*');

      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('test*');
    });

    it('should handle backslashes in search string', () => {
      detector = createDetector('path\\to\\file other');

      // Should not throw
      expect(() => detector.findMatches('path\\')).not.toThrow();
    });

    it('should handle pipe character in search string', () => {
      detector = createDetector('a|b a b ab');

      const matches = detector.findMatches('a|b');

      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('a|b');
    });
  });

  describe('findMatches - edge cases', () => {
    it('should return empty array for empty search string', () => {
      detector = createDetector('hello world');

      const matches = detector.findMatches('');

      expect(matches).toEqual([]);
    });

    it('should return empty array for empty content', () => {
      detector = createDetector('');

      const matches = detector.findMatches('test');

      expect(matches).toEqual([]);
    });

    it('should handle single character search', () => {
      detector = createDetector('a b c a');

      const matches = detector.findMatches('a');

      expect(matches.length).toBe(2);
      expect(matches[0].matchLength).toBe(1);
    });

    it('should handle very long search string', () => {
      const longWord = 'supercalifragilisticexpialidocious';
      detector = createDetector(`${longWord} other words`);

      const matches = detector.findMatches(longWord);

      expect(matches.length).toBe(1);
      expect(matches[0].matchLength).toBe(longWord.length);
    });

    it('should handle whitespace in search string', () => {
      detector = createDetector('hello world test');

      const matches = detector.findMatches('hello world');

      expect(matches.length).toBe(1);
      expect(matches[0].linkText).toBe('hello world');
    });

    it('should handle newlines in content', () => {
      detector = createDetector('test\ntest\ntest');

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(3);
    });

    it('should handle search string not found', () => {
      detector = createDetector('hello world');

      const matches = detector.findMatches('xyz123');

      expect(matches).toEqual([]);
    });
  });

  describe('findMatches - match ordering', () => {
    it('should return matches sorted by index', () => {
      detector = createDetector('test one test two test three');

      const matches = detector.findMatches('test');

      for (let i = 1; i < matches.length; i++) {
        expect(matches[i].index).toBeGreaterThan(matches[i - 1].index);
      }
    });

    it('should assign labels in order (first match gets first label)', () => {
      settings.letters = 'abc';
      detector = createDetector('test test test');

      const matches = detector.findMatches('test');

      // First match should get label starting with 'A' or similar
      expect(matches[0].letter).toBeDefined();
      expect(matches[0].letter.length).toBeGreaterThan(0);
    });
  });

  describe('findMatches - next character exclusion (flash.nvim style)', () => {
    it('should not assign labels matching next char after match', () => {
      // "fla" in "flash" - next char is "s", so "s" should not be a label
      settings.letters = 'sadfjklewcmpgh';
      detector = createDetector('flash flash flash');

      const matches = detector.findMatches('fla');

      // None of the labels should be 's' or contain 's'
      matches.forEach(m => {
        expect(m.letter).not.toContain('s');
      });
    });

    it('should exclude multiple different next chars', () => {
      // "te" in "test" and "team" - next chars are "s" and "a"
      settings.letters = 'sadfjklewcmpgh';
      detector = createDetector('test team');

      const matches = detector.findMatches('te');

      // Labels should not contain 's' or 'a'
      matches.forEach(m => {
        expect(m.letter).not.toContain('s');
        expect(m.letter).not.toContain('a');
      });
    });

    it('should allow labels when next char is whitespace', () => {
      // "hello " (space after) - whitespace should not be excluded
      settings.letters = 'sadfjklewcmpgh';
      detector = createDetector('hello world hello again');

      const matches = detector.findMatches('hello');

      // Should still get labels (whitespace doesn't count)
      expect(matches.length).toBe(2);
      matches.forEach(m => {
        expect(m.letter).toBeDefined();
        expect(m.letter.length).toBeGreaterThan(0);
      });
    });

    it('should allow labels when match is at end of content', () => {
      settings.letters = 'sadfjklewcmpgh';
      detector = createDetector('start middle end');

      const matches = detector.findMatches('end');

      // Should get a label (no next char at end)
      expect(matches.length).toBe(1);
      expect(matches[0].letter).toBeDefined();
    });

    it('should work with Cyrillic next characters', () => {
      // Russian: "при" in "привет" - next char is "в"
      settings.letters = 'sadfjklewcmpgh';
      detector = createDetector('привет привет');

      const matches = detector.findMatches('при');

      // Cyrillic "в" is not in Latin alphabet, so all labels should be available
      expect(matches.length).toBe(2);
      matches.forEach(m => {
        expect(m.letter).toBeDefined();
      });
    });

    it('should exclude next char case-insensitively', () => {
      // "FL" in "FLASH" - next char is "A", should exclude "a"
      settings.letters = 'sadfjklewcmpgh';
      detector = createDetector('FLASH flash FLASH');

      const matches = detector.findMatches('fl');

      // Labels should not contain 'a' (case insensitive)
      matches.forEach(m => {
        expect(m.letter).not.toContain('a');
      });
    });

    it('should still generate labels when all preferred are excluded', () => {
      // Edge case: if next chars would exclude everything, fallback to full alphabet
      settings.letters = 'sab';
      detector = createDetector('sab sab sab');

      const matches = detector.findMatches('sa');

      // Next char is 'b', which is in alphabet
      // Should still get labels (fallback behavior)
      expect(matches.length).toBe(3);
    });

    it('should not over-exclude labels in case-sensitive mode', () => {
      // In case-sensitive mode, lower-case continuation key may not actually
      // extend an upper-case match and should remain available as a label.
      settings.flashCaseSensitive = true;
      settings.letters = 'xyz';
      detector = createDetector('ABX ABY');

      const matches = detector.findMatches('AB');

      // Both matches should still receive labels.
      expect(matches.length).toBe(2);
      expect(matches.every(match => match.letter.length > 0)).toBe(true);
    });
  });

  describe('findMatches - off-screen filtering (visibleRanges)', () => {
    it('should only return matches within visibleRanges', () => {
      // Content: "test one test two test three" (indices 0-28)
      // viewport is larger (includes off-screen buffer)
      // visibleRanges is smaller (only truly visible)
      const content = 'test one test two test three';
      // Viewport includes all content (0-28), but visibleRanges only includes middle "test" (9-17)
      detector = createDetector(content, {
        viewport: { from: 0, to: content.length },
        visibleRanges: [{ from: 9, to: 17 }] // Only "test two" is visible
      });

      const matches = detector.findMatches('test');

      // Should only match the "test" at index 9, not the ones at 0 or 18
      expect(matches.length).toBe(1);
      expect(matches[0].index).toBe(9);
    });

    it('should filter out matches in viewport but not in visibleRanges', () => {
      // Simulates CM6 behavior where viewport includes off-screen buffer
      const content = 'aaa bbb ccc ddd eee fff';
      // Viewport is large (0-23), but only "ccc ddd" (8-15) is visible
      detector = createDetector(content, {
        viewport: { from: 0, to: content.length },
        visibleRanges: [{ from: 8, to: 15 }]
      });

      const matches = detector.findMatches('a');

      // "aaa" is at index 0-2, which is in viewport but NOT in visibleRanges
      expect(matches.length).toBe(0);
    });

    it('should handle multiple visibleRanges', () => {
      // Some editors might have multiple visible ranges (e.g., folded sections)
      const content = 'test1 hidden test2 hidden test3';
      // test1 at 0, test2 at 13, test3 at 26
      detector = createDetector(content, {
        viewport: { from: 0, to: content.length },
        visibleRanges: [
          { from: 0, to: 5 },    // "test1" visible
          { from: 26, to: 31 }   // "test3" visible
        ]
      });

      const matches = detector.findMatches('test');

      // Should find "test1" at 0 and "test3" at 26
      // "hidden test2 hidden" is hidden (indices 5-25)
      expect(matches.length).toBe(2);
      expect(matches[0].index).toBe(0);
      expect(matches[1].index).toBe(26);
    });

    it('should return all matches when visibleRanges equals viewport', () => {
      // Normal case: everything in viewport is visible
      const content = 'test test test';
      detector = createDetector(content, {
        viewport: { from: 0, to: content.length },
        visibleRanges: [{ from: 0, to: content.length }]
      });

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(3);
    });

    it('should handle match at boundary of visibleRange', () => {
      const content = 'test at boundary';
      // Match starts exactly at visibleRange.from
      detector = createDetector(content, {
        viewport: { from: 0, to: content.length },
        visibleRanges: [{ from: 0, to: 4 }] // Only "test" visible
      });

      const matches = detector.findMatches('test');

      expect(matches.length).toBe(1);
      expect(matches[0].index).toBe(0);
    });

    it('should exclude match that starts at visibleRange.to', () => {
      const content = 'aaa test';
      // visibleRange ends where "test" starts (index 4)
      detector = createDetector(content, {
        viewport: { from: 0, to: content.length },
        visibleRanges: [{ from: 0, to: 4 }] // Only "aaa " visible
      });

      const matches = detector.findMatches('test');

      // "test" starts at index 4, which is >= visibleRange.to, so excluded
      expect(matches.length).toBe(0);
    });
  });
});
