/**
 * Seed data for Henry Course Planner
 * Contains all courses, cohorts, teachers, slots, and historical course runs
 */

const SLOT_LENGTH_DAYS = 28;

function computeSlotEndDate(startDate, lengthDays = SLOT_LENGTH_DAYS) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  if (!match) {
    throw new Error(`seedData: ogiltigt start_date "${startDate}"`);
  }
  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  );
  date.setUTCDate(date.getUTCDate() + Math.max(0, Number(lengthDays) - 1));
  return date.toISOString().slice(0, 10);
}

const SLOT_START_DATES = [
  "2024-06-10",
  "2024-09-09",
  "2024-10-07",
  "2025-01-13",
  "2025-02-10",
  "2025-03-10",
  "2025-04-07",
  "2025-05-05",
  "2025-06-02",
  "2025-08-18",
  "2025-10-13",
  "2025-11-10",
  "2026-02-16",
  "2026-03-16",
  "2026-04-13",
  "2026-05-11",
  "2026-06-08",
  "2026-08-17",
  "2026-09-14",
  "2026-10-12",
  "2026-11-09",
  "2026-12-07",
  "2027-01-25",
  "2027-02-22",
  "2027-03-22",
  "2027-04-19",
  "2027-05-17",
  "2027-06-14",
  "2027-08-09",
  "2027-09-06",
  "2027-10-04",
];

const seedDataRaw = {
  // All 14 courses
  courses: [
    {
      code: "AI180U",
      name: "Juridisk översiktskurs",
      credits: 15.0,
      prerequisite_codes: [], // No prerequisites
    },
    {
      code: "AI188U",
      name: "Marknadsanalys och marknadsföring för fastighetsmäklare",
      credits: 7.5,
    },
    {
      code: "AI183U",
      name: "Husbyggnadsteknik",
      credits: 7.5,
    },
    {
      code: "AI184U",
      name: "Fastighetsförmedling introduktion",
      credits: 15.0,
    },
    {
      code: "AI190U",
      name: "Fastighetsvärdering för fastighetsmäklare",
      credits: 7.5,
    },
    {
      code: "AI192U",
      name: "Allmän fastighetsrätt för fastighetsförmedlare",
      credits: 7.5,
      prerequisite_codes: ["AI180U"], // Requires JÖK
    },
    {
      code: "AI191U",
      name: "Bostadsrätt för fastighetsmäklare",
      credits: 7.5,
    },
    {
      code: "AI181U",
      name: "Extern redovisning för fastighetsmäklare",
      credits: 7.5,
    },
    {
      code: "AI185U",
      name: "Ekonomistyrning för fastighetsmäklare",
      credits: 7.5,
    },
    {
      code: "AI186U",
      name: "Beskattningsrätt för fastighetsmäklare",
      credits: 7.5,
    },
    {
      code: "AI182U",
      name: "Speciell fastighetsrätt för fastighetsförmedlare",
      credits: 7.5,
      prerequisite_codes: ["AI192U"], // Requires Allmän fastighetsrätt (which requires JÖK)
    },
    {
      code: "AI189U",
      name: "Fastighetsförmedling - kvalificerad fastighetsmäklarjuridik",
      credits: 7.5,
    },
    {
      code: "AI187U",
      name: "Arbetsmarknad och företagande för fastighetsmäklare",
      credits: 7.5,
    },
    {
      code: "AI181U_KOMM",
      name: "Fastighetsförmedling - kommunikation",
      credits: 7.5,
    },
  ],

  // 10 cohorts
  cohorts: [
    { name: "Kull 1", start_date: "2024-06-05", planned_size: 30 },
    { name: "Kull 2", start_date: "2024-09-06", planned_size: 28 },
    { name: "Kull 3", start_date: "2024-10-03", planned_size: 32 },
    { name: "Kull 4", start_date: "2024-10-30", planned_size: 25 },
    { name: "Kull 5", start_date: "2025-01-08", planned_size: 29 },
    { name: "Kull 6", start_date: "2025-02-05", planned_size: 31 },
    { name: "Kull 7", start_date: "2025-04-02", planned_size: 27 },
    { name: "Kull 8", start_date: "2025-04-28", planned_size: 26 },
    { name: "Kull 9", start_date: "2025-08-13", planned_size: 30 },
    { name: "Kull 10", start_date: "2025-10-08", planned_size: 28 },
  ],

  // Teachers
  teachers: [
    {
      name: "Annina Persson",
      home_department: "AIJ",
      compatible_courses: [4, 5, 6, 7, 10],
    },
    {
      name: "Anna Broback",
      home_department: "AIE",
      compatible_courses: [9, 13],
    },
    {
      name: "Annika Gram",
      home_department: "AF",
      compatible_courses: [4, 6, 10],
    },
    {
      name: "Henry Muyingo",
      home_department: "AIJ",
      compatible_courses: [5, 6],
    },
    {
      name: "Jonny Flodin",
      home_department: "AIJ",
      compatible_courses: [3, 5, 7, 12],
    },
    {
      name: "Ny adjunkt",
      home_department: "AIE",
      compatible_courses: [3, 5, 7],
    },
    { name: "Tim", home_department: "AIJ", compatible_courses: [3, 5, 7, 8, 12] },
    {
      name: "Rickard Engström",
      home_department: "AIE",
      compatible_courses: [2, 4, 10],
    },
    {
      name: "Torun Widström",
      home_department: "AF",
      compatible_courses: [3, 4, 5, 6, 7],
    },
    {
      name: "Inga-Lill Söderberg",
      home_department: "AIE",
      compatible_courses: [4, 5, 6, 7],
    },
    {
      name: "Ulrika Myślinski",
      home_department: "AIJ",
      compatible_courses: [3, 4, 5, 6, 7],
    },
    {
      name: "Jenny Paulsson",
      home_department: "AIJ",
      compatible_courses: [1, 9],
    },
  ],

  // Time slots - seed only the dates (each slot is 28 days)
  slots: SLOT_START_DATES.map((start_date) => ({
    start_date,
    end_date: computeSlotEndDate(start_date),
  })),

  // Seed schedule should start empty; scheduling is done in the UI.
  courseRuns: [],
};

export const seedData = normalizeSeedData(seedDataRaw);

function normalizeSeedData(raw) {
  const courses = normalizeCourses(raw.courses || []);
  const coursePrerequisites = buildCoursePrerequisites(courses);
  const courseRuns = normalizeCourseRuns(raw.courseRuns || []);

  return {
    ...raw,
    courses,
    coursePrerequisites,
    courseRuns,
  };
}

function normalizeCourses(coursesRaw) {
  const codeToId = new Map(
    (coursesRaw || []).map((c, idx) => [c.code, idx + 1])
  );

  return (coursesRaw || []).map((c, idx) => {
    const prerequisiteCodes = Array.isArray(c.prerequisite_codes)
      ? c.prerequisite_codes
      : [];
    const prerequisites = prerequisiteCodes.map((code) => {
      const id = codeToId.get(code);
      if (id == null) {
        throw new Error(
          `seedData: okänd prerequisite-kurskod "${code}" för kurs "${c.code}"`
        );
      }
      return id;
    });

    const { prerequisite_codes, ...rest } = c;
    return {
      ...rest,
      course_id: idx + 1,
      prerequisites,
    };
  });
}

function buildCoursePrerequisites(courses) {
  const rows = [];
  (courses || []).forEach((c) => {
    (c.prerequisites || []).forEach((pid) =>
      rows.push({ course_id: c.course_id, prerequisite_course_id: pid })
    );
  });
  return rows;
}

function normalizeCourseRuns(courseRunsRaw) {
  const runs = Array.isArray(courseRunsRaw) ? courseRunsRaw : [];
  const hasZeroBasedCourseIds = runs.some((r) => Number(r.course_id) === 0);
  const offset = hasZeroBasedCourseIds ? 1 : 0;

  // Only keep runs that are actually scheduled for at least one cohort.
  // Cohort-less runs become "orphan" schedule entries (cohort_id NULL) which can
  // confuse scheduling/summary UI and aren't meaningful in Henry's current model.
  return runs
    .map((r) => ({
      ...r,
      course_id:
        typeof r.course_id === "number" ? r.course_id + offset : r.course_id,
      cohorts: Array.isArray(r.cohorts) ? r.cohorts : [],
    }))
    .filter((r) => r.cohorts.some((id) => id != null));
}
