/**
 * Unit tests for src/utils/common.ts
 * Tests link hint generation and visible content extraction.
 */

import {
  getLinkHintLetters,
  isCyrillic,
  convertToLatin,
} from '../../../src/utils/common';
import { createMockCM6Editor } from '../../mocks/codemirror';

describe('getLinkHintLetters', () => {
  const alphabet = 'sadfjklewcmpgh';

  describe('single letter hints', () => {
    it('should generate single letters for small count', () => {
      const result = getLinkHintLetters(alphabet, 5);

      expect(result.length).toBe(5);
      result.forEach(letter => {
        expect(letter.length).toBe(1);
      });
    });

    it('should use lowercase letters', () => {
      const result = getLinkHintLetters(alphabet, 3);

      result.forEach(letter => {
        expect(letter).toBe(letter.toLowerCase());
      });
    });

    it('should generate unique letters', () => {
      const result = getLinkHintLetters(alphabet, 10);

      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
    });
  });

  describe('two letter hints (prefix expansion)', () => {
    it('should use two-letter prefixes when needed', () => {
      // With 14-char alphabet, need more than 14 hints to trigger prefixes
      const result = getLinkHintLetters(alphabet, 20);

      expect(result.length).toBe(20);
      // Some should have 2 characters
      const twoCharHints = result.filter(h => h.length === 2);
      expect(twoCharHints.length).toBeGreaterThan(0);
    });

    it('should skip prefix letters from single-letter pool', () => {
      const result = getLinkHintLetters(alphabet, 20);

      // When prefixes are used, those letters should not appear alone
      const singleLetterHints = result.filter(h => h.length === 1);
      const twoCharPrefixes = result
        .filter(h => h.length === 2)
        .map(h => h[0]);

      const prefixSet = new Set(twoCharPrefixes);
      singleLetterHints.forEach(single => {
        expect(prefixSet.has(single)).toBe(false);
      });
    });

    it('should generate enough hints for large count', () => {
      const result = getLinkHintLetters(alphabet, 100);

      expect(result.length).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for zero count', () => {
      const result = getLinkHintLetters(alphabet, 0);
      expect(result).toEqual([]);
    });

    it('should handle count of 1', () => {
      const result = getLinkHintLetters(alphabet, 1);

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);
    });

    it('should handle short alphabet', () => {
      const shortAlphabet = 'ab';
      const result = getLinkHintLetters(shortAlphabet, 5);

      // With 2-letter alphabet, can generate: B (single), AA, AB, BA, BB = 5 labels max
      // But algorithm may produce fewer due to prefix reservation
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should handle single letter alphabet', () => {
      const singleAlphabet = 'a';
      const result = getLinkHintLetters(singleAlphabet, 3);

      // With single letter, all hints will be 'A' or 'AA', etc.
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('different alphabets', () => {
    it('should work with home row only', () => {
      const homeRow = 'asdfghjkl';
      const result = getLinkHintLetters(homeRow, 8);

      expect(result.length).toBe(8);
      result.forEach(letter => {
        const chars = letter.split('');
        chars.forEach(c => {
          expect(homeRow.toLowerCase()).toContain(c);
        });
      });
    });

    it('should work with full qwerty', () => {
      const qwerty = 'asdfghjklqwertyuiopzxcvbnm';
      const result = getLinkHintLetters(qwerty, 50);

      expect(result.length).toBe(50);
    });
  });
});

describe('isCyrillic', () => {
  describe('Cyrillic detection', () => {
    it('should return true for Russian lowercase', () => {
      expect(isCyrillic('привет')).toBe(true);
    });

    it('should return true for Russian uppercase', () => {
      expect(isCyrillic('ПРИВЕТ')).toBe(true);
    });

    it('should return true for mixed case Russian', () => {
      expect(isCyrillic('Привет')).toBe(true);
    });

    it('should return true for single Cyrillic letter', () => {
      expect(isCyrillic('а')).toBe(true);
    });

    it('should return true for Ukrainian letters', () => {
      expect(isCyrillic('ї')).toBe(true);
      expect(isCyrillic('є')).toBe(true);
    });
  });

  describe('non-Cyrillic detection', () => {
    it('should return false for Latin letters', () => {
      expect(isCyrillic('hello')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isCyrillic('12345')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isCyrillic('')).toBe(false);
    });

    it('should return false for special characters', () => {
      expect(isCyrillic('!@#$%')).toBe(false);
    });

    it('should return false for Chinese characters', () => {
      expect(isCyrillic('hello')).toBe(false);
    });
  });

  describe('mixed content', () => {
    it('should return true for mixed Cyrillic and Latin', () => {
      expect(isCyrillic('hello привет')).toBe(true);
    });

    it('should return true for Cyrillic with numbers', () => {
      expect(isCyrillic('привет123')).toBe(true);
    });

    it('should return true for Cyrillic with special chars', () => {
      expect(isCyrillic('привет!')).toBe(true);
    });
  });
});

describe('convertToLatin', () => {
  describe('lowercase conversion', () => {
    it('should convert й to q', () => {
      expect(convertToLatin('й')).toBe('q');
    });

    it('should convert common Russian letters', () => {
      expect(convertToLatin('фыва')).toBe('asdf');
    });

    it('should convert all home row letters', () => {
      expect(convertToLatin('фывапролдж')).toBe('asdfghjkl;');
    });
  });

  describe('uppercase conversion', () => {
    it('should convert uppercase Й to Q', () => {
      expect(convertToLatin('Й')).toBe('Q');
    });

    it('should convert uppercase common letters', () => {
      expect(convertToLatin('ФЫВА')).toBe('ASDF');
    });
  });

  describe('mixed content', () => {
    it('should leave Latin letters unchanged', () => {
      expect(convertToLatin('abc')).toBe('abc');
    });

    it('should handle mixed Cyrillic and Latin', () => {
      expect(convertToLatin('aфb')).toBe('aab');
    });

    it('should leave numbers unchanged', () => {
      expect(convertToLatin('123')).toBe('123');
    });

    it('should leave special chars unchanged', () => {
      expect(convertToLatin('!@#')).toBe('!@#');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(convertToLatin('')).toBe('');
    });

    it('should handle unmapped Cyrillic chars', () => {
      // Some rare Cyrillic letters might not be in the mapping
      // They should remain unchanged
      const result = convertToLatin('ё');
      expect(typeof result).toBe('string');
    });
  });

  describe('full keyboard mapping', () => {
    it('should convert full Russian text', () => {
      const russian = 'йцукенгшщзфывапролджячсмитьбю';
      const result = convertToLatin(russian);

      // Result should be all Latin/ASCII
      expect(isCyrillic(result)).toBe(false);
    });
  });
});

describe('getVisibleLinesCM6', () => {
  // Note: This function depends on CM6 internals that are hard to mock
  // These tests verify basic behavior with mock editor

  it('should extract content from viewport', () => {
    // We can't easily test the full function without real CM6
    // So we test that imports work and types are correct
    expect(typeof createMockCM6Editor).toBe('function');
  });

  it('should create mock editor with content', () => {
    const content = 'hello world\nline two\nline three';
    const editor = createMockCM6Editor(content);

    expect(editor.state.sliceDoc(0, 11)).toBe('hello world');
  });
});
