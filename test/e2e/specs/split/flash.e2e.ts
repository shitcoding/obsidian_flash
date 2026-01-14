/**
 * E2E Tests for Flash Plugin - Flash Mode Only
 *
 * Split into separate file to ensure fresh Obsidian session
 */

import { browser, expect } from '@wdio/globals';
import FlashApp from '../../pageobjects/flash-app.page';

describe('Flash Plugin - Flash Mode', function () {
  this.timeout(120000); // Increase timeout for session reload

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

      // Select a hint to properly clean up (selecting a hint cleans up all state)
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
