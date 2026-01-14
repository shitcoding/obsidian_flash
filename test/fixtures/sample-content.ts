/**
 * Test fixtures with sample content for testing.
 * Includes various text types, languages, and markdown formatting.
 */

// ===== Basic Text =====

export const ENGLISH_TEXT = `
Hello world this is a test document.
It contains multiple lines of text.
Some words are short and some are longer words.
`;

export const RUSSIAN_TEXT = `
Привет мир это тестовый документ.
Он содержит несколько строк текста.
Некоторые слова короткие а некоторые длинные слова.
`;

export const MIXED_TEXT = `
Hello привет world мир.
This is тестовый mixed текст document документ.
Numbers 123 числа and special !@# characters.
`;

// ===== Markdown Content =====

export const MARKDOWN_LINKS = `
Here is an [[internal link]] and another [[link|with title]].
Also an [external link](https://example.com).
And a [relative link](./other-file.md).
Plain URL: https://obsidian.md
`;

export const MARKDOWN_FORMATTED = `
Some **bold text** and *italic text* here.
Also \`inline code\` and ~~strikethrough~~.
A mix: **bold *and italic*** together.
`;

export const CYRILLIC_MARKDOWN = `
Вот **жирный текст** и *курсивный текст*.
Также \`код\` в строке.
Ссылка на [[файл]] и [[другой файл|с названием]].
`;

// ===== Edge Cases =====

export const SPECIAL_CHARACTERS = `
Test (parentheses) and [brackets].
Also {curly braces} and <angle brackets>.
Regex special: .* + ? ^ $ | \\
`;

export const UNICODE_EDGE_CASES = `
Chinese: hello
Japanese: hello
Korean: hello
Arabic: مرحبا
Hebrew: שלום
Greek: γεια
`;

export const SHORT_WORDS = `
I a am is to be or no so do go up.
Я и он на за до ко то от.
`;

export const LONG_WORDS = `
Internationalization documentation implementation.
Интернационализация документирование программирование.
`;

// ===== Test Content for Specific Features =====

export const LIGHTSPEED_TEST = `
apple banana cherry date elderberry fig grape.
яблоко банан вишня дата бузина инжир виноград.
mixed яблоко apple банан banana.
`;

export const JUMP_TO_ANYWHERE_TEST = `
Short: a I be do.
Longer: hello world testing.
Cyrillic short: я в.
Cyrillic longer: привет мир тестирование.
Numbers and letters: test123 hello456.
`;

export const REGEX_TEST_CONTENT = `
email@test.com another@example.org
Phone: 123-456-7890 or (555) 123-4567
URLs: http://test.com https://secure.example.com
File paths: /home/user/file.txt C:\\Users\\file.txt
`;

// ===== Factory Functions =====

/**
 * Creates test content with specified number of words.
 */
export function createWordContent(wordCount: number, lang: 'en' | 'ru' | 'mixed' = 'en'): string {
  const enWords = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew'];
  const ruWords = ['яблоко', 'банан', 'вишня', 'дата', 'бузина', 'инжир', 'виноград', 'дыня'];

  const words = lang === 'en' ? enWords :
                lang === 'ru' ? ruWords :
                [...enWords, ...ruWords];

  const result: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(words[i % words.length]);
  }
  return result.join(' ');
}

/**
 * Creates test content with links.
 */
export function createLinkContent(linkCount: number): string {
  const lines: string[] = [];
  for (let i = 0; i < linkCount; i++) {
    const linkType = i % 3;
    if (linkType === 0) {
      lines.push(`Text with [[internal-link-${i}]] here.`);
    } else if (linkType === 1) {
      lines.push(`Text with [external](https://example${i}.com) here.`);
    } else {
      lines.push(`Text with [[link-${i}|Title ${i}]] here.`);
    }
  }
  return lines.join('\n');
}

/**
 * Creates markdown content with various formatting.
 */
export function createFormattedContent(): string {
  return `
# Heading 1

Normal paragraph with **bold** and *italic*.

## Heading 2

- List item 1
- List item 2
- List item 3

### Heading 3

\`\`\`javascript
const code = "block";
\`\`\`

> Blockquote text here.

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
`;
}
