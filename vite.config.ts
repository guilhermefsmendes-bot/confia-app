import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/]react(?:-dom)?[\\/]/, priority: 40 },
            { name: 'firebaseAuth', test: /node_modules[\\/](?:firebase[\\/](?:app|auth)|@firebase[\\/]auth)[\\/]/, priority: 35 },
            { name: 'firebaseFirestore', test: /node_modules[\\/](?:firebase[\\/]firestore|@firebase[\\/]firestore)[\\/]/, priority: 35 },
            { name: 'i18n', test: /node_modules[\\/](?:i18next|react-i18next)[\\/]/, priority: 30 },
            { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/, priority: 25 },
          ],
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
