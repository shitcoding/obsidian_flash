/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/test/mocks/obsidian.ts',
    '^@codemirror/(.*)$': '<rootDir>/test/mocks/codemirror.ts',
    '^codemirror$': '<rootDir>/test/mocks/codemirror.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2020',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowJs: true,
        strict: false,
        skipLibCheck: true,
        lib: ['ES2020', 'DOM'],
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/test/e2e/'],
  verbose: true,
};
