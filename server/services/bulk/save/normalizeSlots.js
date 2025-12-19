import { dedupeSlots } from "../transform/dedupeSlots.js";

export function normalizeSlots(slots = []) {
  const { dedupedSlots, slotIdMapping } = dedupeSlots(slots);
  const remapSlotId = (id) => (id == null ? id : slotIdMapping.get(id) ?? id);

  const orderedSlotsForSpan = dedupedSlots
    .map((s) => ({ slot_id: s.slot_id, start_date: s.start_date }))
    .sort(
      (a, b) =>
        new Date(a.start_date) - new Date(b.start_date) ||
        Number(a.slot_id) - Number(b.slot_id)
    );

  return { dedupedSlots, remapSlotId, orderedSlotsForSpan };
}

