/**
 * Mock implementation of the Obsidian API for unit testing.
 * Provides minimal implementations of commonly used Obsidian classes.
 */

export class Plugin {
  app: App;
  manifest: PluginManifest;

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue(undefined);
  addCommand = jest.fn();
  addSettingTab = jest.fn();
  registerEvent = jest.fn();
  registerEditorExtension = jest.fn();
  registerDomEvent = jest.fn();
  onload = jest.fn();
  onunload = jest.fn();
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion?: string;
  author?: string;
  description?: string;
}

export class App {
  vault = new Vault();
  workspace = new Workspace();
  metadataCache = new MetadataCache();
}

export class Vault {
  read = jest.fn();
  modify = jest.fn();
  create = jest.fn();
  delete = jest.fn();
  getAbstractFileByPath = jest.fn();
  getMarkdownFiles = jest.fn().mockReturnValue([]);
}

export class Workspace {
  getActiveViewOfType = jest.fn();
  on = jest.fn();
  off = jest.fn();
  getActiveFile = jest.fn();
  activeLeaf = null;
}

export class MetadataCache {
  getFileCache = jest.fn();
  on = jest.fn();
}

export class MarkdownView {
  editor: Editor | null = null;
  file: TFile | null = null;
  getViewType = jest.fn().mockReturnValue('markdown');
}

export class TFile {
  basename: string = '';
  extension: string = 'md';
  name: string = '';
  path: string = '';
  stat = {
    ctime: Date.now(),
    mtime: Date.now(),
    size: 0,
  };
}

export interface Editor {
  getValue(): string;
  setValue(content: string): void;
  getCursor(where?: string): EditorPosition;
  setCursor(pos: EditorPosition | number): void;
  getLine(line: number): string;
  setLine(line: number, text: string): void;
  lineCount(): number;
  getScrollInfo(): { left: number; top: number; height: number };
  scrollTo(x: number, y: number): void;
  focus(): void;
  blur(): void;
  replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void;
  replaceSelection(replacement: string): void;
  getSelection(): string;
  setSelection(anchor: EditorPosition, head?: EditorPosition): void;
}

export interface EditorPosition {
  line: number;
  ch: number;
}

export class Notice {
  constructor(message: string, timeout?: number) {}
}

export class Modal {
  app: App;
  contentEl: HTMLElement;
  modalEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
    this.modalEl = document.createElement('div');
  }
  open() {}
  close() {}
}

export class Setting {
  private containerEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
  }
  setName(name: string): this { return this; }
  setDesc(desc: string): this { return this; }
  addText(cb: (text: TextComponent) => any): this { return this; }
  addToggle(cb: (toggle: ToggleComponent) => any): this { return this; }
  addDropdown(cb: (dropdown: DropdownComponent) => any): this { return this; }
  addSlider(cb: (slider: SliderComponent) => any): this { return this; }
  addTextArea(cb: (textArea: TextAreaComponent) => any): this { return this; }
}

export interface TextComponent {
  setValue(value: string): TextComponent;
  getValue(): string;
  setPlaceholder(placeholder: string): TextComponent;
  onChange(callback: (value: string) => any): TextComponent;
}

export interface ToggleComponent {
  setValue(on: boolean): ToggleComponent;
  getValue(): boolean;
  onChange(callback: (value: boolean) => any): ToggleComponent;
}

export interface DropdownComponent {
  addOption(value: string, display: string): DropdownComponent;
  setValue(value: string): DropdownComponent;
  getValue(): string;
  onChange(callback: (value: string) => any): DropdownComponent;
}

export interface SliderComponent {
  setLimits(min: number, max: number, step: number): SliderComponent;
  setValue(value: number): SliderComponent;
  getValue(): number;
  onChange(callback: (value: number) => any): SliderComponent;
  setDynamicTooltip(): SliderComponent;
}

export interface TextAreaComponent {
  setValue(value: string): TextAreaComponent;
  getValue(): string;
  setPlaceholder(placeholder: string): TextAreaComponent;
  onChange(callback: (value: string) => any): TextAreaComponent;
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }
  display(): void {}
  hide(): void {}
}

// Export empty types for CM6 compatibility
export type Extension = any;
export type ViewUpdate = any;
export type DecorationSet = any;
export type PluginValue = any;
