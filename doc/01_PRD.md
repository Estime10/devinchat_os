# Product Requirements Document — Developer Progress OS

| Champ | Valeur |
| --- | --- |
| **Type de document** | `01_PRD` — Product Requirements Document |
| **Produit** | Developer Progress OS (`devinchat_os`) |
| **Version document** | 1.3 |
| **Statut** | Source of truth — V1 = arbre de branches + notes persistées |
| **Documents associés** | [`02_TDD.md`](./02_TDD.md) · [`03_DATABASE_DESIGN.md`](./03_DATABASE_DESIGN.md) · [`04_PREPROD_CHECKLIST.md`](./04_PREPROD_CHECKLIST.md) |
| **Audience** | Founder / CEO agents / agents spécialisés (architecture, produit, GitHub, UX) |
| **Stack cible** | Next.js (App Router) · TypeScript strict · Tailwind · Supabase · GitHub API |
| **Horizon** | V1 — miroir Git → arbre de branches + notes feature |
| **Séquence docs** | `01_PRD` → `02_TDD` → `03_DATABASE_DESIGN` → `04_PREPROD_CHECKLIST` |

---

## V1 = arbre + notes (cadrage actif)

> **Lire cette section avant le reste du PRD.**  
> Le document historique ci-dessous décrit l’OS complet. **La V1 livrée / à stabiliser n’est pas cet OS.**

### Ce que V1 *est*

Un **miroir d’activité Git** :

1. Auth Supabase (email / password)
2. Homescreen GitHub (OAuth + liste repos + activité commits)
3. Page repository → **arbre généalogique de branches** (pas une pyramide plate) :
   - trunks : `main` / `master` + `develop`
   - forêt `open` ordonnée par parenté (`parent_branch_name`) + récence
   - tier `done` (mergé) conservé même si GitHub efface la branche
4. **Notes persistées** par feature (N notes, texte + images WebP, bucket Storage privé + URLs signées)
5. Sync on-demand à l’ouverture (pas de webhooks)
6. Tokens GitHub chiffrés server-side ; credentials **non SELECT**-ables JWT ; **INSERT/UPDATE table** JWT fermés (`UPDATE(status)` seul) ; RPCs credentials **EXECUTE `service_role` only** (appel serveur après `getUser`)
7. Compares GitHub **O(N)** (bases trunk seulement)
8. Features `merged` **conservées** si GitHub efface la branche (`branch_name = null`)
9. Appels GitHub API **GET only** (`githubApiGet`) — le scope OAuth `repo` reste requis pour les privés (limitation OAuth App ; GitHub App = hors V1)

### Ce que V1 *n’est pas* (gelé — ne pas implémenter)

| Hors V1 | Où c’était décrit | Statut |
| --- | --- | --- |
| Machine d’états `planned → … → done` + % progress | §5 Progress model | Gelé |
| `activity_events` / timeline | DB design + TDD | Gelé |
| Webhooks GitHub | TDD §23 | Gelé |
| TanStack Query | TDD §11 | Gelé — RSC + cache suffisent |
| Sélection persistée de repos suivis | §6 Scope | Gelé |
| Command center, overrides manuels UI | TDD | Gelé |

Le TDD (~2000 lignes) reste une **carte d’exploration**, pas une checklist d’implémentation. Toute reprise d’un item gelé exige une mise à jour explicite de **cette** section V1.

### Invariants techniques V1

1. Compares GitHub **O(N)** : uniquement `develop` / `main|master` comme bases — jamais N² entre toutes les branches.
2. Pas d’analyse de code / clone.
3. Server-first ; pas de credentials dans le bundle client.
4. API GitHub : GET only côté app. Scope `repo` = contrainte OAuth App classique pour lire le privé (pas de scope lecture-seule équivalent).
5. Branche GitHub effacée : `merged` reste `merged` (sans branche) ; le reste → `archived`.
6. Attachments notes : bucket **privé**, lecture via URLs signées owner-scoped ; GC storage des images droppées au save serveur.

---

## 0. Comment lire ce document

Ce PRD est le **document source**. Pour le scope *courant*, la section **V1 = arbre + notes** prime. Le reste du document conserve la vision long terme.

Règles de gouvernance :

1. Le cœur V1 (arbre de branches + notes) est figé tant que la section V1 ne l’autorise pas explicitement.
2. Les idées hors V1 vont dans **§8 Future Exploration** — capturées, non implémentées.
3. Le code n’est **jamais** dans le périmètre d’analyse. Le produit observe l’*activité* GitHub, pas le contenu des fichiers.
4. Une branche = un nœud d’arbre (parenté via `parent_branch_name`). Convention `feature/*` = cible produit ; le miroir V1 peut lister d’autres branches tant que les trunks restent lisibles.

---

## 1. Vision

> **Attention :** les §§1–5 et le corps historique ci-dessous décrivent la **vision long terme** (machine d’états, %, timeline).  
> Pour le scope **implémenté**, seule la section **V1 = arbre + notes** (en tête) fait foi.

### Pourquoi ce produit existe

Les développeurs qui mènent plusieurs projets en parallèle (side projects, clients, expérimentations) n’ont **aucune vue centrale fiable** de l’avancement réel de leurs features.

GitHub contient déjà toute l’information utile — repos, branches, commits, PRs, merges — mais elle est **dispersée, technique et coûteuse à reconstruire mentalement**.

**Developer Progress OS** transforme l’activité GitHub en une lecture humaine de l’avancement :

> « Où en suis-je sur Authentication ? »  
> pas  
> « Qu’y a-t-il dans le diff de `feature/authentication` ? »

Le produit est un **miroir de ton activité de développement** : lisible, centralisé, sans forcer à ouvrir le code, le repo, ou un outil de gestion de projet.

### Promesse produit

En quelques secondes, savoir pour chaque feature :

- son état (planned → done)
- son intensité d’activité récente
- sa branche, son PR éventuel
- un score de progression dérivé d’événements GitHub observables

### Positionnement

| Ce que c’est | Ce que ce n’est pas |
| --- | --- |
| Un OS personnel de progress tracking | Un IDE |
| Un miroir GitHub → features | Un clone local obligatoire |
| Une vue d’avancement | Une analyse sémantique du code |
| Un tableau de pilotage perso | Un Jira / Notion / Linear clone |

---

## 2. Problem

### Constat

Un développeur actif jongle typiquement avec :

- plusieurs **repositories**
- plusieurs **projets** (parfois 1 repo = 1 projet, parfois plusieurs projets logiques)
- des dizaines de **branches** `feature/*`
- des **PRs** ouvertes, stale, mergées
- aucune surface unique qui réponde : *« où j’en suis vraiment ? »*

### Friction actuelle

Pour répondre à « où en est Authentication ? », il faut aujourd’hui :

1. Se souvenir du repo
2. Ouvrir GitHub
3. Trouver la branche
4. Scanner les commits
5. Vérifier s’il y a une PR
6. Interpréter mentalement un % d’avancement

Ce processus est **répétitif, fragile et non scalable** dès que le nombre de projets augmente.

### Coût

- Charge cognitive élevée
- Perte de contexte entre sessions
- Impression de stagner alors que l’activité existe
- Impossible de “piloter” son portfolio de features comme un système

### Insight fondateur

Le workflow Cursor / agentique associe **systématiquement une branche à une feature**. Cette convention n’est pas un détail d’outillage : c’est le **modèle mental natif** à productiser.

```
feature/authentication
        ↓
Authentication
```

Le produit n’invente pas une couche métier artificielle. Il **formalise une pratique déjà réelle**.

---

## 3. Core concept

### Chaîne de domaine (invariant)

```
GitHub Repository
       ↓
Project
       ↓
Git Branch
       ↓
Feature
       ↓
Activity
       ↓
Progress
```

### Définitions métier

| Entité | Définition | Invariants V1 |
| --- | --- | --- |
| **Repository** | Source GitHub connectée (owner/name) | Identité = GitHub `repo_id` |
| **Project** | Unité de pilotage visible dans l’OS | 1 Project ↔ 1 Repository en V1 (simplifié) |
| **Branch** | Branche Git observée | Préfixe conventionnel `feature/` privilégié |
| **Feature** | Unité d’avancement lisible par un humain | 1 Feature ↔ 1 Branch active |
| **Activity** | Événement GitHub daté lié à la feature | Immuable une fois ingéré (append-only logique) |
| **Progress** | État + score dérivés des activités | Recalculable ; jamais saisi manuellement en V1 |

### Mapping branche → feature

Règle V1 :

1. Détecter les branches `feature/<slug>`
2. Dériver le nom humain : `authentication` → `Authentication` (title-case, `-`/`_` → espaces)
3. Créer / mettre à jour la Feature liée à cette branche
4. Attacher toute activité ultérieure de cette branche à la Feature

Exemple UI cible :

```
Authentication

● In progress

Commits       7
Last activity 2h ago
PR            #42
Branch        feature/authentication

Progress
████████░░ 80%
```

### Principe non négociable

> Le produit ne cherche pas à savoir **comment** tu as développé Authentication.  
> Il cherche à savoir **où tu en es** dans le développement d’Authentication.

Le code source reste **hors périmètre**.

---

## 4. GitHub integration

### Objectifs

1. Connecter un compte GitHub (OAuth / GitHub App — décision technique ultérieure, contrainte : scopes minimaux)
2. Lister / sélectionner les repositories à suivre
3. Synchroniser branches, commits, PRs, merges
4. Matérialiser Features + Activities sans jamais cloner le code (sauf si un besoin futur l’exige explicitement — hors V1)

### Flux d’intégration

```
User connecte GitHub
       ↓
Sélection des repositories suivis
       ↓
Sync initiale (branches + PRs ouvertes + activité récente)
       ↓
Webhook / polling pour événements incrémentaux
       ↓
Normalisation → Activity
       ↓
Recalcul Progress / status Feature
```

### Événements observés (V1)

| Signal GitHub | Sens produit |
| --- | --- |
| Branch created (`feature/*`) | Feature créée / status → IN_PROGRESS |
| Commits on branch | Activité ; compteur commits ↑ |
| Push | Intensité d’activité ; last_activity |
| PR opened | Lien PR ; status → PR_OPEN |
| PR merged | status → MERGED puis DONE |
| (Optionnel V1.1) Release / deployment | Signal “shipped” — voir Future Exploration |

### Données stockées (intention)

Métadonnées et événements uniquement, par ex. :

- identifiants GitHub (repo, branch, PR, commit SHA)
- timestamps
- titres / noms (branche, PR title)
- compteurs dérivés

**Interdit en V1 :** contenu des fichiers, diffs, AST, embeddings de code, clone local obligatoire.

### Auth & sécurité (contraintes produit)

- Least privilege sur les scopes GitHub
- Tokens chiffrés / gérés côté Supabase (jamais exposés au client)
- Révocation possible de la connexion
- Logs sans secrets ni tokens

### Décision différée (non bloquante pour le PRD)

- OAuth App vs GitHub App
- Webhooks vs polling vs hybrid
- Fenêtre de lookback de la sync initiale (ex. 30 / 90 jours)

Ces choix appartiennent à l’architecture technique ; le PRD impose seulement les **capacités** ci-dessus.

---

## 5. Progress model

### Machine d’états Feature (V1)

```
PLANNED
   ↓
IN_PROGRESS
   ↓
COMMITTED
   ↓
PUSHED
   ↓
PR_OPEN
   ↓
MERGED
   ↓
DONE
```

### Triggers d’état (proposition V1)

| État | Condition d’entrée (observable) |
| --- | --- |
| `PLANNED` | Feature connue mais aucune activité Git encore (cas rare en V1 auto ; utile si création manuelle future) |
| `IN_PROGRESS` | Branche `feature/*` créée |
| `COMMITTED` | ≥ 1 commit local détecté via événements GitHub (commit reachable) |
| `PUSHED` | ≥ 1 push sur la branche |
| `PR_OPEN` | Pull Request ouverte depuis la branche |
| `MERGED` | PR mergée |
| `DONE` | Merged + (option) branche nettoyée ou délai de confirmation — règle exacte à figer en implémentation |

**Note :** certains états peuvent être sautés (ex. PR ouverte sans distinguer COMMITTED/PUSHED). La machine doit accepter des **transitions avec sauts** tant que l’ordre logique est respecté.

### Score de progression (V1 — heuristique explicite)

Le % n’est **pas** une vérité absolue. C’est une **lecture pédagogique** dérivée d’événements.

Proposition initiale (ajustable, versionnée) :

| Signal | Contribution indicative |
| --- | --- |
| Branche créée | 10 % |
| Premier commit | 25 % |
| Activité commits (plafond) | jusqu’à 50 % |
| Push récent | +10 % |
| PR ouverte | 70 % baseline |
| PR mergée | 100 % |

Règles :

1. Le score est **monotone non-décroissant** sauf correction d’événement (rare)
2. La formule est **versionnée** (`progress_model_version`) pour permettre d’évoluer sans réécrire l’historique
3. L’UI doit pouvoir afficher « estimé » — jamais « certifié »

### Surfaces d’activité affichées (carte Feature)

- Status (badge)
- Nombre de commits
- Last activity (relative)
- PR number + lien
- Nom de branche
- Barre de progress + %

---

## 6. Scope V1 (live)

> Aligné sur la section tête **V1 = arbre + notes**. Le corps historique §§1–5 ne prime pas.

### In scope

1. Auth utilisateur (Supabase email/password) + messages d’erreur génériques
2. Connexion GitHub OAuth App (`read:user` + `repo`) — GET only
3. Homescreen : liste repos + activité commits
4. Page repository : sync on-demand → **arbre** de branches (`parent_branch_name`) + tiers trunks / open / done
5. Statuts runtime : `committed` \| `merged` \| `archived` (pas de % progress)
6. **Notes persistées** par feature (texte + images WebP, bucket privé, URLs signées)
7. Credentials GitHub chiffrés ; JWT sans SELECT/INSERT/UPDATE credentials ; RPCs read/write réservés `service_role` (server-only)

### Explicitement hors scope V1

| Non-objectif | Pourquoi |
| --- | --- |
| Machine d’états `planned→…→done` + % | Gelé — vision long terme |
| `activity_events` / timeline / webhooks | Gelé |
| TanStack Query | Gelé — RSC + cache |
| Sélection persistée de repos à suivre | Gelé — ouverture repo = follow implicite |
| Analyse / lecture du code | Contredit le positionnement |
| Clone obligatoire des repos | Complexité inutile |
| Documentation type Notion | Les notes restent attachées à une feature |
| Multi-user / org / team OS | Produit personnel |
| GitHub App | Post-V1 (least-privilege Contents: Read) |

### Critères de succès V1

Un utilisateur connecté doit pouvoir :

1. Connecter GitHub et voir ses repos
2. Ouvrir un repo et lire l’arbre de branches (parenté + récence)
3. Voir `done` conservé même si GitHub a effacé la branche
4. Écrire / sauver des notes (texte + images) sur une feature
5. Être renvoyé au homescreen connect si le token GitHub expire

### Non-critères V1

- Exactitude “comptable” d’un %
- Couverture de 100 % des workflows Git exotiques
- Support des monorepos multi-projets complexes

---

## 7. Architecture cible (intention — pas d’implémentation)

### Stack

| Couche | Choix |
| --- | --- |
| Front | Next.js latest (App Router), React, TypeScript strict, Tailwind |
| Backend | Supabase (Auth, Postgres, Edge Functions / RLS) |
| Source de vérité activité | GitHub API (+ webhooks si possible) |
| Domaine | Entités isolées de l’UI (`backend/features/*` + UI dans `frontend/features/*`) |

### Principes d’implémentation alignés rules Cursor

- Server Components par défaut ; `"use client"` justifié
- Pas de logique métier dans les composants UI
- Validation Zod aux frontières
- RLS Supabase : un user ne voit que ses projets
- Diff minimal ; pas de sur-abstraction
- Domaine avant technique

### Structure app (cible)

```
/app                         → routing Next (groupes ordonnés 01_auth → 02_protected) + api/
/frontend/components         → UI transverse (ui, layout, states)
/frontend/features           → UI produit ordonnée par flow
  /01_authentification
  /02_homescreen
    /github                  → UI connexion GitHub (sous-flow homescreen)
/backend/controllers         → transport HTTP (adapters app/api délèguent ici)
/backend/features            → domaine serveur ordonné
  /01_authentification
  /02_github                 → OAuth tokens, repos, règles métier
/lib                         → transverse (supabase, api/endpoints, github client, crypto)
/doc                         → PRD & décisions produit
/supabase/migrations         → schéma Postgres
```

---

## 8. Future Exploration

> Zone de capture. **Ne pas implémenter** sans mise à jour explicite du Scope V1.

### Idées candidates (non priorisées)

- Mapping 1 Repository → N Projects (monorepo / workspaces)
- Features hors convention `feature/` (config de patterns)
- Releases / Deployments (Vercel, GitHub Releases) comme état `SHIPPED`
- Timeline globale cross-projets (“ce que j’ai avancé cette semaine”)
- Streaks / rythme de shipping (gamification légère)
- Override manuel du status (exception, pas le défaut)
- Détection de branches stale / zombie features
- Intégration Linear/GitHub Issues comme *entrée* PLANNED (attention : ne pas devenir Jira)
- Vue “CEO mode” : portfolio de projets en une page
- Export / API publique de son progress
- Multi-device sync déjà couvert via cloud — widgets desktop
- IA **uniquement** pour résumer l’activité textuelle (titres de commits/PR) — jamais pour “comprendre le code”
- Progress model ML / personnalisé par utilisateur
- Organisation / équipes (Progress OS collab)

### Règle anti-contamination

Toute idée de cette section qui menace le cœur « miroir d’activité, zero code analysis » doit être **rejetée ou reformulée** avant d’entrer en scope.

---

## 9. Glossaire

| Terme | Sens |
| --- | --- |
| **Progress OS** | Le produit ; système personnel de lecture d’avancement |
| **Feature** | Unité métier d’avancement, liée à une branche |
| **Activity** | Événement GitHub normalisé |
| **Progress** | État + score dérivés |
| **Mirror** | Principe : refléter l’activité, ne pas interpréter le code |

---

## 10. Décisions (V1 live)

| ID | Décision | Statut |
| --- | --- | --- |
| D1 | **OAuth App** GitHub (`read:user` + `repo`) — pas GitHub App | Verrouillé V1 |
| D2 | 1 project = 1 repo à l’ouverture | Verrouillé V1 |
| D3 | Pas de % progress | Gelé (vision) |
| D4 | Sync **toutes** les branches (pas filtre `feature/*` seul) | Verrouillé V1 |
| D5 | Sync on-demand à l’ouverture — pas de webhooks | Verrouillé V1 |
| D6 | Parenté arbre = `parent_branch_name` | Verrouillé V1 |

---

## 11. Annexes — user stories V1 (seed)

1. En tant que développeur, je connecte GitHub pour que l’OS puisse lire mon activité.
2. En tant que développeur, je vois automatiquement une Feature quand je crée `feature/<name>`.
3. En tant que développeur, je vois l’arbre de branches (parenté + récence) sur le repository.
4. En tant que développeur, j’attache des notes (texte + images) à une feature et elles persistent.
5. En tant que développeur, je comprends le status sans ouvrir le code.
6. En tant que développeur, quand ma PR est mergée, la Feature passe à Done.

---

## Changelog document

| Version | Date | Changement |
| --- | --- | --- |
| 1.3 | 2026-09-22 | §6 Scope + décisions alignés V1 live (arbre, notes, OAuth App, sync toutes branches) |
| 1.2 | 2026-09-22 | V1 = **arbre** de branches + **notes persistées** (retire pyramide plate ; notes hors Future Exploration) |
| 1.1 | 2026-09-21 | Section **V1 = pyramide** en tête — gel webhooks / TanStack / progress % / activity_events |
| 1.0 | 2026-09-18 | Création PRD source — Vision, Problem, Core concept, GitHub, Progress, Scope V1, Future Exploration |
