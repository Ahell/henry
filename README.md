# Henry Course Planner

Fullstack Lit + Express-app för kursplanering vid FEI, med SQLite som runtime-databas.

## App Contract

- Node-version styrs av `.nvmrc`
- PM2 startar `server/server.js` via `ecosystem.config.cjs`
- `GET /api/health` returnerar `200`
- `GET /api/runtime` returnerar runtime- och databasstatus
- produktion ska använda extern `RUNTIME_ENV_FILE`
- `PUBLIC_BASE_URL` är appens kanoniska publika URL
- `HENRY_DB_PATH` styr var SQLite-filen ligger

## Environment files

- `.env.example` är det kanoniska schemat
- `.env.development.example` är lokal utvecklingsmall
- `.env.production.example` är produktionsformad mall
- riktig produktionskonfiguration ska ligga utanför repoet, till exempel `/home/initium/.config/webapps/henry.env`

## Local development

1. Skapa en lokal `.env` från `.env.example` eller `.env.development.example`
2. Kör `npm install`
3. Kör `npm run dev`

Lokala standardvärden:

- frontend: `http://127.0.0.1:5173`
- backend: `http://127.0.0.1:3001`
- databas: `.runtime/data/henry.db`

## Production runtime

1. Använd `.env.production.example` endast som mall
2. Skapa verklig runtimefil utanför repoet
3. Peka PM2/deploy på filen via `RUNTIME_ENV_FILE`
4. Låt SQLite-filen ligga utanför repoet via `HENRY_DB_PATH`

Rekommenderad produktionspath:

- `RUNTIME_ENV_FILE=/home/initium/.config/webapps/henry.env`
- `HENRY_DB_PATH=/home/initium/.local/share/webapps/henry/henry.db`

## Commands

- `npm run dev` startar frontend och backend
- `npm run build` bygger frontend för produktion
- `npm run start:prod` startar produktionsservern
- `npm run health:check` verifierar `GET /api/health`
- `npm run migrate:deploy` är idag en no-op
- `npm test` kör runtime-/kontraktstester

## Runtime endpoints

- `GET /api/health`
- `GET /api/runtime`

## Deployment

Workflow: `.github/workflows/deploy-webservices.yml`

GitHub Environment `production` bör innehålla:

- `vars.OSBORNE_APP_ID`
- `secrets.DEPLOY_HOST`
- `secrets.DEPLOY_USER`
- `secrets.DEPLOY_PORT`
- `secrets.DEPLOY_SSH_KEY`
