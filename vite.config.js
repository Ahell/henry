import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3002,
    open: true,
    allowedHosts: ["henry.whcg.se"],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          lit: ["lit"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["lit"],
  },
});
