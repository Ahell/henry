import process from "node:process";
import { loadEnv } from "../server/config/env.js";

const env = loadEnv();
const port = Number.parseInt(String(env.port || "3002"), 10);
const url = `http://127.0.0.1:${port}/api/health`;

try {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    process.stderr.write(`Health check failed: ${response.status} ${response.statusText}\n`);
    process.exit(1);
  }

  process.stdout.write(`Health check passed: ${url}\n`);
} catch (error) {
  process.stderr.write(`Health check failed: ${error.message}\n`);
  process.exit(1);
}
