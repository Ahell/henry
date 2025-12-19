import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";

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
    const result = BaseFormService.create("add-slot", slotData, {
      add: (data) => store.addSlot(data),
      delete: (id) => store.deleteSlot(id),
      getIdField: "slot_id",
    });

    return { slot: result.entity, mutationId: result.mutationId };
  }

  /**
   * Delete a slot
   * @param {number} slotId - Slot ID
   * @returns {Object} Mutation info
   */
  static deleteSlot(slotId) {
    return BaseFormService.delete("delete-slot", slotId, {
      delete: (id) => store.deleteSlot(id),
    });
  }
}
