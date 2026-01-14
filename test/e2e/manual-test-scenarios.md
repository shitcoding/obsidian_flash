# Flash Plugin - Manual E2E Test Scenarios

This document provides manual testing scenarios for the Flash plugin.
Use this as a checklist when testing new features or verifying bug fixes.

## Prerequisites

1. **Build and Deploy**
   ```bash
   cd /Users/archer/coding/pet_projects/obsidian_flash_scratch
   npm run build && cp main.js manifest.json styles.css ~/db2/.obsidian/plugins/obsidian-flash/
   ```

2. **Reload Obsidian** (Cmd+R on macOS)

3. **Verify Plugin Enabled**
   - Settings -> Community Plugins -> Flash should be enabled

## Test Scenarios

### TS-001: Jump to Link - Internal Links

**Preconditions:**
- Open a note containing internal links

**Test Content:**
```markdown
Here is a [[test link]] and another [[second link|with title]].
Also an [[unresolved link]] that doesn't exist yet.
```

**Steps:**
1. Open the test note
2. Execute command "Flash: Jump to Link" (or use vimrc binding)
3. Observe hint labels appear
4. Press the label for "test link"

**Expected Result:**
- [ ] Hint labels appear on all internal links
- [ ] Labels are uppercase letters
- [ ] Pressing label opens the linked note
- [ ] If note doesn't exist, option to create it

**Actual Result:** __________________

---

### TS-002: Jump to Link - External Links

**Test Content:**
```markdown
Visit [Google](https://google.com) or [GitHub](https://github.com).
Plain URL: https://obsidian.md
```

**Steps:**
1. Execute "Flash: Jump to Link"
2. Press label for Google link
3. Repeat for plain URL

**Expected Result:**
- [ ] Labels appear on markdown links
- [ ] Labels appear on plain URLs
- [ ] Clicking opens in default browser

**Actual Result:** __________________

---

### TS-003: Jump to Anywhere - English Text

**Test Content:**
```markdown
Hello world this is a test document.
Some short words: a I be do go.
Some longer words: testing implementation documentation.
```

**Steps:**
1. Execute command "Flash: Jump to Anywhere"
2. Observe which words get labels
3. Press a label to jump

**Expected Result:**
- [ ] Labels appear on words with 3+ characters
- [ ] Short words (a, I, be, do) have NO labels
- [ ] Cursor jumps to start of selected word

**Actual Result:** __________________

---

### TS-004: Jump to Anywhere - Russian/Cyrillic Text

**Test Content:**
```markdown
Привет мир это тестовый документ.
Короткие слова: я в к.
Длинные слова: тестирование программирование документация.
```

**Steps:**
1. Execute "Flash: Jump to Anywhere"
2. Check labels on Russian words
3. Jump to a Russian word

**Expected Result:**
- [ ] Labels appear on Russian words 3+ characters
- [ ] Short words (я, в, к) have NO labels
- [ ] Cursor jumps to start of selected word

**Actual Result:** __________________

---

### TS-005: Jump to Anywhere - Mixed Content

**Test Content:**
```markdown
Hello привет world мир.
Testing тестирование documentation документация.
```

**Steps:**
1. Execute "Flash: Jump to Anywhere"
2. Verify both English and Russian words have labels

**Expected Result:**
- [ ] English words have labels
- [ ] Russian words have labels
- [ ] Can jump to words in either language

**Actual Result:** __________________

---

### TS-006: Flash Mode - English Search

**Test Content:**
```markdown
hello world help here happy
testing text the through
```

**Steps:**
1. Enter vim normal mode (Escape)
2. Activate Flash Mode (press 's' or configured key)
3. Type "he" to search

**Expected Result:**
- [ ] Labels appear on "hello", "help", "here"
- [ ] No labels on "the" (too short match)
- [ ] Pressing label jumps to word

**Actual Result:** __________________

---

### TS-007: Flash Mode - Russian Search

**Test Content:**
```markdown
привет программирование прекрасный
мир можно много
тест текст типа
```

**Steps:**
1. Enter vim normal mode
2. Activate Flash Mode
3. Type "пр" (first 2 chars of "привет")

**Expected Result:**
- [ ] Labels appear on "привет", "программирование", "прекрасный"
- [ ] No labels on other words
- [ ] Jump works correctly

**Actual Result:** __________________

---

### TS-008: Flash Mode - Cyrillic Keyboard Label Selection

**Test Content:**
```markdown
hello привет world мир
```

**Steps:**
1. Activate Flash Mode
2. Search for "he" to show labels
3. When labels show, press Cyrillic key instead of Latin
   - Press "ф" (on A key position) instead of "A"
   - Press "ы" (on S key position) instead of "S"

**Expected Result:**
- [ ] Cyrillic keypresses map to Latin labels
- [ ] Can select labels with either keyboard layout
- [ ] "ф" acts as "A", "ы" acts as "S", etc.

**Actual Result:** __________________

---

### TS-009: Escape Cancellation

**Steps:**
1. Activate any Flash mode
2. Wait for labels to appear
3. Press Escape before selecting

**Expected Result:**
- [ ] All hint labels disappear
- [ ] Normal mode resumes
- [ ] No side effects on cursor position

**Actual Result:** __________________

---

### TS-010: Formatted Text - Bold

**Test Content:**
```markdown
Here is **bold text** in a sentence.
And *italic text* here.
Also `inline code` works.
```

**Steps:**
1. Execute "Jump to Anywhere"
2. Jump to "bold" word
3. Check cursor position

**Expected Result:**
- [ ] Cursor on "b" of "bold", NOT on "*"
- [ ] Same for italic and code text

**Actual Result:** __________________

---

### TS-011: Special Characters

**Test Content:**
```markdown
Test (parentheses) and [brackets].
Also {curly} and <angle>.
Regex: .* + ? ^ $ |
```

**Steps:**
1. Activate Flash Mode
2. Search for "(p" (parenthesis + p)
3. Search for "[b" (bracket + b)

**Expected Result:**
- [ ] No JavaScript errors in console
- [ ] Plugin doesn't crash
- [ ] May or may not find matches (acceptable)

**Actual Result:** __________________

---

### TS-012: Auto-jump Single Link

**Test Content:**
```markdown
Only one [[single link]] here.
```

**Steps:**
1. Execute "Jump to Link"
2. Observe behavior

**Expected Result:**
- [ ] If setting enabled: auto-jumps without showing label
- [ ] If setting disabled: shows label, requires keypress

**Actual Result:** __________________

---

## Test Summary

| Test ID | Description | Result |
|---------|-------------|--------|
| TS-001 | Internal Links | |
| TS-002 | External Links | |
| TS-003 | Anywhere - English | |
| TS-004 | Anywhere - Russian | |
| TS-005 | Anywhere - Mixed | |
| TS-006 | Flash Mode - English | |
| TS-007 | Flash Mode - Russian | |
| TS-008 | Cyrillic Keyboard | |
| TS-009 | Escape Cancel | |
| TS-010 | Formatted Text | |
| TS-011 | Special Characters | |
| TS-012 | Auto-jump | |

**Total Passed:** ____
**Total Failed:** ____
**Date Tested:** ____
**Version:** ____
