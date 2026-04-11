import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('html2canvas') || id.includes('jspdf')) {
            return 'pdf-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 750,
  },
})
