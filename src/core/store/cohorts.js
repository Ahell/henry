// src/utils/store/cohorts.js
export class CohortsManager {
  constructor(store) {
    this.store = store; // Reference to main DataStore for shared state/services
  }

  load(cohorts) {
    this.store.cohorts = cohorts || [];
  }

  renumberCohorts() {
    // Sort cohorts by start_date
    const sortedCohorts = [...this.store.cohorts].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );

    // Assign sequential names
    sortedCohorts.forEach((cohort, index) => {
      cohort.name = `Kull ${index + 1}`;
    });

    // Update the cohorts array with the renamed cohorts
    this.store.cohorts = sortedCohorts;
  }

  async addCohort(cohort) {
    console.log("🟢 addCohort called with:", cohort);
    const id = Math.max(...this.store.cohorts.map((c) => c.cohort_id), 0) + 1;
    const newCohort = {
      cohort_id: id,
      name: cohort.name || "",
      start_date: cohort.start_date || "",
      planned_size: cohort.planned_size || 0,
    };
    this.store.cohorts.push(newCohort);
    console.log("🟢 Cohorts after push:", this.store.cohorts.length);

    this.renumberCohorts();
    console.log(
      "🟢 Cohorts after renumber:",
      this.store.cohorts.map((c) => c.name)
    );

    console.log(
      "🟢 Calling notify with",
      this.store.listeners.length,
      "listeners"
    );
    this.store.notify();
    console.log("🟢 addCohort complete");
    return newCohort;
  }

  getCohorts() {
    return this.store.cohorts;
  }

  getCohort(cohortId) {
    return this.store.cohorts.find((c) => c.cohort_id === cohortId);
  }

  async updateCohort(cohortId, updates) {
    const index = this.store.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.store.cohorts[index] = { ...this.store.cohorts[index], ...updates };

      // If start_date changed, renumber all cohorts
      if (updates.start_date) {
        this.renumberCohorts();
      }

      this.store.notify();
      return this.store.cohorts[index];
    }
    return null;
  }

  async deleteCohort(cohortId) {
    const index = this.store.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.store.cohorts.splice(index, 1);

      // Remove this cohort from all course runs and cleanup empty runs
      this.store.courseRunsManager.deleteRunsForCohort(cohortId);

      // Renumber remaining cohorts
      this.renumberCohorts();

      this.store.notify();
      return true;
    }
    return false;
  }
}
