/**
 * Business logic defaults for Henry Course Planner
 * Contains scheduling rules and parameters (persisted in app_settings via bulk-save)
 */

// Business logic defaults (persisted in app_settings via bulk-save)
export const seedBusinessLogic = {
  version: 1,
  scheduling: {
    params: {
      maxStudentsHard: 130,
      maxStudentsPreferred: 100,
    },
    rules: [
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
        id: "dontMovePlacedCourses",
        label: "Ändra inte utplacerade kurser (auto-fyll)",
        description:
          "Auto-fyll flyttar/ersätter inte redan utplacerade kurser för kullen; fyller endast tomma slots.",
        enabled: true,
        kind: "hard",
        locked: false,
      },
      {
        id: "maxStudentsHard",
        label: "Max studenter per kurs (hard)",
        description:
          "Över denna gräns är inte tillåtet. Gränsen sätts i regeln.",
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
        enabled: true,
        kind: "soft",
        locked: false,
      },
      {
        id: "economyColocationPacking",
        label: "Ekonomi: samläsning + packa",
        description:
          "Prioritera samläsning (starta samma kurs i samma slot) och packa kurs-run nära relevant gräns (hard cap, eller preferred cap om den regeln är högre prioriterad).",
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
    ],
  },
};
