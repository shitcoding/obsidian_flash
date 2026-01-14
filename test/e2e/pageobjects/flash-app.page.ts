/**
 * Page Object for Flash Plugin E2E Testing
 *
 * Provides reusable methods for interacting with Obsidian and the Flash plugin.
 * Based on patterns from obsidian-timecodes-plugin and wdio-obsidian-service.
 *
 * Note: Obsidian types are only available inside browser.executeObsidian context,
 * not at the test file level.
 */

import { browser, $, $$ } from '@wdio/globals';

// Plugin command IDs
const FLASH_COMMANDS = {
  JUMP_TO_LINK: 'obsidian-flash:activate-flash-link',
  JUMP_TO_ANYWHERE: 'obsidian-flash:activate-flash-anywhere',
  FLASH_MODE: 'obsidian-flash:activate-flash-mode',
} as const;

class FlashApp {
  /**
   * Set content in the active editor
   */
  async setEditorContent(content: string): Promise<void> {
    await browser.executeObsidian(async ({ app }, content: string) => {
      // Get the active markdown leaf
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length > 0) {
        const view = leaves[0].view as any;
        if (view && view.editor) {
          // Clear and set content
          view.editor.setValue(content);
          // Force CodeMirror to sync
          if (view.editor.cm) {
            view.editor.cm.requestMeasure();
          }
        }
      }
    }, content);

    // Wait for editor to fully update and re-render
    // Don't click - it interferes with keyboard event capture for Flash Mode
    await browser.pause(500);
  }

  /**
   * Get the current editor content
   */
  async getEditorContent(): Promise<string> {
    return await browser.executeObsidian(async ({ app }) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length > 0) {
        const view = leaves[0].view as any;
        if (view && view.editor) {
          return view.editor.getValue();
        }
      }
      return '';
    });
  }

  /**
   * Get the current cursor position
   */
  async getCursorPosition(): Promise<{ line: number; ch: number }> {
    return await browser.executeObsidian(async ({ app }) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length > 0) {
        const view = leaves[0].view as any;
        if (view && view.editor) {
          const cursor = view.editor.getCursor();
          return { line: cursor.line, ch: cursor.ch };
        }
      }
      return { line: 0, ch: 0 };
    });
  }

  /**
   * Set cursor position in the editor
   */
  async setCursorPosition(line: number, ch: number): Promise<void> {
    await browser.executeObsidian(async ({ app }, line: number, ch: number) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length > 0) {
        const view = leaves[0].view as any;
        if (view && view.editor) {
          view.editor.setCursor({ line, ch });
        }
      }
    }, line, ch);
  }

  /**
   * Execute Jump to Link command
   */
  async jumpToLink(): Promise<void> {
    await browser.executeObsidianCommand(FLASH_COMMANDS.JUMP_TO_LINK);
    await browser.pause(100);
  }

  /**
   * Execute Jump to Anywhere command
   */
  async jumpToAnywhere(): Promise<void> {
    await browser.executeObsidianCommand(FLASH_COMMANDS.JUMP_TO_ANYWHERE);
    await browser.pause(100);
  }

  /**
   * Execute Flash Mode command
   * Flash Mode requires the editor to be focused and listens for keydown events
   */
  async flashMode(): Promise<void> {
    // Focus editor before activating
    await this.focusEditor();

    await browser.executeObsidianCommand(FLASH_COMMANDS.FLASH_MODE);
    // Wait for flash mode to initialize
    await browser.pause(200);
  }

  /**
   * Check if Flash Mode is active (contentContainer has flash-active class)
   */
  async isFlashModeActive(): Promise<boolean> {
    return await browser.execute(() => {
      const container = document.querySelector('.cm-contentContainer');
      return container?.classList.contains('flash-active') ?? false;
    });
  }

  /**
   * Check if hint selection mode is active (isLinkHintActive flag on plugin)
   */
  async isHintModeActive(): Promise<boolean> {
    return await browser.executeObsidian(async ({ app }) => {
      const plugin = (app as any).plugins?.plugins?.['obsidian-flash'];
      return plugin?.isLinkHintActive ?? false;
    });
  }

  /**
   * Force cleanup of hint mode by dispatching Escape to trigger listener cleanup
   * The keydown listener is only removed by the listener itself when it receives Escape
   */
  async forceCleanupHints(): Promise<{ contentElExists: boolean; isActiveAfter: boolean }> {
    return await browser.executeObsidian(async ({ app }) => {
      const plugin = (app as any).plugins?.plugins?.['obsidian-flash'];
      let contentElExists = false;
      let isActiveAfter = false;

      // Get contentEl fresh from active view (not plugin.contentElement which may be stale)
      // handleFlashJump uses activeView.contentEl, so we need to match that
      const leaves = app.workspace.getLeavesOfType('markdown');
      const activeView = leaves.length > 0 ? leaves[0].view : null;
      const contentEl = (activeView as any)?.contentEl;
      contentElExists = !!contentEl;

      if (contentEl) {
        // Dispatch Escape to trigger the keydown listener's self-removal
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        contentEl.dispatchEvent(event);
      }

      if (plugin) {
        // removePopovers cleans up visual elements and state
        if (plugin.isLinkHintActive) {
          plugin.removePopovers();
        }
        isActiveAfter = plugin.isLinkHintActive;
      }
      return { contentElExists, isActiveAfter };
    });
  }

  /**
   * Debug: Get the visible content as seen by CM6 viewport
   */
  async getVisibleContent(): Promise<{ from: number; to: number; content: string }> {
    return await browser.executeObsidian(async ({ app }) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length > 0) {
        const view = leaves[0].view as any;
        if (view?.editor?.cm) {
          const cmEditor = view.editor.cm;
          const { from, to } = cmEditor.viewport;
          const content = cmEditor.state.sliceDoc(from, to);
          return { from, to, content };
        }
      }
      return { from: 0, to: 0, content: '' };
    });
  }

  /**
   * Check if hint popovers are visible
   * Flash plugin uses:
   * - ".jl.popover" for Jump to Link and Jump to Anywhere
   * - ".flash-label" for Flash Mode
   */
  async areHintsVisible(): Promise<boolean> {
    const hints = await $$('.jl.popover, .flash-label');
    return hints.length > 0;
  }

  /**
   * Get all visible hint labels
   * Supports both ".jl.popover" and ".flash-label" selectors
   */
  async getHintLabels(): Promise<string[]> {
    const hints = await $$('.jl.popover, .flash-label');
    const labels: string[] = [];
    for (const hint of hints) {
      const text = await hint.getText();
      labels.push(text);
    }
    return labels;
  }

  /**
   * Get the number of visible hints
   * Supports both ".jl.popover" and ".flash-label" selectors
   */
  async getHintCount(): Promise<number> {
    const hints = await $$('.jl.popover, .flash-label');
    return hints.length;
  }

  /**
   * Type a hint label to select it
   * Dispatches keyboard events to contentEl where the plugin listens
   */
  async selectHint(label: string): Promise<void> {
    await browser.executeObsidian(async ({ app }, label: string) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length > 0) {
        const view = leaves[0].view as any;
        if (view && view.contentEl) {
          const contentEl = view.contentEl as HTMLElement;
          for (const char of label) {
            const event = new KeyboardEvent('keydown', {
              key: char,
              code: `Key${char.toUpperCase()}`,
              bubbles: true,
              cancelable: true,
            });
            contentEl.dispatchEvent(event);
          }
        }
      }
    }, label);
    await browser.pause(100);
  }

  /**
   * Cancel hint mode by clicking on the editor (triggers the click cleanup handler)
   * and then pressing Escape to exit any vim mode
   */
  async cancelHints(): Promise<{ contentElExists: boolean; isActiveBefore: boolean; isActiveAfter: boolean }> {
    // First try clicking on the editor which has a click handler that cleans up
    const editor = await $('.cm-content');
    if (await editor.isExisting()) {
      await editor.click();
      await browser.pause(50);
    }

    // Also dispatch Escape via browser.keys to exit any vim mode that might capture keys
    await browser.keys(['Escape']);
    await browser.pause(50);

    // Get the final state
    return await browser.executeObsidian(async ({ app }) => {
      const plugin = (app as any).plugins?.plugins?.['obsidian-flash'];
      const result = {
        contentElExists: false,
        isActiveBefore: false,
        isActiveAfter: false,
      };

      if (plugin) {
        result.isActiveBefore = plugin.isLinkHintActive;
        result.contentElExists = !!plugin.contentElement;
        result.isActiveAfter = plugin.isLinkHintActive;
      }

      return result;
    });
  }

  /**
   * Type characters for Flash Mode search
   * Uses browser.keys() for real keyboard events - no focus change
   */
  async flashSearch(chars: string): Promise<void> {
    // Don't change focus - let browser.keys() send to whatever is focused
    // flashMode() already focused the editor
    for (const char of chars.split('')) {
      await browser.keys([char]);
      await browser.pause(100);
    }
    await browser.pause(200);
  }

  /**
   * Focus the editor
   */
  async focusEditor(): Promise<void> {
    const editor = await $('.cm-content');
    if (await editor.isExisting()) {
      await editor.click();
      await browser.pause(100);
    }
  }

  /**
   * Toggle between source and reading view
   */
  async toggleReadingView(): Promise<void> {
    await browser.executeObsidian(async ({ app }) => {
      await app.commands.executeCommandById('markdown:toggle-preview');
    });
    await browser.pause(300);
  }

  /**
   * Check if we're in source/editing mode
   */
  async isSourceMode(): Promise<boolean> {
    return await browser.executeObsidian(async ({ app }) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length > 0) {
        const view = leaves[0].view as any;
        if (view && typeof view.getMode === 'function') {
          return view.getMode() === 'source';
        }
      }
      return false;
    });
  }

  /**
   * Get the word at cursor position
   */
  async getWordAtCursor(): Promise<string> {
    return await browser.executeObsidian(async ({ app }) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length === 0) return '';

      const view = leaves[0].view as any;
      if (!view || !view.editor) return '';

      const cursor = view.editor.getCursor();
      const line = view.editor.getLine(cursor.line);

      // Find word boundaries (supports Unicode)
      let start = cursor.ch;
      let end = cursor.ch;

      while (start > 0 && /[\w\u0400-\u04FF]/.test(line[start - 1])) {
        start--;
      }
      while (end < line.length && /[\w\u0400-\u04FF]/.test(line[end])) {
        end++;
      }

      return line.slice(start, end);
    });
  }

  /**
   * Get character at cursor position
   */
  async getCharAtCursor(): Promise<string> {
    return await browser.executeObsidian(async ({ app }) => {
      const leaves = app.workspace.getLeavesOfType('markdown');
      if (leaves.length === 0) return '';

      const view = leaves[0].view as any;
      if (!view || !view.editor) return '';

      const cursor = view.editor.getCursor();
      const line = view.editor.getLine(cursor.line);
      return line[cursor.ch] || '';
    });
  }

  /**
   * Wait for hints to appear
   */
  async waitForHints(timeout = 2000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await this.areHintsVisible()) {
        return true;
      }
      await browser.pause(50);
    }
    return false;
  }

  /**
   * Wait for hints to disappear
   */
  async waitForHintsGone(timeout = 2000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (!(await this.areHintsVisible())) {
        return true;
      }
      await browser.pause(50);
    }
    return false;
  }

  /**
   * Open a test note file
   */
  async openTestNote(filename: string): Promise<void> {
    await browser.executeObsidian(async ({ app }, filename: string) => {
      const file = app.vault.getAbstractFileByPath(filename);
      if (file && 'extension' in file) {
        await app.workspace.getLeaf(false).openFile(file as any);
      }
    }, filename);

    await browser.pause(500);
  }

  /**
   * Create a new note with content
   */
  async createNoteWithContent(filename: string, content: string): Promise<void> {
    await browser.executeObsidian(async ({ app }, filename: string, content: string) => {
      // Create or get the file
      let file = app.vault.getAbstractFileByPath(filename);
      if (!file) {
        file = await app.vault.create(filename, content);
      } else {
        await app.vault.modify(file as any, content);
      }
      // Open it
      await app.workspace.getLeaf(false).openFile(file as any);
    }, filename, content);

    await browser.pause(500);
  }
}

export default new FlashApp();
