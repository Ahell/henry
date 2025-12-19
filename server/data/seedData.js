/**
 * Seed data for Henry Course Planner
 * Contains all courses, cohorts, teachers, slots, and historical course runs
 */

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

  // Time slots - calculate end dates (each slot is ~4-5 weeks)
  slots: [
    // 2024
    {
      start_date: "2024-06-10",
      end_date: "2024-07-07",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2024-09-09",
      end_date: "2024-10-06",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2024-10-07",
      end_date: "2024-11-03",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },

    // 2025
    {
      start_date: "2025-01-13",
      end_date: "2025-02-09",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-02-10",
      end_date: "2025-03-09",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-03-10",
      end_date: "2025-04-06",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-04-07",
      end_date: "2025-05-04",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-05-05",
      end_date: "2025-06-01",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-06-02",
      end_date: "2025-06-29",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-08-18",
      end_date: "2025-09-14",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-10-13",
      end_date: "2025-11-09",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-11-10",
      end_date: "2025-12-07",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },

    // 2026
    {
      start_date: "2026-02-16",
      end_date: "2026-03-15",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-03-16",
      end_date: "2026-04-12",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-04-13",
      end_date: "2026-05-10",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-05-11",
      end_date: "2026-06-07",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-06-08",
      end_date: "2026-07-05",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-08-17",
      end_date: "2026-09-13",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-09-14",
      end_date: "2026-10-11",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-10-12",
      end_date: "2026-11-08",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-11-09",
      end_date: "2026-12-06",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-12-07",
      end_date: "2027-01-03",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },

    // 2027
    {
      start_date: "2027-01-25",
      end_date: "2027-02-21",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-02-22",
      end_date: "2027-03-21",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-03-22",
      end_date: "2027-04-18",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-04-19",
      end_date: "2027-05-16",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-05-17",
      end_date: "2027-06-13",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-06-14",
      end_date: "2027-07-11",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-08-09",
      end_date: "2027-09-05",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-09-06",
      end_date: "2027-10-03",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-10-04",
      end_date: "2027-11-01",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
  ],

  // Historical and planned course runs from feiCourses data
  courseRuns: [
    // HT25
    {
      course_id: 0,
      slot_id: 9,
      teacher_id: 0,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI180U
    {
      course_id: 1,
      slot_id: 9,
      teacher_id: 0,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI188U
    {
      course_id: 2,
      slot_id: 9,
      teacher_id: 4,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI183U
    {
      course_id: 3,
      slot_id: 10,
      teacher_id: 11,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI184U
    {
      course_id: 4,
      slot_id: 10,
      teacher_id: 1,
      cohorts: [9],
      planned_students: 28,
      status: "planerad",
    }, // AI190U
    {
      course_id: 5,
      slot_id: 10,
      teacher_id: 0,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI192U
    {
      course_id: 6,
      slot_id: 11,
      teacher_id: 0,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI191U
    {
      course_id: 7,
      slot_id: 11,
      teacher_id: 0,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI181U
    {
      course_id: 8,
      slot_id: 12,
      teacher_id: 4,
      cohorts: [8],
      planned_students: 30,
      status: "planerad",
    }, // AI185U

    // VT26
    {
      course_id: 1,
      slot_id: 12,
      teacher_id: 10,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI188U
    {
      course_id: 9,
      slot_id: 13,
      teacher_id: 1,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI186U
    {
      course_id: 10,
      slot_id: 14,
      teacher_id: 2,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI182U
    {
      course_id: 11,
      slot_id: 15,
      teacher_id: 5,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI189U
    {
      course_id: 7,
      slot_id: 15,
      teacher_id: 0,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI181U
    {
      course_id: 10,
      slot_id: 16,
      teacher_id: 5,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI182U
    {
      course_id: 12,
      slot_id: 16,
      teacher_id: 3,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI187U

    // HT26
    {
      course_id: 0,
      slot_id: 17,
      teacher_id: 0,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI180U
    {
      course_id: 2,
      slot_id: 17,
      teacher_id: 4,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI183U
    {
      course_id: 3,
      slot_id: 18,
      teacher_id: 11,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI184U
    {
      course_id: 5,
      slot_id: 19,
      teacher_id: 0,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI192U
    {
      course_id: 11,
      slot_id: 20,
      teacher_id: 5,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI189U
    {
      course_id: 8,
      slot_id: 20,
      teacher_id: 4,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI185U
    {
      course_id: 6,
      slot_id: 21,
      teacher_id: 1,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI191U

    // VT27
    {
      course_id: 1,
      slot_id: 22,
      teacher_id: 10,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI188U
    {
      course_id: 9,
      slot_id: 23,
      teacher_id: 1,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI186U
    {
      course_id: 10,
      slot_id: 23,
      teacher_id: 5,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI182U
    {
      course_id: 4,
      slot_id: 24,
      teacher_id: 1,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI190U
    {
      course_id: 11,
      slot_id: 25,
      teacher_id: 5,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI189U
    {
      course_id: 2,
      slot_id: 25,
      teacher_id: 4,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI183U
    {
      course_id: 10,
      slot_id: 29,
      teacher_id: 5,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI182U
    {
      course_id: 3,
      slot_id: 29,
      teacher_id: 11,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI184U
    {
      course_id: 8,
      slot_id: 30,
      teacher_id: 4,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI185U
  ],
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

  return runs.map((r) => ({
    ...r,
    course_id:
      typeof r.course_id === "number" ? r.course_id + offset : r.course_id,
  }));
}
