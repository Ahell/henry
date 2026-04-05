import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./router/index.js";
import { loadEnv } from "./config/env.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = loadEnv();
const distDir = env.distDir || path.resolve(__dirname, "../dist");
const distIndex = path.join(distDir, "index.html");
const hasDist = fs.existsSync(distIndex);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "henry", nodeEnv: env.nodeEnv });
});
app.get("/api/runtime", (_req, res) => {
  const databaseExists = fs.existsSync(env.dbPath);
  const databaseSizeBytes = databaseExists ? fs.statSync(env.dbPath).size : 0;
  res.status(200).json({
    status: "ok",
    service: "henry",
    runtime: {
      nodeEnv: env.nodeEnv,
      host: env.host,
      port: env.port,
      publicBaseUrl: env.publicBaseUrl || "",
      apiBaseUrl: env.apiBaseUrl || "",
      runtimeEnvFile: env.runtimeEnvFile || "",
      distDir,
    },
    storage: {
      dbPath: env.dbPath,
      dbExists: databaseExists,
      dbSizeBytes: databaseSizeBytes,
    },
  });
});
app.use("/api", apiRouter);
if (hasDist) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(distIndex);
  });
}

app.listen(env.port, env.host);
