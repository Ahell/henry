# Henry Course Planner - Commit 1: Grundstruktur

## Vad som är gjort

### Arkitektur och Setup
- ✅ Vite-projekt med Lit 3
- ✅ Ingen TypeScript - rent JavaScript
- ✅ Modulär komponentstruktur

### Core-komponenter
1. **`src/store.js`** - Centraliserad datalagringslogik
   - Kurshantering
   - Kullhantering
   - Lärarhantering
   - Tidsluckor (slots)
   - Kursomgångar (course runs)
   - Lärarens tillgänglighet
   - Observer-pattern för reaktiva uppdateringar

2. **`src/businessRules.js`** - All affärslogik
   - Juridiska kursberoenden-validering
   - Lärarens tillgänglighet-check
   - Kapacitetsvalidering
   - Samläsning-förslag
   - Multi-block-kurs-logik

3. **`src/admin-panel.js`** - Admin-gränssnittet
   - Tab-baserad navigation (Kurser, Kullar, Lärare, Slots, Tillgänglighet)
   - Formulär för inmatning
   - Tabeller för befintliga data
   - Responsiv design

4. **`src/course-run-planner.js`** - Kursomgång-skapare
   - Visuell slot-väljare
   - Steg-för-steg-guidad process
   - Kapacitets-validering
   - Kullar-väljare

5. **`src/report-viewer.js`** - Rapporter och Vyer
   - Avdelningschef-vy (bemanning per år/termin)
   - Lärar-vy (vilka kurser undervisar de?)
   - Kull-vy (sekvens av 14 kurser)
   - Gantt-vy (tidsaxel, färgkodning)

6. **`src/import-export.js`** - Data management
   - Importera från JSON/CSV
   - Exportera som JSON/CSV
   - Exempeldata för test
   - Filhantering

### UI och Design
- Enhetlig styling med CSS (ingen CSS-framework)
- Responsiv design
- Tabs och modala formulär
- Färgkodning för juridikkurser, 2-block kurser, etc.
- Gantt-visualisering

## Nästa Steg

1. **Installation och test**
   ```bash
   npm install
   npm run dev
   ```

2. **Testa grundfunktionalitet**
   - Importera exempeldata
   - Lägg till egna kurser/kullar/lärare
   - Skapa kursomgångar
   - Testa olika rapportvyer

3. **Framtida features**
   - Lärar-tillgänglighet-detektor med varningar
   - Automatisk kurssekvens-förslag
   - Drag-and-drop-omplanering
   - Database-integration
   - More sophisticated rules engine

## Filer i repot

```
henry/
├── index.html              # Huvudsida
├── package.json            # NPM-beroenden
├── vite.config.js          # Vite-konfiguration
├── README.md               # Dokumentation
├── src/
│   ├── main.js             # Entry point
│   ├── store.js            # Data management
│   ├── businessRules.js    # Affärsregler
│   ├── admin-panel.js      # Admin-komponent
│   ├── course-run-planner.js # Planerare-komponent
│   ├── report-viewer.js    # Rapporterkomponent
│   └── import-export.js    # Import/Export-komponent
```

## Användarguide

### 1. Starta app
```bash
npm install
npm run dev
```
Öppnar på `http://localhost:5173`

### 2. Ladda exempeldata
- Gå till "Import/Export"
- Klicka "Ladda Exempeldata"

### 3. Lägg till egen data
- Gå till "Admin Grunddata"
- Fyll i kurser, kullar, lärare, slots, tillgänglighet

### 4. Skapa kursomgångar
- Gå till "Skapa Kursomgångar"
- Välj slot, kurs, lärare, kullar
- Appen validerar automatiskt

### 5. Se rapporter
- Gå till "Rapporter & Vyer"
- Välj vilken vy du vill se
- Filtrera efter år, lärare, kull etc.
