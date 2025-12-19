import { store } from "../../../platform/store/DataStore.js";

export const enterDetailView = (component, slotDate, slotId) => {
  component._detailSlotDate = slotDate;
  component._detailSlotId = slotId;
  component.requestUpdate();
};

export const exitDetailView = (component) => {
  component._detailSlotDate = null;
  component._detailSlotId = null;
  component._isEditingExamDate = false;
  component._detailCourseFilter = null;
  component.requestUpdate();
};

export const toggleExamDateEditing = (component) => {
  component._isEditingExamDate = !component._isEditingExamDate;
  if (component._isEditingExamDate) {
    store.unlockExamDate(component._detailSlotId);
  } else {
    store.lockExamDate(component._detailSlotId);
  }
  component.requestUpdate();
};

export const setExamDate = (component, dateStr) => {
  store.setExamDate(component._detailSlotId, dateStr);
  component._isEditingExamDate = false;
  store.lockExamDate(component._detailSlotId);
  component.requestUpdate();
};

export const toggleTeachingDay = (component, dateStr, courseId = null) => {
  if (courseId && courseId !== "all") {
    store.toggleCourseSlotDay(component._detailSlotId, courseId, dateStr);
  } else {
    const slotId = component._detailSlotId;
    const slotCourses = Array.from(
      new Map(
        store
          .getCourseRuns()
          .filter((run) => String(run.slot_id) === String(slotId))
          .map((run) => {
            const course = store.getCourse(run.course_id);
            return [
              run.course_id,
              {
                courseId: run.course_id,
                code: course?.code || "",
                name: course?.name || "",
              },
            ];
          })
      ).values()
    ).filter((c) => c.courseId != null && c.code);

    if (slotCourses.length > 1) {
      const courseList = slotCourses.map((c) => c.code).join(", ");
      const ok = confirm(
        `Ändra undervisningsdag ${dateStr} för ALLA kurser i denna slot?\n\nKurser: ${courseList}`
      );
      if (!ok) return;
    }

    store.toggleTeachingDay(component._detailSlotId, dateStr, null);
  }
  component.requestUpdate();
};
