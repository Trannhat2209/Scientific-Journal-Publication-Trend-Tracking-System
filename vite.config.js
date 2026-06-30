import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  cacheDir: "node_modules/.vite-root",
  server: {
    host: "0.0.0.0",
    port: 5174,
    watch: {
      ignored: [
        "**/ScientificJournalTrendSystem/**",
        "**/scientific-journal-frontend/**",
        "**/dist/**",
      ],
    },
    proxy: {
      "/api": {
        target: "http://localhost:5227",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    entries: ["index.html", "src/main.jsx"],
  },
});
