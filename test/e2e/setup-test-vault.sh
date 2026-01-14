#!/bin/bash
# Setup test vault with user's Obsidian configuration
# This copies vim plugin, vimrc, and essential settings to the test vault

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_VAULT="$SCRIPT_DIR/vaults/test-vault"
USER_VAULT="$HOME/db2"

echo "Setting up test vault at: $TEST_VAULT"
echo "Copying config from: $USER_VAULT"

# Create test vault structure
mkdir -p "$TEST_VAULT/.obsidian/plugins"
mkdir -p "$TEST_VAULT/.obsidian/snippets"
mkdir -p "$TEST_VAULT/.obsidian/themes"

# Copy essential Obsidian settings (not machine-specific)
cp "$USER_VAULT/.obsidian/app.json" "$TEST_VAULT/.obsidian/" 2>/dev/null || true
cp "$USER_VAULT/.obsidian/appearance.json" "$TEST_VAULT/.obsidian/" 2>/dev/null || true
cp "$USER_VAULT/.obsidian/hotkeys.json" "$TEST_VAULT/.obsidian/" 2>/dev/null || true
cp "$USER_VAULT/.obsidian/core-plugins.json" "$TEST_VAULT/.obsidian/" 2>/dev/null || true

# Copy vim plugin (essential for user's workflow)
if [ -d "$USER_VAULT/.obsidian/plugins/obsidian-vimrc-support" ]; then
    echo "Copying obsidian-vimrc-support plugin..."
    cp -r "$USER_VAULT/.obsidian/plugins/obsidian-vimrc-support" "$TEST_VAULT/.obsidian/plugins/"
fi

# Copy .obsidian.vimrc if it exists
if [ -f "$USER_VAULT/.obsidian.vimrc" ]; then
    echo "Copying .obsidian.vimrc..."
    cp "$USER_VAULT/.obsidian.vimrc" "$TEST_VAULT/"
fi

# Create community-plugins.json with vim and flash enabled
cat > "$TEST_VAULT/.obsidian/community-plugins.json" << 'EOF'
[
  "obsidian-vimrc-support",
  "obsidian-flash"
]
EOF

# Create test markdown files
cat > "$TEST_VAULT/Test Links.md" << 'EOF'
# Test Links

## Internal Links
Here is a [[Test Note]] and another [[Second Note|with alias]].

## External Links
Visit [Google](https://google.com) or [GitHub](https://github.com).

Plain URL: https://obsidian.md
EOF

cat > "$TEST_VAULT/Test Note.md" << 'EOF'
# Test Note

This is a test note for E2E testing.

## English Content
Hello world this is test content.
Some longer words: testing implementation documentation.

## Russian Content
Привет мир это тестовый документ.
Длинные слова: тестирование программирование документация.

## Mixed Content
Hello привет world мир testing тестирование.

## Formatted Text
Here is **bold text** and *italic text*.
Also `inline code` and ~~strikethrough~~.

## Special Characters
Test (parentheses) and [brackets].
Regex chars: .* + ? ^ $ |
EOF

cat > "$TEST_VAULT/Second Note.md" << 'EOF'
# Second Note

This note is linked from Test Links.
EOF

echo ""
echo "Test vault setup complete!"
echo ""
echo "Contents:"
ls -la "$TEST_VAULT"
echo ""
echo "Plugins:"
ls -la "$TEST_VAULT/.obsidian/plugins" 2>/dev/null || echo "No plugins yet"
