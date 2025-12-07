# 📁 Projektstruktur

Optimal mappstruktur för ensamutvecklare - Allt är organiserat logiskt och lätt att hitta.

## 🏗️ Överblick

```
henry/
├── 📄 Dokumentation & Config
│   ├── README.md                   # Huvuddokumentation
│   ├── QUICKSTART.md               # Snabbstart
│   ├── DEV_GUIDE.md                # Utvecklingsguide
│   ├── package.json                # Dependencies & scripts
│   ├── vite.config.js              # Vite-konfiguration
│   └── deploy.sh                   # Deployment-script
│
├── 🎨 Frontend (src/)
│   ├── main.js                     # 🚪 Entry point
│   ├── components/                 # ⚡ Web Components (Lit)
│   │   ├── admin-panel.js          # Admin-UI för grunddata
│   │   ├── report-viewer.js        # Planering & rapporter
│   │   └── import-export.js        # Import/export-funktioner
│   ├── utils/                      # 🛠️ Utilities & Logic
│   │   ├── store.js                # Datahantering & API
│   │   └── businessRules.js        # Validering & affärslogik
│   ├── data/                       # 📊 Data & Seeds
│   │   └── seedData.js             # Testdata
│   └── styles/                     # 🎨 Gemensamma stilar (framtida)
│
├── 🖥️ Backend (server/)
│   ├── server.js                   # 🚪 Main server fil
│   ├── henry.db                    # 💾 SQLite-databas
│   ├── routes/                     # 🛤️ API routes (framtida)
│   ├── models/                     # 📦 Data models (framtida)
│   └── utils/                      # 🔧 Helper functions (framtida)
│
├── 🔧 VSCode
│   └── .vscode/
│       ├── settings.json           # Editor-inställningar
│       ├── launch.json             # Debug-config
│       └── extensions.json         # Rekommenderade extensions
│
└── 🌐 Public
    └── index.html                  # HTML entry point
```

## 📂 Detaljerad Beskrivning

### Frontend (src/)

#### `main.js` - Entry Point
- Importerar alla komponenter
- Hanterar navigation mellan sektioner
- Minimalt och rent

#### `components/` - Web Components
Alla Lit-komponenter som bygger upp UI:t:
- **admin-panel.js** (1358 rader) - CRUD för kurser, kullar, lärare, slots
- **report-viewer.js** (2995 rader) - Planering, drag-and-drop, Gantt-vy
- **import-export.js** (302 rader) - Import/export JSON, återställ data

#### `utils/` - Business Logic & Data
- **store.js** (892 rader) - Central datahantering, API-integration, state management
- **businessRules.js** (120 rader) - Valideringslogik, affärsregler

#### `data/` - Data & Seeds
- **seedData.js** (664 rader) - Testdata för kurser, kullar, lärare, etc.

#### `styles/` - Gemensamma Stilar
- Framtida: CSS-variabler, teman, mixins
- För nu: Styles finns i varje komponent

### Backend (server/)

#### `server.js` - Main Server
- Express REST API (419 rader)
- SQLite-integration
- CRUD endpoints för alla entities
- CORS-hantering

#### `routes/` - API Routes (Framtida)
När server.js blir för stor, bryt ut routes:
```
routes/
├── courses.js
├── cohorts.js
├── teachers.js
└── index.js
```

#### `models/` - Data Models (Framtida)
Isolera databaslogik:
```
models/
├── Course.js
├── Cohort.js
└── Teacher.js
```

#### `utils/` - Helper Functions (Framtida)
Återanvändbar serverlogik:
```
utils/
├── validation.js
├── errorHandler.js
└── helpers.js
```

## 🎯 När ska du skapa nya filer?

### Ny Komponent
**Skapa:** `src/components/my-component.js`
```javascript
import { LitElement, html, css } from "lit";
import { store } from "../utils/store.js";

export class MyComponent extends LitElement {
  // ...
}
customElements.define("my-component", MyComponent);
```
**Importera i:** `src/main.js`

### Ny Utility-funktion
**Lägg till i:** `src/utils/businessRules.js` eller skapa ny fil i `src/utils/`

### Ny Data Entity
1. **Backend:** Lägg till i `server/server.js` (tabell + endpoints)
2. **Store:** Lägg till i `src/utils/store.js` (CRUD-metoder)
3. **UI:** Skapa eller uppdatera komponent i `src/components/`

### Gemensam Style
**Skapa:** `src/styles/theme.js`
```javascript
export const colors = {
  primary: "#667eea",
  secondary: "#764ba2",
  // ...
};
```

## 🔍 Hitta rätt fil

| Jag vill... | Gå till... |
|-------------|-----------|
| Ändra hur kullar visas | `src/components/admin-panel.js` |
| Ändra drag-and-drop logik | `src/components/report-viewer.js` |
| Ändra validering | `src/utils/businessRules.js` |
| Ändra hur data sparas | `src/utils/store.js` |
| Ändra API endpoints | `server/server.js` |
| Ändra testdata | `src/data/seedData.js` |
| Lägga till ny komponent | `src/components/` + uppdatera `src/main.js` |

## 📏 Storlek på filer

```
Stora filer (>1000 rader):
├── src/components/report-viewer.js    2995 rader  ⚠️  Överväg split
├── src/components/admin-panel.js      1358 rader  ✅  OK
└── src/utils/store.js                  892 rader  ✅  OK

Medelstora filer (300-700 rader):
├── src/data/seedData.js                664 rader  ✅  OK
├── server/server.js                    419 rader  ✅  OK
└── src/components/import-export.js     302 rader  ✅  OK

Små filer (<100 rader):
├── src/utils/businessRules.js          120 rader  ✅  OK
└── src/main.js                          22 rader  ✅  OK
```

## 🚀 Framtida Refactoring

När projektet växer:

1. **Split report-viewer.js** (~3000 rader)
   ```
   components/
   ├── report-viewer/
   │   ├── index.js
   │   ├── gantt-view.js
   │   ├── drag-drop-handler.js
   │   └── validation.js
   ```

2. **Split server.js**
   ```
   server/
   ├── server.js           # Main
   ├── routes/
   │   ├── courses.js
   │   └── cohorts.js
   └── models/
       └── database.js
   ```

3. **Lägg till tester**
   ```
   tests/
   ├── unit/
   └── integration/
   ```

Men! **Gör det inte nu**. Vänta tills du faktiskt känner behovet.

## 💡 Design Principles

1. **Flat is better than nested** - Max 2 nivåer djupt
2. **Proximity** - Relaterad kod nära varandra
3. **Single responsibility** - En fil, ett syfte
4. **Easy to find** - Logiska namn och platser
5. **Room to grow** - Mappar för framtida expansion

---

**Strukturen är nu optimal för ensamutveckling! 🎉**
