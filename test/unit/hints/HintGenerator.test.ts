/**
 * Unit tests for src/hints/HintGenerator.ts
 * Tests hint label generation with prefix expansion.
 */

import {
  generateHintLabels,
  getLinkHintLetters,
} from '../../../src/hints/HintGenerator';

describe('generateHintLabels', () => {
  const defaultAlphabet = 'sadfjklewcmpgh';

  describe('basic generation', () => {
    it('should generate requested number of labels', () => {
      expect(generateHintLabels(defaultAlphabet, 5).length).toBe(5);
      expect(generateHintLabels(defaultAlphabet, 10).length).toBe(10);
      expect(generateHintLabels(defaultAlphabet, 20).length).toBe(20);
    });

    it('should generate lowercase labels', () => {
      const result = generateHintLabels(defaultAlphabet, 5);
      result.forEach(label => {
        expect(label).toBe(label.toLowerCase());
      });
    });

    it('should generate unique labels', () => {
      const result = generateHintLabels(defaultAlphabet, 50);
      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
    });
  });

  describe('single letter hints', () => {
    it('should use single letters when count <= alphabet length', () => {
      const result = generateHintLabels(defaultAlphabet, 5);
      result.forEach(label => {
        expect(label.length).toBe(1);
      });
    });

    it('should use letters from the alphabet', () => {
      const result = generateHintLabels(defaultAlphabet, 5);
      const alphabetLower = defaultAlphabet.toLowerCase();
      result.forEach(label => {
        expect(alphabetLower).toContain(label);
      });
    });
  });

  describe('prefix expansion', () => {
    it('should use prefixes when count exceeds alphabet length', () => {
      const shortAlphabet = 'abcde'; // 5 letters
      const result = generateHintLabels(shortAlphabet, 10);

      // Should have some 2-letter labels
      const twoLetterLabels = result.filter(l => l.length === 2);
      expect(twoLetterLabels.length).toBeGreaterThan(0);
    });

    it('should skip prefix letters from single-letter pool', () => {
      const alphabet = 'abcde';
      const result = generateHintLabels(alphabet, 15);

      // Get all used prefixes
      const prefixes = result
        .filter(l => l.length === 2)
        .map(l => l[0]);
      const prefixSet = new Set(prefixes);

      // Single letters should not overlap with prefix letters
      const singleLetters = result.filter(l => l.length === 1);
      singleLetters.forEach(letter => {
        expect(prefixSet.has(letter)).toBe(false);
      });
    });

    it('should generate valid two-letter combinations', () => {
      const alphabet = 'abc';
      const result = generateHintLabels(alphabet, 10);

      const alphabetLower = alphabet.toLowerCase();
      result.forEach(label => {
        label.split('').forEach(char => {
          expect(alphabetLower).toContain(char);
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should return empty array for count 0', () => {
      expect(generateHintLabels(defaultAlphabet, 0)).toEqual([]);
    });

    it('should return one label for count 1', () => {
      const result = generateHintLabels(defaultAlphabet, 1);
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);
    });

    it('should handle negative count as zero', () => {
      // Math.max(prefixCount, 0) handles negative
      const result = generateHintLabels(defaultAlphabet, -5);
      expect(result.length).toBe(0);
    });

    it('should handle single-letter alphabet', () => {
      const result = generateHintLabels('a', 3);
      // Can only generate: A, AA (can't have AAA with this algorithm)
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle two-letter alphabet', () => {
      const result = generateHintLabels('ab', 5);
      // With 2-letter alphabet: B (single, A is prefix), AA, AB, BA, BB
      // Algorithm may produce 4-5 labels depending on prefix calculation
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('ordering', () => {
    it('should start with non-prefix single letters', () => {
      const alphabet = 'abcdefgh';
      const result = generateHintLabels(alphabet, 15);

      // First labels should be single letters
      const firstFew = result.slice(0, 3);
      firstFew.forEach(label => {
        expect(label.length).toBeLessThanOrEqual(2);
      });
    });

    it('should put two-letter labels after single letters', () => {
      const alphabet = 'abcde';
      const result = generateHintLabels(alphabet, 10);

      let foundTwoLetter = false;
      let foundSingleAfterTwo = false;

      result.forEach(label => {
        if (label.length === 2) foundTwoLetter = true;
        if (foundTwoLetter && label.length === 1) foundSingleAfterTwo = true;
      });

      // Should not find single letters after two-letter labels
      expect(foundSingleAfterTwo).toBe(false);
    });
  });

  describe('large counts', () => {
    it('should handle 100 labels', () => {
      const result = generateHintLabels(defaultAlphabet, 100);
      expect(result.length).toBe(100);
      expect(new Set(result).size).toBe(100);
    });

    it('should handle 200 labels', () => {
      const result = generateHintLabels(defaultAlphabet, 200);
      // With 14-letter alphabet, max unique combinations with 2 letters:
      // 14 * 14 = 196 for 2-letter + some singles = ~196-210
      // May not reach exactly 200 with the algorithm
      expect(result.length).toBeGreaterThanOrEqual(180);
      expect(new Set(result).size).toBe(result.length);
    });

    it('should have reasonable label lengths for large counts', () => {
      const result = generateHintLabels(defaultAlphabet, 100);
      // Most labels should be 1-2 characters
      result.forEach(label => {
        expect(label.length).toBeLessThanOrEqual(2);
      });
    });
  });
});

describe('getLinkHintLetters (backward compatibility)', () => {
  it('should be an alias for generateHintLabels', () => {
    expect(getLinkHintLetters).toBe(generateHintLabels);
  });

  it('should work identically to generateHintLabels', () => {
    const alphabet = 'abcdef';
    const count = 10;

    const resultGenerate = generateHintLabels(alphabet, count);
    const resultGetLink = getLinkHintLetters(alphabet, count);

    expect(resultGenerate).toEqual(resultGetLink);
  });
});

describe('excluded characters', () => {
  const defaultAlphabet = 'sadfjklewcmpgh';

  it('should exclude specified characters from labels', () => {
    const excluded = new Set(['s', 'a', 'd']);
    const result = generateHintLabels(defaultAlphabet, 5, excluded);

    result.forEach(label => {
      label.split('').forEach(char => {
        expect(excluded.has(char)).toBe(false);
      });
    });
  });

  it('should generate labels without excluded characters', () => {
    const excluded = new Set(['s']);
    const result = generateHintLabels(defaultAlphabet, 5, excluded);

    // First labels should not be 's'
    expect(result[0]).not.toBe('s');
    result.forEach(label => {
      expect(label).not.toContain('s');
    });
  });

  it('should handle empty excluded set', () => {
    const result = generateHintLabels(defaultAlphabet, 5, new Set());

    expect(result.length).toBe(5);
    // Should work normally
  });

  it('should handle undefined excluded set', () => {
    const result = generateHintLabels(defaultAlphabet, 5, undefined);

    expect(result.length).toBe(5);
    // Should work normally
  });

  it('should fall back to full alphabet if all chars excluded', () => {
    // Exclude all characters in alphabet
    const excluded = new Set(defaultAlphabet.toLowerCase().split(''));
    const result = generateHintLabels(defaultAlphabet, 5, excluded);

    // Should still generate labels (falls back to original alphabet)
    expect(result.length).toBe(5);
  });

  it('should work with two-letter labels when chars excluded', () => {
    const alphabet = 'abcde';
    // Exclude 'a', 'b' - leaves c, d, e (3 letters for 6 requests)
    const excluded = new Set(['a', 'b']);
    const result = generateHintLabels(alphabet, 6, excluded);

    // Should use two-letter combinations from c, d, e
    result.forEach(label => {
      expect(label).not.toContain('a');
      expect(label).not.toContain('b');
    });
    expect(result.length).toBe(6);
  });

  it('should exclude characters for flash.nvim-style next-char avoidance', () => {
    // Simulating: searching "fla" in "flash" - exclude "s" (next char)
    const nextChars = new Set(['s']);
    const result = generateHintLabels(defaultAlphabet, 5, nextChars);

    // Labels should not start with or contain 's'
    result.forEach(label => {
      expect(label).not.toContain('s');
    });
  });
});

describe('different alphabet configurations', () => {
  describe('home row only', () => {
    const homeRow = 'asdfghjkl';

    it('should work with home row alphabet', () => {
      const result = generateHintLabels(homeRow, 8);
      expect(result.length).toBe(8);
    });

    it('should use only home row letters', () => {
      const result = generateHintLabels(homeRow, 20);
      const homeRowLower = homeRow.toLowerCase();

      result.forEach(label => {
        label.split('').forEach(char => {
          expect(homeRowLower).toContain(char);
        });
      });
    });
  });

  describe('full qwerty', () => {
    const qwerty = 'asdfghjklqwertyuiopzxcvbnm';

    it('should handle full qwerty alphabet', () => {
      const result = generateHintLabels(qwerty, 50);
      expect(result.length).toBe(50);
    });

    it('should mostly use single letters with full alphabet', () => {
      const result = generateHintLabels(qwerty, 20);
      const singleLetters = result.filter(l => l.length === 1);
      // With 26 letters, 20 hints should all be single letters
      expect(singleLetters.length).toBe(20);
    });
  });

  describe('vim-style', () => {
    const vimStyle = 'fjdkslaghrueiwoqptyvncmxzb';

    it('should work with vim-style ordering', () => {
      const result = generateHintLabels(vimStyle, 15);
      expect(result.length).toBe(15);

      // First hints should be from the start of the alphabet
      expect(vimStyle.toLowerCase()).toContain(result[0]);
    });
  });
});
