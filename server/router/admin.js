import express from "express";
import { db } from "../db/index.js";
import { seedData } from "../data/seedData.js";
import { seedBusinessLogic } from "../data/seedBusinessLogic.js";

const router = express.Router();

const getResetBusinessLogic = () => {
  const base = seedBusinessLogic;
  const rulesRaw = base?.scheduling?.rules;
  const rules = Array.isArray(rulesRaw) ? rulesRaw : [];

  const resetRules = rules
    .map((r) => ({
      ...r,
      enabled: false,
      kind: "soft",
    }))
    .sort((a, b) =>
      String(a?.label || a?.id || "").localeCompare(
        String(b?.label || b?.id || ""),
        "sv",
        { sensitivity: "base" }
      )
    );

  return {
    version: Number(base?.version) || 1,
    scheduling: {
      params: {
        maxStudentsHard:
          Number(base?.scheduling?.params?.maxStudentsHard) || 130,
        maxStudentsPreferred:
          Number(base?.scheduling?.params?.maxStudentsPreferred) || 100,
      },
      rules: resetRules,
    },
  };
};

const clearAllTables = () => {
  // Disable foreign key constraints outside the transaction so it's applied.
  db.pragma("foreign_keys = OFF");

  db.transaction(() => {
    // Get all table names from the database
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all();

    // Delete from all tables
    for (const table of tables) {
      db.prepare(`DELETE FROM "${table.name}"`).run();
    }
  })();

  // Re-enable foreign key constraints
  db.pragma("foreign_keys = ON");
};

router.post("/reset-all", (req, res) => {
  try {
    clearAllTables();

    // Keep app settings seeded even after reset so the UI has a known default state.
    db.prepare(
      `
      INSERT INTO app_settings (key, value)
      VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `
    ).run({
      key: "business_logic",
      value: JSON.stringify(getResetBusinessLogic()),
    });

    res.json({ success: true, message: "All database tables cleared" });
  } catch (error) {
    console.error("Failed to reset database:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/load-test-data", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const response = await fetch(`${baseUrl}/api/bulk/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seedData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Bulk save failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    await response.json();

    res.json({ success: true, message: "Seed data loaded" });
  } catch (error) {
    console.error("Failed to load seed data:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
