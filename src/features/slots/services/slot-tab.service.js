import { store } from "../../../platform/store/DataStore.js";
import { defaultSlotEndDate, normalizeDateOnly } from "../../../utils/date-utils.js";
import { beginOptimisticMutation } from "../../../utils/mutation-helpers.js";

export async function createSlot(slotData) {
  // Ensure the slot has both start and end dates before persisting.
  const startStr = normalizeDateOnly(slotData.start_date);
  const endStr =
    normalizeDateOnly(slotData.end_date) ||
    normalizeDateOnly(defaultSlotEndDate(slotData.start_date));
  if (!startStr || !endStr) {
    throw new Error("Slot behöver giltigt start- och slutdatum.");
  }

  const mutationId = beginOptimisticMutation("add-slot");
  try {
    const newSlot = store.addSlot({
      ...slotData,
      start_date: startStr,
      end_date: endStr,
    });
    return { slot: newSlot, mutationId };
  } catch (error) {
    await store.rollback(mutationId);
    throw error;
  }
}

export async function deleteSlot(slotId) {
  const existing = store.getSlot(slotId);
  if (!existing) {
    return { removed: false, mutationId: null };
  }

  const mutationId = beginOptimisticMutation("delete-slot");

  try {
    const removed = store.deleteSlot(slotId);
    return { removed, mutationId };
  } catch (error) {
    await store.rollback(mutationId);
    throw error;
  }
}
