const HARD_RULES_DEFAULT = [
  {
    id: "prerequisitesOrder",
    label: "Spärrkursordning",
    description: "Kurs får inte starta innan alla spärrkurser är klara.",
    enabled: true,
    locked: true,
  },
  {
    id: "maxOneCoursePerSlot",
    label: "Max 1 kurs per slot (per kull)",
    description: "En kull får inte läsa två kurser i samma slot.",
    enabled: true,
    locked: true,
  },
  {
    id: "maxStudentsHard",
    label: "Max studenter per kurs (hard)",
    description: "Över denna gräns är inte tillåtet.",
    enabled: true,
    locked: false,
  },
  {
    id: "noSkewedOverlap15hp",
    label: "15hp får ej överlappa snett",
    description:
      "Om en 15hp-kurs spänner över två slots måste andra kullar starta den i samma start-slot.",
    enabled: true,
    locked: true,
  },
];

const SOFT_RULES_DEFAULT = [
  {
    id: "maximizeColocation",
    label: "Samläsning först",
    description:
      "Prioritera att flera kullar läser samma kurs i samma slot (upp till maxantal).",
    enabled: true,
  },
  {
    id: "packTowardHardCap",
    label: "Packa mot maxantal",
    description:
      "När samläsning är möjlig, packa en kurs-run närmare maxantal studenter.",
    enabled: true,
  },
  {
    id: "futureJoinCapacity",
    label: "Framåtblick: lämna plats",
    description:
      "Prioritera val som lämnar kapacitet så kommande kullar kan samläsa samma kurs.",
    enabled: true,
  },
  {
    id: "avoidOverPreferred",
    label: "Undvik > preferred",
    description:
      "Undvik att överstiga preferred-gränsen när det finns alternativ.",
    enabled: true,
  },
];

export const DEFAULT_BUSINESS_LOGIC = {
  version: 1,
  scheduling: {
    params: {
      maxStudentsHard: 130,
      maxStudentsPreferred: 100,
      futureOnlyReplan: true,
    },
    hardRules: HARD_RULES_DEFAULT,
    softRules: SOFT_RULES_DEFAULT,
  },
};

function normalizeRuleList(inputList, defaults) {
  const byId = new Map(defaults.map((r) => [r.id, r]));
  const used = new Set();
  const out = [];

  if (Array.isArray(inputList)) {
    inputList.forEach((r) => {
      const id = r?.id;
      if (!byId.has(id) || used.has(id)) return;
      const base = byId.get(id);
      used.add(id);
      out.push({
        ...base,
        enabled: r?.enabled ?? base.enabled,
      });
    });
  }

  defaults.forEach((r) => {
    if (used.has(r.id)) return;
    out.push({ ...r });
  });

  return out;
}

export function normalizeBusinessLogic(input) {
  const scheduling = input?.scheduling ?? {};
  const params = scheduling?.params ?? {};

  const maxStudentsHardRaw = Number(params.maxStudentsHard);
  const maxStudentsPreferredRaw = Number(params.maxStudentsPreferred);
  // Hard constraint: we may only change scheduling in slots after today.
  // Keep this locked on even if older payloads try to disable it.
  const futureOnlyReplan = true;

  return {
    version: 1,
    scheduling: {
      params: {
        maxStudentsHard: Number.isFinite(maxStudentsHardRaw)
          ? maxStudentsHardRaw
          : DEFAULT_BUSINESS_LOGIC.scheduling.params.maxStudentsHard,
        maxStudentsPreferred: Number.isFinite(maxStudentsPreferredRaw)
          ? maxStudentsPreferredRaw
          : DEFAULT_BUSINESS_LOGIC.scheduling.params.maxStudentsPreferred,
        futureOnlyReplan,
      },
      hardRules: normalizeRuleList(
        scheduling?.hardRules,
        DEFAULT_BUSINESS_LOGIC.scheduling.hardRules
      ),
      softRules: normalizeRuleList(
        scheduling?.softRules,
        DEFAULT_BUSINESS_LOGIC.scheduling.softRules
      ),
    },
  };
}
