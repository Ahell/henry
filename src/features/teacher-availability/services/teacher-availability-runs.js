import { store } from "../../../platform/store/DataStore.js";
import { getRunsCoveringSlotId } from "./run-coverage.js";

export const removeTeacherFromRunsInSlot = (teacherId, slotDate, slots) => {
  const slot = slots.find((s) => s.start_date === slotDate);
  if (!slot) return;

  const runsInSlot = getRunsCoveringSlotId(store.getCourseRuns(), slot.slot_id);

  for (const run of runsInSlot) {
    if (run.teachers && run.teachers.includes(teacherId)) {
      run.teachers = run.teachers.filter((id) => id !== teacherId);
    }
  }
};
