import express from "express";
import { db } from "../db/index.js";
import { seedData } from "../data/seedData.js";

const router = express.Router();

const getResetBusinessLogic = () => {
  const base = seedData?.businessLogic;
  const rulesRaw = base?.scheduling?.rules;
  const rules = Array.isArray(rulesRaw) ? rulesRaw : [];

  const normalizedRules = rules
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
      rules: normalizedRules,
    },
  };
};

const clearAllTables = () => {
  db.transaction(() => {
    // Delete all data in correct order to handle foreign key constraints
    db.prepare("DELETE FROM course_run_days").run();
    db.prepare("DELETE FROM course_run_teachers").run();
    db.prepare("DELETE FROM course_run_cohorts").run();
    db.prepare("DELETE FROM course_run_slots").run();
    db.prepare("DELETE FROM teacher_day_unavailability").run();
    db.prepare("DELETE FROM teacher_slot_unavailability").run();
    db.prepare("DELETE FROM course_slot_days").run();
    db.prepare("DELETE FROM slot_days").run();
    db.prepare("DELETE FROM cohort_slot_courses").run();
    db.prepare("DELETE FROM teacher_course_competency").run();
    db.prepare("DELETE FROM teacher_courses_staff").run();
    db.prepare("DELETE FROM course_examinators").run();
    db.prepare("DELETE FROM course_prerequisites").run();
    db.prepare("DELETE FROM slots").run();
    db.prepare("DELETE FROM cohorts").run();
    db.prepare("DELETE FROM teachers").run();
    db.prepare("DELETE FROM courses").run();
    db.prepare("DELETE FROM app_settings").run();
  })();
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

    console.log("Admin: reset all database tables");
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

    console.log("Admin: seeded database with test data");
    res.json({ success: true, message: "Seed data loaded" });
  } catch (error) {
    console.error("Failed to load seed data:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
