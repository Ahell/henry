import { store } from "../../../platform/store/DataStore.js";

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
    let newCohort = null;

    const mutationId = store.applyOptimistic({
      label: "add-cohort",
      rollback: () => {
        if (newCohort && newCohort.cohort_id) {
          store.deleteCohort(newCohort.cohort_id);
        }
      },
    });

    newCohort = store.addCohort(cohortData);
    return { cohort: newCohort, mutationId };
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

    const previous = { ...existing };

    const mutationId = store.applyOptimistic({
      label: "update-cohort",
      rollback: () => {
        store.updateCohort(cohortId, previous);
      },
    });

    const updated = store.updateCohort(cohortId, cohortData);
    return { cohort: updated, mutationId };
  }

  /**
   * Delete a cohort
   * @param {number} cohortId - Cohort ID
   * @returns {Object} Mutation info
   */
  static deleteCohort(cohortId) {
    const mutationId = store.applyOptimistic({
      label: "delete-cohort",
    });

    const removed = store.deleteCohort(cohortId);
    return { removed, mutationId };
  }
}
