import { store } from "../../../platform/store/DataStore.js";
import { defaultSlotEndDate, normalizeDateOnly } from "../../../utils/date-utils.js";
import { SlotsFormService } from "./slots-form.service.js";

export async function createSlot(slotData) {
  // Ensure the slot has both start and end dates before persisting.
  const startStr = normalizeDateOnly(slotData.start_date);
  const endStr =
    normalizeDateOnly(slotData.end_date) ||
    normalizeDateOnly(defaultSlotEndDate(slotData.start_date));
  if (!startStr || !endStr) {
    throw new Error("Slot behöver giltigt start- och slutdatum.");
  }

  const { slot, mutationId } = SlotsFormService.createSlot({
    ...slotData,
    start_date: startStr,
    end_date: endStr,
  });

  await store.saveData({ mutationId });
  return slot;
}

export async function deleteSlot(slotId) {
  const existing = store.getSlot(slotId);
  if (!existing) {
    return false;
  }

  const { removed, mutationId } = SlotsFormService.deleteSlot(slotId);

  if (!removed) {
    await store.rollback(mutationId);
    return false;
  }

  await store.saveData({ mutationId });
  return true;
}
