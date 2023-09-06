import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '',
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg'],
  },
  resolve:
    mode === 'production'
      ? {
          // Enables MobX production build
          mainFields: ['jsnext:main', 'module', 'main'],
        }
      : undefined,
}));
