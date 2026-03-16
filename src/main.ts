import {MarkdownView, Notice, Plugin, View, editorLivePreviewField} from 'obsidian';
import {FlashSettingsTab} from './plugin/SettingsTab';
import {EditorSelection} from "@codemirror/state";
import {EditorView, ViewPlugin} from "@codemirror/view";
import {LegacyEditor, LinkHintBase, Settings, SourceLinkHint, FlashMatch} from 'types';
import {MarkPlugin} from "./cm6-widget/MarkPlugin";

import CM6LinkProcessor from "./processors/CM6LinkProcessor";
import CM6RegexProcessor from "./processors/CM6RegexProcessor";
import {escapeRegex} from "./utils/regexp";
import {convertToLatin, isModifierKey, initLayoutMap} from "./keyboard/KeyboardMapper";
import LegacyRegexpProcessor from "./processors/LegacyRegexpProcessor";
import LegacySourceLinkProcessor from "./processors/LegacySourceLinkProcessor";
import PreviewLinkProcessor from "./processors/PreviewLinkProcessor";
import LivePreviewLinkProcessor from './processors/LivePreviewLinkProcessor';
import {FlashController, FlashWidgetPlugin} from './flash';

enum VIEW_MODE {
    SOURCE,
    PREVIEW,
    LEGACY,
    LIVE_PREVIEW
}

interface CursorState {
    vimMode?: string;
    anchor?: number;
}
export default class FlashPlugin extends Plugin {
    isLinkHintActive: boolean = false;
    settings: Settings;
    prefixInfo: { prefix: string, shiftKey: boolean } | undefined = undefined;
    markViewPlugin: ViewPlugin<MarkPlugin>
    flashViewPlugin: ViewPlugin<FlashWidgetPlugin>
    cmEditor: unknown
    currentView: View
    contentElement: HTMLElement
    mode: VIEW_MODE
    currentCursor: CursorState = {};
    cursorBeforeJump: CursorState = {};
    private clickHandler: (() => void) | null = null;
    private keyDownHandler: ((event: KeyboardEvent) => void) | null = null;
    private currentLinkHintHtmlElements: HTMLElement[] | undefined = undefined;
    private flashController: FlashController | null = null;
    private legacyFlashHandler: ((event: KeyboardEvent) => void) | null = null;
    private legacyFlashContentEl: HTMLElement | null = null;
    private legacyFlashContainer: HTMLElement | null = null;

    async onload() {
        this.settings = await this.loadData() || new Settings();

        // Initialize keyboard layout map for non-Latin layout support
        void initLayoutMap();

        // Migrate old default regex to Unicode-aware iOS-safe version
        const currentRegex = this.settings.jumpToAnywhereRegex;
        const defaultRegex = new Settings().jumpToAnywhereRegex;
        // Detect old ASCII default or old lookbehind-based default (built dynamically to avoid static scan)
        const lookbehindStart = '(?' + '<' + '!';
        if (currentRegex === '\\b\\w{3,}\\b' || currentRegex.startsWith(lookbehindStart)) {
            this.settings.jumpToAnywhereRegex = defaultRegex;
            await this.saveData(this.settings);
        }

        // Migrate old flashJumpToStartOfWord boolean to new flashJumpPosition enum
        const rawSettings = this.settings as unknown as Record<string, unknown>;
        if (rawSettings.flashJumpToStartOfWord !== undefined) {
            if (rawSettings.flashJumpToStartOfWord === true) {
                this.settings.flashJumpPosition = 'word-start';
            } else {
                this.settings.flashJumpPosition = 'match-start';
            }
            delete rawSettings.flashJumpToStartOfWord;
            await this.saveData(this.settings);
        }

        // Apply flash visual settings as CSS custom properties
        this.applyFlashStyles();

        this.addSettingTab(new FlashSettingsTab(this.app, this));

        const markViewPlugin = this.markViewPlugin = ViewPlugin.fromClass(MarkPlugin, {
            decorations: v => v.decorations
        });

        // Capture settings reference for the ViewPlugin class constructor
        const pluginSettings = this.settings;
        const FlashPluginClass = class extends FlashWidgetPlugin {
            constructor(view: EditorView) {
                super(view, pluginSettings);
            }
        };

        const flashViewPlugin = this.flashViewPlugin = ViewPlugin.fromClass(FlashPluginClass, {
            decorations: v => v.decorations
        });

        this.registerEditorExtension([markViewPlugin, flashViewPlugin])

        this.watchForSelectionChange();

        this.addCommand({
            id: 'jump-to-link',
            name: 'Jump to link',
            callback: this.action.bind(this, 'link'),
        });

        this.addCommand({
            id: "jump-to-anywhere",
            name: "Jump to anywhere",
            callback: this.action.bind(this, 'regexp'),
        });

        this.addCommand({
            id: "search-mode",
            name: "Search mode",
            callback: this.action.bind(this, 'flash'),
        });
    }

    onunload() {
        this.cleanupLegacyFlash();
        this.removePopovers();
    }

    action(type: 'link' | 'regexp' | 'flash') {
        if (this.isLinkHintActive) {
            return;
        }

        const activeViewOfType = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeViewOfType) {
            return;
        }
        const currentView = this.currentView = activeViewOfType.leaf.view;
        const mode = this.mode = this.getMode(this.currentView);
        this.contentElement = activeViewOfType.contentEl;
        this.cursorBeforeJump = this.currentCursor;

        switch (mode) {
            case VIEW_MODE.LEGACY:
                this.cmEditor = (currentView as unknown as { sourceMode: { cmEditor: LegacyEditor } }).sourceMode.cmEditor;
                break;
            case VIEW_MODE.LIVE_PREVIEW:
            case VIEW_MODE.SOURCE:
                this.cmEditor = (<{ editor?: { cm: EditorView } }>currentView).editor.cm;
                break;
        }

        switch (type) {
            case "link":
                this.handleJumpToLink();
                return
            case "regexp":
                this.handleJumpToRegex();
                return
            case "flash":
                this.handleFlashJump();
                return
        }
    }

    getMode(currentView: View): VIEW_MODE {
        // @ts-ignore
        const isLegacy = this.app.vault.getConfig("legacyEditor")

        if (currentView.getState().mode === 'preview') {
            return VIEW_MODE.PREVIEW;
        } else if (isLegacy) {
            return VIEW_MODE.LEGACY;
        } else if (currentView.getState().mode === 'source') {
            const isLivePreview = (<{ editor?: { cm: EditorView } }>currentView).editor.cm.state.field(editorLivePreviewField)
            if (isLivePreview) return VIEW_MODE.LIVE_PREVIEW;
            return VIEW_MODE.SOURCE;
        }

        // Fallback to source mode if no mode matches
        return VIEW_MODE.SOURCE;
    }

    handleJumpToLink = () => {
        const {settings: {letters} } = this

        const { mode, currentView } = this;

        switch (mode) {
            case VIEW_MODE.LEGACY: {
                const cmEditor = this.cmEditor as LegacyEditor;
                const sourceLinkHints = new LegacySourceLinkProcessor(cmEditor, letters).init();
                this.handleActions(sourceLinkHints);
                break;
            }
            case VIEW_MODE.LIVE_PREVIEW: {
                const cm6Editor = this.cmEditor as EditorView;
                const previewViewEl: HTMLElement = (currentView as unknown as { currentMode: { editor: { containerEl: HTMLElement } } }).currentMode.editor.containerEl;
                const [previewLinkHints, sourceLinkHints, linkHintHtmlElements] = new LivePreviewLinkProcessor(previewViewEl, cm6Editor, letters).init();
                cm6Editor.plugin(this.markViewPlugin).setLinks(sourceLinkHints);
                this.app.workspace.updateOptions();
                this.handleActions([...previewLinkHints, ...sourceLinkHints], linkHintHtmlElements);
                break;
            }
            case VIEW_MODE.PREVIEW: {
                const previewViewEl: HTMLElement = (currentView as unknown as { previewMode: { containerEl: HTMLElement } }).previewMode.containerEl.querySelector('div.markdown-preview-view');
                const previewLinkHints = new PreviewLinkProcessor(previewViewEl, letters).init();
                this.handleActions(previewLinkHints);
                break;
            }
            case VIEW_MODE.SOURCE: {
                const cm6Editor = this.cmEditor as EditorView;
                const livePreviewLinks = new CM6LinkProcessor(cm6Editor, letters).init();
                cm6Editor.plugin(this.markViewPlugin).setLinks(livePreviewLinks);
                this.app.workspace.updateOptions();
                this.handleActions(livePreviewLinks);
                break;
            }
        }
    }

    /*
    *  caseSensitive is only for flash mode and shall not affect jumpToAnywhere, so it is true
    *  by default. lettersOverride allows using different alphabet (e.g., Cyrillic) for labels.
    */
    handleJumpToRegex = (stringToSearch?: string, caseSensitive: boolean = true, lettersOverride?: string) => {
        const {settings: {letters: defaultLetters, jumpToAnywhereRegex}} = this
        const letters = lettersOverride || defaultLetters;
        const whatToLookAt = stringToSearch || jumpToAnywhereRegex;

        const { mode } = this

        switch (mode) {
            case VIEW_MODE.SOURCE:
                this.handleMarkdownRegex(letters, whatToLookAt, caseSensitive);
                break;
            case VIEW_MODE.LIVE_PREVIEW:
                this.handleMarkdownRegex(letters, whatToLookAt, caseSensitive);
                break;
            case VIEW_MODE.PREVIEW:
                new Notice('Regex jump is not supported in reading view. Switch to editing view.');
                break;
            case VIEW_MODE.LEGACY: {
                const cmEditor = this.cmEditor as LegacyEditor;
                const links = new LegacyRegexpProcessor(cmEditor, whatToLookAt, letters, caseSensitive).init();
                this.handleActions(links);
                break;
            }
            default:
                break;
        }

    }

    handleMarkdownRegex = (letters: string, whatToLookAt: string, caseSensitive: boolean) => {
        const cm6Editor = this.cmEditor as EditorView
        const livePreviewLinks = new CM6RegexProcessor(cm6Editor, letters, whatToLookAt, caseSensitive).init();
        cm6Editor.plugin(this.markViewPlugin).setLinks(livePreviewLinks);
        this.app.workspace.updateOptions();
        this.handleActions(livePreviewLinks);
    }

    /**
     * Handle Flash mode using the new controller-based architecture.
     * Provides incremental search with visual highlights and labels.
     */
    handleFlashJump() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            return;
        }

        const cmEditor = this.cmEditor as EditorView;
        if (!cmEditor) {
            return;
        }

        // Get the flash widget plugin instance for decoration updates
        const flashWidget = cmEditor.plugin(this.flashViewPlugin);
        if (!flashWidget) {
            // Fallback to legacy behavior if widget plugin not available
            console.warn('Flash widget plugin not found, using legacy mode');
            this.handleFlashJumpLegacy();
            return;
        }

        // Decoration update callback - updates CM6 decorations when matches change
        const onDecorationUpdate = (matches: FlashMatch[], searchLength: number, matchedPrefix: string) => {
            if (matches.length === 0) {
                flashWidget.clear();
            } else if (matchedPrefix) {
                // In prefix mode, filter to just matches with that prefix
                flashWidget.setMatches(matches, searchLength);
                flashWidget.filterByKey(matchedPrefix);
            } else {
                flashWidget.setMatches(matches, searchLength);
            }
            // Trigger decoration update
            this.app.workspace.updateOptions();
        };

        // Jump callback - moves cursor to the match position
        const onJump = (index: number) => {
            this.jumpToPosition(activeView, index);
        };

        // Complete callback - resets isLinkHintActive when Flash finishes
        // Clear controller reference BEFORE calling removePopovers to prevent circular call
        const onComplete = () => {
            this.flashController = null;
            this.removePopovers();
        };

        // Create and activate the flash controller
        this.flashController = new FlashController(
            this,
            activeView,
            cmEditor,
            this.settings,
            onJump,
            onDecorationUpdate,
            onComplete
        );

        this.flashController.activate();
        this.isLinkHintActive = true;
    }

    /**
     * Clean up legacy Flash event listeners.
     * Called when unloading plugin, switching views, or activating a new mode.
     */
    private cleanupLegacyFlash(): void {
        if (this.legacyFlashHandler && this.legacyFlashContentEl) {
            this.legacyFlashContentEl.removeEventListener(
                "keydown",
                this.legacyFlashHandler,
                { capture: true }
            );
        }
        if (this.legacyFlashContainer) {
            this.legacyFlashContainer.classList.remove('flash-active');
        }
        this.legacyFlashHandler = null;
        this.legacyFlashContentEl = null;
        this.legacyFlashContainer = null;
    }

    /**
     * Legacy Flash implementation for fallback.
     * Used when widget plugin is not available (e.g., CM5).
     */
    private handleFlashJumpLegacy() {
        // Clean up any existing legacy Flash listener before starting a new one
        this.cleanupLegacyFlash();

        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            return;
        }
        const { contentEl } = activeView;
        if (!contentEl) {return}

        // this element doesn't exist in cm5/has a different class, so flash will not work in cm5
        const contentContainer = contentEl.getElementsByClassName("cm-contentContainer")[0] as HTMLElement;
        if (!contentContainer) { return; }

        // Store references for cleanup
        this.legacyFlashContentEl = contentEl;
        this.legacyFlashContainer = contentContainer;

        // Add class to gray out all text (headers, links, etc.)
        contentContainer.classList.add('flash-active');

        const keyArray: string[] = [];
        const grabKey = (event: KeyboardEvent) => {
            event.preventDefault();

            // handle Escape to reject the mode
            if (event.key === 'Escape') {
                this.cleanupLegacyFlash();
                return;
            }

            // test if keypress is capitalized
            if (/^[\w\S\W]$/i.test(event.key)) {
                const isCapital = event.shiftKey;
                if (isCapital) {
                    // capture uppercase
                    keyArray.push((event.key).toUpperCase());
                } else {
                    // capture lowercase
                    keyArray.push(event.key);
                }
            }

            // stop when length of array is equal to flashCharacterCount
            if (keyArray.length === this.settings.flashCharacterCount) {
                const inputText = keyArray.join("");
                const escapedInput = escapeRegex(inputText);
                // Legacy mode uses simple regex matching - jump position handled by handleJumpToRegex
                const stringToSearch = escapedInput;

                // Labels always in English - key conversion happens in handleActions
                this.handleJumpToRegex(stringToSearch, this.settings.flashCaseSensitive);

                // Clean up after proceeding
                this.cleanupLegacyFlash();
            }
        }

        // Store handler reference for cleanup
        this.legacyFlashHandler = grabKey;
        contentEl.addEventListener('keydown', grabKey, { capture: true });
    }

    /**
     * Jump to a specific position in the editor.
     * Used by Flash mode when a match is selected.
     */
    private jumpToPosition(view: MarkdownView, index: number): void {
        const cmEditor = this.cmEditor;

        if (cmEditor instanceof EditorView) {
            const {vimMode, anchor} = this.cursorBeforeJump;
            const useSelection = vimMode === 'visual' || vimMode === 'visual block';

            if (useSelection && anchor !== undefined) {
                cmEditor.dispatch({
                    selection: EditorSelection.range(anchor, index),
                    scrollIntoView: true
                });
            } else {
                cmEditor.dispatch({
                    selection: EditorSelection.cursor(index),
                    scrollIntoView: true
                });
                cmEditor.focus();

                // Reposition cursor after Obsidian's Live Preview processing
                setTimeout(() => {
                    const currentPos = cmEditor.state.selection.main.head;
                    if (currentPos !== index) {
                        cmEditor.dispatch({
                            selection: EditorSelection.cursor(index)
                        });
                    }
                }, 10);
            }
        } else {
            const legacyEditor = cmEditor as LegacyEditor;
            legacyEditor.setCursor(legacyEditor.posFromIndex(index));
        }
    }

    handleHotkey(heldShiftKey: boolean, link: SourceLinkHint | LinkHintBase) {
        const linkElement = 'linkElement' in link ? (link as { linkElement: HTMLElement }).linkElement : undefined;
        if (linkElement) {
            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
                metaKey: heldShiftKey,
            });
            linkElement.dispatchEvent(event);
        } else if (link.type === 'internal') {
            const file = this.app.workspace.getActiveFile()
            if (file) {
                // the second argument is for the link resolution
                void this.app.workspace.openLinkText(decodeURI(link.linkText), file.path, heldShiftKey, {active: true});
            }
        } else if (link.type === 'external') {
            window.open(link.linkText);
        } else {
            let index = (link as SourceLinkHint).index;
            const cm6Editor = this.cmEditor;

            // Apply jump position setting for regex/Jump to Anywhere matches
            // Use capital variant when Shift is held (any key in multi-letter label)
            if (link.type === 'regex') {
                const matchLength = link.linkText.length;
                const jumpPosition = heldShiftKey
                    ? this.settings.jumpAnywhereJumpPositionCapital
                    : this.settings.jumpAnywhereJumpPosition;
                switch (jumpPosition) {
                    case 'first-char':
                        // index is already at first char
                        break;
                    case 'last-char':
                        index = index + matchLength - 1;
                        break;
                    case 'after-last-char':
                        index = index + matchLength;
                        break;
                }
            }

            if (cm6Editor instanceof EditorView) {
                const {vimMode, anchor} = this.cursorBeforeJump;
                // Selection only in vim visual mode (Shift now controls jump position)
                const useSelection = vimMode === 'visual' || vimMode === 'visual block'

                if (useSelection && anchor !== undefined) {
                    cm6Editor.dispatch({
                        selection: EditorSelection.range(anchor, index),
                        scrollIntoView: true
                    })
                } else {
                    // Set cursor position, then reposition after Obsidian processes
                    // This works around Live Preview's formatting snap behavior
                    cm6Editor.dispatch({
                        selection: EditorSelection.cursor(index),
                        scrollIntoView: true
                    })
                    cm6Editor.focus()

                    // Reposition cursor after Obsidian's Live Preview processing
                    setTimeout(() => {
                        const currentPos = cm6Editor.state.selection.main.head;
                        if (currentPos !== index) {
                            // Cursor was moved by Live Preview, reposition it
                            cm6Editor.dispatch({
                                selection: EditorSelection.cursor(index)
                            })
                        }
                    }, 10)
                }
            } else {
                const legacyEditor = cm6Editor as LegacyEditor;
                legacyEditor.setCursor(legacyEditor.posFromIndex(index));
            }
        }
    }

    removePopovers(linkHintHtmlElements?: HTMLElement[]) {
        const currentView = this.contentElement;

        // Remove dimming effect
        currentView.classList.remove('flash-active');

        // Remove click handler if it exists
        if (this.clickHandler) {
            currentView.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }

        // Remove keydown handler if it exists (critical for proper cleanup)
        if (this.keyDownHandler) {
            currentView.removeEventListener('keydown', this.keyDownHandler, { capture: true });
            this.keyDownHandler = null;
        }

        // Cleanup flash controller if active
        // Clear reference FIRST to prevent circular call from deactivate -> onComplete -> removePopovers
        if (this.flashController) {
            const controller = this.flashController;
            this.flashController = null;
            controller.deactivate();
        }

        // Use passed elements or stored elements
        const elements = linkHintHtmlElements ?? this.currentLinkHintHtmlElements;
        elements?.forEach(e => e.remove());
        this.currentLinkHintHtmlElements = undefined;

        currentView.querySelectorAll('.jl.popover').forEach(e => e.remove());

        this.prefixInfo = undefined;
        if (this.mode == VIEW_MODE.SOURCE || this.mode == VIEW_MODE.LIVE_PREVIEW) {
            (this.cmEditor as EditorView).plugin(this.markViewPlugin).clean();
            // Also clean flash decorations
            const flashWidget = (this.cmEditor as EditorView).plugin(this.flashViewPlugin);
            if (flashWidget) {
                flashWidget.clear();
            }
        }
        this.app.workspace.updateOptions();
        this.isLinkHintActive = false;
    }

    removePopoversWithoutPrefixEventKey(eventKey: string, linkHintHtmlElements: HTMLElement[] | undefined = []) {
        const currentView = this.contentElement;

        linkHintHtmlElements?.forEach(e => {
            if (e.innerHTML.length == 2 && e.innerHTML[0] == eventKey) {
                e.classList.add("matched");
                return;
            }

            e.remove();
        });

        currentView.querySelectorAll('.jl.popover').forEach(e => {
            if (e.innerHTML.length == 2 && e.innerHTML[0] == eventKey) {
                e.classList.add("matched");
                return;
            }

            e.remove();
        });

        if (this.mode == VIEW_MODE.SOURCE || this.mode == VIEW_MODE.LIVE_PREVIEW) {
            (this.cmEditor as EditorView).plugin(this.markViewPlugin).filterWithEventKey(eventKey);
        }
        this.app.workspace.updateOptions();
    }

    handleActions(linkHints: LinkHintBase[], linkHintHtmlElements?: HTMLElement[]): void {
        const contentElement = this.contentElement
        if (!linkHints.length) {
            return;
        }

        // Add dimming effect (same as Flash mode)
        contentElement.classList.add('flash-active');

        const linkHintMap: { [letter: string]: LinkHintBase } = {};
        linkHints.forEach(x => linkHintMap[x.letter.toUpperCase()] = x);

        const handleKeyDown = (event: KeyboardEvent): void => {
            // Handle Escape FIRST (before modifier check, since Escape is in modifier list)
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                this.removePopovers(linkHintHtmlElements);
                return;
            }

            if (isModifierKey(event.key)) {
                return;
            }

            // Convert Cyrillic keypress to Latin (same physical key position)
            // This allows pressing Russian keys to match English labels
            const eventKey = convertToLatin(event.key).toUpperCase();
            const prefixes = new Set(Object.keys(linkHintMap).filter(x => x.length > 1).map(x => x[0]));

            let linkHint: LinkHintBase;
            if (this.prefixInfo) {
                linkHint = linkHintMap[this.prefixInfo.prefix + eventKey];
            } else {
                linkHint = linkHintMap[eventKey];
                if (!linkHint && prefixes && prefixes.has(eventKey)) {
                    this.prefixInfo = {prefix: eventKey, shiftKey: event.shiftKey};

                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    this.removePopoversWithoutPrefixEventKey(eventKey, linkHintHtmlElements);

                    return;
                }
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const heldShiftKey = this.prefixInfo?.shiftKey || event.shiftKey;

            if (linkHint) {
                this.handleHotkey(heldShiftKey, linkHint);
            }

            this.removePopovers(linkHintHtmlElements);
        };

        if (linkHints.length === 1 && this.settings.jumpToLinkIfOneLinkOnly) {
            const heldShiftKey = this.prefixInfo?.shiftKey;
            this.handleHotkey(heldShiftKey, linkHints[0]);
            this.removePopovers(linkHintHtmlElements);
            return
        }

        // Store references for proper cleanup
        this.currentLinkHintHtmlElements = linkHintHtmlElements;
        this.keyDownHandler = handleKeyDown;
        this.clickHandler = () => this.removePopovers(linkHintHtmlElements);
        contentElement.addEventListener('click', this.clickHandler);
        contentElement.addEventListener('keydown', handleKeyDown, { capture: true });
        this.isLinkHintActive = true;
    }

    /**
     * CodeMirror's vim automatically exits visual mode when executing a command.
     * This keeps track of selection changes so we can restore the selection.
     *
     * This is the same approach taken by the obsidian-vimrc-plugin
     */
    watchForSelectionChange() {
        const updateSelection = this.updateSelection.bind(this)
        const watchForChanges = () => {
            const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
            const cm: LegacyEditor | undefined = (editor as unknown as { cm?: { cm?: LegacyEditor } })?.cm?.cm;

            if (cm) {
                const handlers = (cm as unknown as { _handlers: { cursorActivity: Array<(...args: unknown[]) => void> } })._handlers;
                if (!handlers.cursorActivity.includes(updateSelection)) {
                    cm.on("cursorActivity", updateSelection);
                    this.register(() => cm.off("cursorActivity", updateSelection));
                }
            }
        }
        this.registerEvent(this.app.workspace.on("active-leaf-change", watchForChanges));
        this.registerEvent(this.app.workspace.on("file-open", watchForChanges));
        watchForChanges();
    }

    updateSelection(editor: LegacyEditor) {
        const anchor = editor.listSelections()[0]?.anchor
        this.currentCursor = {
            anchor: anchor ? editor.indexFromPos(anchor) : undefined,
            vimMode: editor.state.vim?.mode
        }
    }

    /**
     * Apply flash CSS custom properties from settings.
     * Called on load and when settings change.
     */
    applyFlashStyles(): void {
        document.documentElement.style.setProperty(
            '--flash-label-bg',
            this.settings.flashLabelBackground
        );
        document.documentElement.style.setProperty(
            '--flash-label-color',
            this.settings.flashLabelColor
        );
        document.documentElement.style.setProperty(
            '--flash-highlight-color',
            this.settings.flashMatchHighlight
        );
        document.documentElement.style.setProperty(
            '--flash-dim-opacity',
            String(this.settings.flashDimOpacity)
        );
    }
}
