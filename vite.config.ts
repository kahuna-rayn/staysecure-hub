import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/lib': resolve(__dirname, 'src/lib'),
      '@/modules': resolve(__dirname, 'src/modules'),
      '@/config': resolve(__dirname, 'src/config'),
      '@/pages': resolve(__dirname, 'src/pages'),
      '@/integrations': resolve(__dirname, 'src/integrations'),
      '@/assets': resolve(__dirname, 'src/assets')
    }
  },
  css: {
    postcss: "./postcss.config.js"
  }
});