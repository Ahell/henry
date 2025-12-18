import { store } from "../platform/store/DataStore.js";

/**
 * Clone the current store snapshot so we can restore it on rollback.
 */
export function cloneDataSnapshot() {
  const snapshot = store.dataServiceManager.getDataSnapshot();
  // The snapshot only contains plain data structures, so JSON cloning is sufficient.
  return JSON.parse(JSON.stringify(snapshot));
}

/**
 * Start an optimistic mutation and register a rollback that rehydrates
 * the store with a captured snapshot if persistence fails.
 */
export function beginOptimisticMutation(label = "optimistic-mutation") {
  const snapshot = cloneDataSnapshot();
  return store.applyOptimistic({
    label,
    rollback: () => store.dataServiceManager.hydrate(snapshot),
  });
}
