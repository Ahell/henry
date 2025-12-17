// Public API for slots feature
export { SlotsManager } from './store/slots.manager.js';
export { SlotsTab } from './components/slots-tab.js';

// Optional: Create hooks for easier consumption
export function useSlotsStore(store) {
  return {
    slots: store.slotsManager.getSlots(),
    addSlot: (s) => store.slotsManager.addSlot(s),
    getSlot: (id) => store.slotsManager.getSlot(id),
    deleteSlot: (id) => store.slotsManager.deleteSlot(id),
  };
}
