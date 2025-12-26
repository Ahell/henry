import { store } from "../../../platform/store/DataStore.js";
import { TeacherAvailabilityService } from "./teacher-availability.service.js";

/**
 * Teacher Availability Table Service
 * Handles presentation logic for the availability table (cell rendering, classes, titles).
 */
export class TeacherAvailabilityTableService {
  /**
   * Decide presentation for a day header in the detail view.
   */
  static getDetailDayHeaderPresentation({
    slotId,
    dateStr,
    courseId = null,
    applyToAllCourses = false,
  }) {
    const isAllCourses = courseId == null || courseId === "all";
    const canEditTeachingDays = !isAllCourses || applyToAllCourses;

    const finalize = ({ className, title }) => ({
      className,
      title: canEditTeachingDays
        ? title
        : `${title} (välj en kurs eller aktivera "Applicera på alla kurser" för att ändra)`,
      clickMode: canEditTeachingDays ? "toggleTeachingDay" : null,
    });

    const normalizedCourseDays =
      courseId && courseId !== "all"
        ? store.getCourseSlotDaysForCourse(slotId, courseId)
        : [];
    const state = store.getTeachingDayState(slotId, dateStr, courseId);

    if (state?.isDefault && state.active) {
      return finalize({
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
      return finalize({
        className: "teaching-day-alt-header",
        title: isAllCourses
          ? "Aktiv kursdag (klicka för att avaktivera för alla kurser)"
          : "Aktiv kursdag (klicka för att avaktivera)",
      });
    }

    if (state?.isDefault && !state.active) {
      return finalize({
        className: "teaching-day-default-dimmed-header",
        title: isAllCourses
          ? "Inaktiverad standarddag (klicka för att aktivera för alla kurser)"
          : "Inaktiverad standarddag (klicka för att aktivera)",
      });
    }

    if (state && !state.isDefault && state.active) {
      return finalize({
        className: "teaching-day-alt-header",
        title: isAllCourses
          ? "Alternativ undervisningsdag (klicka för att ta bort för alla kurser)"
          : "Alternativ undervisningsdag (klicka för att ta bort)",
      });
    }

    return finalize({
      className: "",
      title: isAllCourses
        ? "Klicka för att markera som undervisningsdag för alla kurser"
        : "Klicka för att markera som undervisningsdag",
    });
  }

  /**
   * Decide presentation for a day cell in the detail view.
   */
  static getDetailDayCellPresentation({
    slotId,
    slotDate,
    dateStr,
    teacherId,
    courseId = null,
  }) {
    const state = store.getTeachingDayState(slotId, dateStr, courseId);
    const normalizedCourseDays =
      courseId && courseId !== "all"
        ? store.getCourseSlotDaysForCourse(slotId, courseId)
        : [];
    const isUnavailable = TeacherAvailabilityService.isDayUnavailableConsideringSlot(
      teacherId,
      dateStr,
      slotId,
      slotDate
    );

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
   */
  static getOverviewCellPresentation({ teacher, slot, slotDate }) {
    const compatibleCourseIds = teacher.compatible_courses || [];
    const courseRuns = store.getCourseRuns();

    const runsInSlot = TeacherAvailabilityService.getRunsCoveringSlotId(courseRuns, slot.slot_id);
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

    const normalizeDate = (value) => (value || "").split("T")[0];
    const slotDays = (store.getSlotDays(slot.slot_id) || [])
      .map(normalizeDate)
      .filter(Boolean);
    const hasSlotBusyEntry = (store.teacherAvailability || []).some(
      (a) =>
        String(a.teacher_id) === String(teacher.teacher_id) &&
        String(a.slot_id) === String(slot.slot_id) &&
        a.type === "busy"
    );
    const isUnavailableOnDay = (day) =>
      hasSlotBusyEntry || store.isTeacherUnavailableOnDay(teacher.teacher_id, day);
    const unavailableDaysInSlot = hasSlotBusyEntry
      ? slotDays
      : slotDays.filter((d) => store.isTeacherUnavailableOnDay(teacher.teacher_id, d));

    let className = "";
    let content = "";
    let title = "";
    let isLocked = false;
    let courseIds = [];
    let assignedCourseIds = [];
    let segments = [];

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
        className = this._appendClass(className, "assigned-course");
        const assignedNames = courseNamesForIds(assignedCourseIds);
        const otherNames = courseNamesForIds(
          courseIdsInCell.filter((id) => !assignedCourseIds.includes(id))
        );
        title = assignedNames.length ? `Tilldelad: ${assignedNames.join(", ")}` : "";
        if (otherNames.length) {
          title = title ? `${title}\nÖvriga: ${otherNames.join(", ")}` : `Övriga: ${otherNames.join(", ")}`;
        }
      } else {
        className = this._appendClass(className, "has-course");
        const names = courseNamesForIds(courseIdsInCell);
        title = names.join(", ");
      }
    }

    const hasAnyCourseInCell = courseIdsInCell.length > 0;
    
    const unavailablePercentage = store.getTeacherUnavailablePercentageForSlot(
      teacher.teacher_id,
      slotDate,
      slot.slot_id
    );

    const availabilityTitles = {
      "course-unavailable": "Otillgänglig för kursens kursdagar",
      "partial-conflict": "Delvis otillgänglig för kursens kursdagar",
      "partial-availability":
        "Otillgänglig i perioden (men inte på kursens kursdagar)",
    };
    const severity = {
      "course-unavailable": 3,
      "partial-conflict": 2,
      "partial-availability": 1,
    };
    const availabilityByCourseId = new Map();

    if (!hasAnyCourseInCell) {
      if (isUnavailable) {
        className = this._appendClass(className, "unavailable");
        title = title ? `${title} (Upptagen)` : "Upptagen";
      } else if (unavailablePercentage > 0) {
        className = this._appendClass(className, "partial-unavailable");
        title = "Delvis upptagen (utvalda dagar)";
      }
    } else if (unavailableDaysInSlot.length > 0) {
      let availabilityClass = "";
      let availabilityScore = 0;

      for (const courseId of courseIdsInCell) {
        const activeDays = (store.getActiveCourseDaysInSlot(slot.slot_id, courseId) || [])
          .map(normalizeDate)
          .filter(Boolean)
          .filter((d) => slotDays.includes(d));
        if (activeDays.length === 0) continue;
        const unavailableActiveDays = activeDays.filter((d) => isUnavailableOnDay(d));
        let courseAvailability = "";
        if (unavailableActiveDays.length === 0) {
          courseAvailability = "partial-availability";
        } else if (unavailableActiveDays.length === activeDays.length) {
          courseAvailability = "course-unavailable";
        } else {
          courseAvailability = "partial-conflict";
        }

        availabilityByCourseId.set(courseId, courseAvailability);
        const score = severity[courseAvailability] || 0;
        if (score > availabilityScore) {
          availabilityScore = score;
          availabilityClass = courseAvailability;
        }
      }

      if (availabilityClass) {
        if (courseIdsInCell.length <= 1) {
          className = this._appendClass(className, availabilityClass);
        }
        const availabilityTitle = availabilityTitles[availabilityClass];
        if (availabilityTitle) {
          title = title ? `${title}\n${availabilityTitle}` : availabilityTitle;
        }
      }
    }

    if (courseIdsInCell.length > 1) {
      segments = courseIdsInCell.map((courseId) => {
        const course = store.getCourse(courseId);
        const code = course?.code || `Kurs ${courseId}`;
        const isAssignedCourse = assignedCourseIds.some(
          (id) => String(id) === String(courseId)
        );
        const baseClass = isAssignedCourse
          ? "segment-assigned"
          : isAssigned
          ? "segment-compatible-occupied"
          : "segment-compatible-free";
        const availabilityClass = availabilityByCourseId.get(courseId) || "";
        const classNameSuffix = [baseClass, availabilityClass]
          .filter(Boolean)
          .join(" ");
        return { text: code, classNameSuffix };
      });
    }

    className = className.trim();

    return {
      className,
      title,
      content,
      isLocked,
      courseIds,
      assignedCourseIds,
      segments,
    };
  }

  static _appendClass(current, next) {
    return current ? `${current} ${next}` : next;
  }
}
