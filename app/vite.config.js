import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // The contact form posts to /api/enquiry, which is served by the
      // Cloudflare Worker (app/worker/index.js) — not by Vite. Proxying it
      // means `npm run dev` keeps hot reload while the form still works
      // end to end, provided `npm run dev:api` is running alongside.
      //
      // Without both running, submitting the form in dev returns Vite's
      // index.html instead of JSON and fails with a parse error.
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
    },
  },
});
