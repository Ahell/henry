import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  loadRuntimeConfig,
  resolveRuntimeEnvFile,
} from "../config/runtime-config.js";
import { loadEnv } from "../config/env.js";

test("runtime config resolves external runtime env file and db path", async () => {
  const previousCwd = process.cwd();
  const previousEnv = { ...process.env };
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "henry-runtime-"));
  const runtimeEnvFile = path.join(root, "runtime", "henry.env");

  await fs.mkdir(path.dirname(runtimeEnvFile), { recursive: true });
  await fs.writeFile(
    runtimeEnvFile,
    [
      "NODE_ENV=production",
      "HOST=0.0.0.0",
      "PORT=3002",
      "PUBLIC_BASE_URL=https://hej.whcg.se",
      "VITE_API_BASE_URL=",
      "HENRY_DB_PATH=/tmp/henry-test.db",
    ].join("\n"),
    "utf8"
  );

  process.chdir(root);
  process.env = {
    ...previousEnv,
    RUNTIME_ENV_FILE: runtimeEnvFile,
  };

  try {
    const config = loadRuntimeConfig();
    const env = loadEnv();

    assert.equal(resolveRuntimeEnvFile(), runtimeEnvFile);
    assert.equal(config.runtimeEnvFile, runtimeEnvFile);
    assert.equal(config.publicBaseUrl, "https://hej.whcg.se");
    assert.equal(config.port, 3002);
    assert.equal(config.dbPath, "/tmp/henry-test.db");
    assert.equal(env.distDir, path.resolve(root, "dist"));
  } finally {
    process.chdir(previousCwd);
    process.env = previousEnv;
  }
});
