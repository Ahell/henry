// Public API for cohorts feature
export { CohortsManager } from '../../platform/store/managers/cohorts.manager.js';
export { CohortsTab } from './components/cohorts-tab.js';

// Optional: Create hooks for easier consumption
export function useCohortsStore(store) {
  return {
    cohorts: store.cohortsManager.getCohorts(),
    addCohort: (c) => store.cohortsManager.addCohort(c),
    updateCohort: (id, u) => store.cohortsManager.updateCohort(id, u),
    deleteCohort: (id) => store.cohortsManager.deleteCohort(id),
  };
}
