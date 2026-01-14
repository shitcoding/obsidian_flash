/**
 * Unit tests for src/keyboard/KeyboardMapper.ts
 * Tests keyboard mapping for non-Latin layouts and modifier key detection.
 */

import {
  isCyrillic,
  convertToLatin,
  normalizeKeypress,
  isModifierKey,
  CYRILLIC_TO_LATIN,
  MODIFIER_KEYS,
} from '../../../src/keyboard/KeyboardMapper';

describe('CYRILLIC_TO_LATIN mapping', () => {
  describe('completeness', () => {
    it('should have lowercase mappings for main Russian letters', () => {
      const mainLetters = 'йцукенгшщзфывапролдячсмитьбю';
      mainLetters.split('').forEach(letter => {
        expect(CYRILLIC_TO_LATIN[letter]).toBeDefined();
      });
    });

    it('should have uppercase mappings for main Russian letters', () => {
      const mainLetters = 'ЙЦУКЕНГШЩЗФЫВАПРОЛДЯЧСМИТЬБЮ';
      mainLetters.split('').forEach(letter => {
        expect(CYRILLIC_TO_LATIN[letter]).toBeDefined();
      });
    });

    it('should have additional character mappings', () => {
      expect(CYRILLIC_TO_LATIN['х']).toBe('[');
      expect(CYRILLIC_TO_LATIN['ъ']).toBe(']');
      expect(CYRILLIC_TO_LATIN['ж']).toBe(';');
      expect(CYRILLIC_TO_LATIN['э']).toBe("'");
    });
  });

  describe('case consistency', () => {
    it('should map lowercase to lowercase', () => {
      expect(CYRILLIC_TO_LATIN['ф']).toBe('a');
      expect(CYRILLIC_TO_LATIN['ы']).toBe('s');
      expect(CYRILLIC_TO_LATIN['в']).toBe('d');
    });

    it('should map uppercase to uppercase', () => {
      expect(CYRILLIC_TO_LATIN['Ф']).toBe('A');
      expect(CYRILLIC_TO_LATIN['Ы']).toBe('S');
      expect(CYRILLIC_TO_LATIN['В']).toBe('D');
    });
  });
});

describe('MODIFIER_KEYS set', () => {
  it('should contain Shift', () => {
    expect(MODIFIER_KEYS.has('Shift')).toBe(true);
  });

  it('should contain Meta', () => {
    expect(MODIFIER_KEYS.has('Meta')).toBe(true);
  });

  it('should contain Escape', () => {
    expect(MODIFIER_KEYS.has('Escape')).toBe(true);
  });

  it('should contain Control', () => {
    expect(MODIFIER_KEYS.has('Control')).toBe(true);
  });

  it('should contain Alt', () => {
    expect(MODIFIER_KEYS.has('Alt')).toBe(true);
  });

  it('should contain navigation keys', () => {
    expect(MODIFIER_KEYS.has('CapsLock')).toBe(true);
    expect(MODIFIER_KEYS.has('Tab')).toBe(true);
    expect(MODIFIER_KEYS.has('Backspace')).toBe(true);
    expect(MODIFIER_KEYS.has('Enter')).toBe(true);
  });

  it('should not contain regular letters', () => {
    expect(MODIFIER_KEYS.has('a')).toBe(false);
    expect(MODIFIER_KEYS.has('A')).toBe(false);
    expect(MODIFIER_KEYS.has('z')).toBe(false);
  });
});

describe('isCyrillic', () => {
  describe('Cyrillic text detection', () => {
    it('should detect Russian lowercase', () => {
      expect(isCyrillic('привет')).toBe(true);
    });

    it('should detect Russian uppercase', () => {
      expect(isCyrillic('ПРИВЕТ')).toBe(true);
    });

    it('should detect single Cyrillic character', () => {
      expect(isCyrillic('а')).toBe(true);
      expect(isCyrillic('я')).toBe(true);
    });

    it('should detect Ukrainian specific letters', () => {
      expect(isCyrillic('і')).toBe(true);
      expect(isCyrillic('ї')).toBe(true);
      expect(isCyrillic('є')).toBe(true);
    });

    it('should detect Serbian specific letters', () => {
      // Serbian uses some unique Cyrillic letters
      expect(isCyrillic('ђ')).toBe(true);
      expect(isCyrillic('ћ')).toBe(true);
    });
  });

  describe('non-Cyrillic text', () => {
    it('should return false for Latin text', () => {
      expect(isCyrillic('hello')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isCyrillic('')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isCyrillic('123')).toBe(false);
    });

    it('should return false for special characters', () => {
      expect(isCyrillic('!@#$%^&*()')).toBe(false);
    });

    it('should return false for spaces', () => {
      expect(isCyrillic('   ')).toBe(false);
    });

    it('should return false for Chinese characters', () => {
      expect(isCyrillic('hello')).toBe(false);
    });

    it('should return false for Japanese characters', () => {
      expect(isCyrillic('hello')).toBe(false);
    });
  });

  describe('mixed content', () => {
    it('should return true if any Cyrillic present', () => {
      expect(isCyrillic('hello мир')).toBe(true);
      expect(isCyrillic('123а456')).toBe(true);
    });
  });
});

describe('convertToLatin', () => {
  describe('full keyboard row conversion', () => {
    it('should convert top row correctly', () => {
      expect(convertToLatin('йцукенгшщз')).toBe('qwertyuiop');
    });

    it('should convert home row correctly', () => {
      expect(convertToLatin('фывапролдж')).toBe('asdfghjkl;');
    });

    it('should convert bottom row correctly', () => {
      expect(convertToLatin('ячсмитьбю')).toBe('zxcvbnm,.');
    });
  });

  describe('case preservation', () => {
    it('should convert lowercase to lowercase', () => {
      const result = convertToLatin('фыва');
      expect(result).toBe('asdf');
      expect(result).toBe(result.toLowerCase());
    });

    it('should convert uppercase to uppercase', () => {
      const result = convertToLatin('ФЫВА');
      expect(result).toBe('ASDF');
      expect(result).toBe(result.toUpperCase());
    });

    it('should preserve mixed case', () => {
      expect(convertToLatin('ФывА')).toBe('AsdF');
    });
  });

  describe('non-Cyrillic passthrough', () => {
    it('should not change Latin letters', () => {
      expect(convertToLatin('abc')).toBe('abc');
    });

    it('should not change numbers', () => {
      expect(convertToLatin('123')).toBe('123');
    });

    it('should not change special characters', () => {
      expect(convertToLatin('!@#')).toBe('!@#');
    });

    it('should not change spaces', () => {
      expect(convertToLatin('  ')).toBe('  ');
    });
  });

  describe('mixed content', () => {
    it('should convert only Cyrillic characters', () => {
      expect(convertToLatin('test фыва')).toBe('test asdf');
    });

    it('should handle alternating scripts', () => {
      expect(convertToLatin('aфbыcвdа')).toBe('aabscddf');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(convertToLatin('')).toBe('');
    });

    it('should handle single character', () => {
      expect(convertToLatin('ф')).toBe('a');
    });

    it('should handle very long string', () => {
      const long = 'фыва'.repeat(100);
      const result = convertToLatin(long);
      expect(result).toBe('asdf'.repeat(100));
    });
  });
});

describe('normalizeKeypress', () => {
  describe('Cyrillic normalization', () => {
    it('should convert Cyrillic keys to Latin equivalent', () => {
      expect(normalizeKeypress('ф')).toBe('a');
      expect(normalizeKeypress('ы')).toBe('s');
      expect(normalizeKeypress('в')).toBe('d');
    });

    it('should handle uppercase Cyrillic', () => {
      expect(normalizeKeypress('Ф')).toBe('A');
      expect(normalizeKeypress('Ы')).toBe('S');
    });
  });

  describe('Latin passthrough', () => {
    it('should not modify Latin keys', () => {
      expect(normalizeKeypress('a')).toBe('a');
      expect(normalizeKeypress('A')).toBe('A');
      expect(normalizeKeypress('z')).toBe('z');
    });
  });

  describe('special keys', () => {
    it('should pass through modifier keys unchanged', () => {
      expect(normalizeKeypress('Escape')).toBe('Escape');
      expect(normalizeKeypress('Enter')).toBe('Enter');
      expect(normalizeKeypress('Tab')).toBe('Tab');
    });

    it('should pass through number keys unchanged', () => {
      expect(normalizeKeypress('1')).toBe('1');
      expect(normalizeKeypress('0')).toBe('0');
    });
  });
});

describe('isModifierKey', () => {
  describe('modifier keys', () => {
    it('should return true for Shift', () => {
      expect(isModifierKey('Shift')).toBe(true);
    });

    it('should return true for Control', () => {
      expect(isModifierKey('Control')).toBe(true);
    });

    it('should return true for Alt', () => {
      expect(isModifierKey('Alt')).toBe(true);
    });

    it('should return true for Meta', () => {
      expect(isModifierKey('Meta')).toBe(true);
    });

    it('should return true for Escape', () => {
      expect(isModifierKey('Escape')).toBe(true);
    });
  });

  describe('navigation keys', () => {
    it('should return true for Tab', () => {
      expect(isModifierKey('Tab')).toBe(true);
    });

    it('should return true for CapsLock', () => {
      expect(isModifierKey('CapsLock')).toBe(true);
    });

    it('should return true for Backspace', () => {
      expect(isModifierKey('Backspace')).toBe(true);
    });

    it('should return true for Enter', () => {
      expect(isModifierKey('Enter')).toBe(true);
    });
  });

  describe('regular keys', () => {
    it('should return false for letter keys', () => {
      expect(isModifierKey('a')).toBe(false);
      expect(isModifierKey('A')).toBe(false);
      expect(isModifierKey('z')).toBe(false);
      expect(isModifierKey('Z')).toBe(false);
    });

    it('should return false for number keys', () => {
      expect(isModifierKey('1')).toBe(false);
      expect(isModifierKey('0')).toBe(false);
    });

    it('should return false for symbol keys', () => {
      expect(isModifierKey('.')).toBe(false);
      expect(isModifierKey(',')).toBe(false);
      expect(isModifierKey('/')).toBe(false);
    });

    it('should return false for Cyrillic keys', () => {
      expect(isModifierKey('ф')).toBe(false);
      expect(isModifierKey('Ф')).toBe(false);
    });

    it('should return false for space', () => {
      expect(isModifierKey(' ')).toBe(false);
    });
  });

  describe('case sensitivity', () => {
    it('should be case-sensitive', () => {
      expect(isModifierKey('Shift')).toBe(true);
      expect(isModifierKey('shift')).toBe(false);
      expect(isModifierKey('SHIFT')).toBe(false);
    });
  });
});
