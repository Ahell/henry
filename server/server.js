import express from "express";
import cors from "cors";
import apiRouter from "./router/index.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api", apiRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
