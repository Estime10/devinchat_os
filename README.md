# DevinChat OS

Developer Progress OS — miroir GitHub → **arbre de branches** + **notes** (pas d’analyse de code).

## Stack

Next.js (App Router) · React · TypeScript · Tailwind · Supabase · GitHub OAuth/API

## Structure

```text
app/                      routing + API adapters (auth, github callback, repository)
frontend/
  components/             UI transverse (boot, layout, states)
  features/
    01_authentification/
    02_homescreen/github/
    03_repository/        arbre + notes
backend/
  controllers/            HTTP (connect/callback GitHub)
  features/
    01_authentification/
    02_github/            OAuth, repos, credentials RPC
    03_projects/          project 1:1 repo
    04_features/          sync arbre, notes, attachments
lib/                      supabase, github, crypto, notes drafts, hooks
doc/                      01_PRD · 02_TDD · 03_DATABASE_DESIGN · 04_PREPROD_CHECKLIST
supabase/migrations/      source de vérité schéma
```

## V1 live (résumé)

1. Auth Supabase (email/password)
2. GitHub OAuth → homescreen repos
3. `/repository/{owner}/{repo}` → sync on-demand → arbre (`parent_branch_name`)
4. Notes persistées par feature (WebP, bucket privé, URLs signées)
5. Token expiré → redirect `/home?github_error=expired`

Scope détaillé : `doc/01_PRD.md` (section **V1 = arbre + notes**).

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

1. `doc/01_PRD.md` — produit / scope V1
2. `doc/02_TDD.md` — carte d’exploration (pas checklist)
3. `doc/03_DATABASE_DESIGN.md` — schéma live (6 tables + storage)
4. `doc/04_PREPROD_CHECKLIST.md` — migrations / env pré-prod
