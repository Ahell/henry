# 🚀 Henry Course Planner - Snabbstart

## Installation (första gången)

```bash
# 1. Installera alla dependencies
npm install

# Det är allt! Projektet är klart att köras.
```

## Daglig användning

```bash
# Starta appen (frontend + backend)
npm run dev
```

Öppna automatiskt http://localhost:5173

## Vad händer när du kör `npm run dev`?

- ✅ **Frontend** startar på http://localhost:5173 (Vite)
- ✅ **Backend** startar på http://localhost:3001 (Express)
- ✅ **Databas** skapas automatiskt om den inte finns (SQLite)
- ✅ **Testdata** laddas automatiskt första gången

## Vanliga kommandon

```bash
npm run dev           # Starta allt (rekommenderat)
npm run dev:client    # Endast frontend
npm run dev:server    # Endast backend
npm run build         # Bygg för produktion
```

## Första steget i appen

1. Gå till **Import/Export** och klicka "Återställ till testdata"
2. Gå till **Admin Grunddata** och se kurser, kullar, lärare
3. Gå till **Rapporter & Vyer** och börja planera!

## Problem?

### Port redan upptagen

```bash
# Stoppa alla processer
pkill -f "npm run dev"
pkill -f "node server.js"

# Starta igen
npm run dev
```

### Dependencies saknas

```bash
npm run clean       # Rensa allt
npm install         # Installera igen
```

### Databas problem

```bash
# Ta bort databasen och börja om
rm henry.db
npm run dev
```

## Tips för utveckling

- **Hot reload**: Både frontend och backend laddar om automatiskt vid ändringar
- **Console logs**: Öppna DevTools (F12) för frontend-debugging
- **Server logs**: Terminal visar backend-aktivitet
- **Data persistence**: All data sparas automatiskt i SQLite

Lycka till! 🎓
