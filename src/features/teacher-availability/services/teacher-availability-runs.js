import { store } from "../../../platform/store/DataStore.js";

export const removeTeacherFromRunsInSlot = (teacherId, slotDate, slots) => {
  const slot = slots.find((s) => s.start_date === slotDate);
  if (!slot) return;

  const runsInSlot = store
    .getCourseRuns()
    .filter((r) => r.slot_id === slot.slot_id);

  for (const run of runsInSlot) {
    if (run.teachers && run.teachers.includes(teacherId)) {
      run.teachers = run.teachers.filter((id) => id !== teacherId);
    }
  }
};
