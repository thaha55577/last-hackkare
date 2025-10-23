import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use root base for Vercel and typical hosting. Use './' if you need relative assets.
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
