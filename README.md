# AMDOX ERP — AI-Powered Cloud ERP Suite

**Project code:** AMX-ERP-2026-04 · **Version:** 1.0.0

A multi-tenant, AI-augmented ERP platform covering financial management, HR & payroll,
supply chain automation, project delivery, business intelligence and demand forecasting.

Built as a single Next.js 16 application so it deploys to Vercel with **zero configuration** —
no database to provision, no environment variables to set, no separate services to keep alive.

---

## Table of contents

1. [Quick start](#quick-start) — run it in two commands
2. [Full setup](#full-setup) — prerequisites, macOS, Windows, Linux
3. [Push to GitHub](#push-to-github)
4. [Deploy to Vercel](#deploy-to-vercel)
5. [Demo accounts](#demo-accounts)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Requirements coverage F-01 → F-12](#requirements-coverage--f-01-to-f-12)
9. [Architecture](#architecture) · [Security](#security) · [API](#api) · [Forecasting](#forecasting)
10. [Project structure](#project-structure) · [Verified](#verified)

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, click any demo account on the login screen, done.
No database, no `.env` file, no seeding step.

---

## Full setup

### Prerequisites

| Tool | Minimum | Check with | Get it |
|---|---|---|---|
| **Node.js** | **20.9.0** (Next.js 16 requirement) | `node --version` | [nodejs.org](https://nodejs.org) — install the LTS build |
| **npm** | 10.x (ships with Node 20) | `npm --version` | bundled with Node |
| **Git** | any recent | `git --version` | [git-scm.com](https://git-scm.com) |

Node 18 or below **will not build this project.** If `node --version` prints anything
lower than `v20.9.0`, upgrade before continuing.

<details>
<summary>Upgrading Node with a version manager (recommended)</summary>

```bash
# macOS / Linux — nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec $SHELL
nvm install 20
nvm use 20

# macOS — Homebrew alternative
brew install node@22 && brew link --overwrite node@22

# Windows — nvm-windows (run PowerShell as Administrator)
winget install CoreyButler.NVMforWindows
nvm install 20.18.0
nvm use 20.18.0
```
</details>

### If you are moving the project between machines

Copy **only the source**. Never copy these — they are machine-specific, huge, and will
break a build on a different OS or CPU architecture:

```
node_modules/          ~450 MB of platform-native binaries
.next/                 build cache from the other machine
tsconfig.tsbuildinfo   incremental TypeScript cache
next-env.d.ts          regenerated on every build
```

If you already copied them, delete them and reinstall:

```bash
# macOS / Linux
rm -rf node_modules .next tsconfig.tsbuildinfo next-env.d.ts
npm install
```

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, .next, tsconfig.tsbuildinfo, next-env.d.ts -ErrorAction SilentlyContinue
npm install
```

Cloning from GitHub avoids this entirely — `.gitignore` already excludes all four.

### Run it

```bash
cd amdox-erp

npm install              # ~40s, installs 4 runtime deps + 7 dev deps

npm run dev              # development server, hot reload  → http://localhost:3000
npm run build            # production build (must succeed before deploying)
npm start                # serve the production build      → http://localhost:3000
npm run typecheck        # tsc --noEmit, should print nothing
```

A successful `npm run build` ends with `✓ Compiled successfully` and a route table
listing 27 static pages plus the API routes. `npm audit` should report
**0 vulnerabilities**.

To run on a different port: `npm run dev -- -p 4000`.

---

## Push to GitHub

Run these from inside the `amdox-erp` folder. They work on macOS, Linux and Git Bash on
Windows; PowerShell equivalents are noted where they differ.

**1 — Clean machine-specific artifacts so the first commit is small and portable**

```bash
rm -rf node_modules .next tsconfig.tsbuildinfo next-env.d.ts
```

**2 — Authenticate as the correct GitHub account**

```bash
# install the GitHub CLI if you don't have it
brew install gh            # macOS
winget install GitHub.cli  # Windows

gh auth login
#   → GitHub.com
#   → HTTPS
#   → Authenticate Git with your GitHub credentials?  Yes
#   → Login with a web browser  (paste the one-time code it shows)

gh auth status             # MUST print the account you intend to push to
```

Stop if `gh auth status` shows the wrong account. Switch with
`gh auth logout` then `gh auth login` again, or `gh auth switch --user <username>`.

**3 — Set your commit identity** (skip if already configured globally)

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

**4 — Initialise, review, commit**

```bash
git init -b main
git add .
git status --short | wc -l    # expect ~125 files
git status --short | grep -c node_modules   # MUST print 0

git commit -m "AMDOX ERP — AI-powered cloud ERP suite (AMX-ERP-2026-04)"
```

**5 — Create the remote repository and push**

```bash
gh repo create amdox-erp --public --source=. --remote=origin --push
gh repo view --web
```

<details>
<summary>Without the GitHub CLI</summary>

Create an empty repository at <https://github.com/new> — **no** README, `.gitignore` or
licence, or the first push will be rejected as a non-fast-forward. Then:

```bash
git remote add origin https://github.com/<username>/amdox-erp.git
git push -u origin main
```

Git will prompt for credentials. The password field needs a **Personal Access Token**,
not your account password: <https://github.com/settings/tokens> → *Generate new token
(classic)* → scope `repo` → copy it and paste it **at the terminal prompt only**.
Never put a token in a file, a commit, or a chat message. If one ever leaks, revoke it
immediately at that same settings page.
</details>

**6 — Later pushes**

```bash
git add -A
git commit -m "describe the change"
git push
```

**Pulling it down on another machine**

```bash
git clone https://github.com/<username>/amdox-erp.git
cd amdox-erp
npm install
npm run dev
```

---

## Deploy to Vercel

The repository is deployment-ready as-is. Nothing needs to be configured.

1. Go to <https://vercel.com/new> and sign in with GitHub.
2. **Import** the `amdox-erp` repository.
3. Leave every setting at its default — Vercel auto-detects Next.js:
   - Framework preset: **Next.js**
   - Build command: `next build`
   - Output directory: `.next`
   - Install command: `npm install`
   - Root directory: `./` — **unless** you committed the parent folder, in which case
     set it to `amdox-erp`.
4. Environment variables: **none required.** Optionally set `AUTH_SECRET` to a long
   random string so sessions survive redeploys.
5. Click **Deploy**. First build takes roughly 60–90 seconds.

Verify the deployment:

```bash
curl https://<your-app>.vercel.app/api/v1/health
```

It should return `{"status":"ok",...}` with datastore, audit-chain and forecast-engine
sections.

**Via CLI instead:**

```bash
npm i -g vercel
vercel login
vercel --prod
```

> **Note on data persistence.** The app ships a deterministic in-process dataset rather
> than a database — that is what makes it deploy with zero configuration. Writes persist
> for the life of a server instance; a Vercel cold start or a new deployment resets to the
> seed. `Settings → Reset demo data` restores it on demand. Swapping in a real database
> means reimplementing one module, `src/lib/db/repo.ts`.

---

## Demo accounts

All accounts use the password **`Amdox@2026`**. They are listed on the login screen and
one click fills the form.

| Email | Role | What it demonstrates |
|---|---|---|
| `nishant@amdox.in` | SuperAdmin | Full access, both tenants, demo reset |
| `admin@amdox.in` | TenantAdmin | Period close, tenant settings, **MFA step** |
| `cfo@amdox.in` | Manager | Finance posting, approvals, payroll runs |
| `hr@amdox.in` | Manager | Leave approvals, payroll |
| `employee@amdox.in` | Employee | Self-service views only |
| `viewer@amdox.in` | Viewer | Read-only dashboards — everything else is blocked |
| `admin@northwind.io` | TenantAdmin | Second tenant (USD), proves tenant isolation |

The `admin@amdox.in` account exercises the multi-factor step; the demo code is shown on
the MFA screen.

**A three-minute tour:** sign in as `cfo@amdox.in` → **Dashboard** for cross-module KPIs →
**Finance → Ledger**, post an unbalanced journal and watch it fail with the exact
debit/credit totals → **HR → Payroll**, run a period, then run it again to get the
duplicate-run conflict → **Forecasting** for the Holt-Winters ensemble and its backtested
MAPE → **Audit** and hit *Verify chain*. Then sign out, sign in as `viewer@amdox.in`, and
confirm finance, payroll and audit are all blocked at the route *and* the API.

---

## Configuration

Every variable is optional (see `.env.example`). To use them locally, copy the file:

```bash
cp .env.example .env.local
```

| Variable | Default | Purpose |
|---|---|---|
| `AUTH_SECRET` | derived per deployment | Session signing key — set in production so sessions survive redeploys |
| `SESSION_TTL_SECONDS` | `28800` | Session lifetime (8 hours) |
| `RATE_LIMIT_MAX` | `240` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Window length |

`.env.local` is gitignored and will never be committed.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `You are using Node.js 18.x. For Next.js, Node.js version >= 20.9.0 is required.` | Node too old | Upgrade Node — see [prerequisites](#prerequisites) |
| `Error: Cannot find module ... /node_modules/@next/swc-*` | `node_modules` copied from another OS/architecture | `rm -rf node_modules package-lock.json && npm install` |
| `EADDRINUSE: address already in use :::3000` | Port taken | `npm run dev -- -p 4000`, or `lsof -ti:3000 \| xargs kill` (macOS/Linux) / `npx kill-port 3000` |
| Build fails right after cloning | Stale caches came along for the ride | `rm -rf .next tsconfig.tsbuildinfo && npm run build` |
| `npm ERR! code EACCES` on install | Global-install permission problem | Use a Node version manager instead of a system Node; never `sudo npm install` |
| `remote: Permission to <user>/amdox-erp.git denied` | Pushing as the wrong GitHub account | `gh auth status`, then `gh auth switch --user <username>` or re-run `gh auth login` |
| `Updates were rejected because the remote contains work that you do not have` | The GitHub repo was created with a README | `git pull --rebase origin main` then push again |
| macOS: `xcrun: error: invalid active developer path` | Command Line Tools missing | `xcode-select --install` |
| Windows: `running scripts is disabled on this system` | PowerShell execution policy | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Data looks different after a while on Vercel | Cold start reset the in-process store | Expected — see the note under [Deploy](#deploy-to-vercel); use `Settings → Reset demo data` |
| Logged out unexpectedly after a redeploy | `AUTH_SECRET` was auto-derived and changed | Set `AUTH_SECRET` in the Vercel project settings |

---

## Requirements coverage — F-01 to F-12

| ID | Requirement | Where it lives | How it is met |
|---|---|---|---|
| **F-01** | Multi-tenant auth (SSO) | `src/lib/auth/`, `src/middleware.ts` | HMAC-signed session cookies, MFA step, 5-level RBAC, tenant filtering enforced in the repository layer |
| **F-02** | Financial ledger (GL) | `src/lib/domain/ledger.ts`, `/finance/ledger` | Double-entry validation, trial balance, P&L, balance sheet, multi-currency, period close/reopen |
| **F-03** | AP / AR automation | `src/components/finance/`, `/finance/payables` | 3-way match states, ageing buckets, DSO, payment runs that post the cash journal |
| **F-04** | HR & payroll engine | `src/lib/domain/payroll.ts`, `/hr/*` | Employee CRUD, org chart, attendance, leave state machine, gross-to-net payroll with statutory slabs |
| **F-05** | Supply chain & inventory | `src/lib/domain/inventory.ts`, `/supply-chain/*` | Stock ledger, ABC analysis, reorder-point engine that raises purchase orders, PO → goods receipt |
| **F-06** | AI demand forecasting | `src/lib/domain/forecast.ts`, `/forecasting` | Holt-Winters + additive-decomposition ensemble, grid-searched parameters, backtested MAPE, prediction intervals |
| **F-07** | Project management | `src/lib/domain/projects.ts`, `/projects` | Gantt, DAG validation, critical path, budget variance alerts, resource utilisation |
| **F-08** | Business intelligence | `src/lib/domain/analytics.ts`, `/analytics` | Cross-module KPIs, drill-down tables, CSV export |
| **F-09** | Audit & compliance log | `src/lib/db/store.ts`, `/audit` | Append-only SHA-256 hash chain with a verification endpoint |
| **F-10** | Notification engine | `src/lib/db/store.ts`, `/notifications` | Domain events, severity routing, in-app / email / webhook channels, per-user preferences |
| **F-11** | API gateway | `src/app/api/v1/`, `/api-docs` | 37 versioned REST endpoints, published OpenAPI 3.1 spec, rate limiting, validation |
| **F-12** | Offline / PWA | `public/sw.js`, `public/manifest.webmanifest` | Installable PWA, service worker caching for read views, offline fallback page |

---

## Architecture

```
Browser (PWA)
    │  HTTPS
    ▼
Edge middleware ────── session verification + coarse RBAC gate
    │
    ├──► Server Components ──┐
    ├──► Server Actions ─────┤──► Repository layer ──► Seeded in-process store
    └──► REST /api/v1/* ─────┘      (tenant scoping,      (deterministic dataset)
                                     audit, events)
                                          │
                                          ▼
                              Domain engines: ledger · payroll ·
                              inventory · forecasting · projects
```

### Key design decisions

**Single deployable unit.** The original stack sketch had a Fastify API, a Python ML
service and a managed Postgres. Consolidating into one Next.js app removes three
independent failure modes from the live demo. The forecasting models are implemented in
TypeScript rather than Python, so there is no second service to keep warm.

**Repository pattern with enforced tenancy.** Every read passes through `src/lib/db/repo.ts`,
which filters by `tenantId` and honours soft deletes. Page components never touch the
underlying arrays, so a forgotten filter cannot leak another tenant's data. Swapping in a
SQL adapter means reimplementing that one module.

**Defence in depth on authorisation.** Every mutation is checked three times: Edge
middleware gates the route, the server action re-checks the permission before mutating, and
the API route checks again. A hidden button is never the security boundary.

**Tamper-evident audit trail.** Each audit record stores `SHA-256(prevHash ‖ canonical(payload))`.
Editing, deleting or reordering any record breaks the next link. `/api/v1/audit/verify`
replays the chain and reports the exact sequence number where it fails.

**Zero-dependency charts.** All visualisations are hand-rolled SVG. Nothing to break on a
build, and every mark follows one spec: 2px strokes, 4px rounded data-ends, a 2px surface
gap between adjacent fills. The categorical palette is validated for colour-vision
deficiency — every adjacent pair clears the CVD separation floor and the 3:1 contrast bar —
and every chart carries a legend plus direct labels so identity is never colour-alone.

**Data layer.** The platform ships with a deterministic, seeded in-process dataset
(2 tenants, 73 employees, 240+ journal entries, 62 invoices, 35 SKUs, 36 months of demand
history per SKU). A fixed PRNG seed makes every server instance produce identical data. This
is what makes the live demo bulletproof: there is no database that can be asleep, throttled
or unreachable. Mutations persist for the life of the server instance; `Settings → Reset
demo data` restores the seed.

---

## Security

| Control | Implementation |
|---|---|
| Session integrity | HMAC-SHA-256 signed cookies, `httpOnly` + `sameSite=lax` + `secure` in production |
| Credential handling | Constant-time digest comparison; a missing user still runs a comparison so timing does not reveal whether an address exists |
| Authorisation | 29 named permissions across 5 roles, checked at middleware, action and API layers |
| Input validation | Zod schemas on every mutating endpoint and server action; failures return 422 with the offending paths |
| Rate limiting | Fixed-window counter per IP per path, with `X-RateLimit-*` and `Retry-After` headers |
| Headers | CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy |
| Audit | Immutable hash-chained trail over every mutation |
| Secrets | Nothing hardcoded; all configuration is optional and read from the environment |

---

## API

Base path `/api/v1`. The full contract is served at `/api/v1/openapi.json` and browsable
at `/api-docs`.

```bash
# Sign in and keep the session cookie
curl -c jar.txt -X POST https://<your-app>/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"cfo@amdox.in","password":"Amdox@2026"}'

curl -b jar.txt 'https://<your-app>/api/v1/employees?limit=5'
curl -b jar.txt 'https://<your-app>/api/v1/forecast?horizon=6'
curl -b jar.txt  https://<your-app>/api/v1/audit/verify
```

Errors use one envelope: `{ "error": { "code", "message", "details"? } }` with
400 malformed body · 401 unauthenticated · 403 forbidden · 404 not found ·
409 conflict · 422 validation · 429 rate limited.

`/api/v1/health` is public and reports datastore, audit-chain and forecast-engine status.

### Business rules worth demonstrating

These all return a real error rather than silently accepting bad input:

- Posting an unbalanced journal → **422** with the debit/credit totals
- Posting into a closed accounting period → **409**
- Closing a period that still has draft entries → **409** naming the count
- Running payroll twice for the same month → **409**
- Approving an invoice with an open price or quantity variance → **409**
- Paying more than an invoice's outstanding balance → **409**
- Adjusting stock below zero → **409**
- Receiving a purchase order that was never approved → **409**
- Deciding an already-decided leave request → **409**

---

## Forecasting

Two models are fitted per SKU and blended:

1. **Holt-Winters** additive triple exponential smoothing — level, trend and 12-month
   seasonality. The smoothing constants α, β and γ are chosen by grid search over
   one-step-ahead squared error, not hardcoded.
2. **Additive decomposition** — OLS linear trend plus per-month seasonal offsets learnt from
   the detrended residual.

Both are fitted on all but the last six periods and scored against that hold-out. The
ensemble weights each model by the inverse of its MAPE; if one wins decisively it is used
alone. Prediction intervals come from in-sample residual variance and widen with √h. The
suggested reorder quantity is lead-time demand plus a 95% service-level safety stock.

Portfolio accuracy on the seeded data is **~8.7% MAPE**, inside the <12% acceptance target.

---

## Project structure

```
amdox-erp/
├── src/
│   ├── app/
│   │   ├── (app)/              20 authenticated screens + shared server actions
│   │   ├── api/v1/             37 REST endpoints
│   │   ├── login/              credentials + MFA flow
│   │   └── layout.tsx
│   ├── components/
│   │   ├── charts/             hand-rolled SVG: line, bar, donut, gantt, heatmap, sparkline
│   │   ├── ui/                 primitives, action wrappers, toasts, dialogs
│   │   ├── layout/             app shell, sidebar, topbar
│   │   └── finance/            shared AP/AR workspace
│   ├── lib/
│   │   ├── api/                route wrapper, rate limiting, OpenAPI document
│   │   ├── auth/               tokens, RBAC, session, MFA
│   │   ├── db/                 types → seed → store → repository
│   │   ├── domain/             ledger · payroll · inventory · forecast · projects · analytics
│   │   ├── hash.ts             dependency-free SHA-256 / HMAC (Node + Edge)
│   │   └── utils.ts
│   └── middleware.ts
├── public/                     manifest, service worker, icons
├── .env.example                all variables, all optional
├── next.config.mjs             security headers
├── tailwind.config.ts
└── tsconfig.json
```

## Stack

Next.js 16 (Turbopack) · React 19 · TypeScript 5.7 (strict) · Tailwind CSS 3.4 · Zod.

Four runtime dependencies in total. No charting library, no ORM, no auth library, no crypto
package — which is why the build has no moving parts that can fail on a fresh deploy.
`npm audit` reports **0 vulnerabilities**.

## Verified

`npm ci && npm run build` from a clean checkout, then a 49-check acceptance pass against the
production server:

- 18 authenticated screens plus the public surface (health, OpenAPI, manifest, service worker, offline, 404)
- authentication: unauthenticated redirect, 401 on the API, wrong password, malformed body, MFA gate
- RBAC: Viewer blocked from finance, payroll and audit at both the route and API layers
- business rules: duplicate payroll, unbalanced journal, closed period, unknown account, reorder engine, forecast MAPE target, audit-chain verification, tenant isolation
- hardening: CSP, HSTS, X-Frame-Options, rate-limit headers, no `X-Powered-By`

Measured: forecast portfolio MAPE 8.7% · payroll run for 55 employees in ~2 ms ·
audit chain valid after mutations · 0 foreign-tenant rows leaked.

---

*Amdox Technologies — Engineering Division · April 2026*
