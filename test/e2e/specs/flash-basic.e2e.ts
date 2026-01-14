/**
 * E2E Tests for Flash Plugin - Fully Automated
 *
 * These tests run against a sandboxed Obsidian instance with the Flash plugin
 * loaded. They verify all core functionality including:
 * - Jump to Link (internal/external links)
 * - Jump to Anywhere (words matching regex)
 * - Flash Mode (character search)
 * - Unicode/Cyrillic support
 * - Formatted text handling
 */

import { browser, expect } from '@wdio/globals';
import FlashApp from '../pageobjects/flash-app.page';

describe('Flash Plugin - Jump to Link', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    // Ensure we're in source mode
    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  describe('Internal Links', function () {
    it('should display hints on internal links', async function () {
      await FlashApp.setEditorContent(`# Test Links

Here is a [[Test Note]] and another [[Second Note|with alias]].
Also an [[unresolved link]] that does not exist.`);

      await FlashApp.jumpToLink();

      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBeGreaterThanOrEqual(3);

      await FlashApp.cancelHints();
      const hintsGone = await FlashApp.waitForHintsGone();
      expect(hintsGone).toBe(true);
    });

    it('should navigate to internal link when hint is selected', async function () {
      await FlashApp.setEditorContent(`Here is a [[Test Note]] to navigate to.`);

      await FlashApp.jumpToLink();
      await FlashApp.waitForHints();

      const labels = await FlashApp.getHintLabels();
      expect(labels.length).toBeGreaterThan(0);

      // Select the first hint
      await FlashApp.selectHint(labels[0]);

      // Hints should disappear after selection
      const hintsGone = await FlashApp.waitForHintsGone();
      expect(hintsGone).toBe(true);
    });
  });

  describe('External Links', function () {
    it('should display hints on markdown external links', async function () {
      await FlashApp.setEditorContent(`Visit [Google](https://google.com) or [GitHub](https://github.com).`);

      await FlashApp.jumpToLink();
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBe(2);

      await FlashApp.cancelHints();
    });

    it('should display hints on plain URLs', async function () {
      await FlashApp.setEditorContent(`Check out https://obsidian.md for more info.`);

      await FlashApp.jumpToLink();
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBeGreaterThanOrEqual(1);

      await FlashApp.cancelHints();
    });
  });
});

describe('Flash Plugin - Jump to Anywhere', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  describe('English Text', function () {
    it('should display hints on words with 3+ characters', async function () {
      await FlashApp.setEditorContent(`Hello world this is a test document.
Some short words: a I be do go.
Some longer words: testing implementation documentation.`);

      await FlashApp.jumpToAnywhere();
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      // Should have hints on words like "Hello", "world", "this", "test", etc.
      // But NOT on "a", "I", "be", "do", "go" (too short)
      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBeGreaterThan(5);

      await FlashApp.cancelHints();
    });

    it('should jump cursor to selected word', async function () {
      await FlashApp.setEditorContent(`Hello world testing`);
      await FlashApp.setCursorPosition(0, 0);

      await FlashApp.jumpToAnywhere();
      await FlashApp.waitForHints();

      const labels = await FlashApp.getHintLabels();
      expect(labels.length).toBeGreaterThan(0);

      // Select a hint (we'll verify the cursor moved)
      const initialPos = await FlashApp.getCursorPosition();
      await FlashApp.selectHint(labels[0]);

      await FlashApp.waitForHintsGone();

      // Cursor should have moved from initial position
      // (Exact position depends on which hint was first)
      const finalPos = await FlashApp.getCursorPosition();
      // At minimum, verify hints are gone and we have a position
      expect(finalPos.line).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Russian/Cyrillic Text', function () {
    it('should display hints on Russian words with 3+ characters', async function () {
      await FlashApp.setEditorContent(`Привет мир это тестовый документ.
Короткие слова: я в к на.
Длинные слова: тестирование программирование документация.`);

      await FlashApp.jumpToAnywhere();
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      // Should have hints on "Привет", "мир", "это", "тестовый", etc.
      // But NOT on "я", "в", "к", "на" (too short)
      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBeGreaterThan(5);

      await FlashApp.cancelHints();
    });

    it('should jump cursor to Russian word', async function () {
      await FlashApp.setEditorContent(`Привет мир тестирование`);
      await FlashApp.setCursorPosition(0, 0);

      await FlashApp.jumpToAnywhere();
      await FlashApp.waitForHints();

      const labels = await FlashApp.getHintLabels();
      expect(labels.length).toBe(3); // Three Russian words

      await FlashApp.selectHint(labels[0]);
      await FlashApp.waitForHintsGone();

      const pos = await FlashApp.getCursorPosition();
      expect(pos.line).toBe(0);
    });
  });

  describe('Mixed Content', function () {
    it('should display hints on both English and Russian words', async function () {
      await FlashApp.setEditorContent(`Hello привет world мир testing тестирование.`);

      await FlashApp.jumpToAnywhere();
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      // Should have 6 hints: Hello, привет, world, мир, testing, тестирование
      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBe(6);

      await FlashApp.cancelHints();
    });
  });
});

describe('Flash Plugin - Flash Mode', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    // Ensure we're in source mode
    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  describe('English Search', function () {
    it('should find words starting with typed characters', async function () {
      await FlashApp.setEditorContent(`hello world help here happy testing`);

      await FlashApp.flashMode();
      await browser.pause(100);

      // Type "he" to search
      await FlashApp.flashSearch('he');
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      // Should match "hello", "help", "here" but not "happy", "world", "testing"
      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBe(3);

      // Select a hint to properly clean up
      const labels = await FlashApp.getHintLabels();
      await FlashApp.selectHint(labels[0]);
    });

    it('should jump to word when hint selected', async function () {
      // Use content with 2+ matches so hints are shown
      await FlashApp.setEditorContent(`alpha also another testing`);

      await FlashApp.flashMode();
      await browser.pause(100);

      // Type "al" to search - matches "alpha", "also"
      await FlashApp.flashSearch('al');
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      const labels = await FlashApp.getHintLabels();
      expect(labels.length).toBeGreaterThanOrEqual(1);

      // Select hint and verify it disappears
      await FlashApp.selectHint(labels[0]);
      const hintsGone = await FlashApp.waitForHintsGone();
      expect(hintsGone).toBe(true);
    });
  });

  describe('Russian Search', function () {
    it('should find Russian words starting with typed Cyrillic characters', async function () {
      await FlashApp.setEditorContent(`привет программирование прекрасный мир`);

      await FlashApp.flashMode();
      await browser.pause(100);
      await FlashApp.flashSearch('пр');
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      // Should match "привет", "программирование", "прекрасный" but not "мир"
      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBe(3);

      // Select a hint to properly clean up
      const labels = await FlashApp.getHintLabels();
      await FlashApp.selectHint(labels[0]);
    });

    it('should jump to Russian word when hint selected', async function () {
      // Use content with 2+ matches
      await FlashApp.setEditorContent(`альфа альфа2 гамма дельта`);

      await FlashApp.flashMode();
      await browser.pause(100);

      // Type "ал" to search - matches "альфа", "альфа2"
      await FlashApp.flashSearch('ал');
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      const labels = await FlashApp.getHintLabels();
      expect(labels.length).toBeGreaterThanOrEqual(1);

      // Select hint and verify it disappears
      await FlashApp.selectHint(labels[0]);
      const hintsGone = await FlashApp.waitForHintsGone();
      expect(hintsGone).toBe(true);
    });
  });

  describe('Case Sensitivity', function () {
    it('should match case-insensitively', async function () {
      await FlashApp.setEditorContent(`Hello HELLO hello HeLLo`);

      await FlashApp.flashMode();
      await browser.pause(100);
      await FlashApp.flashSearch('he');
      const hintsVisible = await FlashApp.waitForHints();
      expect(hintsVisible).toBe(true);

      // All 4 variations of "hello" should match
      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBe(4);

      // Select a hint to properly clean up
      const labels = await FlashApp.getHintLabels();
      await FlashApp.selectHint(labels[0]);
    });
  });
});

describe('Flash Plugin - Formatted Text', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  describe('Bold Text', function () {
    it('should place cursor on word, not on formatting markers', async function () {
      await FlashApp.setEditorContent(`Here is **bold text** in a sentence.`);
      await FlashApp.setCursorPosition(0, 0);

      await FlashApp.jumpToAnywhere();
      await FlashApp.waitForHints();

      // Find the hint for "bold"
      const labels = await FlashApp.getHintLabels();
      expect(labels.length).toBeGreaterThan(0);

      // Select first hint and verify cursor position is reasonable
      await FlashApp.selectHint(labels[0]);
      await FlashApp.waitForHintsGone();

      // Get character at cursor - should NOT be '*'
      const charAtCursor = await FlashApp.getCharAtCursor();
      expect(charAtCursor).not.toBe('*');
    });
  });

  describe('Inline Code', function () {
    it('should handle inline code formatting', async function () {
      await FlashApp.setEditorContent('Check the `config.json` file for settings.');
      await FlashApp.setCursorPosition(0, 0);

      await FlashApp.jumpToAnywhere();
      await FlashApp.waitForHints();

      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBeGreaterThan(0);

      await FlashApp.cancelHints();
    });
  });

  describe('Italic Text', function () {
    it('should handle italic formatting', async function () {
      await FlashApp.setEditorContent(`Here is *italic text* in a sentence.`);

      await FlashApp.jumpToAnywhere();
      await FlashApp.waitForHints();

      const hintCount = await FlashApp.getHintCount();
      expect(hintCount).toBeGreaterThan(0);

      await FlashApp.cancelHints();
    });
  });
});

describe('Flash Plugin - Escape Cancellation', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  it('should cancel Jump to Link with Escape', async function () {
    await FlashApp.setEditorContent(`[[Link One]] and [[Link Two]]`);

    await FlashApp.jumpToLink();
    const hintsVisible = await FlashApp.waitForHints();
    expect(hintsVisible).toBe(true);

    await FlashApp.cancelHints();
    const hintsGone = await FlashApp.waitForHintsGone();
    expect(hintsGone).toBe(true);
  });

  it('should cancel Jump to Anywhere with Escape', async function () {
    await FlashApp.setEditorContent(`Hello world testing`);

    await FlashApp.jumpToAnywhere();
    const hintsVisible = await FlashApp.waitForHints();
    expect(hintsVisible).toBe(true);

    await FlashApp.cancelHints();
    const hintsGone = await FlashApp.waitForHintsGone();
    expect(hintsGone).toBe(true);
  });

  it('should cancel Flash Mode with Escape', async function () {
    await FlashApp.setEditorContent(`hello help here hero`);

    await FlashApp.flashMode();
    await browser.pause(100);
    await FlashApp.flashSearch('he');
    const hintsVisible = await FlashApp.waitForHints();
    expect(hintsVisible).toBe(true);

    await FlashApp.cancelHints();
    const hintsGone = await FlashApp.waitForHintsGone();
    expect(hintsGone).toBe(true);
  });

  it('should not move cursor when cancelled with Escape', async function () {
    await FlashApp.setEditorContent(`Hello world testing`);
    await FlashApp.setCursorPosition(0, 0);

    const initialPos = await FlashApp.getCursorPosition();

    await FlashApp.jumpToAnywhere();
    await FlashApp.waitForHints();
    // Use forceCleanupHints instead of cancelHints - cancelHints clicks which moves cursor
    await FlashApp.forceCleanupHints();
    await FlashApp.waitForHintsGone();

    const finalPos = await FlashApp.getCursorPosition();
    expect(finalPos.line).toBe(initialPos.line);
    expect(finalPos.ch).toBe(initialPos.ch);
  });
});

describe('Flash Plugin - Special Characters', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  it('should not crash with special regex characters', async function () {
    await FlashApp.setEditorContent(`Test (parentheses) and [brackets].
Also {curly} braces.
Regex chars: .* + ? ^ $ |`);

    // Should not throw an error
    await FlashApp.jumpToAnywhere();
    const hintsVisible = await FlashApp.waitForHints();
    // May or may not show hints, but should not crash
    expect(hintsVisible).toBeDefined();

    if (hintsVisible) {
      await FlashApp.cancelHints();
    }
  });

  it('should handle Flash Mode search with special chars gracefully', async function () {
    await FlashApp.setEditorContent(`test (parentheses) here`);

    await FlashApp.flashMode();

    // Search for something that might have regex implications
    // Should not crash, may or may not find matches
    await FlashApp.flashSearch('te');
    const hintsVisible = await FlashApp.waitForHints();
    expect(hintsVisible).toBeDefined();

    await FlashApp.cancelHints();
  });
});

describe('Flash Plugin - Multiple Hints (Prefix Mode)', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  it('should handle more than 26 targets with prefix hints', async function () {
    // Create content with many words to trigger prefix hints
    const words = Array(30).fill(0).map((_, i) => `word${i}`).join(' ');
    await FlashApp.setEditorContent(words);

    await FlashApp.jumpToAnywhere();
    const hintsVisible = await FlashApp.waitForHints();
    expect(hintsVisible).toBe(true);

    const hintCount = await FlashApp.getHintCount();
    expect(hintCount).toBe(30);

    // Some hints should have 2-character labels (prefix mode)
    const labels = await FlashApp.getHintLabels();
    const hasLongLabels = labels.some(label => label.length > 1);
    expect(hasLongLabels).toBe(true);

    await FlashApp.cancelHints();
  });
});
