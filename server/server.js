import express from "express";
import { mountAuth } from "./auth/accounts.js";
import { openAccounts } from "./auth/store.js";
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

const accounts = openAccounts(env.authDbPath);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' });
  if (req.hostname === 'hej.whcg.se' && env.publicBaseUrl === 'https://fei.whcg.se') return res.redirect(308, env.publicBaseUrl + req.originalUrl);
  const hosts = ['127.0.0.1', 'localhost', '[::1]', ...(env.publicBaseUrl ? [new URL(env.publicBaseUrl).hostname] : [])];
  if (!hosts.includes(req.hostname)) return res.status(403).json({ error: 'Webbadressen är inte tillåten.' });
  const origins = [env.publicBaseUrl, `http://127.0.0.1:${env.port}`, `http://localhost:${env.port}`];
  if (env.nodeEnv !== 'production') origins.push('http://localhost:5173', 'http://127.0.0.1:5173');
  if (req.get('origin') && !origins.includes(req.get('origin'))) return res.status(403).json({ error: 'Webbursprunget är inte tillåtet.' });
  next();
});
app.use("/api/auth", express.json({ limit: "16kb" }));
app.use(express.json({ limit: "50mb" }));
mountAuth(app, accounts, env);
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
app.use(['/api/admin/reset-all', '/api/admin/load-test-data'], (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administratörsbehörighet krävs.' });
  next();
});
app.use("/api", apiRouter);
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Ett serverfel uppstod.' });
});
if (hasDist) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(distIndex);
  });
}

const server = app.listen(env.port, env.host);
async function close() {
  server.close();
  server.closeAllConnections();
  accounts.close();
  const { db } = await import('./db/index.js');
  db.close();
}
process.once('SIGTERM', close);
process.once('SIGINT', close);
