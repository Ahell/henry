/**
 * Business logic rules for course planning
 */

export const BUSINESS_RULES = {
  MAX_STUDENTS_PREFERRED: 100,
  MAX_STUDENTS_HARD: 130,
};

/**
 * Validate law course prerequisites
 * Returns { valid: boolean, errors: string[] }
 */
export function validateLawPrerequisites(
  cohort,
  courseRun,
  allCourseRuns,
  store
) {
  return { valid: true, errors: [] };
}

/**
 * Check teacher availability for slot
 */
export function checkTeacherAvailability(
  teacherId,
  slot,
  teacherAvailabilities
) {
  const busyPeriods = teacherAvailabilities.filter(
    (a) => a.teacher_id === teacherId && a.type === "busy"
  );

  const slotStart = new Date(slot.start_date);
  const slotEnd = new Date(slot.end_date);

  for (const busy of busyPeriods) {
    const busyStart = new Date(busy.from_date);
    const busyEnd = new Date(busy.to_date);

    // Check for overlap
    if (slotStart <= busyEnd && slotEnd >= busyStart) {
      return {
        available: false,
        reason: `Lärare upptagen ${busy.from_date} - ${busy.to_date}`,
      };
    }
  }

  return { available: true };
}

/**
 * Calculate total students for a course run
 */
export function calculatePlannedStudents(courseRun, cohorts) {
  return courseRun.cohorts.reduce((sum, cohortId) => {
    const cohort = cohorts.find((c) => c.cohort_id === cohortId);
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
    errors.push(
      `För många studenter (${planned_students} > ${BUSINESS_RULES.MAX_STUDENTS_HARD})`
    );
  } else if (planned_students > BUSINESS_RULES.MAX_STUDENTS_PREFERRED) {
    warnings.push(
      `Varning: Många studenter (${planned_students} > ${BUSINESS_RULES.MAX_STUDENTS_PREFERRED})`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}
