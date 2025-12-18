import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CohortFormService } from "./cohort-form.service.js";

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

  const { cohort, mutationId } = CohortFormService.createCohort({
    start_date: formData.start_date,
    planned_size: formData.planned_size,
  });

  await store.saveData({ mutationId });
  return cohort;
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

  const { mutationId } = CohortFormService.updateCohort(cohortId, {
    start_date: formData.start_date,
    planned_size: formData.planned_size,
  });

  await store.saveData({ mutationId });
}

export async function deleteCohortById(cohortId) {
  const { removed, mutationId } = CohortFormService.deleteCohort(cohortId);

  if (!removed) {
    await store.rollback(mutationId);
    return false;
  }

  await store.saveData({ mutationId });
  return true;
}

export function resetCohortForm(root) {
  FormService.clearCustomForm(root, ["cohortStartDate", "cohortSize"]);
  FormService.setCustomInput(root, "cohortSize", DEFAULT_SIZE);
}
