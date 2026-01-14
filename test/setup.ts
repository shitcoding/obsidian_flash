/**
 * Jest Test Setup
 * Initializes the test environment with necessary globals and mocks.
 */

// Mock global activeDocument for DOM operations in tests
Object.defineProperty(global, 'activeDocument', {
  value: document,
  writable: true,
});

// Extend Array prototype with contains() for Obsidian compatibility
if (!Array.prototype.hasOwnProperty('contains')) {
  Object.defineProperty(Array.prototype, 'contains', {
    value: function<T>(this: T[], item: T): boolean {
      return this.includes(item);
    },
    writable: true,
    configurable: true,
  });
}

// Console warning suppression for expected warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress regex validation warnings in tests
  if (args[0]?.includes?.('Regex validation failed')) {
    return;
  }
  originalWarn.apply(console, args);
};
