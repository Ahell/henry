const RULES_DEFAULT = [
  {
    id: "prerequisitesOrder",
    label: "Spärrkursordning",
    description: "Kurs får inte starta innan alla spärrkurser är klara.",
    enabled: true,
    kind: "hard",
    locked: true,
  },
  {
    id: "maxOneCoursePerSlot",
    label: "Max 1 kurs per slot (per kull)",
    description: "En kull får inte läsa två kurser i samma slot.",
    enabled: true,
    kind: "hard",
    locked: true,
  },
  {
    id: "maxStudentsHard",
    label: "Max studenter per kurs (hard)",
    description: "Över denna gräns är inte tillåtet. Gränsen sätts i regeln.",
    enabled: true,
    kind: "hard",
    locked: false,
  },
  {
    id: "noSkewedOverlap15hp",
    label: "15hp får ej överlappa snett",
    description:
      "Om en 15hp-kurs spänner över två slots måste andra kullar starta den i samma start-slot.",
    enabled: true,
    kind: "hard",
    locked: true,
  },
  {
    id: "requireAvailableCompatibleTeachers",
    label: "Kräv tillgänglig kompatibel lärare",
    description:
      "Hard: blockera schemaläggning om ingen kompatibel lärare är tillgänglig i perioden. Soft: prioritera val som har fler tillgängliga kompatibla lärare.",
    enabled: false,
    kind: "hard",
    locked: false,
  },
  {
    id: "maximizeColocation",
    label: "Samläsning först (matcha slot)",
    description:
      "Välj i första hand en kurs som redan startar i samma slot i andra kullar (gemensam kurs-run = samläsning).",
    enabled: true,
    kind: "soft",
  },
  {
    id: "packTowardHardCap",
    label: "Packa inom samläsning (mot max)",
    description:
      "Om flera val ger samläsning: välj det alternativ som gör att totalen hamnar närmast max (färre parallella kurs-run).",
    enabled: true,
    kind: "soft",
  },
  {
    id: "futureJoinCapacity",
    label: "Framåtblick: lämna plats",
    description:
      "Prioritera val som lämnar kapacitet så kommande kullar kan samläsa samma kurs.",
    enabled: true,
    kind: "soft",
  },
  {
    id: "avoidEmptySlots",
    label: "Undvik tomma slots",
    description:
      "Om flera alternativ finns: prioritera val som gör det mer sannolikt att nästa slot också kan fyllas (minskar luckor).",
    enabled: true,
    kind: "soft",
  },
  {
    id: "avoidOverPreferred",
    label: "Undvik > preferred",
    description:
      "Undvik att överstiga preferred-gränsen när det finns alternativ. Gränsen sätts i regeln.",
    enabled: true,
    kind: "soft",
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
    rules: RULES_DEFAULT,
  },
};

function normalizeRules(inputRules, defaults) {
  const byId = new Map(defaults.map((r) => [r.id, r]));
  const used = new Set();
  const out = [];

  if (Array.isArray(inputRules)) {
    inputRules.forEach((r) => {
      const id = r?.id;
      if (!byId.has(id) || used.has(id)) return;
      const base = byId.get(id);
      used.add(id);
      const kindRaw = String(r?.kind || base.kind || "soft").toLowerCase();
      const kind = kindRaw === "hard" ? "hard" : "soft";
      out.push({
        ...base,
        enabled: r?.enabled ?? base.enabled,
        kind,
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
  const futureOnlyReplan =
    typeof params.futureOnlyReplan === "boolean"
      ? params.futureOnlyReplan
      : DEFAULT_BUSINESS_LOGIC.scheduling.params.futureOnlyReplan;

  const rules = (() => {
    if (Array.isArray(scheduling?.rules)) {
      return normalizeRules(scheduling.rules, DEFAULT_BUSINESS_LOGIC.scheduling.rules);
    }

    // Backwards compatibility: old payloads with hardRules/softRules arrays.
    const legacyHard = Array.isArray(scheduling?.hardRules) ? scheduling.hardRules : [];
    const legacySoft = Array.isArray(scheduling?.softRules) ? scheduling.softRules : [];
    const merged = [
      ...legacyHard.map((r) => ({ ...r, kind: "hard" })),
      ...legacySoft.map((r) => ({ ...r, kind: "soft" })),
    ];
    return normalizeRules(merged, DEFAULT_BUSINESS_LOGIC.scheduling.rules);
  })();

  const hardRules = rules.filter((r) => r.kind === "hard");
  const softRules = rules.filter((r) => r.kind !== "hard");

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
      rules,
      // Keep derived lists for backwards compatibility with existing code.
      hardRules,
      softRules,
    },
  };
}
