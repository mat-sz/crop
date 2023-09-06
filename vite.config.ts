import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    {
      name: 'configure-sharedarraybuffer',
      configureServer: server => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          next();
        });
      },
    },
  ],
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
