import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
    },
  },
});
