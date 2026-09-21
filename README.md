# DevinChat OS

Developer Progress OS — miroir GitHub → features (pas d’analyse de code).

## Stack

Next.js (App Router) · React · TypeScript · Tailwind · Supabase · GitHub OAuth/API

## Structure

```text
app/                 routing + API adapters
frontend/            components + features UI (01_auth → 02_homescreen/github)
backend/             controllers HTTP + features domaine
lib/                 transverse (supabase, github, api/endpoints, crypto)
doc/                 PRD, TDD, DB, checklist pré-prod
supabase/migrations
```

## Dev

```bash
pnpm install
pnpm dev
```

Variables utiles (serveur) : voir `doc/04_PREPROD_CHECKLIST.md` (Supabase + GitHub OAuth).

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

## Docs

1. `doc/01_PRD.md`
2. `doc/02_TDD.md`
3. `doc/03_DATABASE_DESIGN.md`
4. `doc/04_PREPROD_CHECKLIST.md`
