import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // This loads variables from your .env or DigitalOcean settings
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // Ensures assets like index-xxxxx.js are looked for at the root domain
    base: '/', 
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
    },
  }
})
