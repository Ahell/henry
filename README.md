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

## FEI environments and personal accounts

Production is `https://fei.whcg.se` on branch `main`. Staging is `https://fei-staging.whcg.se` on branch `staging`. `hej.whcg.se` redirects to the production address. The GitHub repository remains `Ahell/henry`.

Local checkouts live in `Downloads/webapps/webapps-fei/fei-production` (main, port 5330) and `fei-staging` (staging, port 5331). Run `npm ci`, `npm run build`, then `npm start` in the selected checkout. The local `.env` points at that checkout's own `.runtime/data` directory. Local and server installations use independent planning and account databases. Initial local/staging installations contain base business rules and empty planning collections.

Each user logs in personally and works in the environment's shared planning. Administrators create or disable accounts through Mitt konto. Every user can change their own password. Sessions use HttpOnly, SameSite Strict cookies, with Secure over HTTPS. Reset and test-data operations require the administrator role. Accounts live in `HENRY_AUTH_DB_PATH`, separate from `HENRY_DB_PATH`, so planning imports and resets operate on planning data. Sessions expire after twelve hours and are revoked by logout, password change or disabling an account.

Create the first administrator with `npm run user:add -- anders admin`, providing a password of at least twelve characters on standard input. The deployment runtime is read from `RUNTIME_ENV_FILE`. Keep credentials outside Git.

Deployment installs locked dependencies, builds assets, initializes missing schema/base settings and restarts the target PM2 process. Existing base settings are retained. Legacy startup deletion of orphan rows and unused tables is excluded from automatic migration. Imports, reset and loading example planning remain explicit authenticated application operations. The root clean command only removes build/dependency directories.

Production continues using `/home/initium/.local/share/webapps/henry/henry.db`. Its account file is `/home/initium/.local/share/webapps/henry/accounts.sqlite`. Server staging uses its own `/home/initium/.local/share/webapps/henry-staging` directory. Runtime files are `/home/initium/.config/webapps/henry.env` and `henry-staging.env`. Deployment target ids remain henry and henry-staging. Each GitHub Environment has its matching OSBORNE_APP_ID and deploy secrets.

Work through feature branches and pull requests into staging. Verify staging before merging staging into main. Deploys operate on application code and schema initialization. Database files are ignored by Git and stay external to the server checkout. Cross-environment data transfer is a separate explicit administrative operation.
