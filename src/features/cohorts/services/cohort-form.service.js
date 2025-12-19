import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";

/**
 * Cohort Form Service
 * Handles cohort creation, update, and delete logic with optimistic updates
 */
export class CohortFormService {
  /**
   * Create a new cohort
   * @param {Object} cohortData - Cohort data
   * @returns {Object} Created cohort and mutation ID
   */
  static createCohort(cohortData) {
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
}
