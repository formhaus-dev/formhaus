import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: { loadPaths: ['node_modules/@uswds/uswds/packages'] },
    },
  },
});
