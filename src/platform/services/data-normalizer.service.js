// Data Normalizer Service - Handles data transformation and normalization
const DEFAULT_SLOT_LENGTH_DAYS = 28;

export class DataNormalizer {
  normalizeDateOnly(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  }

  defaultSlotEndDate(startDate) {
    const start =
      startDate instanceof Date ? new Date(startDate) : new Date(startDate);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setDate(end.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
    return end;
  }

  normalizeCourses(rawCourses) {
    if (!Array.isArray(rawCourses)) return [];

    const courses = (rawCourses || []).map((c, idx) => {
      const courseId =
        c?.course_id != null && Number.isFinite(Number(c.course_id))
          ? Number(c.course_id)
          : idx + 1;
      const creditsValueRaw = Number.isFinite(Number(c?.credits ?? c?.hp))
        ? Number(c.credits ?? c.hp)
        : 7.5;
      const creditsValue = creditsValueRaw === 15 ? 15 : 7.5;
      return {
        course_id: courseId,
        code: c?.code || "",
        name: c?.name || "",
        credits: creditsValue,
        prerequisites: Array.isArray(c?.prerequisites)
          ? [...c.prerequisites]
          : [],
      };
    });

    const codeToId = new Map();
    courses.forEach((c) => {
      if (c.code) {
        codeToId.set(c.code, c.course_id);
      }
    });

    rawCourses.forEach((raw, idx) => {
      if (Array.isArray(raw?.prerequisite_codes)) {
        const target = courses[idx];
        target.prerequisites = raw.prerequisite_codes
          .map((code) => codeToId.get(code))
          .filter((id) => id != null);
      }
    });

    return courses;
  }

  getSlotRange(slot) {
    if (!slot) return null;
    const startStr = this.normalizeDateOnly(slot.start_date);
    if (!startStr) return null;
    const endStr =
      this.normalizeDateOnly(slot.end_date) ||
      this.normalizeDateOnly(this.defaultSlotEndDate(startStr));
    if (!endStr) return null;
    return {
      start: new Date(startStr),
      end: new Date(endStr),
      startStr,
      endStr,
    };
  }
}
