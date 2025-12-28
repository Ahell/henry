import { store } from "../../../platform/store/DataStore.js";
import { TeacherAvailabilityService } from "./teacher-availability.service.js";

const schedulePaintUpdate = (component) => {
  if (component._paintUpdateScheduled) return;
  component._paintUpdateScheduled = true;
  requestAnimationFrame(() => {
    component._paintUpdateScheduled = false;
    component.requestUpdate();
  });
};

const dispatchPaintState = (component) => {
  component.dispatchEvent(
    new CustomEvent("paint-state-changed", {
      detail: {
        isPainting: !!component.isPainting,
        paintMode: component._paintMode || null,
      },
      bubbles: true,
      composed: true,
    })
  );
};

const getCellEventData = (e) => {
  const d = e.detail || {};
  const resolve = (key) =>
    d[key] !== undefined ? d[key] : e.currentTarget?.dataset?.[key];

  return {
    isDetailView:
      d.isDetail !== undefined
        ? d.isDetail
        : e.currentTarget?.dataset?.isDetail === "true",
    teacherId:
      d.teacherId !== undefined
        ? parseInt(d.teacherId)
        : parseInt(e.currentTarget?.dataset?.teacherId),
    date: resolve("date"),
    slotDate: resolve("slotDate"),
    slotId:
      d.slotId !== undefined
        ? d.slotId
        : parseInt(e.currentTarget?.dataset?.slotId),
    isLocked:
      d.isLocked !== undefined
        ? d.isLocked
        : e.currentTarget?.dataset?.isLocked === "true",
  };
};

const ensureAvailabilityMutation = (component) => {
  if (component._availabilityMutationId) {
    return component._availabilityMutationId;
  }

  // Painting triggers lots of mutations; suspend auto-save during the session
  // and persist once on paint end.
  if (!component._autoSaveSuspendedForPaint) {
    store.beginAutoSaveSuspension();
    component._autoSaveSuspendedForPaint = true;
  }

  // Capture initial state of teacher availability for rollback
  const previousAvailability = store.teacherAvailability.map((entry) => ({
    ...entry,
  }));

  component._availabilityMutationId = store.applyOptimistic({
    label: "teacher-availability",
    rollback: () => {
      store.teacherAvailability = previousAvailability;
      schedulePaintUpdate(component);
    },
  });

  store.markUncommittedChanges();

  return component._availabilityMutationId;
};

const persistAvailabilityMutation = async (component) => {
  if (!component._availabilityMutationId) return;
  const mutationId = component._availabilityMutationId;
  component._availabilityMutationId = null;
  try {
    await store.saveData({ mutationId });
  } catch (err) {
    await store.rollback(mutationId);
    console.error("Failed to spara lärartillgänglighet:", err);
  } finally {
    if (component._autoSaveSuspendedForPaint) {
      store.endAutoSaveSuspension();
      component._autoSaveSuspendedForPaint = false;
    }
  }
};

export function handleCellMouseDown(component, e) {
  if (!component.isPainting) return;
  ensureAvailabilityMutation(component);

  const {
    isDetailView,
    teacherId,
    date,
    slotDate,
    slotId,
    isLocked,
  } = getCellEventData(e);

  if (isDetailView) {
    const hasSlotEntry = TeacherAvailabilityService.hasBusySlotEntry(
      teacherId,
      component._detailSlotId,
      component._detailSlotDate
    );

    if (hasSlotEntry) {
      const removed = TeacherAvailabilityService.convertSlotEntryToDayEntriesAndRemove(
        component._detailSlotId,
        teacherId,
        date
      );

      component._paintMode = "remove";
      component._isMouseDown = true;
      schedulePaintUpdate(component);
      dispatchPaintState(component);
      return;
    }

    const isCurrentlyUnavailable = store.isTeacherUnavailableOnDay(
      teacherId,
      date
    );

    component._paintMode = isCurrentlyUnavailable ? "remove" : "add";

    store.toggleTeacherAvailabilityForDay(teacherId, date);
    component._isMouseDown = true;
    schedulePaintUpdate(component);
    dispatchPaintState(component);
    return;
  }

  const slotDateLocal = slotDate;
  const slotIdLocal = slotId;
  const isLockedLocal = isLocked;
  if (isLockedLocal) {
    return;
  }

  const isCurrentlyUnavailable = store.isTeacherUnavailable(
    teacherId,
    slotDateLocal,
    slotIdLocal
  );

  component._paintMode = isCurrentlyUnavailable ? "remove" : "add";

  store.toggleTeacherAvailabilityForSlot(
    teacherId,
    slotDateLocal,
    slotIdLocal
  );
  component._isMouseDown = true;
  schedulePaintUpdate(component);
  dispatchPaintState(component);
}

export function handleCellMouseEnter(component, e) {
  if (!component.isPainting || !component._isMouseDown || !component._paintMode)
    return;
  ensureAvailabilityMutation(component);

  const {
    isDetailView,
    teacherId,
    date,
    slotDate,
    slotId,
    isLocked,
  } = getCellEventData(e);

  if (isDetailView) {
    let isCurrentlyUnavailable = store.isTeacherUnavailableOnDay(
      teacherId,
      date
    );

    if (
      !isCurrentlyUnavailable &&
      component._detailSlotDate &&
      component._detailSlotId
    ) {
      if (
        TeacherAvailabilityService.hasBusySlotEntry(
          teacherId,
          component._detailSlotId,
          component._detailSlotDate
        )
      ) {
        isCurrentlyUnavailable = true;
      }
    }

    if (component._paintMode === "add" && !isCurrentlyUnavailable) {
      store.toggleTeacherAvailabilityForDay(teacherId, date);
      schedulePaintUpdate(component);
    } else if (
      component._paintMode === "remove" &&
      isCurrentlyUnavailable
    ) {
      const isDayLevel = store.isTeacherUnavailableOnDay(teacherId, date);

      if (!isDayLevel && component._detailSlotDate && component._detailSlotId) {
        TeacherAvailabilityService.convertSlotEntryToDayEntriesAndRemove(
          component._detailSlotId,
          teacherId,
          date
        );
      } else {
        store.toggleTeacherAvailabilityForDay(teacherId, date);
      }

      schedulePaintUpdate(component);
    }
    return;
  }

  const slotDateLocal = slotDate;
  const slotIdLocal = slotId;
  const isLockedLocal = isLocked;
  if (isLockedLocal) {
    return;
  }

  const isCurrentlyUnavailable = store.isTeacherUnavailable(
    teacherId,
    slotDateLocal,
    slotIdLocal
  );

  if (component._paintMode === "add" && !isCurrentlyUnavailable) {
    store.toggleTeacherAvailabilityForSlot(
      teacherId,
      slotDateLocal,
      slotIdLocal
    );
    schedulePaintUpdate(component);
  } else if (component._paintMode === "remove" && isCurrentlyUnavailable) {
    store.toggleTeacherAvailabilityForSlot(
      teacherId,
      slotDateLocal,
      slotIdLocal
    );
    schedulePaintUpdate(component);
  }
}

export async function handlePaintEnd(component) {
  if (component._isMouseDown) {
    component._isMouseDown = false;
    component._paintMode = null;
    component.dispatchEvent(new CustomEvent("paint-session-ended"));
    dispatchPaintState(component);
  }
  await persistAvailabilityMutation(component);
}
