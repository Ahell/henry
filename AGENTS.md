# AGENTS.md

## Purpose

This repository follows **Osborne Fullstack Standard v1** for automated production deploys.

## Production Branch Rule

- `main` is the **only production branch**.
- Every push to `main` is treated as deployable production code.
- Use feature branches + PRs for all non-production work.

## Runtime Model

- One app = one repo.
- One public entrypoint via Traefik/Osborne.
- Frontend, backend and database logic may exist in same repo, but only backend endpoint is exposed publicly.

## Required Repository Structure

- `frontend/` for UI code.
- `backend/` for API/server code.
- `migrations/` or `prisma/` for database migrations.
- Root `package.json` orchestrates the full app lifecycle.

## Required `package.json` Scripts

The root `package.json` must contain these scripts:

- `build`
- `start:prod`
- `health:check`
- `migrate:deploy`

Expected behavior:

- `build`: builds frontend + backend production artifacts.
- `start:prod`: starts backend server in production mode.
- `health:check`: verifies local app health endpoint.
- `migrate:deploy`: runs idempotent production DB migrations.

## Backend Requirements

- Must bind to:
  - `HOST=0.0.0.0`
  - `PORT` from environment variable.
- Must expose:
  - `GET /api/health` returning HTTP `200`.

## Environment Requirements

- Must support:
  - `NODE_ENV=production`
  - `PORT`
  - `HOST`
  - `DATABASE_URL` (if DB is used).

## CI/CD Contract

- Deploy workflow triggers on push to `main`.
- Required GitHub Actions secrets:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_PORT`
  - `DEPLOY_SSH_KEY`

## Required Deploy Workflow (All App Repos)

Every app repository root must include:

- `.github/workflows/deploy-webservices.yml`

Workflow requirements:

- Trigger: push to `main`.
- Deploy exactly the pushed commit SHA (`${{ github.sha }}`).
- Use repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_SSH_KEY`.
- Run the remote deploy command format:
  - `/home/initium/deploy/deploy-app.sh <app-id> ${{ github.sha }}`
- `<app-id>` must match `id` in Osborne app registry (`osborne/data/app-registry.json`).

Standard workflow template:

```yml
name: Deploy to initium-webservices

on:
  push:
    branches:
      - main

concurrency:
  group: deploy-<app-id>-prod
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Start SSH agent
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.DEPLOY_SSH_KEY }}

      - name: Add deploy host key
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -p "${{ secrets.DEPLOY_PORT }}" -H "${{ secrets.DEPLOY_HOST }}" >> ~/.ssh/known_hosts

      - name: Run remote deploy
        env:
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
          DEPLOY_PORT: ${{ secrets.DEPLOY_PORT }}
        run: |
          ssh -p "${DEPLOY_PORT}" -o StrictHostKeyChecking=yes "${DEPLOY_USER}@${DEPLOY_HOST}" \
            "/home/initium/deploy/deploy-app.sh <app-id> ${{ github.sha }}"
```

## Definition of Done (Production Readiness)

A change is production-ready only if all pass:

1. `npm run build`
2. `PORT=5200 HOST=0.0.0.0 npm run start:prod`
3. `curl -i http://127.0.0.1:5200/api/health` returns `200`
4. `npm run health:check`
5. `npm run migrate:deploy`

## Minimal `package.json` Example

```json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend",
    "start:prod": "node backend/dist/server.js",
    "health:check": "curl -fsS http://127.0.0.1:${PORT:-5200}/api/health > /dev/null",
    "migrate:deploy": "prisma migrate deploy"
  }
}
```

## .gitignore (Mandatory)

Every app repo must include a `.gitignore` that prevents local/runtime artifacts from being committed.

Minimum required entries:

```gitignore
# Dependencies
node_modules/

# Secrets and local env
.env
.env.*
!.env.example

# Build output
dist/
build/
.next/
out/

# Logs and coverage
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
coverage/

# OS/editor noise
.DS_Store
.vscode/
.idea/

# Optional local database files (if not intentionally versioned)
*.sqlite
*.sqlite3
*.db
```

Committa aldrig riktiga secrets.
Behåll endast säkra mallar i git (t.ex. .env.example).
Genererade artefakter och lokal cache ska alltid ignoreras.
