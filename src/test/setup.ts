import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock navigator for device fingerprint
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-agent',
    language: 'en-US',
    languages: ['en-US'],
  },
  writable: true,
});

// Mock screen
Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
  },
  writable: true,
});

// Mock Intl.DateTimeFormat
Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: vi.fn(() => ({
      resolvedOptions: () => ({ timeZone: 'UTC' }),
    })),
  },
  writable: true,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});