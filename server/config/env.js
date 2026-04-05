import path from "node:path";
import { loadRuntimeConfig } from "./runtime-config.js";

export function loadEnv() {
  const runtime = loadRuntimeConfig();
  return {
    ...runtime,
    distDir: path.resolve(process.cwd(), "dist"),
  };
}
