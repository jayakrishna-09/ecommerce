import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  css: {
    modules:{
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        // additionalData: `@import "./src/styles/global.scss";`,
      },
    },
  },
});
