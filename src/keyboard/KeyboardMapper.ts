/**
 * Keyboard mapping utilities for non-Latin keyboard layouts.
 * Uses the Keyboard Layout Map API for universal layout support,
 * with Cyrillic fallback for environments where the API is unavailable.
 */

/**
 * Cyrillic to Latin keyboard mapping (fallback when Layout Map API is unavailable)
 */
export const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
    'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p',
    'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l',
    'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm',
    'Й': 'Q', 'Ц': 'W', 'У': 'E', 'К': 'R', 'Е': 'T', 'Н': 'Y', 'Г': 'U', 'Ш': 'I', 'Щ': 'O', 'З': 'P',
    'Ф': 'A', 'Ы': 'S', 'В': 'D', 'А': 'F', 'П': 'G', 'Р': 'H', 'О': 'J', 'Л': 'K', 'Д': 'L',
    'Я': 'Z', 'Ч': 'X', 'С': 'C', 'М': 'V', 'И': 'B', 'Т': 'N', 'Ь': 'M',
    // Additional characters on Russian keyboard
    'х': '[', 'ъ': ']', 'ж': ';', 'э': "'", 'б': ',', 'ю': '.',
    'Х': '{', 'Ъ': '}', 'Ж': ':', 'Э': '"', 'Б': '<', 'Ю': '>',
};

/**
 * Modifier keys that should be ignored during hint selection
 */
export const MODIFIER_KEYS: ReadonlySet<string> = new Set([
    'Shift', 'Meta', 'Escape', 'Control', 'Alt',
    'CapsLock', 'Tab', 'Backspace', 'Enter'
]);

/**
 * Cached reverse layout map: non-Latin character → Latin letter (physical key position).
 * Built from Keyboard Layout Map API or Cyrillic fallback.
 */
let layoutCharToLatin: Map<string, string> = new Map();
let layoutMapInitialized = false;

/**
 * Initialize/refresh the keyboard layout mapping.
 * Uses navigator.keyboard.getLayoutMap() for universal layout support.
 * Falls back to Cyrillic mapping table if the API is unavailable.
 */
export async function initLayoutMap(): Promise<void> {
    const newMap = new Map<string, string>();

    try {
        const keyboard = (navigator as NavigatorWithKeyboard).keyboard;
        if (keyboard?.getLayoutMap) {
            const layoutMap = await keyboard.getLayoutMap();
            for (const [code, char] of layoutMap.entries()) {
                if (code.startsWith('Key')) {
                    const latinLetter = code.charAt(3).toLowerCase();
                    const layoutChar = char.toLowerCase();
                    // Only add mappings where the layout produces a different character
                    if (layoutChar !== latinLetter) {
                        newMap.set(layoutChar, latinLetter);
                    }
                }
            }
            if (newMap.size > 0) {
                layoutCharToLatin = newMap;
                layoutMapInitialized = true;
                return;
            }
        }
    } catch {
        // API not available or failed, fall through to Cyrillic fallback
    }

    // Fallback: build map from Cyrillic table
    buildCyrillicFallbackMap(newMap);
    layoutCharToLatin = newMap;
    layoutMapInitialized = true;
}

/**
 * Build the fallback map from the Cyrillic mapping table.
 */
function buildCyrillicFallbackMap(map: Map<string, string>): void {
    for (const [cyrillic, latin] of Object.entries(CYRILLIC_TO_LATIN)) {
        const lowerLatin = latin.toLowerCase();
        // Only map letter keys (a-z)
        if (lowerLatin.length === 1 && /[a-z]/.test(lowerLatin)) {
            map.set(cyrillic.toLowerCase(), lowerLatin);
        }
    }
}

/**
 * Get the Latin label letter for a character based on the current keyboard layout.
 * Returns undefined if the character is already Latin or has no mapping.
 */
export function getLatinForLayoutChar(char: string): string | undefined {
    if (!layoutMapInitialized) {
        // Synchronous fallback: use Cyrillic table directly
        const latin = CYRILLIC_TO_LATIN[char] || CYRILLIC_TO_LATIN[char.toLowerCase()];
        if (latin) {
            return latin.toLowerCase();
        }
        return undefined;
    }
    return layoutCharToLatin.get(char.toLowerCase());
}

/**
 * Extract the Latin label letter from a KeyboardEvent.code.
 * Uses the physical key position, works universally for any layout.
 * Returns undefined for non-letter keys.
 */
export function getLatinFromCode(code: string): string | undefined {
    if (code.startsWith('Key') && code.length === 4) {
        return code.charAt(3).toLowerCase();
    }
    return undefined;
}

/**
 * Detects if a string contains Cyrillic characters
 */
export function isCyrillic(str: string): boolean {
    return /[\u0400-\u04FF]/.test(str);
}

/**
 * Converts Cyrillic letters to Latin based on keyboard layout position.
 */
export function convertToLatin(str: string): string {
    return str.split('').map(char => CYRILLIC_TO_LATIN[char] || char).join('');
}

/**
 * Normalizes a keypress to its Latin equivalent.
 * Handles Cyrillic input by mapping to physical key position.
 */
export function normalizeKeypress(key: string): string {
    if (isCyrillic(key)) {
        return convertToLatin(key);
    }
    return key;
}

/**
 * Checks if a key is a modifier key that should be ignored
 */
export function isModifierKey(key: string): boolean {
    return MODIFIER_KEYS.has(key);
}

/**
 * Type declaration for navigator.keyboard (Keyboard API)
 * Available in Chromium/Electron but not in all TypeScript DOM libs.
 */
interface NavigatorWithKeyboard extends Navigator {
    keyboard?: {
        getLayoutMap(): Promise<KeyboardLayoutMapLike>;
        addEventListener?(event: string, handler: () => void): void;
    };
}

interface KeyboardLayoutMapLike {
    entries(): IterableIterator<[string, string]>;
    get(key: string): string | undefined;
}
