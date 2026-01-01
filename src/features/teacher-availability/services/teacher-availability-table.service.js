import { store } from "../../../platform/store/DataStore.js";
import { TeacherAvailabilityService } from "./teacher-availability.service.js";

/**
 * Teacher Availability Table Service
 * Handles presentation logic for the availability table (cell rendering, classes, titles).
 */
export class TeacherAvailabilityTableService {
  static buildRenderContext() {
    const normalizeDate = this._normalizeDate;
    const slotDaysBySlotId = new Map();
    const slotDaysSetBySlotId = new Map();
    const dayBusyByTeacher = new Map();
    const slotBusyByTeacher = new Map();
    const runsBySlotId = new Map();
    const slotCourseIdsBySlotId = new Map();
    const activeCourseDaysByKey = new Map();
    const courseById = new Map(
      (store.getCourses() || []).map((course) => [
        String(course.course_id),
        course,
      ])
    );
    const teacherById = new Map(
      (store.getTeachers() || []).map((teacher) => [
        String(teacher.teacher_id),
        teacher,
      ])
    );

    (store.slotDays || []).forEach((sd) => {
      if (!sd) return;
      const slotId = sd.slot_id;
      if (slotId == null) return;
      const date = normalizeDate(sd.date || sd.slot_day_id_date || "");
      if (!date) return;
      const key = String(slotId);
      if (!slotDaysBySlotId.has(key)) {
        slotDaysBySlotId.set(key, []);
      }
      slotDaysBySlotId.get(key).push(date);
    });

    (store.getSlots() || []).forEach((slot) => {
      if (!slot) return;
      const key = String(slot.slot_id);
      let days = slotDaysBySlotId.get(key);
      if (!days || days.length === 0) {
        days = (store.getSlotDays(slot.slot_id) || [])
          .map((d) => normalizeDate(d))
          .filter(Boolean);
        slotDaysBySlotId.set(key, days);
      }
      if (!slotDaysSetBySlotId.has(key)) {
        slotDaysSetBySlotId.set(key, new Set(days));
      }
    });

    (store.teacherAvailability || []).forEach((entry) => {
      if (!entry || entry.type !== "busy") return;
      const teacherKey = String(entry.teacher_id);
      if (entry.slot_id) {
        if (!slotBusyByTeacher.has(teacherKey)) {
          slotBusyByTeacher.set(teacherKey, new Set());
        }
        slotBusyByTeacher.get(teacherKey).add(String(entry.slot_id));
        return;
      }
      const date = normalizeDate(entry.from_date);
      if (!date) return;
      if (!dayBusyByTeacher.has(teacherKey)) {
        dayBusyByTeacher.set(teacherKey, new Set());
      }
      dayBusyByTeacher.get(teacherKey).add(date);
    });

    (store.getCourseRuns() || []).forEach((run) => {
      if (!run) return;
      const slotIds =
        Array.isArray(run.slot_ids) && run.slot_ids.length
          ? run.slot_ids
          : run.slot_id != null
          ? [run.slot_id]
          : [];
      slotIds.forEach((slotId) => {
        if (slotId == null) return;
        const key = String(slotId);
        if (!runsBySlotId.has(key)) {
          runsBySlotId.set(key, []);
        }
        runsBySlotId.get(key).push(run);
      });
    });

    for (const [slotId, runs] of runsBySlotId.entries()) {
      const courseIds = new Set();
      (runs || []).forEach((run) => {
        if (run?.course_id == null) return;
        courseIds.add(String(run.course_id));
      });
      slotCourseIdsBySlotId.set(String(slotId), courseIds);
    }

    return {
      slotDaysBySlotId,
      slotDaysSetBySlotId,
      dayBusyByTeacher,
      slotBusyByTeacher,
      runsBySlotId,
      slotCourseIdsBySlotId,
      activeCourseDaysByKey,
      courseById,
      teacherById,
    };
  }

  /**
   * Decide presentation for a day header in the detail view.
   */
  static getDetailDayHeaderPresentation({
    slotId,
    dateStr,
    courseId = null,
    applyToAllCourses = false,
    context = null,
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
        ? this._getActiveCourseDays(slotId, courseId, context)
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
    context = null,
  }) {
    const state = store.getTeachingDayState(slotId, dateStr, courseId);
    const normalizedCourseDays =
      courseId && courseId !== "all"
        ? this._getActiveCourseDays(slotId, courseId, context)
        : [];
    const isUnavailable = context
      ? this._isDayUnavailableConsideringSlot(
          teacherId,
          dateStr,
          slotId,
          slotDate,
          context
        )
      : TeacherAvailabilityService.isDayUnavailableConsideringSlot(
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

    // Calculate content (compatible active course codes) & segments
    let content = "";
    let segments = [];
    const teacher = this._getTeacher(teacherId, context);

    if (teacher) {
      const runsInSlot = this._getRunsInSlot(slotId, context);
      
      const slotCourseIds = this._getSlotCourseIdSet(slotId, context);

      const compatibleIds = (teacher.compatible_courses || []).filter((cid) =>
        slotCourseIds.has(String(cid))
      );

      const targetIds =
        courseId && courseId !== "all"
          ? compatibleIds.filter((cid) => Number(cid) === Number(courseId))
          : compatibleIds;

      const activeIds = targetIds.filter((cid) => {
        const days = this._getActiveCourseDays(slotId, cid, context);
        return days && days.includes(dateStr);
      });

      const activeCodes = activeIds
        .map((cid) => this._getCourse(cid, context)?.code)
        .filter(Boolean);
      
      if (activeCodes.length > 0) {
        content = activeCodes.join(", ");
      }

      if (activeIds.length > 0) {
        const assignedRuns = runsInSlot.filter(
          (r) => r.teachers && r.teachers.includes(teacher.teacher_id)
        );
        const assignedCourseIds = new Set(
          assignedRuns.map((r) => String(r.course_id)).filter(Boolean)
        );
        const isOccupied = assignedCourseIds.size > 0;

        segments = activeIds.map((cid) => {
          const code = this._getCourse(cid, context)?.code || `Kurs ${cid}`;
          const isAssigned = assignedCourseIds.has(String(cid));
          const activeDays = this._getActiveCourseDays(slotId, cid, context);
          const examDate =
            activeDays && activeDays.length > 0
              ? activeDays[activeDays.length - 1]
              : null;
          const isExam = examDate === dateStr;
          
          let baseClass = "segment-compatible-free";
          if (isAssigned) {
            baseClass = "segment-assigned";
          } else if (isOccupied) {
            baseClass = "segment-compatible-occupied";
          }

          const availabilityClass = isUnavailable ? "course-unavailable" : "";
          const classNameSuffix = [baseClass, availabilityClass]
            .filter(Boolean)
            .join(" ");

          return { 
            text: code, 
            classNameSuffix,
            badgeText: isExam ? "Tenta" : null
          };
        });
      }
    }

    return { className, title, content, segments };
  }

  /**
   * Decide presentation for an overview cell (slot-level view).
   */
  static getOverviewCellPresentation({
    teacher,
    slot,
    slotDate,
    context = null,
  }) {
    const compatibleCourseIds = teacher.compatible_courses || [];
    const runsInSlot = this._getRunsInSlot(slot.slot_id, context);
    const compatibleRuns = runsInSlot.filter((r) =>
      compatibleCourseIds.includes(r.course_id)
    );
    const assignedRuns = runsInSlot.filter(
      (r) => r.teachers && r.teachers.includes(teacher.teacher_id)
    );

    const isAssigned = assignedRuns.length > 0;
    const isUnavailable = context
      ? this._isTeacherUnavailable(
          teacher.teacher_id,
          slot.slot_id,
          slotDate,
          context
        )
      : store.isTeacherUnavailable(teacher.teacher_id, slotDate, slot.slot_id);

    const slotDays = this._getSlotDays(slot.slot_id, context);
    const slotDaySet = this._getSlotDaySet(slot.slot_id, context);
    const hasSlotBusyEntry = this._hasSlotBusyEntry(
      teacher.teacher_id,
      slot.slot_id,
      context
    );
    const daySet = this._getTeacherDaySet(teacher.teacher_id, context);
    const isUnavailableOnDay = (day) =>
      hasSlotBusyEntry || daySet.has(this._normalizeDate(day));
    const unavailableDaysInSlot = hasSlotBusyEntry
      ? slotDays
      : slotDays.filter((d) => daySet.has(this._normalizeDate(d)));

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
    
    const unavailablePercentage = context
      ? this._getUnavailablePercentage(
          teacher.teacher_id,
          slot.slot_id,
          slotDate,
          context
        )
      : store.getTeacherUnavailablePercentageForSlot(
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
        const activeDays = (this._getActiveCourseDays(
          slot.slot_id,
          courseId,
          context
        ) || []).filter((d) => slotDaySet.has(this._normalizeDate(d)));
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

  static _normalizeDate(value) {
    if (!value) return "";
    const raw = String(value);
    const splitOnT = raw.split("T")[0];
    return splitOnT.split(" ")[0];
  }

  static _getSlotDays(slotId, context) {
    if (!context) {
      return (store.getSlotDays(slotId) || [])
        .map((d) => this._normalizeDate(d))
        .filter(Boolean);
    }
    const key = String(slotId);
    return context.slotDaysBySlotId.get(key) || [];
  }

  static _getSlotDaySet(slotId, context) {
    if (!context) {
      return new Set(this._getSlotDays(slotId, null));
    }
    const key = String(slotId);
    return context.slotDaysSetBySlotId.get(key) || new Set();
  }

  static _getTeacherDaySet(teacherId, context) {
    if (!context) {
      const normalized = new Set();
      (store.teacherAvailability || []).forEach((a) => {
        if (!a || a.type !== "busy" || a.slot_id) return;
        if (String(a.teacher_id) !== String(teacherId)) return;
        const date = this._normalizeDate(a.from_date);
        if (date) normalized.add(date);
      });
      return normalized;
    }
    return context.dayBusyByTeacher.get(String(teacherId)) || new Set();
  }

  static _hasSlotBusyEntry(teacherId, slotId, context) {
    if (!context) {
      return (store.teacherAvailability || []).some(
        (a) =>
          String(a.teacher_id) === String(teacherId) &&
          String(a.slot_id) === String(slotId) &&
          a.type === "busy"
      );
    }
    const slotSet = context.slotBusyByTeacher.get(String(teacherId));
    if (!slotSet) return false;
    return slotSet.has(String(slotId));
  }

  static _isTeacherUnavailable(teacherId, slotId, slotDate, context) {
    if (this._hasSlotBusyEntry(teacherId, slotId, context)) return true;
    const days = this._getSlotDays(slotId, context);
    if (days.length === 0) return false;
    const daySet = this._getTeacherDaySet(teacherId, context);
    let count = 0;
    for (const day of days) {
      if (daySet.has(this._normalizeDate(day))) {
        count += 1;
      }
    }
    return count > 0 && count === days.length;
  }

  static _getUnavailablePercentage(teacherId, slotId, slotDate, context) {
    if (this._hasSlotBusyEntry(teacherId, slotId, context)) return 1.0;
    const days = this._getSlotDays(slotId, context);
    if (days.length === 0) return 0;
    const daySet = this._getTeacherDaySet(teacherId, context);
    let count = 0;
    for (const day of days) {
      if (daySet.has(this._normalizeDate(day))) {
        count += 1;
      }
    }
    return count / days.length;
  }

  static _isDayUnavailableConsideringSlot(
    teacherId,
    dateStr,
    slotId,
    slotDate,
    context
  ) {
    if (this._hasSlotBusyEntry(teacherId, slotId, context)) return true;
    const daySet = this._getTeacherDaySet(teacherId, context);
    return daySet.has(this._normalizeDate(dateStr));
  }

  static _getRunsInSlot(slotId, context) {
    if (!context) {
      return TeacherAvailabilityService.getRunsCoveringSlotId(
        store.getCourseRuns(),
        slotId
      );
    }
    return context.runsBySlotId.get(String(slotId)) || [];
  }

  static _getSlotCourseIdSet(slotId, context) {
    if (!context) {
      const courseIds = new Set();
      (this._getRunsInSlot(slotId, null) || []).forEach((run) => {
        if (run?.course_id == null) return;
        courseIds.add(String(run.course_id));
      });
      return courseIds;
    }
    return context.slotCourseIdsBySlotId.get(String(slotId)) || new Set();
  }

  static _getCourse(courseId, context) {
    if (!context) return store.getCourse(courseId);
    return context.courseById.get(String(courseId));
  }

  static _getTeacher(teacherId, context) {
    if (!context) return store.getTeacher(teacherId);
    return context.teacherById.get(String(teacherId));
  }

  static _getActiveCourseDays(slotId, courseId, context) {
    if (!context) return store.getActiveCourseDaysInSlot(slotId, courseId);
    const key = `${slotId}:${courseId}`;
    if (!context.activeCourseDaysByKey.has(key)) {
      const days = (store.getActiveCourseDaysInSlot(slotId, courseId) || [])
        .map((d) => this._normalizeDate(d))
        .filter(Boolean);
      context.activeCourseDaysByKey.set(key, days);
    }
    return context.activeCourseDaysByKey.get(key) || [];
  }
}
