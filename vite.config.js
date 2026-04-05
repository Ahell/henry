import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "PUBLIC_"],
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: false,
    allowedHosts: ["henry.whcg.se"],
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3001",
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
