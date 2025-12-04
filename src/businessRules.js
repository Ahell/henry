/**
 * Business logic rules for course planning
 */

export const BUSINESS_RULES = {
  MAX_STUDENTS_PREFERRED: 100,
  MAX_STUDENTS_HARD: 130,
  
  LAW_COURSES: {
    overview: 'AI180U',  // Juridisk översiktskurs
    general: 'AI192U',   // Allmän fastighetsrätt
    special: 'AI182U',   // Speciell fastighetsrätt
    bostadsratt: 'AI191U',
    beskattning: 'AI186U',
    qualified: 'AI189U'
  },

  TWO_BLOCK_COURSES: ['AI180U', 'AI184U'], // Juridisk översikt + Fastighetsförmedling intro
};

/**
 * Validate law course prerequisites
 * Returns { valid: boolean, errors: string[] }
 */
export function validateLawPrerequisites(cohort, courseRun, allCourseRuns, store) {
  const errors = [];
  const course = store.getCourse(courseRun.course_id);
  
  if (!course?.is_law_course) {
    return { valid: true, errors: [] };
  }

  // If it's a law course but NOT the overview course, check that cohort has completed overview
  if (course.code !== BUSINESS_RULES.LAW_COURSES.overview) {
    const overviewCourse = store.courses.find(c => c.code === BUSINESS_RULES.LAW_COURSES.overview);
    if (overviewCourse) {
      const cohortHasOverview = allCourseRuns.some(r => 
        r.course_id === overviewCourse.course_id && 
        r.cohorts.includes(cohort.cohort_id)
      );
      
      if (!cohortHasOverview) {
        errors.push(`Kull ${cohort.name} måste genomföra Juridisk översiktskurs före denna juridikkurs`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check teacher availability for slot
 */
export function checkTeacherAvailability(teacherId, slot, teacherAvailabilities) {
  const busyPeriods = teacherAvailabilities.filter(a => a.teacher_id === teacherId && a.type === 'busy');
  
  const slotStart = new Date(slot.start_date);
  const slotEnd = new Date(slot.end_date);

  for (const busy of busyPeriods) {
    const busyStart = new Date(busy.from_date);
    const busyEnd = new Date(busy.to_date);

    // Check for overlap
    if (slotStart <= busyEnd && slotEnd >= busyStart) {
      return { available: false, reason: `Lärare upptagen ${busy.from_date} - ${busy.to_date}` };
    }
  }

  return { available: true };
}

/**
 * Calculate total students for a course run
 */
export function calculatePlannedStudents(courseRun, cohorts) {
  return courseRun.cohorts.reduce((sum, cohortId) => {
    const cohort = cohorts.find(c => c.cohort_id === cohortId);
    return sum + (cohort?.planned_size || 0);
  }, 0);
}

/**
 * Validate capacity
 */
export function validateCapacity(planned_students) {
  const warnings = [];
  const errors = [];

  if (planned_students > BUSINESS_RULES.MAX_STUDENTS_HARD) {
    errors.push(`För många studenter (${planned_students} > ${BUSINESS_RULES.MAX_STUDENTS_HARD})`);
  } else if (planned_students > BUSINESS_RULES.MAX_STUDENTS_PREFERRED) {
    warnings.push(`Varning: Många studenter (${planned_students} > ${BUSINESS_RULES.MAX_STUDENTS_PREFERRED})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Suggest course run merging (reuse existing run for new cohort)
 */
export function suggestCourseRunMerge(course, cohort, existingRuns, slots, teacherAvailabilities) {
  const suggestions = [];

  // Find existing runs of the same course
  const sameCourseRuns = existingRuns.filter(r => r.course_id === course.course_id);

  for (const run of sameCourseRuns) {
    const slot = slots.find(s => s.slot_id === run.slot_id);
    if (!slot) continue;

    // Check teacher availability for new cohort
    const availability = checkTeacherAvailability(run.teacher_id, slot, teacherAvailabilities);
    if (!availability.available) continue;

    // Check if adding cohort would exceed capacity
    const newPlannedStudents = run.planned_students + cohort.planned_size;
    const capacityCheck = validateCapacity(newPlannedStudents);
    if (!capacityCheck.valid) continue;

    suggestions.push({
      run_id: run.run_id,
      slot_id: run.slot_id,
      teacher_id: run.teacher_id,
      newPlannedStudents,
      reason: 'Kan samläsas med befintlig kursomgång'
    });
  }

  return suggestions;
}

/**
 * Get recommended law course order
 */
export function getRecommendedLawCourseOrder(store) {
  const codes = [
    BUSINESS_RULES.LAW_COURSES.overview,
    BUSINESS_RULES.LAW_COURSES.general,
    BUSINESS_RULES.LAW_COURSES.special,
    BUSINESS_RULES.LAW_COURSES.bostadsratt,
    BUSINESS_RULES.LAW_COURSES.beskattning,
    BUSINESS_RULES.LAW_COURSES.qualified
  ];

  return codes
    .map(code => store.courses.find(c => c.code === code))
    .filter(c => c);
}

/**
 * Check if course is multi-block
 */
export function isMultiBlockCourse(courseCode) {
  return BUSINESS_RULES.TWO_BLOCK_COURSES.includes(courseCode);
}
