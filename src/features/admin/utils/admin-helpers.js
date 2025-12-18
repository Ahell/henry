/**
 * Admin feature helpers - store-coupled utilities for admin tab components.
 */

import { store } from "../../../platform/store/DataStore.js";

/**
 * Initialize edit state properties for a component.
 * Call this in the component's constructor.
 * @param {LitElement} component - The component to initialize
 * @param {string} editingProperty - Name of the editing ID property
 */
export function initializeEditState(component, editingProperty = "editingId") {
  component[editingProperty] = null;
  component.message = "";
  component.messageType = "";
}

/**
 * Subscribe component to store updates.
 * Call this in the component's constructor after initializeEditState.
 * @param {LitElement} component - The component to subscribe
 */
export function subscribeToStore(component) {
  console.log("🔵 Subscribing component:", component.constructor.name);
  store.subscribe(() => {
    console.log(
      "🔵 Store changed, updating component:",
      component.constructor.name
    );
    if (component.cohorts !== undefined) {
      const newCohorts = store.getCohorts();
      console.log(
        "🔵 Updating cohorts from",
        component.cohorts.length,
        "to",
        newCohorts.length
      );
      component.cohorts = newCohorts;
    }
    console.log("🔵 Calling requestUpdate");
    component.requestUpdate();
  });
}
