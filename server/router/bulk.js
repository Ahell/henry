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
    if (
      req.body &&
      req.body._delta === true &&
      Array.isArray(req.body.changed) &&
      req.body.changed.length === 0
    ) {
      res.json({ _delta: true, changed: [] });
      return;
    }
    const before = loadBulkSnapshot();
    await persistBulkData(req.body);
    const after = loadBulkSnapshot();
    const { changed, data } = diffSnapshot(before, after);
    res.json({ _delta: true, changed, ...data });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

function diffSnapshot(before = {}, after = {}) {
  const changed = [];
  const data = {};
  const keys = Object.keys(after || {});
  keys.forEach((key) => {
    if (!deepEqual(before?.[key], after?.[key])) {
      changed.push(key);
      data[key] = after[key];
    }
  });
  return { changed, data };
}

function deepEqual(a, b) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    return false;
  }
}

export default router;
