const fs = require("node:fs");

const NODE_22 = "/home/initium/.nvm/versions/node/v22.21.1/bin/node";
const appName = process.env.PM2_APP_NAME || "henry";
const appCwd = process.env.PM2_APP_CWD || __dirname;
const runtimeEnvFile =
  process.env.RUNTIME_ENV_FILE || `/home/initium/.config/webapps/${appName}.env`;

function stripWrappingQuotes(value) {
  const text = String(value || "").trim();
  if (
    (text.startsWith("\"") && text.endsWith("\"")) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function loadRuntimeEnv(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = stripWrappingQuotes(trimmed.slice(separator + 1));
      if (!key) continue;
      env[key] = value;
    }
    return env;
  } catch (_error) {
    return {};
  }
}

const runtimeEnv = loadRuntimeEnv(runtimeEnvFile);

function envValue(key, fallback = "") {
  const live = process.env[key];
  if (live !== undefined && live !== "") return live;
  const fromFile = runtimeEnv[key];
  if (fromFile !== undefined && fromFile !== "") return fromFile;
  return fallback;
}

module.exports = {
  apps: [
    {
      name: appName,
      cwd: appCwd,
      script: "server/server.js",
      interpreter: NODE_22,
      env: {
        RUNTIME_ENV_FILE: runtimeEnvFile,
        NODE_ENV: envValue("NODE_ENV", "production"),
        HOST: envValue("HOST", "0.0.0.0"),
        PORT: envValue("PORT", "3002"),
        PUBLIC_BASE_URL: envValue("PUBLIC_BASE_URL", ""),
        VITE_API_BASE_URL: envValue("VITE_API_BASE_URL", ""),
        HENRY_DB_PATH: envValue("HENRY_DB_PATH", ""),
      },
    },
  ],
};
