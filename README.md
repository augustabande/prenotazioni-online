# Kami Experience — Kitesurf Booking Platform

![CI](https://github.com/YOUR_ORG/kami-experience/actions/workflows/ci.yml/badge.svg)

Piattaforma SaaS di booking per scuole di kitesurf. Monorepo Nx con Angular 21, NestJS, PostgreSQL su Supabase, pagamenti Stripe.

## Architettura

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Netlify    │       │     Render       │       │   Supabase   │
│  (Angular)   │──API──│   (NestJS)       │──SQL──│ (PostgreSQL) │
│  Tailwind    │       │   Prisma ORM     │       │  Auth (OTP)  │
│  FullCalendar│       │   JWT + Guards   │       │  Pooler      │
└─────────────┘       └───────┬──────────┘       └──────────────┘
                              │
                    ┌─────────┴─────────┐
                    │      Stripe       │
                    │  (Payments +      │
                    │   Webhooks)       │
                    └───────────────────┘
```

## Stack

| Layer | Tecnologia |
|---|---|
| Frontend | Angular 21, Tailwind CSS v4, FullCalendar, Angular CDK, Angular Material |
| Backend | NestJS 11, Prisma 7, class-validator, @nestjs/jwt, @nestjs/schedule |
| Database | PostgreSQL 16 (Supabase) |
| Auth | Supabase Auth (magic link OTP) |
| Payments | Stripe (Payment Intents + Webhooks) |
| Email | Resend |
| Shared | `@kite/shared-types` — DTOs e interfacce condivise |
| CI | GitHub Actions (lint, test, build) |
| Deploy | Render (backend), Netlify (frontend) |

## Quick Start (locale)

```bash
# 1. Clona e installa
git clone https://github.com/YOUR_ORG/kami-experience.git
cd kami-experience
pnpm install

# 2. Avvia PostgreSQL
docker compose up -d

# 3. Configura environment
cp backend/.env.example backend/.env

# 4. Applica migration e seed
pnpm db:reset

# 5. Avvia frontend (4200) + backend (3000)
pnpm dev
```

## Struttura

```
├── frontend/              # Angular 21 (porta 4200)
│   ├── src/app/features/  # Landing, Catalog, Booking, Portal, Admin
│   ├── src/app/core/      # Services, Guards, Interceptors
│   └── netlify.toml       # Config deploy Netlify
├── backend/               # NestJS (porta 3000)
│   ├── src/               # Modules: auth, bookings, slots, payments, ...
│   ├── prisma/            # Schema + migrations + seed
│   └── Dockerfile         # Multi-stage per Render
├── libs/shared-types/     # @kite/shared-types
├── scripts/
│   ├── inject-env.js      # Inject env vars nel build frontend
│   └── smoke-test.sh      # Smoke test post-deploy
├── docs/deploy/           # Guide deploy step-by-step
├── render.yaml            # Blueprint Render
├── docker-compose.yml     # PostgreSQL locale
└── .github/workflows/     # CI pipeline
```

## Comandi utili

```bash
pnpm dev                          # Avvia tutto in parallelo
pnpm nx serve frontend            # Solo frontend
pnpm nx serve backend             # Solo backend
pnpm nx run-many -t lint          # Lint tutto
pnpm nx run-many -t test          # Test tutto
pnpm nx run-many -t build         # Build tutto
pnpm db:seed                      # Seed database
pnpm db:reset                     # Reset + seed database
pnpm db:studio                    # Prisma Studio (GUI)
```

## Deploy

Guide step-by-step in `docs/deploy/`:

1. [Supabase (Database + Auth)](docs/deploy/supabase.md)
2. [Render (Backend API)](docs/deploy/render.md)
3. [Netlify (Frontend SPA)](docs/deploy/netlify.md)
4. [Stripe (Webhooks)](docs/deploy/stripe.md)
5. [Checklist post-deploy](docs/deploy/checklist.md)

### Smoke test

```bash
bash scripts/smoke-test.sh https://kite-booking-api.onrender.com
```

## Credenziali Demo

| Ruolo | Email | Accesso |
|---|---|---|
| Admin | `admin@demo.local` | Magic link (Supabase OTP) |
| Customer | `sofia.bianchi@gmail.com` | Magic link |
| Instructor | `marco.rossi@kamikite.com` | Magic link |

Carta di test Stripe: `4242 4242 4242 4242` — scadenza e CVC qualsiasi.

## Cosa manca per andare in produzione

- [ ] **Rate limiting** — Throttle su API pubbliche (es. `@nestjs/throttler`)
- [ ] **2FA admin** — Autenticazione a due fattori per utenti admin
- [ ] **PCI compliance review** — Verifica conformità PCI DSS per pagamenti
- [ ] **GDPR cookie banner** — Consenso cookie e privacy policy
- [ ] **Backup strategy** — Backup automatici DB con retention policy
- [ ] **Monitoring APM** — Application Performance Monitoring (Sentry, Datadog)
- [ ] **Logging centralizzato** — Aggregazione log (es. Datadog, Logtail)
- [ ] **Disaster recovery** — Piano di recovery con RTO/RPO definiti
- [ ] **Multi-tenancy** — Supporto per più scuole di kitesurf sulla stessa piattaforma
- [ ] **CDN per immagini** — Ottimizzazione immagini con CDN dedicato
- [ ] **E2E tests** — Test Playwright per flussi critici
- [ ] **API versioning** — Versionamento endpoint per backward compatibility
