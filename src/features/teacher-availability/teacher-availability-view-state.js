import { store } from "../../utils/store.js";

export const enterDetailView = (component, slotDate, slotId) => {
  component._detailSlotDate = slotDate;
  component._detailSlotId = slotId;
  component.requestUpdate();
};

export const exitDetailView = (component) => {
  component._detailSlotDate = null;
  component._detailSlotId = null;
  component._isEditingExamDate = false;
  component.requestUpdate();
};

export const toggleExamDateEditing = (component) => {
  component._isEditingExamDate = !component._isEditingExamDate;
  if (component._isEditingExamDate) {
    store.unlockExamDate(component._detailSlotId);
  } else {
    store.lockExamDate(component._detailSlotId);
  }
  component.requestUpdate();
};

export const setExamDate = (component, dateStr) => {
  store.setExamDate(component._detailSlotId, dateStr);
  component._isEditingExamDate = false;
  store.lockExamDate(component._detailSlotId);
  component.requestUpdate();
};

export const toggleTeachingDay = (component, dateStr) => {
  store.toggleTeachingDay(component._detailSlotId, dateStr);
  component.requestUpdate();
};
