import { idForCompare, normalizeId } from "./idUtils.js";

export function dedupeCohorts(inputCohorts = []) {
  const byStartDate = new Map();
  const idMapping = new Map();
  const normalizeStart = (value) => (value ?? "").toString().trim();

  (inputCohorts || []).forEach((cohort) => {
    const normalized = {
      ...cohort,
      cohort_id: normalizeId(cohort?.cohort_id),
      start_date: normalizeStart(cohort?.start_date),
    };
    const key = normalized.start_date;
    const existing = byStartDate.get(key);

    if (!existing) {
      byStartDate.set(key, normalized);
      ensureSelfMapping(idMapping, normalized.cohort_id);
      return;
    }

    const keep =
      idForCompare(existing.cohort_id) <= idForCompare(normalized.cohort_id)
        ? existing
        : normalized;
    const drop = keep === existing ? normalized : existing;
    byStartDate.set(key, keep);

    if (drop.cohort_id != null && keep.cohort_id != null) {
      idMapping.set(drop.cohort_id, keep.cohort_id);
    }
    ensureSelfMapping(idMapping, keep.cohort_id);
  });

  const dedupedCohorts = Array.from(byStartDate.values()).sort((a, b) => {
    const dateDiff = new Date(a.start_date) - new Date(b.start_date);
    if (dateDiff !== 0) return dateDiff;
    return idForCompare(a.cohort_id) - idForCompare(b.cohort_id);
  });

  dedupedCohorts.forEach((c, idx) => {
    c.name = `Kull ${idx + 1}`;
  });

  return { dedupedCohorts, cohortIdMapping: idMapping };
}

function ensureSelfMapping(idMapping, id) {
  if (id != null && !idMapping.has(id)) idMapping.set(id, id);
}

