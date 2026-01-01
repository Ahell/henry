# Henry Course Planner - Utvecklingsguide

## 📋 Översikt

Detta dokument är en guide för dig som ensam utvecklare på projektet.

## 🏗️ Arkitektur

### Single Page Application (SPA)

- **Frontend**: Lit 3 Web Components (inga ramverk!)
- **Backend**: Express.js REST API
- **Databas**: SQLite (en fil, inget installerat DBMS behövs)
- **Dev Server**: Vite för snabb utveckling med HMR

### Dataflöde

```
Browser (Lit Components)
    ↓ HTTP fetch
Backend API (Express)
    ↓ better-sqlite3
SQLite Database (henry.db)
```

## 🚀 Snabb utveckling

### Daglig workflow

```bash
npm run dev           # Startar allt med live reload
```

### Testning

1. Öppna http://localhost:5173
2. Gå till "Import/Export" → "Återställ till testdata"
3. Testa funktioner i UI:t
4. Se console logs i DevTools (F12)

### Debug-tips

- **Frontend**: loggar syns i browser DevTools
- **Backend**: loggar syns i terminalen
- **API-anrop**: Använd Network-fliken i DevTools
- **Databas**: Öppna `henry.db` (i repo-roten) med SQLite-verktyg

## 📁 Filstruktur och ansvar

```
src/
├── main.js              # Entry point - importerar alla komponenter
├── features/admin/components/admin-panel.js       # Admin-UI för CRUD på grunddata
├── features/import-export/components/import-export.js     # Import/export JSON
├── utils/
│   ├── store.js         # VIKTIGAST! Datahantering och API-calls
│   └── businessRules.js # Valideringslogik (isolerad)
└── server/data/seedData.js     # Testdata (backend)

server/
└── server.js            # Hela backend i en fil!

index.html               # HTML-skal, laddar main.js
```

### Var ska ny kod hamna?

| Vad du gör      | Var                                 | Exempel               |
| --------------- | ----------------------------------- | --------------------- |
| Ny UI-komponent | `src/` ny fil                       | `src/student-list.js` |
| Ny affärsregel  | `src/utils/businessRules.js`        | Valideringsfunktion   |
| Ny datatyp      | `src/utils/store.js` + `server/server.js` | Lägg till entity      |
| Ny API-endpoint | `server/server.js`                  | POST /api/courses     |
| Styling         | Inom komponenten                    | Lit css`` template    |

## 🔧 Vanliga uppgifter

### Lägga till ny entity (t.ex. "Program")

1. **Backend** (`server/server.js`):

```javascript
// Skapa tabell
db.exec(`CREATE TABLE IF NOT EXISTS programs (...)`);

// Lägg till CRUD endpoints
app.get('/api/programs', (req, res) => {...});
app.post('/api/programs', (req, res) => {...});
```

2. **Store** (`src/utils/store.js`):

```javascript
constructor() {
  this.programs = [];
}

async loadData() {
  const programs = await fetch(`${this.apiBase}/programs`)...
}

addProgram(program) {...}
```

3. **UI** (skapa `src/program-panel.js` eller uppdatera `features/admin/components/admin-panel.js`)

### Ändra validering

Allt finns i `src/utils/businessRules.js`. T.ex.:

```javascript
export function validateCapacity(planned_students) {
  // Ändra gränserna här
  if (planned_students > 150) { ... }
}
```

### Lägga till ny kolumn i databas

1. Ta bort databasen: `rm henry.db`
2. Uppdatera schema i `server/server.js`
3. Starta om: `npm run dev`

### Performance-optimering

- **Frontend**: Använd `shouldUpdate()` i Lit-komponenter
- **Backend**: Lägg till index i SQLite för ofta använda queries
- **API**: Cacha data i `src/utils/store.js` istället för att hämta varje gång

## 🐛 Felsökning

### Frontend laddar inte

- Kolla console i browser (F12)
- Verifiera att Vite körs på port 5173
- Töm cache: Ctrl+Shift+R

### Backend svarar inte

- Kolla terminal där `npm run dev` körs
- Verifiera att Express körs på port 3001
- Testa direkt: `curl http://localhost:3001/api/courses`

### Data sparas inte

- Kolla att `store.saveData()` anropas efter ändringar
- Verifiera att `henry.db` finns i repo-roten
- Kolla backend-logs för fel

### Saker fungerar inte efter pull

```bash
npm run clean
npm install
npm run dev
```

## 📦 Dependencies

### Frontend

- `lit` - Web Components framework

### Backend

- `express` - HTTP server
- `cors` - Cross-Origin support
- `better-sqlite3` - SQLite driver

### Dev

- `vite` - Build tool och dev server
- `concurrently` - Kör flera kommandon samtidigt

## 🚢 Deployment

```bash
./deploy.sh           # Bygg allt för produktion
```

Detta skapar `dist/` med:

- Frontend: Minifierad HTML/JS/CSS
- Backend: Server-filer
- Databas: Kopieras om den finns

Upload till server och kör:

```bash
cd dist/server
node server.js
```

## 💡 Best Practices

### DRY (Don't Repeat Yourself)

- Gemensamma validering → `src/utils/businessRules.js`
- Återanvändbar UI → Skapa ny Lit-komponent
- API-anrop → Alltid via `src/utils/store.js`

### Keep It Simple

- En fil per komponent
- Backend i en fil (tills den blir för stor)
- Ingen onödig abstraktion

### Git Workflow

```bash
git add .
git commit -m "Kort beskrivning av ändring"
git push origin test
```

### Kommentarer

- Skriv VARFÖR, inte VAD
- Använd JSDoc för funktioner

```javascript
/**
 * Validates that law prerequisites are met
 * @param {Object} cohort - The cohort to validate
 * @param {Object} courseRun - The course run
 * @returns {Object} {valid: boolean, errors: string[]}
 */
```

## 📚 Användbara resurser

- **Lit**: https://lit.dev/docs/
- **Express**: https://expressjs.com/
- **SQLite**: https://sqlite.org/docs.html
- **Vite**: https://vitejs.dev/guide/

## 🎯 Nästa steg

När projektet växer, överväg:

1. Bryt ut `server.js` i flera filer (routes/, models/, utils/)
2. Lägg till TypeScript för type safety
3. Lägg till tester (Vitest för frontend, Jest för backend)
4. Lägg till linting (ESLint) och formatting (Prettier)
5. CI/CD pipeline (GitHub Actions)

Men börja enkelt! Optimera när du behöver det.

---

**Lycka till med utvecklingen! 🚀**
