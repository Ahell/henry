import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";

/**
 * Cohort Service
 * Complete cohort business logic and form processing
 */
export class CohortService {
  static async _withAutoSaveSuspended(fn) {
    store.beginAutoSaveSuspension();
    try {
      return await fn();
    } finally {
      store.endAutoSaveSuspension();
    }
  }
  /**
   * Check if a cohort start date is unique
   * @param {string} startDate - The start date to check
   * @param {number|null} excludeCohortId - ID to exclude from check (for updates)
   * @returns {boolean} True if unique
   */
  static isCohortStartDateUnique(startDate, excludeCohortId = null) {
    if (!startDate) return true;

    return !(store.getCohorts() || []).some((c) => {
      if (
        excludeCohortId != null &&
        String(c.cohort_id) === String(excludeCohortId)
      ) {
        return false;
      }
      return c.start_date === startDate;
    });
  }

  /**
   * Create a new cohort with optimistic updates
   * @param {Object} cohortData - Cohort data
   * @returns {Object} Created cohort and mutation ID
   */
  static createCohort(cohortData) {
    const startDate = cohortData?.start_date;
    if (!startDate) throw new Error("Startdatum måste anges.");
    
    if (!this.isCohortStartDateUnique(startDate)) {
      throw new Error("En kull med detta startdatum finns redan.");
    }

    if (!Number.isFinite(cohortData.planned_size) || cohortData.planned_size <= 0) {
      throw new Error("Planerat antal studenter måste vara ett positivt tal.");
    }

    const result = BaseFormService.create("add-cohort", cohortData, {
      add: (data) => store.addCohort(data),
      delete: (id) => store.deleteCohort(id),
      getIdField: "cohort_id",
    });

    return { cohort: result.entity, mutationId: result.mutationId };
  }

  /**
   * Update an existing cohort
   * @param {number} cohortId - Cohort ID
   * @param {Object} cohortData - Updated cohort data
   * @returns {Object} Updated cohort and mutation ID
   */
  static updateCohort(cohortId, cohortData) {
    const existing = store.getCohort(cohortId);
    if (!existing) {
      throw new Error(`Cohort ${cohortId} not found`);
    }

    const nextDate = cohortData?.start_date ?? existing.start_date;
    
    if (!this.isCohortStartDateUnique(nextDate, cohortId)) {
      throw new Error("En kull med detta startdatum finns redan.");
    }

    if (cohortData.planned_size !== undefined && (!Number.isFinite(cohortData.planned_size) || cohortData.planned_size <= 0)) {
      throw new Error("Planerat antal studenter måste vara ett positivt tal.");
    }

    const result = BaseFormService.update("update-cohort", cohortId, cohortData, {
      get: (id) => store.getCohort(id),
      update: (id, data) => store.updateCohort(id, data),
    });

    return { cohort: result.entity, mutationId: result.mutationId };
  }

  /**
   * Delete a cohort
   * @param {number} cohortId - Cohort ID
   * @returns {Object} Mutation info
   */
  static deleteCohort(cohortId) {
    return BaseFormService.delete("delete-cohort", cohortId, {
      delete: (id) => store.deleteCohort(id),
    });
  }

  /**
   * Save a new cohort
   * @param {Object} formData - Form data
   * @returns {Object} Created cohort
   */
  static async saveNewCohort(formData) {
    return this._withAutoSaveSuspended(async () => {
      const { cohort, mutationId } = this.createCohort({
        start_date: formData.start_date,
        planned_size: formData.planned_size,
      });

      await store.saveData({ mutationId });
      return cohort;
    });
  }

  /**
   * Save an updated cohort
   * @param {number} cohortId - Cohort ID
   * @param {Object} formData - Updated form data
   * @returns {Object} Updated cohort
   */
  static async saveUpdatedCohort(cohortId, formData) {
    return this._withAutoSaveSuspended(async () => {
      const { cohort, mutationId } = this.updateCohort(cohortId, {
        start_date: formData.start_date,
        planned_size: formData.planned_size,
      });

      await store.saveData({ mutationId });
      return cohort;
    });
  }

  /**
   * Delete cohort by ID
   * @param {number} cohortId - Cohort ID
   * @returns {boolean} Success status
   */
  static async deleteCohortById(cohortId) {
    return this._withAutoSaveSuspended(async () => {
      const { removed, mutationId } = this.deleteCohort(cohortId);
      if (!removed) return false;
      await store.saveData({ mutationId });
      return true;
    });
  }

  /**
   * Get all cohorts
   * @returns {Array} Array of cohort objects
   */
  static getCohorts() {
    return store.getCohorts();
  }
}
