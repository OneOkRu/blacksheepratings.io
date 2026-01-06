
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Замените 'REPO_NAME' на название вашего репозитория на GitHub, например 'blacksheep-ratings'
export default defineConfig({
  plugins: [react()],
  base: './', // Позволяет сайту работать в любой подпапке (важно для GitHub Pages)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
