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
│   │   ├── admin-panel.js          # Admin tab router (~110 rader)
│   │   ├── admin/                  # 📁 Admin tab components
│   │   │   ├── courses-tab.js      # CRUD för kurser
│   │   │   ├── cohorts-tab.js      # CRUD för kullar
│   │   │   ├── teachers-tab.js     # CRUD för lärare
│   │   │   └── index.js            # Export alla tabs
│   │   ├── ui/                     # 🎨 Primära UI-komponenter
│   │   │   ├── button.js           # Henry button
│   │   │   ├── input.js            # Henry input
│   │   │   ├── select.js           # Henry select
│   │   │   ├── textarea.js         # Henry textarea
│   │   │   ├── checkbox.js         # Henry checkbox
│   │   │   ├── heading.js          # Henry heading
│   │   │   ├── card.js             # Henry card
│   │   │   └── index.js            # Export alla UI
│   │   ├── report-viewer.js        # Planering & rapporter
│   │   └── import-export.js        # Import/export-funktioner
│   ├── utils/                      # 🛠️ Utilities & Logic
│   │   ├── store.js                # Datahantering & API
│   │   └── businessRules.js        # Validering & affärslogik
│   ├── data/                       # 📊 Data & Seeds
│   │   └── seedData.js             # Testdata
│   └── styles/                     # 🎨 Gemensamma stilar
│       ├── tokens.css              # Design tokens
│       └── theme.css               # Gemensamt tema
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

- **admin-panel.js** (~110 rader) - Tab router för admin-funktioner
- **admin/** - Separata tab-komponenter för bättre underhåll
  - **courses-tab.js** (~400 rader) - CRUD för kurser
  - **cohorts-tab.js** (~350 rader) - CRUD för kullar
  - **teachers-tab.js** (~380 rader) - CRUD för lärare
- **ui/** - Återanvändbara primära UI-komponenter
  - **button.js** - Knappar med variants (primary, secondary, danger, success)
  - **input.js** - Textfält, nummer, datum med validering
  - **select.js** - Dropdown-menyer med labels
  - **textarea.js** - Flerradiga textfält
  - **checkbox.js** - Checkboxar med labels
  - **heading.js** - Rubriker H1-H6
  - **card.js** - Kort/paneler med variants

#### `styles/` - Gemensamma Stilar

- **tokens.css** - Design tokens (färger, spacing, typografi)
- **theme.css** - Gemensamt tema och utility classes
- Används i alla komponenter för konsekvent design

- **utils/store.js** (1946 rader) - Central datahantering, API-integration, state management
- **utils/businessRules.js** (82 rader) - Valideringslogik, affärsregler

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

**Skapa:** `src/components/my-component.js` eller `src/components/admin/my-tab.js`

```javascript
import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

export class MyComponent extends LitElement {
  static styles = css`
    @import url("/src/styles/tokens.css");
    /* använd design tokens */
  `;
  // ...
}
customElements.define("my-component", MyComponent);
```

**Importera i:** `src/main.js` eller relevant parent component
**Importera i:** `src/main.js`

### Ny Utility-funktion

**Lägg till i:** `src/utils/businessRules.js` eller skapa ny fil i `src/utils/`

### Gemensam Style

**Lägg till i:** `src/styles/tokens.css` (design tokens) eller `src/styles/theme.css` (utility classes)

````css
/* tokens.css */
:root {
  --color-my-new: #abc123;
  --space-custom: 2.5rem;
}
```javascript
export const colors = {
  primary: "#667eea",
  secondary: "#764ba2",
| Jag vill...               | Gå till...                                  |
| ------------------------- | ------------------------------------------- |
| Ändra hur kullar visas    | `src/components/admin/cohorts-tab.js`       |
| Ändra hur kurser visas    | `src/components/admin/courses-tab.js`       |
| Ändra hur lärare visas    | `src/components/admin/teachers-tab.js`      |
| Ändra drag-and-drop logik | `src/components/report-viewer.js`           |
| Ändra validering          | `src/utils/businessRules.js`                |
| Ändra hur data sparas     | `src/utils/store.js`                        |
| Ändra API endpoints       | `server/server.js`                          |
| Ändra testdata            | `src/data/seedData.js`                      |
| Ändra design tokens       | `src/styles/tokens.css`                     |
## 📏 Storlek på filer

````

Stora filer (>1000 rader):
└── src/components/report-viewer.js 2995 rader ⚠️ Överväg split

Medelstora filer (300-700 rader):
├── src/data/seedData.js 664 rader ✅ OK
├── server/server.js 419 rader ✅ OK
├── src/components/admin/courses-tab.js 400 rader ✅ OK
├── src/components/admin/teachers-tab.js 380 rader ✅ OK
├── src/components/admin/cohorts-tab.js 350 rader ✅ OK
└── src/components/import-export.js 302 rader ✅ OK

Små filer (<150 rader):
├── src/components/admin-panel.js 110 rader ✅ Perfect!
├── src/components/ui/\*.js ~100 rader ✅ OK
├── src/utils/businessRules.js 120 rader ✅ OK
└── src/main.js 22 rader ✅ OK

```src/utils/store.js 1946 rader  ✅  OK

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
