/**
 * Return true if a course run covers the given slot_id.
 * Backend provides `slot_ids` for runs that span multiple slots (e.g. 15hp => 2 slots).
 */
export function runCoversSlotId(run, slotId) {
  if (!run || slotId == null) return false;

  if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
    return run.slot_ids.some((id) => String(id) === String(slotId));
  }

  return String(run.slot_id) === String(slotId);
}

export function getRunsCoveringSlotId(courseRuns, slotId) {
  if (!Array.isArray(courseRuns)) return [];
  return courseRuns.filter((run) => runCoversSlotId(run, slotId));
}

