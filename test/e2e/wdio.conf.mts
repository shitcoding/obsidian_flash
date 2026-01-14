/**
 * WebdriverIO Configuration for E2E Testing with wdio-obsidian-service
 *
 * This uses a test vault pre-configured with the user's Obsidian settings:
 * - Vim mode (obsidian-vimrc-support plugin)
 * - User's hotkeys and appearance settings
 *
 * Setup: Run ./test/e2e/setup-test-vault.sh to copy your config to test vault
 */

import type { Options } from '@wdio/types';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

export const config: Options.Testrunner = {
  runner: 'local',

  // Test specs - absolute path
  specs: [path.join(__dirname, 'specs/**/*.e2e.ts')],

  // Single instance to avoid conflicts
  maxInstances: 1,

  // Obsidian capabilities
  capabilities: [{
    browserName: 'obsidian',
    browserVersion: 'latest',
    'wdio:obsidianOptions': {
      // Use earliest installer for stability
      installerVersion: 'earliest',
      // Load our plugin being tested
      plugins: [projectRoot],
      // Use test vault with user's vim config copied in - absolute path
      vault: path.join(__dirname, 'vaults/test-vault'),
    },
  }],

  // Test framework
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000, // 2 min timeout for Obsidian startup
  },

  // Reporters
  reporters: [
    'spec',
    ['obsidian', {}],
  ],

  // Services
  services: ['obsidian'],

  // Log level
  logLevel: 'info',

  // Timeouts
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // Hooks
  onPrepare: async function () {
    console.log('');
    console.log('=== E2E Test Setup ===');
    console.log('Using test vault: ./test/e2e/vaults/test-vault');
    console.log('Vim mode: enabled (obsidian-vimrc-support)');
    console.log('');
  },

  before: async function () {
    // Wait for Obsidian to fully initialize
    await browser.pause(3000);

    // Open a test note to have an active editor
    await browser.executeObsidian(async ({ app }) => {
      const file = app.vault.getAbstractFileByPath('Test Note.md');
      if (file && 'extension' in file) {
        await app.workspace.getLeaf(false).openFile(file as any);
      }
    });

    await browser.pause(1000);

    // Verify plugin is loaded
    const pluginLoaded = await browser.executeObsidian(async ({ app }) => {
      const plugins = (app as any).plugins;
      return plugins && plugins.enabledPlugins && plugins.enabledPlugins.has('obsidian-flash');
    });

    if (!pluginLoaded) {
      console.warn('WARNING: obsidian-flash plugin not detected as enabled!');
      // Try to enable it
      await browser.executeObsidian(async ({ app }) => {
        const plugins = (app as any).plugins;
        if (plugins) {
          await plugins.enablePlugin('obsidian-flash');
        }
      });
      await browser.pause(500);
    }

    // Ensure we're in source mode (not reading view)
    await browser.executeObsidian(async ({ app }) => {
      const view = app.workspace.getActiveViewOfType((app as any).workspace.activeLeaf?.view?.constructor);
      if (view && typeof (view as any).getMode === 'function') {
        const mode = (view as any).getMode();
        if (mode !== 'source') {
          await app.commands.executeCommandById('markdown:toggle-preview');
        }
      }
    });

    await browser.pause(500);
    console.log('Obsidian initialized, test note open, starting tests...');
  },

  afterTest: async function (test, context, { error }) {
    if (error) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(__dirname, `screenshots/${test.title.replace(/\s+/g, '_')}-${timestamp}.png`);
      try {
        await browser.saveScreenshot(screenshotPath);
        console.log(`Screenshot saved: ${screenshotPath}`);
      } catch (e) {
        console.error('Failed to save screenshot:', e);
      }
    }
  },

  after: async function () {
    console.log('');
    console.log('=== E2E Tests Complete ===');
    // WebdriverIO and wdio-obsidian-service handle session cleanup automatically
  },

  // Additional cleanup hook
  onComplete: async function () {
    console.log('Test session complete.');
  },
};
