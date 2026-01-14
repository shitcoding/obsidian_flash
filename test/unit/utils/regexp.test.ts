/**
 * Unit tests for src/utils/regexp.ts
 * Tests regex escaping, validation, and extraction functions.
 */

import {
  escapeRegex,
  validateRegex,
  adjustIndexForFormatting,
  extractRegexpBlocks,
} from '../../../src/utils/regexp';

describe('escapeRegex', () => {
  describe('basic special characters', () => {
    it('should escape dot', () => {
      expect(escapeRegex('.')).toBe('\\.');
    });

    it('should escape asterisk', () => {
      expect(escapeRegex('*')).toBe('\\*');
    });

    it('should escape plus', () => {
      expect(escapeRegex('+')).toBe('\\+');
    });

    it('should escape question mark', () => {
      expect(escapeRegex('?')).toBe('\\?');
    });

    it('should escape caret', () => {
      expect(escapeRegex('^')).toBe('\\^');
    });

    it('should escape dollar sign', () => {
      expect(escapeRegex('$')).toBe('\\$');
    });

    it('should escape curly braces', () => {
      expect(escapeRegex('{}')).toBe('\\{\\}');
    });

    it('should escape parentheses', () => {
      expect(escapeRegex('()')).toBe('\\(\\)');
    });

    it('should escape pipe', () => {
      expect(escapeRegex('|')).toBe('\\|');
    });

    it('should escape square brackets', () => {
      expect(escapeRegex('[]')).toBe('\\[\\]');
    });

    it('should escape backslash', () => {
      expect(escapeRegex('\\')).toBe('\\\\');
    });
  });

  describe('mixed content', () => {
    it('should escape special chars in text', () => {
      expect(escapeRegex('file.txt')).toBe('file\\.txt');
    });

    it('should escape multiple special chars', () => {
      expect(escapeRegex('(test)')).toBe('\\(test\\)');
    });

    it('should handle regex-like patterns', () => {
      expect(escapeRegex('[a-z]+')).toBe('\\[a-z\\]\\+');
    });

    it('should handle complex patterns', () => {
      expect(escapeRegex('$100.00 (USD)')).toBe('\\$100\\.00 \\(USD\\)');
    });
  });

  describe('Unicode content', () => {
    it('should not escape Cyrillic letters', () => {
      expect(escapeRegex('привет')).toBe('привет');
    });

    it('should not escape Chinese characters', () => {
      expect(escapeRegex('hello')).toBe('hello');
    });

    it('should handle mixed Unicode and special chars', () => {
      expect(escapeRegex('привет (world)')).toBe('привет \\(world\\)');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(escapeRegex('')).toBe('');
    });

    it('should handle plain text without special chars', () => {
      expect(escapeRegex('hello world')).toBe('hello world');
    });

    it('should not escape hyphen (not in character class)', () => {
      expect(escapeRegex('a-b')).toBe('a-b');
    });
  });
});

describe('validateRegex', () => {
  describe('valid patterns', () => {
    it('should return null for simple pattern', () => {
      expect(validateRegex('hello')).toBeNull();
    });

    it('should return null for word boundary pattern', () => {
      expect(validateRegex('\\bword\\b')).toBeNull();
    });

    it('should return null for Unicode pattern', () => {
      expect(validateRegex('[\\p{L}]+')).toBeNull();
    });

    it('should return null for capture groups', () => {
      expect(validateRegex('(\\w+)')).toBeNull();
    });

    it('should return null for alternation', () => {
      expect(validateRegex('cat|dog')).toBeNull();
    });
  });

  describe('invalid patterns', () => {
    it('should return error for unclosed group', () => {
      const result = validateRegex('(unclosed');
      expect(result).not.toBeNull();
      expect(result).toContain('Invalid regex');
    });

    it('should return error for unclosed bracket', () => {
      const result = validateRegex('[unclosed');
      expect(result).not.toBeNull();
      expect(result).toContain('Invalid regex');
    });

    it('should return error for invalid quantifier', () => {
      const result = validateRegex('*start');
      expect(result).not.toBeNull();
      expect(result).toContain('Invalid regex');
    });
  });

  describe('dangerous patterns', () => {
    it('should reject nested quantifiers with explicit pattern', () => {
      // The DANGEROUS_PATTERNS regex looks for patterns like .++ or .*+
      // These are the actual dangerous patterns checked
      const result = validateRegex('.++');
      expect(result).not.toBeNull();
      expect(result).toContain('dangerous');
    });

    it('should reject quantifier followed by quantifier', () => {
      const result = validateRegex('a{2,}{3,}');
      expect(result).not.toBeNull();
      expect(result).toContain('dangerous');
    });
  });

  describe('length limits', () => {
    it('should accept pattern under 1000 chars', () => {
      const pattern = 'a'.repeat(999);
      expect(validateRegex(pattern)).toBeNull();
    });

    it('should reject pattern over 1000 chars', () => {
      const pattern = 'a'.repeat(1001);
      const result = validateRegex(pattern);
      expect(result).not.toBeNull();
      expect(result).toContain('too long');
    });
  });
});

describe('adjustIndexForFormatting', () => {
  describe('correct positions', () => {
    it('should return same index when position is correct', () => {
      const content = 'hello world';
      expect(adjustIndexForFormatting(content, 0, 'hello')).toBe(0);
    });

    it('should return same index for middle of text', () => {
      const content = 'hello world';
      expect(adjustIndexForFormatting(content, 6, 'world')).toBe(6);
    });
  });

  describe('markdown formatting', () => {
    it('should adjust for bold formatting', () => {
      const content = '**hello** world';
      // If match index is 0 (at **) but matched text is "hello"
      expect(adjustIndexForFormatting(content, 0, 'hello')).toBe(2);
    });

    it('should adjust for italic formatting', () => {
      const content = '*hello* world';
      expect(adjustIndexForFormatting(content, 0, 'hello')).toBe(1);
    });

    it('should adjust for code formatting', () => {
      const content = '`code` here';
      expect(adjustIndexForFormatting(content, 0, 'code')).toBe(1);
    });
  });

  describe('Unicode text', () => {
    it('should work with Cyrillic text', () => {
      const content = '**привет** мир';
      expect(adjustIndexForFormatting(content, 0, 'привет')).toBe(2);
    });

    it('should handle mixed script content', () => {
      const content = '*hello* и *мир*';
      expect(adjustIndexForFormatting(content, 0, 'hello')).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should return original index for empty matched text', () => {
      expect(adjustIndexForFormatting('hello', 0, '')).toBe(0);
    });

    it('should return original index for negative index', () => {
      expect(adjustIndexForFormatting('hello', -1, 'hello')).toBe(-1);
    });

    it('should return original index for out of bounds', () => {
      expect(adjustIndexForFormatting('hello', 100, 'hello')).toBe(100);
    });

    it('should handle single character match', () => {
      const content = '*a* test';
      expect(adjustIndexForFormatting(content, 0, 'a')).toBe(1);
    });
  });
});

describe('extractRegexpBlocks', () => {
  const alphabet = 'sadfjklewcmpgh';

  describe('basic extraction', () => {
    it('should extract simple word matches', () => {
      const content = 'hello world test';
      const result = extractRegexpBlocks(content, 0, '\\w+', alphabet, false);

      expect(result.length).toBe(3);
      expect(result[0].linkText).toBe('hello');
      expect(result[1].linkText).toBe('world');
      expect(result[2].linkText).toBe('test');
    });

    it('should assign unique letters to each match', () => {
      const content = 'one two three';
      const result = extractRegexpBlocks(content, 0, '\\w+', alphabet, false);

      const letters = result.map(r => r.letter);
      const uniqueLetters = new Set(letters);
      expect(uniqueLetters.size).toBe(letters.length);
    });

    it('should set type to regex for all matches', () => {
      const content = 'hello world';
      const result = extractRegexpBlocks(content, 0, '\\w+', alphabet, false);

      result.forEach(r => {
        expect(r.type).toBe('regex');
      });
    });
  });

  describe('offset handling', () => {
    it('should add offset to match indices', () => {
      const content = 'hello world';
      const offset = 100;
      const result = extractRegexpBlocks(content, offset, 'hello', alphabet, false);

      expect(result[0].index).toBe(100);
    });

    it('should handle non-zero offset correctly', () => {
      const content = 'test';
      const result = extractRegexpBlocks(content, 50, 'test', alphabet, false);

      expect(result[0].index).toBe(50);
    });
  });

  describe('case sensitivity', () => {
    it('should match case-insensitively by default', () => {
      const content = 'Hello HELLO hello';
      const result = extractRegexpBlocks(content, 0, 'hello', alphabet, false);

      expect(result.length).toBe(3);
    });

    it('should match case-sensitively when enabled', () => {
      const content = 'Hello HELLO hello';
      const result = extractRegexpBlocks(content, 0, 'hello', alphabet, true);

      expect(result.length).toBe(1);
      expect(result[0].linkText).toBe('hello');
    });
  });

  describe('Unicode support', () => {
    it('should match Cyrillic text', () => {
      const content = 'привет мир';
      const result = extractRegexpBlocks(content, 0, '[\\p{L}]+', alphabet, false);

      expect(result.length).toBe(2);
      expect(result[0].linkText).toBe('привет');
      expect(result[1].linkText).toBe('мир');
    });

    it('should match mixed Latin and Cyrillic', () => {
      const content = 'hello привет world мир';
      const result = extractRegexpBlocks(content, 0, '[\\p{L}]+', alphabet, false);

      expect(result.length).toBe(4);
    });

    it('should work with Unicode word boundaries', () => {
      const content = 'тест test';
      const result = extractRegexpBlocks(
        content,
        0,
        '(?<![\\p{L}\\p{N}_])[\\p{L}\\p{N}]{3,}(?![\\p{L}\\p{N}_])',
        alphabet,
        false
      );

      expect(result.length).toBe(2);
    });
  });

  describe('capture groups', () => {
    it('should use capture group when available', () => {
      const content = '[[link]] text';
      const result = extractRegexpBlocks(content, 0, '\\[\\[(.+?)\\]\\]', alphabet, false);

      expect(result.length).toBe(1);
      expect(result[0].linkText).toBe('link');
    });

    it('should fall back to full match without capture group', () => {
      const content = 'hello world';
      const result = extractRegexpBlocks(content, 0, '\\w+', alphabet, false);

      expect(result[0].linkText).toBe('hello');
    });
  });

  describe('invalid regex handling', () => {
    it('should return empty array for invalid regex', () => {
      const content = 'hello world';
      const result = extractRegexpBlocks(content, 0, '[invalid', alphabet, false);

      expect(result).toEqual([]);
    });

    it('should return empty array for dangerous regex', () => {
      const content = 'hello world';
      const result = extractRegexpBlocks(content, 0, '(a+)+', alphabet, false);

      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const result = extractRegexpBlocks('', 0, '\\w+', alphabet, false);
      expect(result).toEqual([]);
    });

    it('should handle no matches', () => {
      const content = '!@#$%';
      const result = extractRegexpBlocks(content, 0, '\\d+', alphabet, false);
      expect(result).toEqual([]);
    });

    it('should handle zero-length matches without infinite loop', () => {
      const content = 'abc';
      // This regex can match empty string
      const result = extractRegexpBlocks(content, 0, '.*?', alphabet, false);
      // Should complete without hanging
      expect(Array.isArray(result)).toBe(true);
    });

    it('should sort results by index', () => {
      const content = 'c b a';
      const result = extractRegexpBlocks(content, 0, '[abc]', alphabet, false);

      const indices = result.map(r => r.index);
      const sortedIndices = [...indices].sort((a, b) => a - b);
      expect(indices).toEqual(sortedIndices);
    });
  });
});
