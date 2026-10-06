# OpenNow — ServiceNow Platform & ITSM Clone

Self-hosted recreation of the ServiceNow platform engine (Now Platform) and ITSM suite:
incidents, change requests, problems, dual-stream journals, SLA tracking, CMDB —
behind a ServiceNow-compatible Table API.

## Architecture

Type-safe modular monolith. There is **no separate backend server**: the API is
Next.js App Router route handlers running in the same `npm run dev` process as
the UI, talking directly to Postgres and Redis.

```
Browser → Next.js 14 (App Router UI + /api/now/* routes)
              ├── Postgres 16 (tasks, journals, SLAs, CMDB) — Docker
              └── Redis 7 (BullMQ SLA queue) — Docker
BullMQ worker daemon (`npm run worker`, 2nd terminal) — SLA breach cron
```

## Prerequisites

- Node.js 20+, npm
- Docker + Docker Compose (Postgres & Redis)

## Setup

```powershell
cd opennow
npm install
docker compose -f docker/docker-compose.yml up -d
npm run db:migrate   # creates all tables (pgcrypto, task hierarchy, journals, SLA, CMDB)
npm run db:seed      # users, groups, roles, SLA definitions, sample INC0000001
npm run dev          # frontend + backend API on http://localhost:3000
```

Second terminal (optional, powers SLA breach detection):

```powershell
npm run worker
```

Run tests / typecheck / production build:

```powershell
npm test            # vitest — 13 tests (engines, ACL, integration)
npx tsc --noEmit
npm run build
```

> Run only **one** `npm run dev` at a time from this folder. Two servers
> (e.g. `:3000` + `:3001`) share the `.next` dev cache, corrupt it, and pages
> start rendering with no CSS (stylesheet 404s). Fix: stop all servers,
> delete `.next`, start one server.

## Login (seeded, password `Password123!`)

| Username | Roles |
|---|---|
| `admin` | admin, itil, itil_admin, approver_user, employee |
| `itil.manager` | itil, itil_admin, approver_user |
| `itil.fulfiller` | itil |
| `network.tech` | itil |
| `abel.tuter` | employee |

## Sign in with Google / Microsoft

OAuth is optional and lights up automatically when its env vars are set —
buttons appear on `/login`, first-time users are matched by email, otherwise
provisioned with the `employee` role.

```bash
# Google Cloud → APIs & Services → Credentials → OAuth client ID (Web app)
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Azure Portal → App registrations → New → Web redirect URI:
# http://localhost:3000/api/auth/callback/microsoft-entra-id
AUTH_MICROSOFT_ENTRA_ID_ID=
AUTH_MICROSOFT_ENTRA_ID_SECRET=
AUTH_MICROSOFT_ENTRA_ID_TENANT=common   # or your tenant ID
```

See `.env.example`. Restart `npm run dev` after adding keys.

## Authorization (every page)

`src/middleware.ts` (Edge-safe, verifies the Auth.js JWT via `jose`) gates
**all** routes except `/login`, `/api/auth/*` and static assets:

| Who | Where |
|---|---|
| Anyone, no session (`/` shows sign-in prompts for live sections) | `/`, `/login` |
| Signed-out pages → `/login`; session-less API → `401` | everything else |
| `employee` (any signed-in user) | `/`, `/workspace` (overview), `/catalog`, `/tickets`, `/settings` |
| `admin` / `itil` / `itil_admin` only (others → `/tickets`) | `/workspace/incident`, `/workspace/change`, `/workspace/problem` |

Table API routes additionally re-check the session server-side (`401` with no
session). Roles live on the JWT (`token.roles`) and session (`session.user.roles`).
Pure gate logic in `src/lib/security/gates.ts` is unit-tested (`tests/gates.test.ts`).

## Table API (Next.js backend)

Base: `http://localhost:3000/api/now/table/:table`
(`:table` = `incident` | `change_request` | `problem` | `task`)

```powershell
# List — sysparm dialect: = != LIKE, ^ = AND, ^OR = OR
Invoke-RestMethod "http://localhost:3000/api/now/table/incident?sysparm_query=priority=1^active=true&sysparm_limit=10"

# Create — number auto-generated (INC+7 digits), priority from impact×urgency matrix, SLA clocks attach
Invoke-RestMethod http://localhost:3000/api/now/table/incident -Method Post `
  -ContentType "application/json" `
  -Body '{"short_description":"Printer jam floor 3","impact":1,"urgency":1,"category":"hardware"}'

# One record with journals + SLAs
Invoke-RestMethod "http://localhost:3000/api/now/table/incident/<id>"

# Update — state machine enforced (422 on illegal jump), ACL enforced (403)
Invoke-RestMethod http://localhost:3000/api/now/table/incident/<id> -Method Patch `
  -ContentType "application/json" `
  -Body '{"state":2,"work_notes":"Technician dispatched"}'
```

Journal streams: `work_notes` (internal, `itil`/`admin` only) vs `comments`
(customer-visible). Pass either key in POST/PATCH bodies to append.

## State machine

`New (1)` → `In Progress (2)` → `On Hold (3)` / `Resolved (6)` → `Closed (7)`;
`Resolved` can re-open to `In Progress`. `Closed (7)` / `Canceled (8)` are
terminal and read-only. Illegal jumps return HTTP 422.

Priority is derived, never set directly:

| Impact ＼ Urgency | High (1) | Medium (2) | Low (3) |
|---|---|---|---|
| High (1) | P1 Critical | P2 High | P3 Moderate |
| Medium (2) | P2 High | P3 Moderate | P4 Low |
| Low (3) | P3 Moderate | P4 Low | P5 Planning |

## Project structure

```
docker/docker-compose.yml   Postgres 16 + Redis 7
drizzle/                    migrations (applied via src/lib/db/migrate.ts)
src/
  app/                      routes: / (landing console), /login,
                            /workspace/{incident,change,problem}, /catalog, /tickets,
                            /api/now/table/[table](/[id]), /api/auth/[...nextauth]
  components/
    ui/                     shadcn primitives (button, card, badge, input, dialog…)
    deck/                   ops-deck shell: command rail, status strip, queue table, activity feed
    motion/                 transitions-dev wrappers (tabs, accordion, toast, number pop…)
    aceternity/             spotlight, grid backdrop, moving border, 3-D tilt
  lib/
    db/schema/              Drizzle schemas: auth, task, incident, journal, sla, cmdb
    engines/                priorityEngine, stateEngine, numberGenerator, queryParser
    security/acl.ts         row/field ACL (work_notes = itil-only, closed = read-only)
    sla/evaluate.ts         start/pause/stop condition matching, 24x7 vs 8x5 math
    queue/redis.ts          BullMQ connection
  workers/                  slaWorker + 60s breach cron (npm run worker)
  styles/                   motion-tokens, transitions, view-transitions, aceternity
tests/                      vitest: engines, ACL, query parser, SLA, DB integration
```

## UI notes

- Ops-deck theme: dark ink-navy, signal-blue primary, JetBrains Mono ticket numerals.
- Motion: transitions-dev tokens + snippets (skeleton reveals, sliding tabs,
  page slides, toasts, success checks), view-transition CSS recipes ready for a
  Next upgrade (React 18 has no `<ViewTransition>` component, so navigation uses
  `startTransition` + native `document.startViewTransition` enhancement).
- Landing `/` is a live console: real queue counts, runnable sysparm playground,
  lifecycle strip — all querying your database.

## Environment (.env)

`DATABASE_URL` (postgres), `REDIS_HOST`/`REDIS_PORT`, `AUTH_SECRET`,
`SLA_CHECK_INTERVAL_SECONDS=60`. See `.env.example`.
