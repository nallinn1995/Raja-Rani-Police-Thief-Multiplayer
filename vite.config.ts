import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@babylonjs') || id.includes('node_modules/three/')) {
            return 'vendor-3d';
          }
          if (id.includes('node_modules/tone/') || id.includes('node_modules/howler/')) {
            return 'vendor-audio';
          }
          if (id.includes('framer-motion') || id.includes('canvas-confetti')) {
            return 'vendor-animation';
          }
          if (id.includes('lucide-react') || id.includes('@heroicons')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('react-toastify')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});
