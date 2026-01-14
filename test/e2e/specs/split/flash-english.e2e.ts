/**
 * E2E Tests for Flash Plugin - Flash Mode English Search
 * Each test runs in its own fresh session
 */

import { browser, expect } from '@wdio/globals';
import FlashApp from '../../pageobjects/flash-app.page';

describe('Flash Plugin - Flash Mode English', function () {
  this.timeout(60000);

  beforeEach(async function () {
    // Clean up any previous state FIRST (instead of afterEach)
    // This ensures fresh state even if previous test crashed
    await FlashApp.forceCleanupHints();
    await browser.pause(50);

    // Ensure we're in source mode
    if (!(await FlashApp.isSourceMode())) {
      await FlashApp.toggleReadingView();
    }
    await FlashApp.focusEditor();
    await browser.pause(200);
  });

  it('should find words starting with typed characters', async function () {
    await FlashApp.setEditorContent(`hello world help here happy testing`);

    await FlashApp.flashMode();
    await browser.pause(100);

    await FlashApp.flashSearch('he');
    const hintsVisible = await FlashApp.waitForHints();
    expect(hintsVisible).toBe(true);

    const hintCount = await FlashApp.getHintCount();
    expect(hintCount).toBe(3);

    // Select first hint to properly clean up (instead of just Escape)
    // This matches what the second test does and ensures complete cleanup
    const labels = await FlashApp.getHintLabels();
    await FlashApp.selectHint(labels[0]);
  });

  it('should jump to word when hint selected', async function () {
    // Use content with 2+ matches so hints are shown (plugin has jumpToLinkIfOneLinkOnly setting)
    await FlashApp.setEditorContent(`alpha also another apple testing`);

    await FlashApp.flashMode();
    await browser.pause(100);

    await FlashApp.flashSearch('al');
    const hintsVisible = await FlashApp.waitForHints();
    expect(hintsVisible).toBe(true);

    const labels = await FlashApp.getHintLabels();
    expect(labels.length).toBeGreaterThanOrEqual(1);

    await FlashApp.selectHint(labels[0]);
    const hintsGone = await FlashApp.waitForHintsGone();
    expect(hintsGone).toBe(true);
  });
});
