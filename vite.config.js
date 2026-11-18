import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
 const env = loadEnv(mode, process.cwd(), "");
 return {
  envPrefix: ["VITE_", "PUBLIC_"],
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: false,
    allowedHosts: ["fei.whcg.se", "fei-staging.whcg.se"],
    proxy: {
      "/api": {
        target: env.VITE_API_PROXY_TARGET || `http://127.0.0.1:${env.PORT || 5331}`,
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
 };
});
