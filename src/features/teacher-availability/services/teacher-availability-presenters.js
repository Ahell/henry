import { isDayUnavailableConsideringSlot } from "./helpers.js";

/**
 * Decide presentation for a day header in the detail view.
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{slotId:number, dateStr:string, isEditingExamDate:boolean, store:object, courseId:number|null, applyToAllCourses?:boolean}} options
 * @returns {{className:string,title:string,clickMode:('toggleTeachingDay'|'setExamDate'|null)}}
 */
export function getDetailDayHeaderPresentation({
  slotId,
  dateStr,
  isEditingExamDate,
  courseId = null,
  applyToAllCourses = false,
  store,
}) {
  const isExamDate = store.isExamDate(slotId, dateStr);
  const isExamDateLocked = store.isExamDateLocked(slotId);

  // Exam-date scenarios first
  if (isExamDateLocked) {
    return {
      className: "exam-date-locked-header",
      title:
        "Tentamensdatum (låst - tryck 'Ändra tentamensdatum' för att ändra)",
      clickMode: null,
    };
  }

  if (isExamDate && isEditingExamDate) {
    return {
      className: "exam-date-unlocked-header",
      title: "Nuvarande tentamensdatum (klicka för att byta)",
      clickMode: "setExamDate",
    };
  }

  if (isExamDate) {
    return {
      className: "exam-date-unlocked-header",
      title: "Tentamensdatum (olåst)",
      clickMode: null,
    };
  }

  if (isEditingExamDate) {
    return {
      className: "exam-date-new-header",
      title: "Klicka för att sätta som tentamensdatum",
      clickMode: "setExamDate",
    };
  }

  const isAllCourses = courseId == null || courseId === "all";
  const canEditTeachingDays = !isAllCourses || applyToAllCourses;

  const finalizeTeachingDay = ({ className, title }) => ({
    className,
    title: canEditTeachingDays
      ? title
      : `${title} (välj en kurs eller aktivera "Applicera på alla kurser" för att ändra)`,
    clickMode: canEditTeachingDays ? "toggleTeachingDay" : null,
  });

  // Teaching-day scenarios
  const normalizedCourseDays =
    courseId && courseId !== "all"
      ? store.getCourseSlotDaysForCourse(slotId, courseId)
      : [];
  const state = store.getTeachingDayState(slotId, dateStr, courseId);

  if (state?.isDefault && state.active) {
    return finalizeTeachingDay({
      className: "teaching-day-default-header",
      title: isAllCourses
        ? "Standarddag (klicka för att inaktivera för alla kurser)"
        : "Standarddag (klicka för att inaktivera)",
    });
  }

  if (
    normalizedCourseDays.length > 0 &&
    normalizedCourseDays.includes(dateStr)
  ) {
    return finalizeTeachingDay({
      className: "teaching-day-alt-header",
      title: isAllCourses
        ? "Aktiv kursdag (klicka för att avaktivera för alla kurser)"
        : "Aktiv kursdag (klicka för att avaktivera)",
    });
  }

  if (state?.isDefault && !state.active) {
    return finalizeTeachingDay({
      className: "teaching-day-default-dimmed-header",
      title: isAllCourses
        ? "Inaktiverad standarddag (klicka för att aktivera för alla kurser)"
        : "Inaktiverad standarddag (klicka för att aktivera)",
    });
  }

  if (state && !state.isDefault && state.active) {
    return finalizeTeachingDay({
      className: "teaching-day-alt-header",
      title: isAllCourses
        ? "Alternativ undervisningsdag (klicka för att ta bort för alla kurser)"
        : "Alternativ undervisningsdag (klicka för att ta bort)",
    });
  }

  return finalizeTeachingDay({
    className: "",
    title: isAllCourses
      ? "Klicka för att markera som undervisningsdag för alla kurser"
      : "Klicka för att markera som undervisningsdag",
  });
}

/**
 * Decide presentation for a day cell in the detail view.
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{slotId:number, dateStr:string, teacherId:number, slotDate:string, isEditingExamDate:boolean, store:object, courseId:number|null}} options
 * @returns {{className:string,title:string}}
 */
export function getDetailDayCellPresentation({
  slotId,
  slotDate,
  dateStr,
  teacherId,
  isEditingExamDate,
  courseId = null,
  store,
}) {
  const state = store.getTeachingDayState(slotId, dateStr, courseId);
  const normalizedCourseDays =
    courseId && courseId !== "all"
      ? store.getCourseSlotDaysForCourse(slotId, courseId)
      : [];
  const isExamDate = store.isExamDate(slotId, dateStr);
  const isExamDateLocked = store.isExamDateLocked(slotId);
  const isUnavailable = isDayUnavailableConsideringSlot(
    teacherId,
    dateStr,
    slotId,
    slotDate
  );

  // Start with base presentation
  let className = "";
  let title = dateStr;

  if (isExamDate) {
    if (isExamDateLocked) {
      className = "exam-date-locked";
      title += " (Tentamensdatum - låst)";
    } else if (isEditingExamDate) {
      className = "exam-date-unlocked";
      title += " (Tentamensdatum - olåst)";
    } else {
      className = "exam-date-unlocked";
      title += " (Tentamensdatum - olåst)";
    }
  } else if (isEditingExamDate) {
    className = "exam-date-new";
    title += " (Kan väljas som tentamensdatum)";
  } else if (state) {
    if (state.isDefault && state.active) {
      className = "teaching-day-default";
      title += " (Standarddag)";
    } else if (state.isDefault && !state.active) {
      className = "teaching-day-default-dimmed";
      title += " (Inaktiverad standarddag)";
    } else if (!state.isDefault && state.active) {
      className = "teaching-day-alt";
      title += " (Alternativ undervisningsdag)";
    } else if (
      normalizedCourseDays.length > 0 &&
      normalizedCourseDays.includes(dateStr)
    ) {
      className = "teaching-day-alt";
      title += " (Aktiv kursdag)";
    }
  } else if (
    normalizedCourseDays.length > 0 &&
    normalizedCourseDays.includes(dateStr)
  ) {
    className = "teaching-day-alt";
    title += " (Aktiv kursdag)";
  }

  if (isUnavailable) {
    className += (className ? " " : "") + "unavailable";
    title = `Upptagen ${dateStr}` + (isExamDate ? " (Tentamensdatum)" : "");
  }

  return { className, title };
}

/**
 * Decide presentation for an overview cell (slot-level view).
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{teacher:object, slot:object, slotDate:string, store:object}} options
 * @returns {{className:string,title:string,content:string,isLocked:boolean}}
 */
export function getOverviewCellPresentation({
  teacher,
  slot,
  slotDate,
  store,
}) {
  const compatibleCourseIds = teacher.compatible_courses || [];
  const courseRuns = store.getCourseRuns();

  const runsInSlot = courseRuns.filter((r) => r.slot_id === slot.slot_id);
  const compatibleRuns = runsInSlot.filter((r) =>
    compatibleCourseIds.includes(r.course_id)
  );
  const assignedRuns = runsInSlot.filter(
    (r) => r.teachers && r.teachers.includes(teacher.teacher_id)
  );

  const isAssigned = assignedRuns.length > 0;
  const isUnavailable = store.isTeacherUnavailable(
    teacher.teacher_id,
    slotDate,
    slot.slot_id
  );

  let className = "";
  let content = "";
  let title = "";
  let isLocked = false;
  let courseIds = [];

  if (isAssigned) {
    const codes = assignedRuns
      .map((run) => store.getCourse(run.course_id)?.code)
      .filter(Boolean);
    const names = assignedRuns
      .map((run) => store.getCourse(run.course_id)?.name)
      .filter(Boolean);
    courseIds = assignedRuns.map((run) => run.course_id).filter(Boolean);

    className = appendClass(className, "assigned-course");
    content = codes.join(", ");
    title = names.length ? `Tilldelad: ${names.join(", ")}` : "";
  } else if (compatibleRuns.length > 0) {
    const codes = compatibleRuns
      .map((run) => store.getCourse(run.course_id)?.code)
      .filter(Boolean);
    const names = compatibleRuns
      .map((run) => store.getCourse(run.course_id)?.name)
      .filter(Boolean);
    courseIds = compatibleRuns.map((run) => run.course_id).filter(Boolean);

    className = appendClass(className, "has-course");
    content = codes.join(", ");
    title = names.join(", ");
  }

  if (isUnavailable && !isAssigned) {
    className = appendClass(className, "unavailable");
    title = title ? `${title} (Upptagen)` : "Upptagen";
  }

  // Ensure leading/trailing whitespace trimmed
  className = className.trim();

  return { className, title, content, isLocked, courseIds };
}

const appendClass = (current, next) => (current ? `${current} ${next}` : next);
