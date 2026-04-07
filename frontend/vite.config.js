import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Ensures all asset paths in index.html start with / instead of being relative.
  // This is the most common fix for White Screens on App Platform.
  base: '/', 

  build: {
    // This ensures your build matches the "Output Directory: dist" in DO
    outDir: 'dist',
    // Generates a manifest file which helps with debugging asset loading
    manifest: true,
  },

  server: {
    // This only affects your local 'npm run dev', not the DO build
    port: 5173,
    strictPort: true,
  }
})
