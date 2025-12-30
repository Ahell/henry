import express from "express";
import cors from "cors";
import apiRouter from "./router/index.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api", apiRouter);

const HOST = process.env.HOST || "127.0.0.1";
const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
});
