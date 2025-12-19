import { getConsecutiveSlotIds } from "../../../db/index.js";

export function buildCourseRunSlotsRows({
  dedupedCourseSlots,
  orderedSlotsForSpan,
  remapSlotId,
  runSlotOverridesInput,
}) {
  const runSlotOverrides = buildRunSlotOverrides(runSlotOverridesInput, remapSlotId);

  const rows = [];
  (dedupedCourseSlots || []).forEach((cs) => {
    if (cs.cohort_slot_course_id == null) return;
    const primarySlotId = remapSlotId(cs.slot_id);
    if (primarySlotId == null) return;

    const slotIds = computeSlotIdsForRun({
      primarySlotId,
      span: Number(cs.slot_span) || 1,
      runId: cs.cohort_slot_course_id,
      orderedSlotsForSpan,
      runSlotOverrides,
      remapSlotId,
    });

    slotIds.forEach((slotId, idx) =>
      rows.push({ run_id: cs.cohort_slot_course_id, slot_id: slotId, sequence: idx + 1 })
    );
  });

  return rows;
}

function buildRunSlotOverrides(input, remapSlotId) {
  const map = new Map();
  (Array.isArray(input) ? input : []).forEach((rs) => {
    if (rs.run_id == null || rs.slot_id == null) return;
    const list = map.get(rs.run_id) || [];
    list.push(remapSlotId(rs.slot_id));
    map.set(rs.run_id, list);
  });
  return map;
}

function computeSlotIdsForRun({
  primarySlotId,
  span,
  runId,
  orderedSlotsForSpan,
  runSlotOverrides,
  remapSlotId,
}) {
  const overrides = runSlotOverrides.get(runId);
  if (overrides && overrides.length > 0) {
    return Array.from(
      new Set(overrides.filter((sid) => sid != null).map((sid) => remapSlotId(sid)))
    );
  }

  return getConsecutiveSlotIds(remapSlotId(primarySlotId), span, orderedSlotsForSpan).filter(
    (sid) => sid != null
  );
}

