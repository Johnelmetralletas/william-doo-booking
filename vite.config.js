import { defineConfig } from 'vite';

// Plain static site — index.html at the root is the entry point and pulls in
// /src/main.js. No framework plugins needed.
export default defineConfig({
  root: '.',
  // Relative asset paths so the build works when opened directly as a file,
  // served from a sub-path, or hosted at a domain root (Netlify, etc.).
  base: './',
  server: {
    // Honour a PORT assigned by the harness/preview manager; fall back to 5173.
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
