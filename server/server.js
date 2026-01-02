import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./router/index.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const distIndex = path.join(distDir, "index.html");
const hasDist = fs.existsSync(distIndex);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api", apiRouter);
if (hasDist) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(distIndex);
  });
}

const HOST = process.env.HOST || "127.0.0.1";
const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST);
