// src/features/cohorts/store/cohorts.manager.js
export class CohortsManager {
  constructor(events, courseRunsManager) {
    this.events = events;
    this.courseRunsManager = courseRunsManager;
    this.cohorts = [];
  }

  load(cohorts) {
    this.cohorts = cohorts || [];
  }

  renumberCohorts() {
    // Sort cohorts by start_date
    const sortedCohorts = [...this.cohorts].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );

    // Assign sequential names
    sortedCohorts.forEach((cohort, index) => {
      cohort.name = `Kull ${index + 1}`;
    });

    // Update the cohorts array with the renamed cohorts
    this.cohorts = sortedCohorts;
  }

  async addCohort(cohort) {
    const id = Math.max(...this.cohorts.map((c) => c.cohort_id), 0) + 1;
    const newCohort = {
      cohort_id: id,
      name: cohort.name || "",
      start_date: cohort.start_date || "",
      planned_size: cohort.planned_size || 0,
    };
    this.cohorts.push(newCohort);

    this.renumberCohorts();

    this.events.notify();
    return newCohort;
  }

  getCohorts() {
    return this.cohorts;
  }

  getCohort(cohortId) {
    return this.cohorts.find((c) => c.cohort_id === cohortId);
  }

  async updateCohort(cohortId, updates) {
    const index = this.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.cohorts[index] = { ...this.cohorts[index], ...updates };

      // If start_date changed, renumber all cohorts
      if (updates.start_date) {
        this.renumberCohorts();
      }

      this.events.notify();
      return this.cohorts[index];
    }
    return null;
  }

  async deleteCohort(cohortId) {
    const index = this.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.cohorts.splice(index, 1);

      // Remove this cohort from all course runs and cleanup empty runs
      this.courseRunsManager.deleteRunsForCohort(cohortId);

      // Renumber remaining cohorts
      this.renumberCohorts();

      this.events.notify();
      return true;
    }
    return false;
  }
}
