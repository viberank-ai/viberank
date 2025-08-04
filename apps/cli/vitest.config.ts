import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@viberank/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
