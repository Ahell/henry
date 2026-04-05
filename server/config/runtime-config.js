import fs from "node:fs";
import path from "node:path";

const DEFAULT_RUNTIME_ENV_FILE = ".env";
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3002;
const MANAGED_ENV_KEYS = [
  "RUNTIME_ENV_FILE",
  "NODE_ENV",
  "HOST",
  "PORT",
  "PUBLIC_BASE_URL",
  "VITE_API_BASE_URL",
  "HENRY_DB_PATH",
];

function normalizeValue(value) {
  return String(value || "").trim();
}

function stripWrappingQuotes(value) {
  const text = normalizeValue(value);
  if (
    (text.startsWith("\"") && text.endsWith("\"")) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function parsePort(value, fallback = DEFAULT_PORT) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function resolveRuntimeEnvFile(rawValue = process.env.RUNTIME_ENV_FILE || DEFAULT_RUNTIME_ENV_FILE) {
  const trimmed = normalizeValue(rawValue);
  return path.resolve(process.cwd(), trimmed || DEFAULT_RUNTIME_ENV_FILE);
}

export function parseDotEnvFile(content) {
  return String(content || "")
    .split(/\r?\n/)
    .reduce((accumulator, line) => {
      const trimmed = String(line || "").trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return accumulator;
      }

      const separator = trimmed.indexOf("=");
      if (separator <= 0) {
        return accumulator;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = stripWrappingQuotes(trimmed.slice(separator + 1));
      if (!key) {
        return accumulator;
      }

      accumulator[key] = value;
      return accumulator;
    }, {});
}

export function loadRuntimeEnvFile(filePath = resolveRuntimeEnvFile()) {
  try {
    return parseDotEnvFile(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function resolveDbPath(rawPath) {
  const trimmed = normalizeValue(rawPath);
  if (!trimmed) {
    return path.resolve(process.cwd(), "henry.db");
  }

  return path.isAbsolute(trimmed)
    ? trimmed
    : path.resolve(process.cwd(), trimmed);
}

export function loadRuntimeConfig() {
  const runtimeEnvFile = resolveRuntimeEnvFile();
  const fileEnv = loadRuntimeEnvFile(runtimeEnvFile);
  const merged = {
    ...fileEnv,
    ...Object.fromEntries(
      MANAGED_ENV_KEYS.map((key) => [key, normalizeValue(process.env[key]) || fileEnv[key] || ""])
    ),
  };

  const publicBaseUrl = normalizeValue(merged.PUBLIC_BASE_URL);
  const apiBaseUrl = normalizeValue(merged.VITE_API_BASE_URL);
  const dbPath = resolveDbPath(merged.HENRY_DB_PATH);

  return {
    runtimeEnvFile,
    nodeEnv: normalizeValue(merged.NODE_ENV) || "production",
    host: normalizeValue(merged.HOST) || DEFAULT_HOST,
    port: parsePort(merged.PORT, DEFAULT_PORT),
    publicBaseUrl,
    apiBaseUrl,
    dbPath,
  };
}
