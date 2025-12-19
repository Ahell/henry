import { idForCompare, normalizeId } from "./idUtils.js";

export function dedupeSlots(inputSlots = []) {
  const bySignature = new Map();
  const idMapping = new Map();

  (inputSlots || []).forEach((slot) => {
    const normalized = normalizeSlot(slot);
    const sig = `${normalized.start_date}|${normalized.end_date}`;

    const existing = bySignature.get(sig);
    if (!existing) {
      bySignature.set(sig, normalized);
      ensureSelfMapping(idMapping, normalized.slot_id);
      return;
    }

    const keep =
      idForCompare(existing.slot_id) <= idForCompare(normalized.slot_id)
        ? existing
        : normalized;
    const drop = keep === existing ? normalized : existing;
    bySignature.set(sig, keep);

    if (drop.slot_id != null && keep.slot_id != null) {
      idMapping.set(drop.slot_id, keep.slot_id);
    }
    ensureSelfMapping(idMapping, keep.slot_id);
  });

  const dedupedSlots = Array.from(bySignature.values()).sort((a, b) => {
    const dateDiff = new Date(a.start_date) - new Date(b.start_date);
    if (dateDiff !== 0) return dateDiff;
    return idForCompare(a.slot_id) - idForCompare(b.slot_id);
  });

  return { dedupedSlots, slotIdMapping: idMapping };
}

function normalizeSlot(slot) {
  return {
    ...slot,
    slot_id: normalizeId(slot?.slot_id),
    start_date: slot?.start_date ?? "",
    end_date: slot?.end_date ?? "",
  };
}

function ensureSelfMapping(idMapping, id) {
  if (id != null && !idMapping.has(id)) idMapping.set(id, id);
}

