import { defineConfig } from 'vite';

// relative base so the build works at the domain root AND under a
// sub-path (GitHub Pages project sites)
export default defineConfig({
  base: './',
});
