import { expect } from 'vitest';
import { FsPath } from '../file-info/fs-path';
import { inVfs } from './in-vfs';

expect.extend({
  toBeVfsFile(received: FsPath, expected: string) {
    return {
      pass: received === inVfs(expected),
      message: () => `expected ${received} to be ${expected}`,
    };
  },

  toBeVfsFiles(received: FsPath[], expected: string[]) {
    return {
      pass:
        JSON.stringify(received.sort()) ===
        JSON.stringify(expected.map(inVfs).sort()),
      message: () => `expected ${received} to be ${expected}`,
    };
  },
});

interface CustomMatchers<R = unknown> {
  toBeVfsFile(expected: string): R;
  toBeVfsFiles(expected: string[]): R;
}

declare global {
  namespace Vi {
    interface Assertion extends CustomMatchers {}
  }
}
