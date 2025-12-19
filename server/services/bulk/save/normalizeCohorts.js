import { dedupeCohorts } from "../transform/dedupeCohorts.js";

export function normalizeCohorts(cohorts = []) {
  const { dedupedCohorts, cohortIdMapping } = dedupeCohorts(cohorts);
  const remapCohortId = (id) => (id == null ? id : cohortIdMapping.get(id) ?? id);
  return { dedupedCohorts, remapCohortId };
}

