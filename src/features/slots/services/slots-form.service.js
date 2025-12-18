import { store } from "../../../platform/store/DataStore.js";

/**
 * Slots Form Service
 * Handles slot creation and delete logic with optimistic updates
 */
export class SlotsFormService {
  /**
   * Create a new slot
   * @param {Object} slotData - Slot data
   * @returns {Object} Created slot and mutation ID
   */
  static createSlot(slotData) {
    let newSlot = null;

    const mutationId = store.applyOptimistic({
      label: "add-slot",
      rollback: () => {
        if (newSlot && newSlot.slot_id) {
          store.deleteSlot(newSlot.slot_id);
        }
      },
    });

    newSlot = store.addSlot(slotData);
    return { slot: newSlot, mutationId };
  }

  /**
   * Delete a slot
   * @param {number} slotId - Slot ID
   * @returns {Object} Mutation info
   */
  static deleteSlot(slotId) {
    const mutationId = store.applyOptimistic({
      label: "delete-slot",
    });

    const removed = store.deleteSlot(slotId);
    return { removed, mutationId };
  }
}
