import express from "express";
import {
  computeCourseSlotSpan,
  db,
  ensureSlotDaysForSlot,
  getConsecutiveSlotIds,
  getSortedSlots,
  upsertRunSlots,
} from "../db/index.js";
import {
  deserializeArrayFields,
  normalizeCourseCode,
  normalizeCredits,
} from "../utils/index.js";

const router = express.Router();

router.get("/bulk-load", (req, res) => {
  try {
    const courses = db.prepare("SELECT * FROM courses").all();

    const cohorts = db.prepare("SELECT * FROM cohorts").all();

    const teachers = db.prepare("SELECT * FROM teachers").all();

    const teacherCourses = db
      .prepare("SELECT teacher_id, course_id FROM teacher_course_competency")
      .all();

    const slots = db.prepare("SELECT * FROM slots").all();

    const cohortSlotCoursesRaw = db
      .prepare("SELECT * FROM cohort_slot_courses")
      .all();
    const courseRunSlots = db.prepare("SELECT * FROM course_run_slots").all();
    const slotsByRun = new Map();
    courseRunSlots.forEach((row) => {
      const list = slotsByRun.get(row.run_id) || [];
      list.push(row);
      slotsByRun.set(row.run_id, list);
    });
    const sortedSlots = getSortedSlots();

    const courseSlots = cohortSlotCoursesRaw.map((cs) => {
      const parsed = deserializeArrayFields(cs, ["teachers"]);
      return {
        ...cs,
        teachers: parsed.teachers || [],
        course_slot_id: cs.cohort_slot_course_id,
      };
    });

    const courseRuns = courseSlots.map((cs) => {
      const rawSlots = slotsByRun.get(cs.cohort_slot_course_id) || [];
      const slotIds =
        rawSlots.length > 0
          ? rawSlots
              .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
              .map((r) => r.slot_id)
          : getConsecutiveSlotIds(
              cs.slot_id,
              Number(cs.slot_span) >= 2
                ? Number(cs.slot_span)
                : computeCourseSlotSpan(cs.course_id),
              sortedSlots
            );

      return {
        run_id: cs.cohort_slot_course_id,
        course_id: cs.course_id,
        slot_id: slotIds[0] ?? cs.slot_id,
        slot_ids: slotIds,
        slot_span: slotIds.length || Number(cs.slot_span) || 1,
        cohorts: cs.cohort_id != null ? [cs.cohort_id] : [],
        teachers: cs.teachers || [],
      };
    });

    const unavailability = db
      .prepare("SELECT * FROM teacher_slot_unavailability")
      .all();
    const teacherAvailability = unavailability.map((a) => {
      const slot = slots.find((s) => s.slot_id === a.slot_id);
      return {
        id: a.id,
        teacher_id: a.teacher_id,
        from_date: slot ? slot.start_date : "",
        to_date: slot ? slot.start_date : "",
        slot_id: a.slot_id,
        type: "busy",
      };
    });

    console.log("Bulk load successful:", {
      courses: courses.length,
      cohorts: cohorts.length,
      teachers: teachers.length,
      slots: slots.length,
      courseRuns: courseRuns.length,
      courseRunSlots: courseRunSlots.length,
      teacherAvailability: Object.keys(teacherAvailability).length,
    });

    const slotDays = db.prepare("SELECT * FROM slot_days").all();
    const courseSlotDays = db.prepare("SELECT * FROM course_slot_days").all();
    const teacherDayUnavailability = db
      .prepare("SELECT * FROM teacher_day_unavailability")
      .all();
    let coursePrerequisites = db
      .prepare("SELECT * FROM course_prerequisites")
      .all();

    if (coursePrerequisites.length === 0) {
      coursePrerequisites = [];
      courses.forEach((c) => {
        if (Array.isArray(c.prerequisites)) {
          c.prerequisites.forEach((pid) =>
            coursePrerequisites.push({
              course_id: c.course_id,
              prerequisite_course_id: pid,
            })
          );
        }
      });
    } else {
      const byCourse = new Map();
      coursePrerequisites.forEach((cp) => {
        const list = byCourse.get(cp.course_id) || [];
        list.push(cp.prerequisite_course_id);
        byCourse.set(cp.course_id, list);
      });
      courses.forEach((c) => {
        c.prerequisites = byCourse.get(c.course_id) || [];
      });
    }

    res.json({
      courses,
      cohorts,
      teachers,
      teacherCourses,
      slots,
      courseRuns,
      teacherAvailability,
      courseSlots,
      cohortSlotCourses: courseSlots,
      courseRunSlots,
      slotDays,
      teacherDayUnavailability,
      courseSlotDays,
      coursePrerequisites,
    });
  } catch (error) {
    console.error("Bulk load error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/bulk-save", (req, res) => {
  const {
    courses,
    cohorts,
    teachers,
    slots,
    courseRuns,
    teacherAvailability,
    courseSlots,
    cohortSlotCourses,
    slotDays,
    courseSlotDays,
    coursePrerequisites,
  } = req.body;

  const dedupeCourses = (inputCourses) => {
    const codeMap = new Map();
    const idMapping = new Map();
    const deduped = [];

    (inputCourses || []).forEach((course) => {
      const normalizedCode = normalizeCourseCode(course.code);
      const courseWithNormalized = { ...course, code: normalizedCode };

      const ensureSelfMapping = (c) => {
        if (c.course_id != null && !idMapping.has(c.course_id)) {
          idMapping.set(c.course_id, c.course_id);
        }
      };

      if (!normalizedCode) {
        deduped.push(courseWithNormalized);
        ensureSelfMapping(courseWithNormalized);
        return;
      }

      const existing = codeMap.get(normalizedCode);
      if (!existing) {
        codeMap.set(normalizedCode, courseWithNormalized);
        deduped.push(courseWithNormalized);
        ensureSelfMapping(courseWithNormalized);
        return;
      }

      const keep =
        (existing.course_id ?? Infinity) <=
        (courseWithNormalized.course_id ?? Infinity)
          ? existing
          : courseWithNormalized;
      const drop = keep === existing ? courseWithNormalized : existing;

      if (keep !== existing) {
        codeMap.set(normalizedCode, keep);
        const idx = deduped.indexOf(existing);
        if (idx !== -1) {
          deduped[idx] = keep;
        }
      }

      if (drop.course_id != null && keep.course_id != null) {
        idMapping.set(drop.course_id, keep.course_id);
      }
      ensureSelfMapping(keep);
    });

    return { dedupedCourses: deduped, courseIdMapping: idMapping };
  };

  const { dedupedCourses, courseIdMapping } = dedupeCourses(courses || []);
  const remapCourseId = (id) => {
    if (id == null) return id;
    return courseIdMapping.get(id) ?? id;
  };
  const creditsByCourseId = new Map(
    (dedupedCourses || []).map((c) => [
      remapCourseId(c.course_id),
      normalizeCredits(c.credits),
    ])
  );
  const spanForCourse = (courseId) =>
    creditsByCourseId.get(courseId) === 15 ? 2 : 1;

  const normalizeId = (value) => {
    if (value === null || value === undefined) return value;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  };

  const dedupeSlots = (inputSlots) => {
    const bySignature = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };

    (inputSlots || []).forEach((slot) => {
      const normalized = {
        ...slot,
        slot_id: normalizeId(slot?.slot_id),
        start_date: slot?.start_date ?? "",
        end_date: slot?.end_date ?? "",
      };
      const sig = `${normalized.start_date ?? ""}|${normalized.end_date ?? ""}`;

      const existing = bySignature.get(sig);
      if (!existing) {
        bySignature.set(sig, normalized);
        if (normalized.slot_id != null) {
          idMapping.set(normalized.slot_id, normalized.slot_id);
        }
        return;
      }

      const keep =
        idForCompare(existing.slot_id) <= idForCompare(normalized.slot_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      bySignature.set(sig, keep);

      if (drop.slot_id != null && keep.slot_id != null) {
        idMapping.set(drop.slot_id, keep.slot_id);
      }
      if (keep.slot_id != null && !idMapping.has(keep.slot_id)) {
        idMapping.set(keep.slot_id, keep.slot_id);
      }
    });

    const dedupedSlots = Array.from(bySignature.values()).sort((a, b) => {
      const dateDiff = new Date(a.start_date) - new Date(b.start_date);
      if (dateDiff !== 0) return dateDiff;
      return idForCompare(a.slot_id) - idForCompare(b.slot_id);
    });

    return { dedupedSlots, slotIdMapping: idMapping };
  };

  const { dedupedSlots, slotIdMapping } = dedupeSlots(slots || []);
  const remapSlotId = (id) => {
    if (id == null) return id;
    return slotIdMapping.get(id) ?? id;
  };

  const dedupeTeachers = (inputTeachers) => {
    const byName = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };
    const normalizeName = (name) =>
      (name ?? "").toString().trim().toLowerCase();

    (inputTeachers || []).forEach((teacher) => {
      const normalized = {
        ...teacher,
        teacher_id: normalizeId(teacher?.teacher_id),
        name: teacher?.name ?? "",
      };
      const key = normalizeName(normalized.name);
      const existing = byName.get(key);

      const ensureSelfMapping = (t) => {
        if (t.teacher_id != null && !idMapping.has(t.teacher_id)) {
          idMapping.set(t.teacher_id, t.teacher_id);
        }
      };

      if (!existing) {
        byName.set(key, normalized);
        ensureSelfMapping(normalized);
        return;
      }

      const keep =
        idForCompare(existing.teacher_id) <= idForCompare(normalized.teacher_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      byName.set(key, keep);

      if (drop.teacher_id != null && keep.teacher_id != null) {
        idMapping.set(drop.teacher_id, keep.teacher_id);
      }
      ensureSelfMapping(keep);

      const keepCourses = Array.isArray(keep.compatible_courses)
        ? keep.compatible_courses
        : [];
      const dropCourses = Array.isArray(drop.compatible_courses)
        ? drop.compatible_courses
        : [];
      const mergedCourses = Array.from(
        new Set([...keepCourses, ...dropCourses])
      );
      if (mergedCourses.length > 0) {
        keep.compatible_courses = mergedCourses;
      }
    });

    const deduped = Array.from(byName.values()).sort((a, b) => {
      const nameDiff = normalizeName(a.name).localeCompare(
        normalizeName(b.name)
      );
      if (nameDiff !== 0) return nameDiff;
      return idForCompare(a.teacher_id) - idForCompare(b.teacher_id);
    });

    return { dedupedTeachers: deduped, teacherIdMapping: idMapping };
  };

  const { dedupedTeachers, teacherIdMapping } = dedupeTeachers(teachers || []);
  const remapTeacherId = (id) => {
    if (id == null) return id;
    return teacherIdMapping.get(id) ?? id;
  };

  try {
    const incomingTeacherIds = (dedupedTeachers || []).map((t) => t.teacher_id);
    const incomingCourseIds = (dedupedCourses || []).map((c) =>
      remapCourseId(c.course_id)
    );

    if (!incomingTeacherIds || incomingTeacherIds.length === 0) {
      db.prepare("DELETE FROM teacher_course_competency").run();
    } else {
      const placeholders = incomingTeacherIds.map(() => "?").join(",");
      db.prepare(
        `DELETE FROM teacher_course_competency WHERE teacher_id NOT IN (${placeholders})`
      ).run(...incomingTeacherIds);
    }

    if (!incomingCourseIds || incomingCourseIds.length === 0) {
      db.prepare("DELETE FROM teacher_course_competency").run();
    } else {
      const placeholders = incomingCourseIds.map(() => "?").join(",");
      db.prepare(
        `DELETE FROM teacher_course_competency WHERE course_id NOT IN (${placeholders})`
      ).run(...incomingCourseIds);
    }
  } catch (e) {
    console.warn("Failed to prune teacher_course_competency rows:", e);
  }

  const dedupeCohorts = (inputCohorts) => {
    const byStartDate = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };
    const normalizeStart = (value) => (value ?? "").toString().trim();

    (inputCohorts || []).forEach((cohort) => {
      const normalized = {
        ...cohort,
        cohort_id: normalizeId(cohort?.cohort_id),
        start_date: normalizeStart(cohort?.start_date),
      };
      const key = normalized.start_date;
      const existing = byStartDate.get(key);

      const ensureSelfMapping = (c) => {
        if (c.cohort_id != null && !idMapping.has(c.cohort_id)) {
          idMapping.set(c.cohort_id, c.cohort_id);
        }
      };

      if (!existing) {
        byStartDate.set(key, normalized);
        ensureSelfMapping(normalized);
        return;
      }

      const keep =
        idForCompare(existing.cohort_id) <= idForCompare(normalized.cohort_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      byStartDate.set(key, keep);

      if (drop.cohort_id != null && keep.cohort_id != null) {
        idMapping.set(drop.cohort_id, keep.cohort_id);
      }
      ensureSelfMapping(keep);
    });

    const deduped = Array.from(byStartDate.values()).sort((a, b) => {
      const dateDiff = new Date(a.start_date) - new Date(b.start_date);
      if (dateDiff !== 0) return dateDiff;
      return idForCompare(a.cohort_id) - idForCompare(b.cohort_id);
    });

    deduped.forEach((c, idx) => {
      c.name = `Kull ${idx + 1}`;
    });

    return { dedupedCohorts: deduped, cohortIdMapping: idMapping };
  };

  const { dedupedCohorts, cohortIdMapping } = dedupeCohorts(cohorts || []);
  const remapCohortId = (id) => {
    if (id == null) return id;
    return cohortIdMapping.get(id) ?? id;
  };

  const dedupeCourseSlots = (inputCourseSlots) => {
    const keepByKey = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };

    (inputCourseSlots || []).forEach((cs) => {
      const id = normalizeId(
        cs.cohort_slot_course_id ?? cs.course_slot_id ?? null
      );
      const normalized = {
        ...cs,
        course_id: normalizeId(remapCourseId(cs.course_id)),
        slot_id: normalizeId(remapSlotId(cs.slot_id)),
        cohort_id: normalizeId(remapCohortId(cs.cohort_id ?? null)),
        slot_span:
          Number(cs.slot_span) >= 2
            ? Number(cs.slot_span)
            : spanForCourse(normalizeId(remapCourseId(cs.course_id))),
        teachers: Array.isArray(cs.teachers)
          ? Array.from(
              new Set(
                cs.teachers
                  .map((tid) => remapTeacherId(tid))
                  .filter((tid) => tid !== null && tid !== undefined)
              )
            )
          : [],
        cohort_slot_course_id: id,
      };
      const key = `${normalized.course_id}|${normalized.slot_id}|${
        normalized.cohort_id ?? ""
      }`;
      const existing = keepByKey.get(key);

      if (!existing) {
        keepByKey.set(key, normalized);
        if (id != null) {
          idMapping.set(id, id);
        }
        return;
      }

      const keep =
        idForCompare(existing.cohort_slot_course_id) <=
        idForCompare(normalized.cohort_slot_course_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      keepByKey.set(key, keep);

      if (
        drop.cohort_slot_course_id != null &&
        keep.cohort_slot_course_id != null
      ) {
        idMapping.set(drop.cohort_slot_course_id, keep.cohort_slot_course_id);
      }

      const keepTeachers = Array.isArray(keep.teachers) ? keep.teachers : [];
      const dropTeachers = Array.isArray(drop.teachers) ? drop.teachers : [];
      const mergedTeachers = Array.from(
        new Set([...keepTeachers, ...dropTeachers])
      );
      keep.teachers = mergedTeachers;
    });

    keepByKey.forEach((cs) => {
      if (
        cs.cohort_slot_course_id != null &&
        !idMapping.has(cs.cohort_slot_course_id)
      ) {
        idMapping.set(cs.cohort_slot_course_id, cs.cohort_slot_course_id);
      }
    });

    return {
      dedupedCourseSlots: Array.from(keepByKey.values()).map((cs) => ({
        ...cs,
        course_slot_id: cs.cohort_slot_course_id,
      })),
      courseSlotIdMapping: idMapping,
    };
  };

  const courseSlotsDerivedFromRuns =
    !cohortSlotCourses && !courseSlots && Array.isArray(courseRuns)
      ? courseRuns.flatMap((r) => {
          const cohortsArr =
            Array.isArray(r.cohorts) && r.cohorts.length > 0
              ? r.cohorts
              : [null];
          const runSpan =
            Number(r.slot_span) >= 2
              ? Number(r.slot_span)
              : Array.isArray(r.slot_ids) && r.slot_ids.length > 1
              ? r.slot_ids.length
              : spanForCourse(remapCourseId(r.course_id));
          return cohortsArr.map((cohortId) => ({
            course_id: r.course_id,
            slot_id: r.slot_id,
            cohort_id: cohortId,
            teachers: Array.isArray(r.teachers) ? r.teachers : [],
            slot_span: runSpan,
          }));
        })
      : null;

  const courseSlotsInput =
    cohortSlotCourses ?? courseSlots ?? courseSlotsDerivedFromRuns;
  const { dedupedCourseSlots, courseSlotIdMapping } = dedupeCourseSlots(
    courseSlotsInput || []
  );
  const remapCourseSlotId = (id) => {
    if (id == null) return id;
    return courseSlotIdMapping.get(id) ?? id;
  };

  const courseRunSlotsInput = Array.isArray(req.body.courseRunSlots)
    ? req.body.courseRunSlots
    : [];
  const runSlotOverrides = new Map();
  courseRunSlotsInput.forEach((rs) => {
    if (rs.run_id == null || rs.slot_id == null) return;
    const list = runSlotOverrides.get(rs.run_id) || [];
    list.push(remapSlotId(rs.slot_id));
    runSlotOverrides.set(rs.run_id, list);
  });

  const orderedSlotsForSpan = (dedupedSlots || [])
    .map((s) => ({
      slot_id: s.slot_id,
      start_date: s.start_date,
    }))
    .sort(
      (a, b) =>
        new Date(a.start_date) - new Date(b.start_date) ||
        Number(a.slot_id) - Number(b.slot_id)
    );
  const computeSlotIdsForRun = (primarySlotId, span, runId) => {
    const overrides = runSlotOverrides.get(runId);
    if (overrides && overrides.length > 0) {
      return Array.from(
        new Set(
          overrides
            .filter((sid) => sid !== null && sid !== undefined)
            .map((sid) => remapSlotId(sid))
            .filter((sid) => sid !== null && sid !== undefined)
        )
      );
    }
    return getConsecutiveSlotIds(
      remapSlotId(primarySlotId),
      span,
      orderedSlotsForSpan
    );
  };

  const courseRunSlotsRows = [];
  (dedupedCourseSlots || []).forEach((cs) => {
    if (cs.cohort_slot_course_id == null) return;
    const spanRaw = Number(cs.slot_span);
    const span =
      Number.isFinite(spanRaw) && spanRaw >= 2
        ? spanRaw
        : spanForCourse(cs.course_id);
    const primarySlotId = remapSlotId(cs.slot_id);
    if (primarySlotId == null) return;
    const slotIds = computeSlotIdsForRun(
      primarySlotId,
      span,
      cs.cohort_slot_course_id
    );
    slotIds
      .filter((slotId) => slotId !== null && slotId !== undefined)
      .forEach((slotId, idx) =>
        courseRunSlotsRows.push({
          run_id: cs.cohort_slot_course_id,
          slot_id: slotId,
          sequence: idx + 1,
        })
      );
  });

  console.log("Bulk save received:", {
    courses: dedupedCourses?.length,
    cohorts: dedupedCohorts?.length,
    teachers: dedupedTeachers?.length,
    slots: dedupedSlots?.length,
    courseRuns: courseRuns?.length,
    teacherAvailability: Array.isArray(teacherAvailability)
      ? teacherAvailability.length
      : Object.keys(teacherAvailability || {}).length,
  });

  try {
    db.prepare("DELETE FROM courses").run();
    db.prepare("DELETE FROM cohorts").run();
    db.prepare("DELETE FROM teachers").run();
    db.prepare("DELETE FROM teacher_courses_staff").run();
    db.prepare("DELETE FROM slots").run();
    db.prepare("DELETE FROM teacher_slot_unavailability").run();
    db.prepare("DELETE FROM teacher_day_unavailability").run();
    db.prepare("DELETE FROM cohort_slot_courses").run();
    db.prepare("DELETE FROM course_run_slots").run();
    db.prepare("DELETE FROM slot_days").run();
    db.prepare("DELETE FROM course_slot_days").run();
    db.prepare("DELETE FROM course_prerequisites").run();

    if (dedupedCourses && dedupedCourses.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO courses (course_id, name, code, credits, created_at) VALUES (?, ?, ?, ?, ?)"
      );
      dedupedCourses.forEach((c) => {
        stmt.run(
          c.course_id,
          c.name,
          normalizeCourseCode(c.code),
          normalizeCredits(c.credits),
          c.created_at || new Date().toISOString()
        );
      });
    }

    const prereqRows = Array.isArray(coursePrerequisites)
      ? coursePrerequisites
      : [];
    if (!coursePrerequisites && dedupedCourses.length > 0) {
      dedupedCourses.forEach((c) => {
        (c.prerequisites || []).forEach((pid) => {
          prereqRows.push({
            course_id: remapCourseId(c.course_id),
            prerequisite_course_id: remapCourseId(pid),
          });
        });
      });
    }
    if (prereqRows.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO course_prerequisites (course_id, prerequisite_course_id) VALUES (?, ?)"
      );
      prereqRows.forEach((cp) => {
        stmt.run(
          remapCourseId(cp.course_id),
          remapCourseId(cp.prerequisite_course_id)
        );
      });
    }

    if (dedupedCohorts && dedupedCohorts.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO cohorts (cohort_id, name, start_date, planned_size) VALUES (?, ?, ?, ?)"
      );
      dedupedCohorts.forEach((c) => {
        stmt.run(c.cohort_id, c.name, c.start_date, c.planned_size);
      });
    }

    if (dedupedTeachers && dedupedTeachers.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO teachers (teacher_id, name, home_department, created_at) VALUES (?, ?, ?, ?)"
      );
      dedupedTeachers.forEach((t) => {
        stmt.run(
          t.teacher_id,
          t.name,
          t.home_department,
          t.created_at || new Date().toISOString()
        );
      });
    }

    const teacherCoursesPayload = req.body.teacherCourses;
    const teacherCoursesToInsert = Array.isArray(teacherCoursesPayload)
      ? teacherCoursesPayload.map((tc) => ({
          teacher_id: remapTeacherId(tc.teacher_id),
          course_id: remapCourseId(tc.course_id),
        }))
      : [];
    if (!teacherCoursesPayload && Array.isArray(dedupedTeachers)) {
      dedupedTeachers.forEach((t) => {
        (t.compatible_courses || []).forEach((cid) => {
          teacherCoursesToInsert.push({
            teacher_id: remapTeacherId(t.teacher_id),
            course_id: remapCourseId(cid),
          });
        });
      });
    }
    if (teacherCoursesToInsert.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO teacher_course_competency (teacher_id, course_id) VALUES (?, ?)"
      );
      teacherCoursesToInsert.forEach((tc) => {
        stmt.run(tc.teacher_id, tc.course_id);
      });
    }

    if (dedupedSlots && dedupedSlots.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO slots (slot_id, start_date, end_date) VALUES (?, ?, ?)"
      );
      dedupedSlots.forEach((s) => {
        stmt.run(s.slot_id, s.start_date, s.end_date);
      });
      dedupedSlots.forEach((s) => {
        try {
          ensureSlotDaysForSlot(s);
        } catch (e) {
          console.warn(`Failed to ensure slot_days for slot ${s.slot_id}:`, e);
        }
      });
    }

    if (slotDays) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO slot_days (slot_day_id, slot_id, date) VALUES (?, ?, ?)"
      );
      slotDays.forEach((sd) => {
        stmt.run(sd.slot_day_id || null, remapSlotId(sd.slot_id), sd.date);
      });
    }

    if (teacherAvailability) {
      const insertStmt = db.prepare(
        "INSERT OR IGNORE INTO teacher_slot_unavailability (id, teacher_id, slot_id, created_at) VALUES (?, ?, ?, ?)"
      );
      const deleteStmt = db.prepare(
        "DELETE FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
      );

      const insertDayStmt = db.prepare(
        "INSERT OR IGNORE INTO teacher_day_unavailability (id, teacher_id, slot_day_id, created_at) VALUES (?, ?, ?, ?)"
      );
      const deleteDayStmt = db.prepare(
        "DELETE FROM teacher_day_unavailability WHERE teacher_id = ? AND slot_day_id = ?"
      );

      if (Array.isArray(teacherAvailability)) {
        teacherAvailability.forEach((a) => {
          if (a.slot_id) {
            if (a.type === "busy") {
              insertStmt.run(
                a.id || null,
                remapTeacherId(a.teacher_id),
                remapSlotId(a.slot_id),
                a.created_at || new Date().toISOString()
              );
            } else {
              deleteStmt.run(
                remapTeacherId(a.teacher_id),
                remapSlotId(a.slot_id)
              );
            }
          } else if (a.from_date) {
            const startStr = (a.from_date || "").split("T")[0];
            const endStr = (a.to_date || a.from_date || "").split("T")[0];
            if (!startStr) return;

            const slot = dedupedSlots?.find((s) => s.start_date === startStr);
            const isFullSlotRange = slot && endStr && slot.end_date === endStr;

            if (a.slot_id || isFullSlotRange) {
              console.log(
                `teacherAvailability: treating as slot-level for teacher ${
                  a.teacher_id
                } (${startStr} - ${endStr}), slot_id=${
                  slot ? slot.slot_id : a.slot_id
                }, slotRangeMatch=${isFullSlotRange}`
              );
              if (a.type === "busy") {
                insertStmt.run(
                  a.id || null,
                  remapTeacherId(a.teacher_id),
                  slot ? slot.slot_id : remapSlotId(a.slot_id),
                  a.created_at || new Date().toISOString()
                );
              } else {
                deleteStmt.run(
                  remapTeacherId(a.teacher_id),
                  slot ? slot.slot_id : remapSlotId(a.slot_id)
                );
              }
            } else {
              const dayRows = db
                .prepare(
                  "SELECT slot_day_id, date FROM slot_days WHERE date >= ? AND date <= ?"
                )
                .all(startStr, endStr || startStr);

              if (dayRows && dayRows.length > 0) {
                dayRows.forEach((dr) => {
                  if (a.type === "busy") {
                    insertDayStmt.run(
                      a.id || null,
                      remapTeacherId(a.teacher_id),
                      dr.slot_day_id,
                      a.created_at || new Date().toISOString()
                    );
                  } else {
                    deleteDayStmt.run(
                      remapTeacherId(a.teacher_id),
                      dr.slot_day_id
                    );
                  }
                });
              } else {
                console.warn(
                  `No slot_days found for teacher day unavailability ${startStr} - ${endStr}`
                );
              }
            }
          }
        });
      } else {
        Object.entries(teacherAvailability).forEach(([key, available]) => {
          const [teacher_id, slot_id] = key.split("-").map(Number);
          if (available) {
            deleteStmt.run(remapTeacherId(teacher_id), remapSlotId(slot_id));
          } else {
            insertStmt.run(
              null,
              remapTeacherId(teacher_id),
              remapSlotId(slot_id),
              new Date().toISOString()
            );
          }
        });
      }
    }

    if (dedupedCourseSlots && dedupedCourseSlots.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO cohort_slot_courses (cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, slot_span, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      dedupedCourseSlots.forEach((cs) => {
        stmt.run(
          cs.cohort_slot_course_id || null,
          cs.course_id,
          cs.slot_id,
          cs.cohort_id ?? null,
          JSON.stringify(cs.teachers || []),
          Number(cs.slot_span) >= 2
            ? Number(cs.slot_span)
            : spanForCourse(cs.course_id),
          cs.created_at || new Date().toISOString()
        );
      });
    }

    if (courseSlotDays) {
      const stmt = db.prepare(
        "INSERT INTO course_slot_days (course_slot_day_id, course_slot_id, date, is_default, active) VALUES (?, ?, ?, ?, ?)"
      );
      courseSlotDays.forEach((csd) => {
        const courseSlotId =
          csd.cohort_slot_course_id ?? csd.course_slot_id ?? null;
        stmt.run(
          csd.course_slot_day_id || null,
          remapCourseSlotId(courseSlotId),
          csd.date,
          csd.is_default ? 1 : 0,
          csd.active === 0 ? 0 : 1
        );
      });
    }

    if (courseRunSlotsRows.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)"
      );
      courseRunSlotsRows.forEach((rs) => {
        stmt.run(rs.run_id, rs.slot_id, rs.sequence || 1);
      });
    }

    console.log("Bulk save completed successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

export default router;
