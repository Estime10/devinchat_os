# Database Design / Data Model

## Developer Progress OS

| Champ | Valeur |
| --- | --- |
| **Type de document** | `03_DATABASE_DESIGN` — Database Design / Data Model |
| **Statut** | Aligné V1 live (arbre + notes) |
| **Version** | 1.2 |
| **Documents associés** | [`01_PRD.md`](./01_PRD.md) · [`02_TDD.md`](./02_TDD.md) · [`04_PREPROD_CHECKLIST.md`](./04_PREPROD_CHECKLIST.md) |
| **SGBD** | PostgreSQL via Supabase |
| **Principe** | Modèle minimal justifié par le domaine — pas de tables « pour faire sérieux » |
| **Source de vérité schéma** | `supabase/migrations/*` (ce doc décrit le live ; le SQL gagne en cas de divergence) |

---

## 0. Comment lire ce document

> **V1 live = 6 tables** + bucket Storage notes.  
> `activity_events` / `project_sync_state` / parenté `parent_feature_id` / webhooks = **hors V1** (vision historique encore présente plus bas, marquée comme telle).

Ce document décrit le modèle de données **implémenté**.

Il répond à :

1. Qui possède quoi ?
2. Comment représenter GitHub ?
3. Comment une branche devient une feature (arbre via `parent_branch_name`) ?
4. Où vivent les notes + images ?
5. Que faire si une branche / un repo disparaît ?
6. Quelles tables ont du RLS ?
7. Comment les credentials GitHub sont isolés ?

### Gouvernance

- Toute évolution de schéma passe par une migration versionnée.
- Les décisions marquées **DÉCISION V1** sont figées jusqu’à révision explicite.
- Les éléments hors V1 sont listés en §16 — capturés, non créés.

---

## 1. Décisions verrouillées (résumé)

| # | Décision |
| --- | --- |
| D1 | L’identité utilisateur est **Supabase Auth** (`auth.users`). Pas de table `users` applicative. |
| D2 | `profiles` = données applicatives non-auth (`display_name` seulement — pas d’`avatar_url`). |
| D3 | Un **project** appartient à un user via `owner_id`. Pas de `project_members` en V1. |
| D4 | Un project est lié à **un** repository GitHub (`github_repository_id`) — créé à l’ouverture repo. |
| D5 | Une **connexion GitHub** appartient à un user ; les repos découverts appartiennent à cette connexion. |
| D6 | Une **feature** a un UUID interne. Les IDs GitHub sont stockés séparément. |
| D7 | **Pas de table `branches`**. La branche est un attribut de la feature (`branch_name`). |
| D8 | **Parenté V1 live** = `parent_branch_name` (nom de branche Git parent). `parent_feature_id` existe en SQL mais **n’est pas écrit** par le sync — hors usage V1. |
| D9 | **Pas d’`activity_events` en V1 live.** Sync on-demand → upsert features directement. |
| D10 | Idempotence sync : upsert par `(project_id, branch_name)`. |
| D11 | Branche GitHub **supprimée** → si `done` : `branch_name = NULL` (status conservé) ; sinon → `archived`. |
| D12 | Repo déconnecté → lien projet nullifié ; pas de cascade destructive sur les features. |
| D13 | RLS obligatoire sur toutes les tables user-data. |
| D14 | Tokens GitHub chiffrés server-side ; SELECT + INSERT/UPDATE colonnes credentials **fermés** ; lecture/écriture via RPC DEFINER. |
| D15 | Tables applicatives V1 live : **6** (`profiles`, `github_connections`, `github_repositories`, `projects`, `features`, `feature_notes`) + bucket `feature-note-attachments`. |
| D16 | Sync = **toutes** les branches GitHub du repo (pas seulement `feature/*`). Statuts runtime : `in_progress` \| `done` \| `archived`. |
| D17 | Notes : N par feature ; images WebP ; bucket **privé** ; URLs **signées** (TTL 1h) ; GC storage au save serveur. |

---

## 2. Modèle conceptuel (V1 live)

```text
auth.users  (Supabase Auth — email / password / session)
    │
    ├── profiles
    │
    ├── github_connections
    │         │
    │         └── github_repositories
    │                   ▲
    │                   │ (lien 1:1 à l’ouverture)
    └── projects ───────┘
              │
              └── features
                      │  parent_branch_name → arbre UI
                      └── feature_notes
                              └── Storage: feature-note-attachments (privé)
```

### Boucle métier live

```text
User ouvre /repository/{owner}/{repo}
        ↓
OAuth token (RPC credentials) + ensure project 1:1 repo
        ↓
fetch branches + merge matrix trunks O(N) + parents PR
        ↓
upsert features (status in_progress|done, parent_branch_name, last_pushed_at)
        ↓
archive stale (done sans branche / archived)
        ↓
UI arbre + notes persistées
```

---

## 3. Inventaire des tables V1 live

| Table | Rôle | RLS |
| --- | --- | --- |
| `profiles` | Profil applicatif 1:1 avec `auth.users` | Oui |
| `projects` | Unité de pilotage ; propriétaire = user | Oui |
| `github_connections` | Connexion OAuth GitHub du user | Oui |
| `github_repositories` | Repos découverts via la connexion | Oui |
| `features` | Feature / branche + parenté Git + statut | Oui |
| `feature_notes` | Notes utilisateur (texte + attachments) par feature | Oui |

**Storage V1 :** bucket `feature-note-attachments` — **privé**, SELECT/INSERT/UPDATE/DELETE owner-scoped (`auth.uid()` prefix) ; lecture via URLs signées (TTL 1h).

**Hors V1 (non créées) :** `activity_events`, `project_sync_state`, `project_members`, `github_branches`, `github_events`, vault secrets, teams, billing.

---

## 4. Types énumérés (PostgreSQL)

```sql
CREATE TYPE project_status AS ENUM (
  'active',
  'archived'
);

CREATE TYPE feature_status AS ENUM (
  'planned',
  'in_progress',
  'committed',
  'pushed',
  'pr_open',
  'merged',
  'done',
  'archived'
);
-- Runtime V1 n’écrit que : in_progress | done | archived
-- Les autres valeurs = legacy SQL (vision machine d’états) — non utilisées par le sync.

CREATE TYPE github_connection_status AS ENUM (
  'active',
  'expired',
  'revoked',
  'error'
);

CREATE TYPE sync_status AS ENUM (
  'idle',
  'syncing',
  'success',
  'error'
);

CREATE TYPE activity_source AS ENUM (
  'github'
  -- futurs : 'vercel', 'manual', ...
);

CREATE TYPE activity_type AS ENUM (
  'branch_created',
  'commit_detected',
  'push_detected',
  'pr_opened',
  'pr_updated',
  'pr_merged',
  'pr_closed',
  'branch_deleted',
  'release_created'
);
```

> Les valeurs d’enum sont en `snake_case` bas pour rester stables en SQL. L’UI peut les présenter en libellés humains (`IN PROGRESS`, etc.).

---

## 5. Schéma relationnel détaillé

### 5.1 `profiles`

Données applicatives liées à l’utilisateur. L’auth (email/password) reste dans `auth.users`.

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | = `auth.uid()` |
| `display_name` | `text` | NULL | Pseudo (signup) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Règle :** créer le profil à l’inscription (trigger `on_auth_user_created` ou logique applicative).

---

### 5.2 `projects`

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | ID interne |
| `owner_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Propriétaire V1 |
| `name` | `text` | NOT NULL | |
| `description` | `text` | NULL | |
| `status` | `project_status` | NOT NULL, DEFAULT `'active'` | |
| `github_repository_id` | `uuid` | NULL, FK → `github_repositories(id)` ON DELETE SET NULL | Lien repo |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Contraintes :**

```sql
-- Un même repo GitHub ne peut être lié qu’à un seul projet (par owner via la connexion)
-- Garantie pratique : UNIQUE partiel sur github_repository_id quand non NULL
UNIQUE (github_repository_id) -- nullable unique : plusieurs NULL OK en PostgreSQL
```

**Indexes :**

```sql
CREATE INDEX idx_projects_owner_id ON projects (owner_id);
CREATE INDEX idx_projects_github_repository_id ON projects (github_repository_id)
  WHERE github_repository_id IS NOT NULL;
```

---

### 5.3 `github_connections`

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | |
| `github_user_id` | `bigint` | NOT NULL | ID numérique GitHub |
| `github_login` | `text` | NOT NULL | ex. `Estime10` |
| `status` | `github_connection_status` | NOT NULL, DEFAULT `'active'` | |
| `credentials_ciphertext` | `text` | NOT NULL | Token chiffré — jamais en clair |
| `credentials_nonce` | `text` | NULL | Selon schéma de chiffrement (→ 05) |
| `scopes` | `text[]` | NULL | Scopes OAuth accordés |
| `expires_at` | `timestamptz` | NULL | Si applicable |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Contraintes :**

```sql
UNIQUE (user_id)              -- 1 connexion GitHub active par user en V1
UNIQUE (github_user_id)       -- un compte GitHub lié à au plus un user app
```

> Si on autorise plus tard plusieurs connexions (orgs), retirer `UNIQUE (user_id)`.

**Sécurité :** les colonnes `credentials_ciphertext` / `credentials_nonce` ne sont **pas** SELECT-ables ni INSERT/UPDATE-ables par le rôle `authenticated`. Lecture via RPC `get_own_github_credentials()` ; écriture via RPC `upsert_own_github_connection()` — toutes deux SECURITY DEFINER, scoped `auth.uid()`. UPDATE JWT limité au non-secret (ex. `status` pour expired). L’API mappe un DTO sans secrets. Détail → `05_SECURITY_MODEL`.

---

### 5.3b `feature_notes`

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | |
| `feature_id` | `uuid` | FK → `features` ON DELETE CASCADE | Owner via project |
| `title` | `text` | NOT NULL | Dérivé du body |
| `body` | `jsonb` | array de blocs éditeur | |
| `attachments` | `jsonb` | array `{ id, path, url, name, mimeType, size, label }` | `url` vide en DB ; signée à la lecture |
| `created_at` / `updated_at` | `timestamptz` | | |

**RLS :** ALL via ownership `features → projects.owner_id = auth.uid()`.

**Storage :** paths `{user_id}/{feature_id}/{note_id}/…` ; `url` **vide en DB** ; régénérée via `createSignedUrl` (TTL 1h) à la lecture ; GC des paths droppés dans `saveOwnFeatureNote`.

---

### 5.4 `github_repositories`

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | ID interne |
| `connection_id` | `uuid` | NOT NULL, FK → `github_connections(id)` ON DELETE CASCADE | |
| `github_repository_id` | `bigint` | NOT NULL | ID GitHub du repo |
| `owner` | `text` | NOT NULL | |
| `name` | `text` | NOT NULL | |
| `full_name` | `text` | NOT NULL | `owner/name` |
| `default_branch` | `text` | NOT NULL, DEFAULT `'main'` | |
| `is_private` | `boolean` | NOT NULL, DEFAULT `true` | |
| `html_url` | `text` | NULL | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Contraintes :**

```sql
UNIQUE (connection_id, github_repository_id)
```

**Indexes :**

```sql
CREATE INDEX idx_github_repositories_connection_id
  ON github_repositories (connection_id);
CREATE INDEX idx_github_repositories_full_name
  ON github_repositories (full_name);
```

---

### 5.5 `features`

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | UUID métier interne |
| `project_id` | `uuid` | NOT NULL, FK → `projects(id)` ON DELETE CASCADE | |
| `parent_feature_id` | `uuid` | NULL, FK → `features(id)` | **Hors usage V1** — non écrit par le sync |
| `name` | `text` | NOT NULL | Dérivé du nom de branche |
| `description` | `text` | NULL | |
| `branch_name` | `text` | NULL | NULL si branche GitHub absente (done conservé) |
| `parent_branch_name` | `text` | NULL | Parenté Git pour l’arbre UI |
| `status` | `feature_status` | NOT NULL | Runtime V1 : `in_progress` \| `done` \| `archived` |
| `last_pushed_at` | `timestamptz` | NULL | Tip commit / push GitHub |
| `manual_override` | `boolean` | NOT NULL, DEFAULT `false` | Réservé — non utilisé V1 |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Contraintes :**

```sql
CREATE UNIQUE INDEX uq_features_project_branch_name
  ON features (project_id, branch_name)
  WHERE branch_name IS NOT NULL;

CHECK (parent_feature_id IS DISTINCT FROM id);
```

**Indexes :**

```sql
CREATE INDEX idx_features_project_id ON features (project_id);
CREATE INDEX idx_features_status ON features (project_id, status);
CREATE INDEX idx_features_parent_branch_name ON features (project_id, parent_branch_name)
  WHERE parent_branch_name IS NOT NULL;
```

#### Mapping branche → feature (règle V1 live)

```text
Toute branche GitHub du repo
        ↓
name              = nom de branche (affichage)
branch_name       = nom exact GitHub
parent_branch_name = parenté (merge matrix trunks + PRs mergées)
status            = in_progress | done  (trunks / merges develop|main)
last_pushed_at    = tip commit
```

`feature/*` = convention de nommage produit, **pas** un filtre de sync.  
L’arbre UI est construit depuis `parent_branch_name` (`buildFeatureTree`), pas depuis `parent_feature_id`.

#### Pas de table `branches` — justification

Une branche GitHub n’est **pas** un objet métier durable. Elle est temporaire et déjà couverte par `features.branch_name` + `parent_branch_name`.

---

### 5.6 `activity_events` — **HORS V1 live**

> Non créée. Conservée ici comme esquisse vision (timeline / idempotence events).  
> V1 live : sync on-demand upsert `features` sans table d’événements.

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `project_id` | `uuid` | NOT NULL, FK → `projects(id)` ON DELETE CASCADE | Toujours rattaché au projet |
| `feature_id` | `uuid` | NULL, FK → `features(id)` ON DELETE SET NULL | NULL si événement projet-level |
| `source` | `activity_source` | NOT NULL, DEFAULT `'github'` | |
| `type` | `activity_type` | NOT NULL | |
| `external_id` | `text` | NULL | ID d’idempotence côté source |
| `metadata` | `jsonb` | NOT NULL, DEFAULT `'{}'` | PR number, SHA, title, etc. |
| `occurred_at` | `timestamptz` | NOT NULL | Timestamp métier (événement) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Timestamp d’ingestion |

**Contraintes d’idempotence :**

```sql
-- Empêche le double traitement du même événement GitHub
CREATE UNIQUE INDEX uq_activity_events_source_external_id
  ON activity_events (source, external_id)
  WHERE external_id IS NOT NULL;
```

**Indexes :**

```sql
CREATE INDEX idx_activity_events_project_occurred_at
  ON activity_events (project_id, occurred_at DESC);
CREATE INDEX idx_activity_events_feature_occurred_at
  ON activity_events (feature_id, occurred_at DESC)
  WHERE feature_id IS NOT NULL;
CREATE INDEX idx_activity_events_type
  ON activity_events (project_id, type);
```

#### Immutabilité

**DÉCISION V1 :** `activity_events` est **append-only**.

| Opération | Autorisée ? |
| --- | --- |
| INSERT | Oui |
| UPDATE du contenu métier | Non (sauf correction admin rare — hors V1) |
| DELETE | Non en usage normal ; CASCADE uniquement si le projet est détruit |

Si une correction est nécessaire (ex. événement mal classé) : **insérer un événement correctif** plutôt que muter l’historique.

`metadata` ne doit **jamais** contenir de tokens, secrets, ou contenu de fichiers sources.

---

### 5.7 `project_sync_state` — **HORS V1 live**

> Non créée. Sync on-demand à l’ouverture repo ; pas de watermark persisté.

| Colonne | Type | Contraintes | Notes |
| --- | --- | --- | --- |
| `project_id` | `uuid` | PK, FK → `projects(id)` ON DELETE CASCADE | 1:1 avec projet |
| `status` | `sync_status` | NOT NULL, DEFAULT `'idle'` | |
| `last_started_at` | `timestamptz` | NULL | |
| `last_successful_sync_at` | `timestamptz` | NULL | |
| `last_error` | `text` | NULL | Message safe (pas de secrets) |
| `cursor` | `text` | NULL | Curseur / watermark de sync si utile |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

Création : à la création du projet (ou à la première connexion repo).

---

## 6. Diagramme relationnel (clés) — V1 live

```text
auth.users.id
      │
      ├──── profiles.id
      │
      ├──── projects.owner_id
      │           │
      │           └──── features.project_id
      │                       │
      │                       └──── feature_notes.feature_id
      │
      └──── github_connections.user_id
                  │
                  └──── github_repositories.connection_id
                              │
                              └──── projects.github_repository_id
```

---

## 7. Stratégies de cycle de vie (suppression & déconnexion)

### 7.1 Branche GitHub supprimée (V1 live)

```text
Sync on-demand : branche absente de la liste GitHub
        ↓
archiveStaleOwnFeatures
        ↓
SI status = done  → branch_name = NULL (status done conservé)
SINON             → status = archived
        ↓
Feature RESTE en base (pas de hard delete)
```

**Pourquoi :** après un merge, GitHub delete souvent la branche. Hard-delete ferait disparaître l’historique `done` — contraire au produit.

### 7.2 Feature hard-delete (utilisateur)

Autorisé uniquement via action explicite (ex. supprimer une **note** ; hard-delete feature = hors UI V1).

### 7.3 Repository déconnecté du projet

```text
projects.github_repository_id = NULL
        ↓
features CONSERVÉS
```

### 7.4 Connexion GitHub révoquée / expirée

```text
github_connections.status = expired | revoked
        ↓
UI homescreen : reconnect GitHub
        ↓
Historique local (projects / features / notes) CONSERVÉ
```

### 7.5 Suppression d’un projet

```text
DELETE projects → CASCADE features → CASCADE feature_notes
(+ objets Storage notes à GC côté service delete)
```

### 7.6 Suppression du compte utilisateur

CASCADE via `owner_id` / `user_id` sur les tables applicatives.

```text
DELETE auth.users
  → CASCADE profiles, projects, github_connections, ...
```

Conformité : données utilisateur retirées avec le compte.

---

## 8. Idempotence & synchronisation (V1 live)

### 8.1 Sync on-demand

```text
Ouverture /repository/{owner}/{repo}
  ↓
buildFeatureBranchSyncPlan (GitHub GET, cache ~60s)
  ↓
upsertOwnFeatureBranch par (project_id, branch_name)
  ↓
archiveStaleOwnFeatures
```

Pas de webhooks. Pas d’`activity_events`. Idempotence = UNIQUE partiel `(project_id, branch_name)`.

### 8.2 Ordre de traitement

1. Auth + connexion GitHub active
2. Ensure project 1:1 repo
3. Snapshot GitHub (branches + merge matrix trunks)
4. Upsert features + archive stale
5. Rendu arbre + notes

---

## 9. Intégrité référentielle avancée

### 9.1 Parent feature même projet

> Trigger `check_feature_parent_same_project` — **non implémenté** (parenté V1 = `parent_branch_name`).

### 9.2 `updated_at` automatique

Trigger générique `set_updated_at()` sur : `profiles`, `projects`, `features`, `github_connections`, `github_repositories`, `feature_notes`.

### 9.3 Création profil à l’inscription

Trigger / hook auth → insert `profiles` avec `display_name` depuis metadata signup.

---

## 10. Row Level Security (baseline)

> Politiques d’accès data obligatoires. Credentials : SELECT + INSERT/UPDATE colonnes fermés ; RPCs DEFINER.

### 10.1 Principe

```text
auth.uid()
    ↓
owner / user_id
    ↓
SELECT / INSERT / UPDATE / DELETE autorisés uniquement sur ses lignes
```

Activer RLS sur **toutes** les tables applicatives listées.

### 10.2 Politiques conceptuelles

#### `profiles`

```sql
-- SELECT / UPDATE : id = auth.uid()
-- INSERT : id = auth.uid()
```

#### `projects`

```sql
-- ALL : owner_id = auth.uid()
```

#### `features`

```sql
-- ALL : EXISTS (
--   SELECT 1 FROM projects p
--   WHERE p.id = features.project_id AND p.owner_id = auth.uid()
-- )
```

#### `activity_events`

```sql
-- SELECT / INSERT : via ownership du project
-- UPDATE / DELETE : interdit pour le rôle authentifié (append-only)
-- (service role / backend privilégié uniquement pour maintenance)
```

#### `project_sync_state`

```sql
-- ALL via ownership du project
```

#### `github_connections`

```sql
-- SELECT : colonnes non-credentials seulement (column grants)
-- INSERT/UPDATE credentials_* : REVOKE — uniquement RPC upsert_own_github_connection
-- UPDATE status : table/colonne non-secret + RLS user_id = auth.uid()
-- Lecture secrets : RPC get_own_github_credentials()
```

#### `feature_notes`

```sql
-- ALL via ownership project (features → projects.owner_id)
```

#### `github_repositories`

```sql
-- ALL : EXISTS (
--   SELECT 1 FROM github_connections c
--   WHERE c.id = github_repositories.connection_id
--     AND c.user_id = auth.uid()
-- )
```

### 10.3 Rôles

| Contexte | Rôle | Usage |
| --- | --- | --- |
| Browser / SSR user-scoped | `authenticated` + JWT | Lectures / mutations user via RLS |
| Server Actions / Route Handlers | client user-scoped préféré | Respecte RLS |
| Webhooks / jobs sync | `service_role` (minimisé) | Justifié : pas de session user ; toujours scoped par `project_id` connu |
| Anon | `anon` | Aucun accès data métier |

**Règle :** toute utilisation de `service_role` doit être justifiée et scoped (jamais de `SELECT *` cross-tenant).

---

## 11. SQL de migration (esquisse V1)

> Fichier cible futur : `supabase/migrations/YYYYMMDDHHMMSS_init_domain.sql`  
> Ci-dessous : esquisse de référence pour l’implémentation — à exécuter via le workflow migrations Supabase.

```sql
-- extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- enums (voir §4)

-- tables
CREATE TABLE profiles ( ... );
CREATE TABLE github_connections ( ... );
CREATE TABLE github_repositories ( ... );
CREATE TABLE projects ( ... );
CREATE TABLE features ( ... );
CREATE TABLE activity_events ( ... );
CREATE TABLE project_sync_state ( ... );

-- indexes & unique (voir §5)
-- triggers (voir §9)
-- ENABLE ROW LEVEL SECURITY + policies (voir §10)
```

Ordre de création recommandé (FK) :

1. enums  
2. `profiles`  
3. `github_connections`  
4. `github_repositories`  
5. `projects`  
6. `features`  
7. `activity_events`  
8. `project_sync_state`  
9. indexes / triggers / RLS  

---

## 12. Types applicatifs (intention TypeScript)

Alignés sur le schéma — génération possible via Supabase CLI plus tard (`Database` types).

```ts
type ProjectStatus = 'active' | 'archived'

type FeatureStatus =
  | 'planned'
  | 'in_progress'
  | 'committed'
  | 'pushed'
  | 'pr_open'
  | 'merged'
  | 'done'
  | 'archived'

type ActivitySource = 'github'

type ActivityType =
  | 'branch_created'
  | 'commit_detected'
  | 'push_detected'
  | 'pr_opened'
  | 'pr_updated'
  | 'pr_merged'
  | 'pr_closed'
  | 'branch_deleted'
  | 'release_created'

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'
```

Les DTOs API **ne doivent pas** exposer `credentials_ciphertext`.

---

## 13. Matrice propriété / accès

| Ressource | Propriétaire | Chemin d’authz |
| --- | --- | --- |
| Profile | User | `profiles.id = auth.uid()` |
| Project | User | `projects.owner_id = auth.uid()` |
| Feature | via Project | `feature → project.owner_id` |
| Activity | via Project | `event → project.owner_id` |
| Sync state | via Project | `sync → project.owner_id` |
| GitHub connection | User | `github_connections.user_id` |
| GitHub repository | via Connection | `repo → connection.user_id` |

**V1 :** pas de partage.  
**Plus tard :** `project_members(project_id, user_id, role)` s’insère entre User et Project **sans casser** `owner_id` (owner reste le créateur ; members ajoutent des droits).

---

## 14. Ce que PostgreSQL garantit vs ce que le service garantit

| Règle | PostgreSQL | Service / App |
| --- | --- | --- |
| Unicité branche active / projet | UNIQUE partiel | — |
| Idempotence events | UNIQUE `(source, external_id)` | Construction `external_id` |
| Ownership | RLS + FK | `requireAuth` + authorize |
| Parent même projet | Trigger | Validation Zod + service |
| Transition de status | CHECK optionnel / enum | State machine métier |
| `manual_override` | Colonne bool | Skip auto-update |
| Pas de secrets dans metadata | — | Validation / sanitization |
| Append-only events | Policy RLS no UPDATE | Discipline code |

---

## 15. Réponses aux questions ouvertes (verrouillage)

| Question | Réponse V1 live |
| --- | --- |
| Qui possède quoi ? | User possède projects + github_connection ; le reste dérive. |
| `project_members` ? | Non ; `owner_id` suffit. |
| Comment représenter GitHub ? | `github_connections` + `github_repositories` ; pas de clone. |
| Branch → Feature ? | `features.branch_name` ; sync **toutes** les branches. |
| Parenté arbre ? | `parent_branch_name` (pas `parent_feature_id`). |
| Events / timeline ? | Hors V1 — pas de table `activity_events`. |
| Doublons sync ? | UNIQUE `(project_id, branch_name)`. |
| Branche supprimée ? | `done` → `branch_name` NULL ; sinon `archived`. |
| Notes ? | `feature_notes` + bucket privé + URLs signées. |
| RLS partout ? | Oui sur les 6 tables user-data. |
| Credentials ? | Chiffrés ; RPC read/write ; colonnes non SELECT/INSERT/UPDATE JWT. |

---

## 16. Future Exploration (non créé en V1)

- `activity_events` + `project_sync_state` (timeline / watermark)
- Usage réel de `parent_feature_id` (arbre métier vs Git)
- `project_members` / rôles collab
- Table `github_branches` si audit Git avancé
- Machine d’états riche + % progress
- Soft-delete global (`deleted_at`)
- Full-text search sur features / projects

---

## 17. Critères d’acceptation du modèle

Le modèle V1 est valide si :

1. Un user authentifié ne peut lire/écrire que ses données (RLS).
2. Une feature `done` peut exister **sans** branche (`branch_name` NULL).
3. La suppression d’une branche GitHub ne fait **pas** disparaître une feature `done`.
4. Aucun token GitHub n’est stocké en clair ni exposé via SELECT / INSERT / UPDATE JWT sur les colonnes credentials.
5. Les attachments notes ne sont pas listables publiquement (bucket privé + signed URLs).
6. Le schéma live tient en **6 tables** + 1 bucket — pas plus sans justification.

---

## 18. Docs associés

```text
01  PRD                      ← scope produit V1 = arbre + notes
02  TDD                      ← carte d’exploration (pas checklist)
03  Database Design          ← ce document (aligné migrations)
04  Preprod checklist        ← env / migrations à appliquer
```

Migrations live : `supabase/migrations/`.

---

## Changelog document

| Version | Date | Changement |
| --- | --- | --- |
| 1.2 | 2026-09-22 | Alignement V1 live — 6 tables, `parent_branch_name`, notes/storage, events hors V1 |
| 1.0 | 2026-09-18 | Baseline initiale (vision 7 tables + events) |
