# Kami Experience — Kitesurf Booking Platform

Monorepo Nx per piattaforma SaaS di booking per scuole di kitesurf.

## Stack

- **Frontend**: Angular 21+ (standalone components, signals, Tailwind CSS, FullCalendar, Angular CDK)
- **Backend**: NestJS (Prisma, class-validator, @nestjs/config, @nestjs/schedule, @nestjs/jwt)
- **Shared**: Libreria `@kite/shared-types` con DTOs e interfacce condivise
- **DB**: PostgreSQL 16

## Setup

```bash
# 1. Installa dipendenze
pnpm install

# 2. (Opzionale) Avvia PostgreSQL con Docker
docker compose up -d

# 3. Configura environment
cp backend/.env.example backend/.env

# 4. Avvia frontend (4200) + backend (3000) in parallelo
pnpm dev
```

## Struttura

```
├── frontend/          # App Angular (porta 4200)
├── backend/           # App NestJS (porta 3000)
│   └── prisma/        # Schema Prisma
├── libs/
│   └── shared-types/  # @kite/shared-types
├── docker-compose.yml # PostgreSQL 16
└── nx.json
```

## Comandi utili

```bash
pnpm dev                          # Avvia tutto in parallelo
pnpm nx serve frontend            # Solo frontend
pnpm nx serve backend             # Solo backend
pnpm nx lint frontend             # Lint frontend
pnpm nx lint backend              # Lint backend
pnpm nx run-many --target=lint    # Lint tutto
```
