import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";
import {
  normalizeDateOnly,
  defaultSlotEndDate,
  DEFAULT_SLOT_LENGTH_DAYS,
} from "../../../utils/date-utils.js";

/**
 * Slot Service
 * Complete slot business logic and form processing
 */
export class SlotService {
  /**
   * Create a new slot
   * @param {Object} slotData - Slot data
   * @returns {Object} Created slot and mutation ID
   */
  static createSlot(slotData) {
    // Ensure the slot has both start and end dates before persisting.
    const startStr = normalizeDateOnly(slotData.start_date);
    const endStr =
      normalizeDateOnly(slotData.end_date) ||
      normalizeDateOnly(defaultSlotEndDate(slotData.start_date));
    
    if (!startStr || !endStr) {
      throw new Error("Slot behöver giltigt start- och slutdatum.");
    }

    const result = BaseFormService.create("add-slot", {
      ...slotData,
      start_date: startStr,
      end_date: endStr,
    }, {
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

  /**
   * Save a new slot
   * @param {Object} formData - Form data
   * @returns {Object} Created slot
   */
  static async saveNewSlot(formData) {
    const { slot, mutationId } = this.createSlot({
      start_date: formData.start_date,
    });

    await store.saveData({ mutationId });
    return slot;
  }

  /**
   * Delete slot by ID
   * @param {number} slotId - Slot ID
   * @returns {boolean} Success status
   */
  static async deleteSlotById(slotId) {
    const existing = store.getSlot(slotId);
    if (!existing) return false;

    const { removed, mutationId } = this.deleteSlot(slotId);
    if (!removed) {
      await store.rollback(mutationId);
      return false;
    }
    await store.saveData({ mutationId });
    return true;
  }

  /**
   * Get all slots
   * @returns {Array} Array of slot objects
   */
  static getSlots() {
    return store.getSlots() || [];
  }

  /**
   * Get options for "Insert After" dropdown
   * @returns {Array} Array of options {value, label}
   */
  static getInsertAfterOptions() {
    const sorted = this.getSlots()
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    return sorted.map((s, i) => ({
      value: String(s.slot_id),
      label: `Efter kursperiod ${i + 1} — ${s.start_date}`,
    }));
  }

  /**
   * Calculate available start dates based on insertion point
   * @param {string|number} insertAfterId - ID of the slot to insert after
   * @returns {Array} Array of date strings or empty array if none available
   */
  static getAvailableStartDates(insertAfterId) {
    const slots = this.getSlots()
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    const idx = slots.findIndex((s) => String(s.slot_id) === String(insertAfterId));

    if (!insertAfterId || idx === -1) {
      return [];
    }

    const prev = slots[idx];
    const next = slots[idx + 1] || null;

    // Allowed range: the day after prev ends through the latest day that keeps a 28-day slot before next starts
    const min = new Date(defaultSlotEndDate(prev.start_date));
    min.setDate(min.getDate() + 1);

    const max = next
      ? (() => {
          const nextStart = new Date(next.start_date);
          const latest = new Date(nextStart);
          latest.setDate(latest.getDate() - (DEFAULT_SLOT_LENGTH_DAYS - 1));
          return latest;
        })()
      : (() => {
          const latest = new Date(min);
          latest.setFullYear(latest.getFullYear() + 1);
          return latest;
        })();

    if (max < min) {
      return [];
    }

    const opts = [];
    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
      opts.push(formatDate(new Date(d)));
    }

    return opts;
  }
}
