/**
 * Flash Plugin Settings Tab
 * Provides UI for configuring plugin settings.
 */

import {App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {Settings} from '../../types';

/**
 * Plugin interface required by SettingsTab
 */
interface FlashPluginInterface extends Plugin {
    settings: Settings;
    saveData(data: Settings): Promise<void>;
    applyFlashStyles(): void;
}

/**
 * Settings tab for the Flash plugin
 */
export class FlashSettingsTab extends PluginSettingTab {
    plugin: FlashPluginInterface;

    constructor(app: App, plugin: FlashPluginInterface) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Flash Settings' });

        // Reset to defaults button
        new Setting(containerEl)
            .setName('Reset to defaults')
            .setDesc('Reset all settings to their default values.')
            .addButton((button) => {
                button.setButtonText('Reset')
                    .onClick(async () => {
                        const defaults = new Settings();
                        Object.assign(this.plugin.settings, defaults);
                        await this.plugin.saveData(this.plugin.settings);
                        this.plugin.applyFlashStyles();
                        this.display(); // Refresh the settings UI
                    });
            });

        // ===== General Settings =====
        containerEl.createEl('h3', { text: 'General' });

        // Hint characters setting
        new Setting(containerEl)
            .setName('Characters used for link hints')
            .setDesc('The characters placed next to each link after enter link-hint mode.')
            .addText(cb => {
                cb.setValue(this.plugin.settings.letters)
                    .onChange((value: string) => {
                        this.plugin.settings.letters = value;
                        this.plugin.saveData(this.plugin.settings);
                    });
            });

        // Auto-jump toggle
        new Setting(containerEl)
            .setName('Auto-jump if single link')
            .setDesc('If enabled, auto jump to link if there is only one link in page')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.jumpToLinkIfOneLinkOnly)
                    .onChange(async (state) => {
                        this.plugin.settings.jumpToLinkIfOneLinkOnly = state;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        // ===== Jump to Anywhere Settings =====
        containerEl.createEl('h3', { text: 'Jump to Anywhere' });

        // Jump to anywhere regex
        new Setting(containerEl)
            .setName('Regex pattern')
            .setDesc("Regex based navigating in editor mode. Use \\p{L} for Unicode letters, \\p{N} for numbers.")
            .addText((text) =>
                text
                    .setPlaceholder('Custom Regex')
                    .setValue(this.plugin.settings.jumpToAnywhereRegex)
                    .onChange(async (value) => {
                        this.plugin.settings.jumpToAnywhereRegex = value;
                        await this.plugin.saveData(this.plugin.settings);
                    })
            );

        // Jump to Anywhere position dropdown (lowercase)
        new Setting(containerEl)
            .setName('Jump position (lowercase)')
            .setDesc('Cursor position when pressing lowercase label.')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('first-char', 'First character of the word')
                    .addOption('last-char', 'Last character of the word')
                    .addOption('after-last-char', 'After last character of the word')
                    .setValue(this.plugin.settings.jumpAnywhereJumpPosition)
                    .onChange(async (value: 'first-char' | 'last-char' | 'after-last-char') => {
                        this.plugin.settings.jumpAnywhereJumpPosition = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        // Jump to Anywhere position dropdown (uppercase)
        new Setting(containerEl)
            .setName('Jump position (uppercase)')
            .setDesc('Cursor position when pressing Shift. For multi-letter labels, if any letter is uppercase, this position is used.')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('first-char', 'First character of the word')
                    .addOption('last-char', 'Last character of the word')
                    .addOption('after-last-char', 'After last character of the word')
                    .setValue(this.plugin.settings.jumpAnywhereJumpPositionCapital)
                    .onChange(async (value: 'first-char' | 'last-char' | 'after-last-char') => {
                        this.plugin.settings.jumpAnywhereJumpPositionCapital = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        // ===== Flash Settings =====
        containerEl.createEl('h3', { text: 'Flash Mode' });

        // Case sensitivity toggle
        new Setting(containerEl)
            .setName('Case sensitive')
            .setDesc('If enabled, the search will be case sensitive.')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.flashCaseSensitive)
                    .onChange(async (state) => {
                        this.plugin.settings.flashCaseSensitive = state;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        // Character count setting
        new Setting(containerEl)
            .setName('Minimum characters to show labels')
            .setDesc('Start showing jump labels after typing this many characters. You can type more to narrow matches.')
            .addText((text) => {
                text.setValue(String(this.plugin.settings.flashCharacterCount))
                    .onChange(async (value) => {
                        const num = Number(value);
                        if (!isNaN(num)) {
                            this.plugin.settings.flashCharacterCount = num;
                            await this.plugin.saveData(this.plugin.settings);
                        }
                    });
                text.inputEl.type = "number";
            });

        // Jump position dropdown (lowercase)
        new Setting(containerEl)
            .setName('Jump position (lowercase)')
            .setDesc('Cursor position when pressing lowercase label.')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('match-start', 'Match start')
                    .addOption('match-end', 'Match end')
                    .addOption('after-match-end', 'After match end')
                    .addOption('word-start', 'Word start')
                    .addOption('word-end', 'Word end')
                    .addOption('after-word-end', 'After word end')
                    .setValue(this.plugin.settings.flashJumpPosition)
                    .onChange(async (value: 'match-start' | 'match-end' | 'after-match-end' | 'word-start' | 'word-end' | 'after-word-end') => {
                        this.plugin.settings.flashJumpPosition = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        // Jump position dropdown (uppercase)
        new Setting(containerEl)
            .setName('Jump position (uppercase)')
            .setDesc('Cursor position when pressing Shift. For multi-letter labels, if any letter is uppercase, this position is used.')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('match-start', 'Match start')
                    .addOption('match-end', 'Match end')
                    .addOption('after-match-end', 'After match end')
                    .addOption('word-start', 'Word start')
                    .addOption('word-end', 'Word end')
                    .addOption('after-word-end', 'After word end')
                    .setValue(this.plugin.settings.flashJumpPositionCapital)
                    .onChange(async (value: 'match-start' | 'match-end' | 'after-match-end' | 'word-start' | 'word-end' | 'after-word-end') => {
                        this.plugin.settings.flashJumpPositionCapital = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });

        // ===== Styling Settings =====
        containerEl.createEl('h3', { text: 'Styling' });

        // Label background color
        new Setting(containerEl)
            .setName('Label background color')
            .setDesc('Background color for jump labels (default: #ffba42)')
            .addColorPicker((color) => {
                color.setValue(this.plugin.settings.flashLabelBackground)
                    .onChange(async (value) => {
                        this.plugin.settings.flashLabelBackground = value;
                        await this.plugin.saveData(this.plugin.settings);
                        this.plugin.applyFlashStyles();
                    });
            });

        // Label text color
        new Setting(containerEl)
            .setName('Label text color')
            .setDesc('Text color for jump labels (default: #000000)')
            .addColorPicker((color) => {
                color.setValue(this.plugin.settings.flashLabelColor)
                    .onChange(async (value) => {
                        this.plugin.settings.flashLabelColor = value;
                        await this.plugin.saveData(this.plugin.settings);
                        this.plugin.applyFlashStyles();
                    });
            });

        // Match highlight color
        new Setting(containerEl)
            .setName('Match highlight color')
            .setDesc('Background color for matched characters (default: #ff6b6b)')
            .addColorPicker((color) => {
                color.setValue(this.plugin.settings.flashMatchHighlight)
                    .onChange(async (value) => {
                        this.plugin.settings.flashMatchHighlight = value;
                        await this.plugin.saveData(this.plugin.settings);
                        this.plugin.applyFlashStyles();
                    });
            });

        // Dim opacity slider
        new Setting(containerEl)
            .setName('Dim opacity')
            .setDesc('Opacity of non-matching text during search (0-1)')
            .addSlider((slider) => {
                slider.setLimits(0, 1, 0.1)
                    .setValue(this.plugin.settings.flashDimOpacity)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.flashDimOpacity = value;
                        await this.plugin.saveData(this.plugin.settings);
                        this.plugin.applyFlashStyles();
                    });
            });

        // Font inheritance toggle
        new Setting(containerEl)
            .setName('Inherit font from text')
            .setDesc('Labels inherit font family and size from matched text')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.flashInheritFont)
                    .onChange(async (value) => {
                        this.plugin.settings.flashInheritFont = value;
                        await this.plugin.saveData(this.plugin.settings);
                    });
            });
    }
}

// Backward compatibility alias
export const SettingTab = FlashSettingsTab;
