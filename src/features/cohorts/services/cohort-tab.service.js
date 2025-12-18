import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { beginOptimisticMutation } from "../../../utils/mutation-helpers.js";

const DEFAULT_SIZE = 30;

export async function createCohortFromForm(root) {
  const formData = FormService.extractFormData(root, {
    start_date: "cohortStartDate",
    planned_size: {
      id: "cohortSize",
      transform: (value) => Number(value),
    },
  });

  if (!formData.start_date) {
    throw new Error("Startdatum måste anges.");
  }
  if (!Number.isFinite(formData.planned_size) || formData.planned_size <= 0) {
    throw new Error("Planerat antal studenter måste vara ett positivt tal.");
  }

  const mutationId = beginOptimisticMutation("add-cohort");
  try {
    const cohort = await store.addCohort({
      start_date: formData.start_date,
      planned_size: formData.planned_size,
    });
    await store.saveData({ mutationId });
    return cohort;
  } catch (error) {
    await store.rollback(mutationId);
    throw error;
  }
}

export async function updateCohortFromForm(root, cohortId) {
  const formData = FormService.extractFormData(root, {
    start_date: "edit-date",
    planned_size: {
      id: "edit-size",
      transform: (value) => Number(value),
    },
  });

  if (!formData.start_date) {
    throw new Error("Startdatum måste anges.");
  }
  if (!Number.isFinite(formData.planned_size) || formData.planned_size <= 0) {
    throw new Error("Planerat antal studenter måste vara ett positivt tal.");
  }

  const mutationId = beginOptimisticMutation("update-cohort");
  try {
    await store.updateCohort(cohortId, {
      start_date: formData.start_date,
      planned_size: formData.planned_size,
    });
    await store.saveData({ mutationId });
  } catch (error) {
    await store.rollback(mutationId);
    throw error;
  }
}

export async function deleteCohortById(cohortId) {
  const mutationId = beginOptimisticMutation("delete-cohort");
  try {
    const removed = await store.deleteCohort(cohortId);
    if (!removed) {
      await store.rollback(mutationId);
      return false;
    }
    await store.saveData({ mutationId });
    return true;
  } catch (error) {
    await store.rollback(mutationId);
    throw error;
  }
}

export function resetCohortForm(root) {
  FormService.clearCustomForm(root, ["cohortStartDate", "cohortSize"]);
  FormService.setCustomInput(root, "cohortSize", DEFAULT_SIZE);
}
