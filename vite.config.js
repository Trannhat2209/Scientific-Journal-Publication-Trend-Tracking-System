import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  cacheDir: "node_modules/.vite-root",
  server: {
    host: "0.0.0.0",
    port: 5174,
    allowedHosts: true,
    watch: {
      ignored: [
        "**/ScientificJournalTrendSystem/**",
        "**/scientific-journal-frontend/**",
        "**/.codex-run/**",
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
  build: {
    // Three.js is loaded only when the knowledge-graph page mounts.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("three")) return "vendor-three";
          if (id.includes("chart.js") || id.includes("react-chartjs-2")) return "vendor-charts";
          if (id.includes("i18next")) return "vendor-i18n";
          if (id.includes("react")) return "vendor-react";
          return undefined;
        },
      },
    },
  },
});
