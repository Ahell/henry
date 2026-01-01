import express from "express";
import { loadBulkSnapshot } from "../services/bulkLoadService.js";
import { persistBulkData } from "../services/bulkSaveService.js";

const router = express.Router();

router.get("/load", (req, res) => {
  try {
    res.json(loadBulkSnapshot());
  } catch (error) {
    console.error("Bulk load error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/save", async (req, res) => {
  try {
    await persistBulkData(req.body);
    res.json(loadBulkSnapshot());
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

export default router;
