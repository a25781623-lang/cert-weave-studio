// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs/dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // CRITICAL FIX: Forces relative paths for all assets to work with HashRouter on static hosts
  // THIS MUST BE FOLLOWED BY A COMMA (,)
  base: './', 
  
  plugins: [react()],
  envDir: './backend',
  envPrefix: 'VITE_',
  
  // This alias section is now correctly in place.
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      crypto: "crypto-browserify",
    },
  },
}));