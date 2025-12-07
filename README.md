# Henry Course Planner 🎓

En fullstack webbapp för kursplanering vid FEI, byggd med Lit 3, Express och SQLite.

## 🚀 Snabbstart

```bash
# Installera alla dependencies
npm install

# Starta både frontend och backend
npm run dev
```

Öppna http://localhost:5173 i webbläsaren.

## 📁 Projektstruktur

```
henry/
├── src/                    # Frontend (Lit components)
│   ├── admin-panel.js      # Admin-gränssnitt för grunddata
│   ├── report-viewer.js    # Rapporter och planeringsvy
│   ├── import-export.js    # Import/export av data
│   ├── store.js            # Datahantering och API-integration
│   ├── businessRules.js    # Affärslogik och valideringsregler
│   ├── seedData.js         # Initial testdata
│   └── main.js             # Entry point
├── server/                 # Backend (Express + SQLite)
│   ├── server.js           # API-server och databas
│   └── henry.db            # SQLite-databas (skapas automatiskt)
├── index.html              # HTML entry point
├── vite.config.js          # Vite-konfiguration
└── package.json            # Projektberoenden
```

## 🛠️ Kommandon

```bash
# Utveckling
npm run dev              # Starta frontend + backend samtidigt
npm run dev:client       # Endast frontend (port 5173)
npm run dev:server       # Endast backend (port 3001)

# Produktion
npm run build            # Bygga för produktion
npm start                # Starta backend-server
npm run preview          # Förhandsgranska produktionsbygge

# Underhåll
npm run clean            # Rensa alla dependencies och builds
```

## 🎯 Funktioner

### 1. **Import/Export**

- Ladda data från JSON eller CSV-filer
- Exportera planen för delning eller backup
- Exempeldata för snabb start

### 2. **Admin - Grunddata**

- Lägg till och hantera kurser (inkl. juridikkurser)
- Hantera studentkullar
- Registrera lärare och deras hemavdelningar
- Definiera tidsluckor (slots) för undervisning
- Registrera lärarnas tillgänglighet (busy/free perioder)

### 3. **Skapa Kursomgångar**

- Visuell slot-väljare
- Välj kurs, lärare och kullar som ska delta
- Automatisk kapacitetsvalidering
- Föreslå samläsning för befintliga kursomgångar

### 4. **Rapporter & Vyer**

#### 4.1 Avdelningschef-vy

- Bemanning per år/termin
- Filtrera på år och avdelning
- Se alla kurskoder, examinator, start/slut, antal studenter

#### 4.2 Lärar-vy

- Per lärare: vilka FEI-kursomgångar undervisar de?
- Möjlighet att detektera krockar med busy-perioder (KTH)

#### 4.3 Kull-vy

- Per kull: sekvens av 14 kurser i kronologisk ordning
- Markering av juridikkurser
- Framgång/status för varje kurs

#### 4.4 Gantt-vy (Planeringsöversikt)

- Tidsaxel för alla kullar och kurser
- Färgkodning: juridik (lila), normal (blå), 2-block (grön)
- Visar studieverlauf per kull

## Affärsregler

### Juridiska kursberoenden

- **Juridisk översiktskurs (AI180U)** måste komma före alla andra juridikkurser
- Rekommenderad ordning: Översikt → Allmän → Speciell → Bostadsrätt/Beskattning/Kvalificerad
- Varning om ordningen avviker från rekommenderad

### Kapacitet

- **Föredragen max:** 100 studenter per kursomgång
- **Hårt stopp:** 130 studenter
- Automatisk varning och validering

### 2-block kurser

- **AI180U (Juridisk översiktskurs):** 15 hp = 2 block
- **AI184U (Fastighetsförmedling - introduktion):** 15 hp = 2 block

### Tidsluckor

- Fördefinerade slots från FEI (t.o.m. 2027)
- Slots kan vara "placeholders" (tomma) eller reserverade
- Stöd för kvällsmönster (tis/tor, mån/fre, etc.)

## Installation

```bash
# Installera beroenden
npm install

# Starta dev-server
npm run dev

# Bygg för produktion
npm run build

# Förhandsgranska produktion
npm run preview
```

## Datastruktur

### Kurser (Course)

```json
{
  "course_id": 1,
  "code": "AI180U",
  "name": "Juridisk översiktskurs",
  "hp": 15.0,
  "is_law_course": true,
  "law_type": "overview",
  "default_block_length": 2,
  "preferred_order_index": 0
}
```

### Kullar (Cohort)

```json
{
  "cohort_id": 1,
  "name": "Start 1",
  "start_date": "2024-06-10",
  "planned_size": 30
}
```

### Kursomgångar (CourseRun)

```json
{
  "run_id": 1,
  "course_id": 1,
  "slot_id": 1,
  "teacher_id": 1,
  "cohorts": [1, 2],
  "planned_students": 60,
  "status": "planned"
}
```

### Tidsluckor (Slot)

```json
{
  "slot_id": 1,
  "start_date": "2024-06-10",
  "end_date": "2024-07-05",
  "evening_pattern": "tis/tor",
  "is_placeholder": false,
  "location": "FEI Campus"
}
```

## Arkitektur

- **`src/store.js`** - DataStore för global state management
- **`src/businessRules.js`** - All affärslogik (validering, regler)
- **`src/admin-panel.js`** - Lit-komponent för grunddata
- **`src/course-run-planner.js`** - Lit-komponent för skapande av kursomgångar
- **`src/report-viewer.js`** - Lit-komponent för rapporter och vyer
- **`src/import-export.js`** - Lit-komponent för import/export
- **`src/main.js`** - Huvudentry-point och navigation

## Framtida Utökningar

- [ ] Lärarens tidskonflikt-detektor (KTH vs FEI)
- [ ] Automatisk förslag på kurssekvenser för nya kullar
- [ ] Röda dagar-handling och kompensationslogik
- [ ] Drag-and-drop för omplanering av slots
- [ ] Remiss-workflow för lärare/avdelningschefer
- [ ] Notifications vid konflikter eller ändringar
- [ ] Database-integration (Firebase, Supabase, etc.)

## Teknologi

- **Lit 3** - Webkomponenter och reaktiv rendering
- **Vite** - Build-tool och dev-server
- **Vanilla JavaScript** - Ingen TypeScript, enkel och direkt

## Licens

MIT
