# Flash

> Neovim-style navigation for Obsidian. Jump anywhere with minimal keystrokes.

Flash brings the speed of [flash.nvim](https://github.com/folke/flash.nvim) and [leap.nvim](https://github.com/ggandor/leap.nvim) to Obsidian. Type a few characters, see labels appear on matches, press a label to jump instantly.

## Features

- **Flash Mode** — Incremental search with live-updating labels. Type characters to narrow matches, press a label to jump.
- **Jump to Link** — Navigate to any link (`[[wiki]]`, `[markdown](url)`, plain URLs) with a single keypress.
- **Jump to Anywhere** — Regex-based navigation to jump to any word or pattern.
- **Smart labels** — Labels never conflict with the next character after a match, so you can keep typing naturally.
- **Auto-jump** — Automatically jumps when only one match remains.
- **Full Unicode support** — Works with Cyrillic, CJK, and any Unicode text. Cyrillic keyboard input maps to Latin labels.
- **Visual feedback** — Search panel shows your query, matched text highlights, non-matches dim.

## How It Works

### Flash Mode

The primary way to navigate. Like `/` search but better.

1. Activate Flash Mode (`s` in Vim normal mode, or via command)
2. Start typing — matches highlight in real-time
3. After 2 characters (configurable), labels appear next to matches
4. Press a label key to jump, or keep typing to narrow results
5. If one match remains, auto-jumps immediately

**Controls:**
- Type any character to search or select a label
- `Backspace` to delete characters
- `Escape` or click to cancel

### Jump to Link

Quick navigation between links in your note.

1. Activate Jump to Link
2. Labels appear on all links
3. Press a label to jump (or open in new pane with `Shift`)

Works with wiki links, markdown links, and bare URLs.

### Jump to Anywhere

Regex-powered navigation to any text pattern.

1. Activate Jump to Anywhere
2. Labels appear on all regex matches (default: words with 3+ characters)
3. Press a label to jump

## Installation

### Community Plugins (Recommended)

1. Open **Settings → Community Plugins**
2. Click **Browse** and search for "Flash"
3. Click **Install**, then **Enable**

### Manual

1. Download `main.js`, `manifest.json`, `styles.css` from [Releases](https://github.com/USERNAME/obsidian-flash/releases)
2. Create folder: `<vault>/.obsidian/plugins/obsidian-flash/`
3. Copy files into the folder
4. Enable in **Settings → Community Plugins**

## Vim Integration

Use with [obsidian-vimrc-support](https://github.com/esm7/obsidian-vimrc-support):

```vim
" Flash Mode (recommended primary navigation)
exmap flash obcommand obsidian-flash:activate-flash-mode
nmap s :flash<CR>
vmap s :flash<CR>

" Jump to Link
exmap jumpLink obcommand obsidian-flash:activate-flash-link
nmap gl :jumpLink<CR>

" Jump to Anywhere
exmap jumpAnywhere obcommand obsidian-flash:activate-flash-anywhere
nmap <Space>j :jumpAnywhere<CR>
```

## Configuration

### General

| Setting | Description | Default |
|---------|-------------|---------|
| Characters for hints | Letters used for labels (home row first recommended) | `asdfghjkl...` |
| Auto-jump single target | Skip label when only one match | On |

### Flash Mode

| Setting | Description | Default |
|---------|-------------|---------|
| Minimum characters | Characters needed before showing labels | `2` |
| Case sensitive | Match case when searching | Off |
| Jump position | Where cursor lands: match start/end, word start/end | Match end |
| Jump position (Shift) | Position when holding Shift | Match start |

### Flash Mode Appearance

| Setting | Description | Default |
|---------|-------------|---------|
| Label background | Background color for labels | `#F47D1A` |
| Label text color | Text color for labels | `#000000` |
| Match highlight | Color for matched characters | `#F47D1A` |
| Dim opacity | Opacity of non-matching text (0-1) | `0.4` |
| Inherit font | Labels match surrounding text font | On |

### Jump to Anywhere

| Setting | Description | Default |
|---------|-------------|---------|
| Regex pattern | Pattern for matching targets | `(?<![\p{L}\p{N}_])[\p{L}\p{N}]{3,}...` |
| Jump position | Where cursor lands | After last char |
| Jump position (Shift) | Position when holding Shift | First char |

## Command IDs

```
obsidian-flash:activate-flash-mode      # Flash Mode (incremental search)
obsidian-flash:activate-flash-link      # Jump to Link
obsidian-flash:activate-flash-anywhere  # Jump to Anywhere
```

## CSS Customization

```css
/* Label appearance */
.flash-label {
    background: #your-color;
    color: #your-text-color;
    border-radius: 3px;
}

/* Matched text highlight */
.flash-highlight {
    color: #your-highlight !important;
}

/* Dimmed text during Flash Mode */
.flash-active {
    --flash-color: rgba(128, 128, 128, 0.5);
}

/* Search panel */
.flash-search-panel {
    background: var(--background-secondary);
    border-color: var(--text-accent);
}
```

## Unicode & Cyrillic Support

Full support for non-Latin text:

- **Search any script** — Flash Mode finds matches in Cyrillic, CJK, or any Unicode text
- **Cyrillic keyboard mapping** — Type on Russian layout, labels still work (ф→a, ы→s, etc.)
- **Unicode regex** — Jump to Anywhere uses `\p{L}` (letters) and `\p{N}` (numbers) for universal matching

## Requirements

- Obsidian 0.15.0+
- CodeMirror 6 editor (default in modern Obsidian)

## Credits

Inspired by:
- [flash.nvim](https://github.com/folke/flash.nvim) — The gold standard for Neovim navigation
- [leap.nvim](https://github.com/ggandor/leap.nvim) — Lightning-fast motion plugin
- [obsidian-jump-to-link](https://github.com/mrjackphil/obsidian-jump-to-link) — Original Obsidian link jumping

## License

MIT
