import { store } from "../../../platform/store/DataStore.js";
import {
  hasBusySlotEntry,
  convertSlotEntryToDayEntriesAndRemove,
} from "./helpers.js";
import { removeTeacherFromRunsInSlot } from "./teacher-availability-runs.js";

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

  // Capture initial state of teacher availability for rollback
  const previousAvailability = store.teacherAvailability.map((entry) => ({
    ...entry,
  }));

  component._availabilityMutationId = store.applyOptimistic({
    label: "teacher-availability",
    rollback: () => {
      store.teacherAvailability = previousAvailability;
    },
  });

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
    const hasSlotEntry = hasBusySlotEntry(
      teacherId,
      component._detailSlotId,
      component._detailSlotDate
    );

    if (hasSlotEntry) {
      const removed = convertSlotEntryToDayEntriesAndRemove(
        component._detailSlotId,
        teacherId,
        date
      );

      component._paintMode = "remove";
      component._isMouseDown = true;
      component.requestUpdate();

      component.dispatchEvent(
        new CustomEvent("availability-changed", {
          detail: { teacherId, date, unavailable: false },
        })
      );
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
    component.requestUpdate();

    component.dispatchEvent(
      new CustomEvent("availability-changed", {
        detail: { teacherId, date, unavailable: !isCurrentlyUnavailable },
      })
    );
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

  if (component._paintMode === "add") {
    removeTeacherFromRunsInSlot(teacherId, slotDateLocal, component.slots);
  }

  store.toggleTeacherAvailabilityForSlot(
    teacherId,
    slotDateLocal,
    slotIdLocal
  );
  component._isMouseDown = true;
  component.requestUpdate();

  component.dispatchEvent(
    new CustomEvent("availability-changed", {
      detail: {
        teacherId,
        slotDate: slotDateLocal,
        unavailable: !isCurrentlyUnavailable,
      },
    })
  );
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
        hasBusySlotEntry(
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
      component.requestUpdate();
      component.dispatchEvent(
        new CustomEvent("availability-changed", {
          detail: { teacherId, date, unavailable: true },
        })
      );
    } else if (
      component._paintMode === "remove" &&
      isCurrentlyUnavailable
    ) {
      const isDayLevel = store.isTeacherUnavailableOnDay(teacherId, date);

      if (!isDayLevel && component._detailSlotDate && component._detailSlotId) {
        convertSlotEntryToDayEntriesAndRemove(
          component._detailSlotId,
          teacherId,
          date
        );
      } else {
        store.toggleTeacherAvailabilityForDay(teacherId, date);
      }

      component.requestUpdate();

      component.dispatchEvent(
        new CustomEvent("availability-changed", {
          detail: { teacherId, date, unavailable: false },
        })
      );
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
    removeTeacherFromRunsInSlot(teacherId, slotDateLocal, component.slots);
    store.toggleTeacherAvailabilityForSlot(
      teacherId,
      slotDateLocal,
      slotIdLocal
    );
    component.requestUpdate();

    component.dispatchEvent(
      new CustomEvent("availability-changed", {
        detail: { teacherId, slotDate: slotDateLocal, unavailable: true },
      })
    );
  } else if (component._paintMode === "remove" && isCurrentlyUnavailable) {
    store.toggleTeacherAvailabilityForSlot(
      teacherId,
      slotDateLocal,
      slotIdLocal
    );
    component.requestUpdate();

    component.dispatchEvent(
      new CustomEvent("availability-changed", {
        detail: { teacherId, slotDate: slotDateLocal, unavailable: false },
      })
    );
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

export function handlePaintChangeRequest(component, e) {
  const payload = e?.detail || {};
  if (payload.isPainting !== undefined) {
    component.isPainting = payload.isPainting;
  }
  if ("paintMode" in payload) {
    component._paintMode = payload.paintMode;
  }

  if (!component.isPainting) {
    component._isMouseDown = false;
    component._paintMode = null;
  }

  component.requestUpdate();
  dispatchPaintState(component);
}
