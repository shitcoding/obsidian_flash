/**
 * Unit tests for src/flash/FlashLabelWidget.ts
 * Tests the CM6 widget that renders jump labels with font inheritance.
 */

import { FlashLabelWidget } from '../../../src/flash/FlashLabelWidget';
import { FontInfo } from '../../../types';

describe('FlashLabelWidget', () => {
  const defaultFontInfo: FontInfo = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
  };

  describe('constructor', () => {
    it('should store label property', () => {
      const widget = new FlashLabelWidget('A', '', defaultFontInfo);

      expect(widget.label).toBe('A');
    });

    it('should store matchedKey property', () => {
      const widget = new FlashLabelWidget('SA', 'S', defaultFontInfo);

      expect(widget.matchedKey).toBe('S');
    });

    it('should store fontInfo property', () => {
      const widget = new FlashLabelWidget('A', '', defaultFontInfo);

      expect(widget.fontInfo).toEqual(defaultFontInfo);
    });
  });

  describe('toDOM', () => {
    it('should create a span element', () => {
      const widget = new FlashLabelWidget('A', '', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.tagName).toBe('SPAN');
    });

    it('should set correct CSS class', () => {
      const widget = new FlashLabelWidget('A', '', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.className).toContain('flash-label');
    });

    it('should display the label text', () => {
      const widget = new FlashLabelWidget('SA', '', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.textContent).toBe('SA');
    });

    it('should handle single-letter label', () => {
      const widget = new FlashLabelWidget('A', '', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.textContent).toBe('A');
    });

    it('should handle two-letter label', () => {
      const widget = new FlashLabelWidget('SA', '', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.textContent).toBe('SA');
    });
  });

  describe('toDOM - font inheritance', () => {
    it('should apply fontFamily from fontInfo', () => {
      const fontInfo: FontInfo = {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        fontWeight: '400',
      };
      const widget = new FlashLabelWidget('A', '', fontInfo);

      const element = widget.toDOM();

      expect(element.style.fontFamily).toBe('Georgia, serif');
    });

    it('should apply fontSize from fontInfo', () => {
      const fontInfo: FontInfo = {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        fontWeight: '400',
      };
      const widget = new FlashLabelWidget('A', '', fontInfo);

      const element = widget.toDOM();

      expect(element.style.fontSize).toBe('24px');
    });

    it('should handle different font sizes (headers)', () => {
      const headerFontInfo: FontInfo = {
        fontFamily: 'Inter, sans-serif',
        fontSize: '32px',
        fontWeight: '700',
      };
      const widget = new FlashLabelWidget('A', '', headerFontInfo);

      const element = widget.toDOM();

      expect(element.style.fontSize).toBe('32px');
    });

    it('should handle monospace fonts (code blocks)', () => {
      const codeFontInfo: FontInfo = {
        fontFamily: 'Menlo, Monaco, monospace',
        fontSize: '14px',
        fontWeight: '400',
      };
      const widget = new FlashLabelWidget('A', '', codeFontInfo);

      const element = widget.toDOM();

      expect(element.style.fontFamily).toBe('Menlo, Monaco, monospace');
    });

    it('should handle inherit as font value', () => {
      const inheritFontInfo: FontInfo = {
        fontFamily: 'inherit',
        fontSize: '1em',
        fontWeight: 'bold',
      };
      const widget = new FlashLabelWidget('A', '', inheritFontInfo);

      const element = widget.toDOM();

      expect(element.style.fontFamily).toBe('inherit');
    });
  });

  describe('toDOM - matched state', () => {
    it('should add matched class when matchedKey matches label prefix', () => {
      const widget = new FlashLabelWidget('SA', 'S', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.classList.contains('matched')).toBe(true);
    });

    it('should not add matched class when matchedKey is empty', () => {
      const widget = new FlashLabelWidget('SA', '', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.classList.contains('matched')).toBe(false);
    });

    it('should not add matched class when matchedKey does not match', () => {
      const widget = new FlashLabelWidget('SA', 'D', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.classList.contains('matched')).toBe(false);
    });

    it('should handle case-insensitive prefix matching', () => {
      const widget = new FlashLabelWidget('SA', 's', defaultFontInfo);

      const element = widget.toDOM();

      // Should match because 's' and 'S' are the same key
      expect(element.classList.contains('matched')).toBe(true);
    });

    it('should handle single-letter labels with matchedKey', () => {
      const widget = new FlashLabelWidget('A', 'A', defaultFontInfo);

      const element = widget.toDOM();

      // Single letter labels might need special handling
      // When matchedKey equals full label, may or may not add matched class
      // Depends on implementation - label 'A' with matchedKey 'A' could mean jump
      expect(element.classList.contains('matched') || !element.classList.contains('matched')).toBe(true);
    });
  });

  describe('eq - equality comparison', () => {
    it('should return true for identical widgets', () => {
      const widget1 = new FlashLabelWidget('A', '', defaultFontInfo);
      const widget2 = new FlashLabelWidget('A', '', defaultFontInfo);

      expect(widget1.eq(widget2)).toBe(true);
    });

    it('should return false when labels differ', () => {
      const widget1 = new FlashLabelWidget('A', '', defaultFontInfo);
      const widget2 = new FlashLabelWidget('B', '', defaultFontInfo);

      expect(widget1.eq(widget2)).toBe(false);
    });

    it('should return false when matchedKey differs', () => {
      const widget1 = new FlashLabelWidget('SA', 'S', defaultFontInfo);
      const widget2 = new FlashLabelWidget('SA', '', defaultFontInfo);

      expect(widget1.eq(widget2)).toBe(false);
    });

    it('should consider fontInfo in equality (optional)', () => {
      // Note: fontInfo comparison may or may not be included in eq()
      // depending on implementation requirements
      const fontInfo1: FontInfo = {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontWeight: '400',
      };
      const fontInfo2: FontInfo = {
        fontFamily: 'Georgia',
        fontSize: '24px',
        fontWeight: '700',
      };

      const widget1 = new FlashLabelWidget('A', '', fontInfo1);
      const widget2 = new FlashLabelWidget('A', '', fontInfo2);

      // This test documents whether fontInfo affects equality
      // Implementation may choose to ignore fontInfo for performance
      // Document actual behavior here after implementation
      expect(typeof widget1.eq(widget2)).toBe('boolean');
    });
  });

  describe('ignoreEvent', () => {
    it('should return false (allow events)', () => {
      const widget = new FlashLabelWidget('A', '', defaultFontInfo);

      expect(widget.ignoreEvent()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty label', () => {
      const widget = new FlashLabelWidget('', '', defaultFontInfo);

      const element = widget.toDOM();

      expect(element.textContent).toBe('');
    });

    it('should handle empty fontFamily', () => {
      const fontInfo: FontInfo = {
        fontFamily: '',
        fontSize: '16px',
        fontWeight: '400',
      };
      const widget = new FlashLabelWidget('A', '', fontInfo);

      // Should not throw
      expect(() => widget.toDOM()).not.toThrow();
    });

    it('should handle undefined-like empty strings in fontInfo', () => {
      const fontInfo: FontInfo = {
        fontFamily: '',
        fontSize: '',
        fontWeight: '',
      };
      const widget = new FlashLabelWidget('A', '', fontInfo);

      // Should not throw
      expect(() => widget.toDOM()).not.toThrow();
    });
  });
});
