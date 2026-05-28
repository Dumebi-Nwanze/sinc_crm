# SINC CRM

Education sales CRM for international student recruitment. Clients chat with the admissions team, sales reps manage conversations and deals, and managers have full oversight across clients, pipeline, and team.

---

## Deployed URLs


| Service                     | URL                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Frontend (Cloudflare Pages) | *Add your Pages URL after deploy*                                                      |
| API (Cloudflare Worker)     | *Add your Worker URL after deploy* (e.g. `https://sinc-crm-api.<account>.workers.dev`) |


---

## Tech Stack


| Layer        | Technology                                     |
| ------------ | ---------------------------------------------- |
| Frontend     | React 19 + React Router v7 + TypeScript + Vite |
| State / Data | TanStack Query v5                              |
| UI           | shadcn/ui primitives + custom design system    |
| Styling      | Tailwind CSS v4                                |
| Icons        | Lineicons                                      |
| Backend      | Cloudflare Workers + Hono                      |
| Auth         | Supabase Auth (JWT)                            |
| Database     | Supabase Postgres + RLS                        |
| Realtime     | Supabase Realtime                              |
| Validation   | Zod (frontend + backend)                       |
| Forms        | React Hook Form                                |
| i18n         | i18next (English + Turkish)                    |


---

## Architecture

```
Browser (React SPA)
  │
  ├─► Supabase Auth + Realtime  (session, live chat/deals)
  │
  └─► Cloudflare Worker /api/*    (Hono + service role)
            │
            └─► Supabase Postgres (RLS enforced on direct client reads too)
```

**Roles:** `client` · `sales` · `manager`


| Role    | Access                                                         |
| ------- | -------------------------------------------------------------- |
| Client  | Own profile, conversations, messages, deal status              |
| Sales   | Assigned/unassigned conversations, owned deals, client CRM     |
| Manager | Full read/write on clients, conversations, deals, team invites |


---

## Local Setup

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (recommended) or npm
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for the API worker)

### 1. Clone and install

```bash
git clone <repo-url>
cd sinc_crm
pnpm install
cd worker && pnpm install && cd ..
```

### 2. Environment variables

Copy the example file and fill in values from your Supabase project dashboard (**Settings → API**):

```bash
cp .env.example .env.local
```

For the Worker, create `worker/.dev.vars` (gitignored) with secrets:

```bash
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
SUPABASE_JWT_SECRET=<JWT secret from Supabase API settings>
RESEND_API_KEY=<optional — required for team invite emails>
```

`worker/wrangler.toml` already sets local `ALLOWED_ORIGIN` and `APP_URL` to `http://localhost:5175`.

### 3. Database

Link to your Supabase project (one-time):

```bash
supabase link --project-ref <your-project-ref>
```

Apply migrations and seed demo data:

```bash
supabase db reset
```

This runs all migrations in `supabase/migrations/` and loads `supabase/seed.sql`.

### 4. Start the API worker

```bash
cd worker
pnpm dev
```

Worker runs at **[http://localhost:8787](http://localhost:8787)**. Health check: `GET /api/health`.

### 5. Start the frontend

In a second terminal, from the repo root:

```bash
pnpm dev
```

App runs at **[http://localhost:5175](http://localhost:5175)**.

### 6. Log in

Use any demo user below with password `**Demo1234!`**.

---

## Environment Variables

### Frontend (`.env.local`)


| Variable                 | Description                       | Where to get it                                        |
| ------------------------ | --------------------------------- | ------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | Supabase project URL              | Supabase → Settings → API → Project URL                |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (safe in browser) | Supabase → Settings → API → anon public                |
| `VITE_API_URL`           | Worker base URL                   | Local: `http://localhost:8787` · Prod: your Worker URL |


### Worker (`worker/.dev.vars` locally · Wrangler secrets in production)


| Variable                    | Description                                                  | Where to get it                                                           |
| --------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL                                         | Set in `wrangler.toml` `[vars]` or dashboard                              |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server only, never expose to frontend** | Supabase → Settings → API → service_role                                  |
| `SUPABASE_JWT_SECRET`       | JWT signing secret for token verification                    | Supabase → Settings → API → JWT Secret                                    |
| `ALLOWED_ORIGIN`            | CORS allowed origin(s), comma-separated                      | Local: `http://localhost:5175` · Prod: your Pages URL                     |
| `APP_URL`                   | Base URL for invite/email links                              | Same as frontend URL                                                      |
| `RESEND_API_KEY`            | Resend API key for transactional email                       | [resend.com](https://resend.com) — optional for local dev without invites |
| `RESEND_FROM`               | Sender address for invites                                   | Default in wrangler.toml                                                  |
| `SYSTEM_ACCOUNT_ID`         | UUID of system service account                               | Set in seed — do not change unless re-seeding                             |


Production secrets:

```bash
cd worker
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put RESEND_API_KEY
```

After deploying Pages, update Worker `ALLOWED_ORIGIN` and `APP_URL` to match the production frontend URL.

---

## Demo Users

All passwords: `**Demo1234!**`


| Email                                         | Role    |
| --------------------------------------------- | ------- |
| [manager@sinc.demo](mailto:manager@sinc.demo) | manager |
| [sales1@sinc.demo](mailto:sales1@sinc.demo)   | sales   |
| [sales2@sinc.demo](mailto:sales2@sinc.demo)   | sales   |
| [client1@sinc.demo](mailto:client1@sinc.demo) | client  |
| [client2@sinc.demo](mailto:client2@sinc.demo) | client  |
| [client3@sinc.demo](mailto:client3@sinc.demo) | client  |


Seed data includes sample clients, conversation threads, deals across pipeline stages, and stage history — log in as `sales1@sinc.demo` or `manager@sinc.demo` to explore the full CRM.

---

## API Routes


| Method    | Path                              | Auth    | Notes                               |
| --------- | --------------------------------- | ------- | ----------------------------------- |
| GET       | `/api/health`                     | None    | Smoke test                          |
| POST      | `/api/inquiry`                    | None    | Public lead form                    |
| GET       | `/api/me`                         | JWT     | Current profile                     |
| POST      | `/api/me/claim`                   | JWT     | Client links account to CRM record  |
| GET/POST  | `/api/clients`                    | JWT     | Role-filtered list / manager create |
| GET       | `/api/clients/:id`                | JWT     | Client detail                       |
| GET/POST  | `/api/conversations`              | JWT     | Inbox / new thread                  |
| GET       | `/api/conversations/:id`          | JWT     | Thread + messages                   |
| POST      | `/api/conversations/:id/messages` | JWT     | Send message                        |
| PATCH     | `/api/conversations/:id/assign`   | JWT     | Assign rep                          |
| PATCH     | `/api/conversations/:id/status`   | JWT     | Open / pending / closed             |
| GET/POST  | `/api/deals`                      | JWT     | Pipeline list / create              |
| GET/PATCH | `/api/deals/:id`                  | JWT     | Detail / update stage or owner      |
| POST      | `/api/deals/:id/notes`            | JWT     | Add note                            |
| GET       | `/api/dashboard`                  | JWT     | Role-specific stats                 |
| GET       | `/api/team`                       | Manager | Team roster                         |
| POST      | `/api/team/invite`                | Manager | Invite sales rep (email via Resend) |


---

## Database Schema

Postgres on Supabase with Row Level Security on all tables.

**Enums:** `app_role`, `conversation_status`, `message_sender_type`, `deal_stage`

**Tables:**


| Table                   | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `profiles`              | User profile linked to `auth.users`, stores role    |
| `clients`               | CRM client records (may exist before account claim) |
| `conversation_threads`  | Chat threads per client, assignment + status        |
| `conversation_messages` | Messages within a thread                            |
| `deals`                 | Sales opportunities with stage, value, owner        |
| `deal_stage_history`    | Audit trail of pipeline stage changes               |
| `deal_notes`            | Internal notes on deals                             |


Migrations live in `supabase/migrations/` (001–005).

---

## Manual Deployment

### Cloudflare Worker (API)

```bash
cd worker
# Set production ALLOWED_ORIGIN + APP_URL in wrangler.toml or via dashboard
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put RESEND_API_KEY
pnpm deploy
```

Set `VITE_API_URL` on Pages to the deployed Worker URL.

### Cloudflare Pages (Frontend)

1. Connect the repo in the Cloudflare Pages dashboard.
2. **Build command:** `pnpm build`
3. **Build output:** `build/client` (static client bundle)
4. Set environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
5. Add a SPA fallback (`/* /index.html 200`) if client-side routes 404 on refresh.

Update Worker `ALLOWED_ORIGIN` to your Pages domain before testing auth.

---

## Scripts


| Command                    | Description                     |
| -------------------------- | ------------------------------- |
| `pnpm dev`                 | Frontend dev server (port 5175) |
| `pnpm build`               | Production frontend build       |
| `pnpm typecheck`           | TypeScript check                |
| `cd worker && pnpm dev`    | Worker dev server (port 8787)   |
| `cd worker && pnpm deploy` | Deploy Worker to Cloudflare     |


---

## Project Structure

```
app/
  components/     # Shared UI (design system + layout)
  features/       # Feature modules (api.ts, hooks, dialogs)
  pages/          # Route pages (one folder per route)
  lib/            # Utilities, i18n, Supabase client
worker/
  src/routes/     # Hono route handlers
  src/services/   # Business logic + Supabase queries
supabase/
  migrations/     # SQL migrations
  seed.sql        # Demo data
```

