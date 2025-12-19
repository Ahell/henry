import { store } from "../../../platform/store/DataStore.js";

export const enterDetailView = (component, slotDate, slotId) => {
  component._detailSlotDate = slotDate;
  component._detailSlotId = slotId;
  component._applyToAllCourses = true;
  component.dispatchEvent(
    new CustomEvent("detail-view-changed", {
      detail: { active: true, slotId, slotDate },
      bubbles: true,
      composed: true,
    })
  );
  component.requestUpdate();
};

export const exitDetailView = (component) => {
  component._detailSlotDate = null;
  component._detailSlotId = null;
  component._detailCourseFilter = null;
  component._applyToAllCourses = true;
  component.dispatchEvent(
    new CustomEvent("detail-view-changed", {
      detail: { active: false },
      bubbles: true,
      composed: true,
    })
  );
  component.requestUpdate();
};

export const toggleTeachingDay = (component, dateStr, courseId = null) => {
  const slotId = component._detailSlotId;
  const normalizedCourseId =
    courseId == null || courseId === "all" ? null : Number(courseId);

  if (normalizedCourseId != null && !Number.isNaN(normalizedCourseId)) {
    store.toggleCourseSlotDay(slotId, normalizedCourseId, dateStr);
    component.requestUpdate();
    return;
  }

  if (component._applyToAllCourses) {
    const courseIdsInSlot = Array.from(
      new Set(
        store
          .getCourseRuns()
          .filter((run) => String(run.slot_id) === String(slotId))
          .map((run) => run.course_id)
          .filter((id) => id != null)
      )
    );

    if (courseIdsInSlot.length === 0) {
      component.requestUpdate();
      return;
    }

    const perCourse = courseIdsInSlot.map((cid) => ({
      courseId: cid,
      active: store.getTeachingDayState(slotId, dateStr, cid)?.active === true,
    }));

    const allActive = perCourse.every((c) => c.active);
    const desiredActive = !allActive;

    for (const { courseId: cid, active } of perCourse) {
      if (active !== desiredActive) {
        store.toggleCourseSlotDay(slotId, cid, dateStr, { skipNotify: true });
      }
    }

    store.notify();
  }
  component.requestUpdate();
};
