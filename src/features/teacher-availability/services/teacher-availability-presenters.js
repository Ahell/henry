import { isDayUnavailableConsideringSlot } from "./helpers.js";
import { getRunsCoveringSlotId } from "./run-coverage.js";

/**
 * Decide presentation for a day header in the detail view.
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{slotId:number, dateStr:string, store:object, courseId:number|null, applyToAllCourses?:boolean}} options
 * @returns {{className:string,title:string,clickMode:('toggleTeachingDay'|null)}}
 */
export function getDetailDayHeaderPresentation({
  slotId,
  dateStr,
  courseId = null,
  applyToAllCourses = false,
  store,
}) {
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
 * @param {{slotId:number, dateStr:string, teacherId:number, slotDate:string, store:object, courseId:number|null}} options
 * @returns {{className:string,title:string}}
 */
export function getDetailDayCellPresentation({
  slotId,
  slotDate,
  dateStr,
  teacherId,
  courseId = null,
  store,
}) {
  const state = store.getTeachingDayState(slotId, dateStr, courseId);
  const normalizedCourseDays =
    courseId && courseId !== "all"
      ? store.getCourseSlotDaysForCourse(slotId, courseId)
      : [];
  const isUnavailable = isDayUnavailableConsideringSlot(
    teacherId,
    dateStr,
    slotId,
    slotDate
  );

  // Start with base presentation
  let className = "";
  let title = dateStr;

  if (state) {
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
    title = `Upptagen ${dateStr}`;
  }

  return { className, title };
}

/**
 * Decide presentation for an overview cell (slot-level view).
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{teacher:object, slot:object, slotDate:string, store:object}} options
 * @returns {{className:string,title:string,content:string,isLocked:boolean,courseIds:number[],assignedCourseIds:number[]}}
 */
export function getOverviewCellPresentation({
  teacher,
  slot,
  slotDate,
  store,
}) {
  const compatibleCourseIds = teacher.compatible_courses || [];
  const courseRuns = store.getCourseRuns();

  const runsInSlot = getRunsCoveringSlotId(courseRuns, slot.slot_id);
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
  let assignedCourseIds = [];

  const uniqueCourseIdsInRuns = (runs) => {
    const seen = new Set();
    const result = [];
    for (const run of runs || []) {
      if (!run || run.course_id == null) continue;
      const key = String(run.course_id);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(run.course_id);
    }
    return result;
  };

  const courseCodesForIds = (ids) =>
    (ids || [])
      .map((id) => store.getCourse(id)?.code)
      .filter(Boolean);

  const courseNamesForIds = (ids) =>
    (ids || [])
      .map((id) => store.getCourse(id)?.name)
      .filter(Boolean);

  assignedCourseIds = uniqueCourseIdsInRuns(assignedRuns);
  const compatibleCourseIdsInSlot = uniqueCourseIdsInRuns(compatibleRuns);
  const courseIdsInCell = [
    ...assignedCourseIds,
    ...compatibleCourseIdsInSlot.filter((id) => !assignedCourseIds.includes(id)),
  ];

  if (courseIdsInCell.length > 0) {
    courseIds = courseIdsInCell;
    const codes = courseCodesForIds(courseIdsInCell);
    content = codes.join(", ");

    if (isAssigned) {
      className = appendClass(className, "assigned-course");
      const assignedNames = courseNamesForIds(assignedCourseIds);
      const otherNames = courseNamesForIds(
        courseIdsInCell.filter((id) => !assignedCourseIds.includes(id))
      );
      title = assignedNames.length ? `Tilldelad: ${assignedNames.join(", ")}` : "";
      if (otherNames.length) {
        title = title ? `${title}\nÖvriga: ${otherNames.join(", ")}` : `Övriga: ${otherNames.join(", ")}`;
      }
    } else {
      className = appendClass(className, "has-course");
      const names = courseNamesForIds(courseIdsInCell);
      title = names.join(", ");
    }
  }

  // Only use a full "unavailable" cell state when there are no course codes to show.
  // If there are course codes, unavailability/conflicts are communicated via per-course overlays.
  const hasAnyCourseInCell = courseIdsInCell.length > 0;
  if (isUnavailable && !hasAnyCourseInCell) {
    className = appendClass(className, "unavailable");
    title = title ? `${title} (Upptagen)` : "Upptagen";
  }

  // Ensure leading/trailing whitespace trimmed
  className = className.trim();

  return { className, title, content, isLocked, courseIds, assignedCourseIds };
}

const appendClass = (current, next) => (current ? `${current} ${next}` : next);
