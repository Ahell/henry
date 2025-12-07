/**
 * Seed data for Henry Course Planner
 * Contains all courses, cohorts, teachers, slots, and historical course runs
 */

export const seedData = {
  // All 14 courses
  courses: [
    {
      code: "AI180U",
      name: "Juridisk översiktskurs",
      hp: 15.0,
      is_law_course: true,
      law_type: "overview",
      default_block_length: 2,
      preferred_order_index: 0,
      prerequisite_codes: [], // No prerequisites
    },
    {
      code: "AI188U",
      name: "Marknadsanalys och marknadsföring för fastighetsmäklare",
      hp: 7.5,
      is_law_course: false,
      law_type: null,
      default_block_length: 1,
      preferred_order_index: 1,
    },
    {
      code: "AI183U",
      name: "Husbyggnadsteknik",
      hp: 7.5,
      is_law_course: false,
      law_type: null,
      default_block_length: 1,
      preferred_order_index: 2,
    },
    {
      code: "AI184U",
      name: "Fastighetsförmedling introduktion",
      hp: 15.0,
      is_law_course: false,
      law_type: null,
      default_block_length: 2,
      preferred_order_index: 3,
    },
    {
      code: "AI190U",
      name: "Fastighetsvärdering för fastighetsmäklare",
      hp: 7.5,
      is_law_course: false,
      law_type: null,
      default_block_length: 1,
      preferred_order_index: 4,
    },
    {
      code: "AI192U",
      name: "Allmän fastighetsrätt för fastighetsförmedlare",
      hp: 7.5,
      is_law_course: true,
      law_type: "general",
      default_block_length: 1,
      preferred_order_index: 5,
      prerequisite_codes: ["AI180U"], // Requires JÖK
    },
    {
      code: "AI191U",
      name: "Bostadsrätt för fastighetsmäklare",
      hp: 7.5,
      is_law_course: true,
      law_type: "bostadsratt",
      default_block_length: 1,
      preferred_order_index: 6,
    },
    {
      code: "AI181U",
      name: "Extern redovisning för fastighetsmäklare",
      hp: 7.5,
      is_law_course: false,
      law_type: null,
      default_block_length: 1,
      preferred_order_index: 8,
    },
    {
      code: "AI185U",
      name: "Ekonomistyrning för fastighetsmäklare",
      hp: 7.5,
      is_law_course: false,
      law_type: null,
      default_block_length: 1,
      preferred_order_index: 9,
    },
    {
      code: "AI186U",
      name: "Beskattningsrätt för fastighetsmäklare",
      hp: 7.5,
      is_law_course: true,
      law_type: "beskattning",
      default_block_length: 1,
      preferred_order_index: 10,
    },
    {
      code: "AI182U",
      name: "Speciell fastighetsrätt för fastighetsförmedlare",
      hp: 7.5,
      is_law_course: true,
      law_type: "special",
      default_block_length: 1,
      preferred_order_index: 7,
      prerequisite_codes: ["AI192U"], // Requires Allmän fastighetsrätt (which requires JÖK)
    },
    {
      code: "AI189U",
      name: "Fastighetsförmedling - kvalificerad fastighetsmäklarjuridik",
      hp: 7.5,
      is_law_course: true,
      law_type: "qualified",
      default_block_length: 1,
      preferred_order_index: 11,
    },
    {
      code: "AI187U",
      name: "Arbetsmarknad och företagande för fastighetsmäklare",
      hp: 7.5,
      is_law_course: false,
      law_type: null,
      default_block_length: 1,
      preferred_order_index: 12,
    },
    {
      code: "AI181U_KOMM",
      name: "Fastighetsförmedling - kommunikation",
      hp: 7.5,
      is_law_course: false,
      law_type: null,
      default_block_length: 1,
      preferred_order_index: 13,
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
    { name: "Annina Persson", home_department: "AIJ" },
    { name: "Anna Broback", home_department: "AIE" },
    { name: "Annika Gram", home_department: "AF" },
    { name: "Henry Muyingo", home_department: "AIJ" },
    { name: "Jonny Flodin", home_department: "AIJ" },
    { name: "Ny adjunkt", home_department: "AIE" },
    { name: "Tim", home_department: "AIJ" },
    { name: "Rickard Engström", home_department: "AIE" },
    { name: "Torun Widström", home_department: "AF" },
    { name: "Inga-Lill Söderberg", home_department: "AIE" },
    { name: "Ulrika Myślinski", home_department: "AIJ" },
    { name: "Jenny Paulsson", home_department: "AIJ" },
  ],

  // Time slots - calculate end dates (each slot is ~4-5 weeks)
  slots: [
    // 2024
    {
      start_date: "2024-06-10",
      end_date: "2024-07-05",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2024-09-09",
      end_date: "2024-10-04",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2024-10-07",
      end_date: "2024-11-01",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },

    // 2025
    {
      start_date: "2025-01-13",
      end_date: "2025-02-07",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-02-10",
      end_date: "2025-03-07",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-03-10",
      end_date: "2025-04-04",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-04-07",
      end_date: "2025-05-02",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-05-05",
      end_date: "2025-05-30",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-06-02",
      end_date: "2025-06-27",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-08-18",
      end_date: "2025-09-12",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-10-13",
      end_date: "2025-11-07",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2025-11-10",
      end_date: "2025-12-05",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },

    // 2026
    {
      start_date: "2026-02-16",
      end_date: "2026-03-13",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-03-16",
      end_date: "2026-04-10",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-04-13",
      end_date: "2026-05-08",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-05-11",
      end_date: "2026-06-05",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-06-08",
      end_date: "2026-07-03",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-08-17",
      end_date: "2026-09-11",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-09-14",
      end_date: "2026-10-09",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-10-12",
      end_date: "2026-11-06",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-11-09",
      end_date: "2026-12-04",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2026-12-07",
      end_date: "2027-01-22",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },

    // 2027
    {
      start_date: "2027-01-25",
      end_date: "2027-02-19",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-02-22",
      end_date: "2027-03-19",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-03-22",
      end_date: "2027-04-16",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-04-19",
      end_date: "2027-05-14",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-05-17",
      end_date: "2027-06-11",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-06-14",
      end_date: "2027-07-09",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-08-09",
      end_date: "2027-09-03",
      evening_pattern: "tis/tor",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-09-06",
      end_date: "2027-10-01",
      evening_pattern: "mån/fre",
      is_placeholder: false,
      location: "FEI Campus",
    },
    {
      start_date: "2027-09-20",
      end_date: "2027-10-15",
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
      slot_id: 26,
      teacher_id: 5,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI182U
    {
      course_id: 3,
      slot_id: 26,
      teacher_id: 11,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI184U
    {
      course_id: 8,
      slot_id: 27,
      teacher_id: 4,
      cohorts: [],
      planned_students: 0,
      status: "planerad",
    }, // AI185U
  ],
};
