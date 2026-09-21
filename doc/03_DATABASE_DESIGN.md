# Database Design / Data Model

## Developer Progress OS

| Champ | Valeur |
| --- | --- |
| **Type de document** | `03_DATABASE_DESIGN` — Database Design / Data Model |
| **Statut** | Draft / Baseline verrouillée V1 |
| **Version** | 1.0 |
| **Documents associés** | [`01_PRD.md`](./01_PRD.md) · [`02_TDD.md`](./02_TDD.md) |
| **Documents suivants** | `04_API_CONTRACT` · `05_SECURITY_MODEL` · `06_IMPLEMENTATION` |
| **SGBD** | PostgreSQL via Supabase |
| **Principe** | Modèle minimal justifié par le domaine — pas de tables « pour faire sérieux » |

---

## 0. Comment lire ce document

Ce document **verrouille** le modèle de données V1 avant tout code métier.

Il répond aux questions laissées ouvertes par le PRD et le TDD :

1. Qui possède quoi ?
2. Comment représenter GitHub ?
3. Comment une branche devient une feature (et une sous-branche une sous-feature) ?
4. Où stocker les événements ?
5. Comment éviter les doublons à la sync ?
6. Que faire si une branche / un repo disparaît ?
7. Quelles tables ont du RLS ?
8. Quelles contraintes PostgreSQL garantissent l’intégrité ?
9. Quels indexes sont nécessaires ?
10. Quels événements sont immuables ?

### Gouvernance

- Toute évolution de schéma passe par une migration versionnée.
- Les décisions marquées **DÉCISION V1** sont figées jusqu’à révision explicite.
- Les éléments hors V1 sont listés en §16 — capturés, non créés.

---

## 1. Décisions verrouillées (résumé)

| # | Décision |
| --- | --- |
| D1 | L’identité utilisateur est **Supabase Auth** (`auth.users`). Pas de table `users` applicative pour email/password. |
| D2 | `profiles` existe uniquement pour les données applicatives non-auth. |
| D3 | Un **project** appartient à un user via `owner_id` (V1 ownership-based). Pas de `project_members` en V1. |
| D4 | Un project peut être lié à **un** repository GitHub (`github_repository_id`). |
| D5 | Une **connexion GitHub** appartient à un user ; les repos découverts appartiennent à cette connexion. |
| D6 | Une **feature** a un UUID interne applicatif. Les IDs GitHub sont stockés séparément. |
| D7 | **Pas de table `branches`**. La branche est un attribut de la feature (`branch_name`). |
| D8 | Sous-feature = feature avec `parent_feature_id` (arbre à 1 niveau recommandé en V1 ; profondeur > 1 autorisée techniquement). |
| D9 | Les événements GitHub (et futurs) vivent dans `activity_events`. |
| D10 | Idempotence : `(source, external_id)` UNIQUE quand `external_id` est présent. |
| D11 | Branche GitHub **supprimée** → `branch_name = NULL` ; la **feature n’est pas hard-deleted** (surtout si DONE). |
| D12 | Repo déconnecté → lien projet nullifié / sync en erreur ; pas de cascade destructive sur l’historique features/events. |
| D13 | RLS obligatoire sur toutes les tables contenant des données utilisateur. |
| D14 | Tokens GitHub **chiffrés server-side** ; jamais exposés au client. Détail chiffrement → `05_SECURITY_MODEL`. |
| D15 | Minimum de tables : **7 tables applicatives** (+ `auth.users` géré par Supabase). |

---

## 2. Modèle conceptuel

```text
auth.users  (Supabase Auth — email / password / session)
    │
    ├── profiles
    │
    ├── github_connections
    │         │
    │         └── github_repositories
    │                   ▲
    │                   │ (lien optionnel)
    └── projects ───────┘
              │
              ├── features
              │       │
              │       └── features (parent_feature_id → sous-features)
              │
              ├── activity_events  (feature_id nullable)
              │
              └── project_sync_state
```

### Boucle métier

```text
User travaille dans GitHub / Cursor
        ↓
Branch feature/*  (= Feature)
        ↓
Commits / Push / PR / Merge
        ↓
Webhook ou Sync
        ↓
activity_events (idempotent)
        ↓
Mise à jour feature.status (+ branch_name)
        ↓
Dashboard
```

---

## 3. Inventaire des tables V1

| Table | Rôle | RLS |
| --- | --- | --- |
| `profiles` | Profil applicatif 1:1 avec `auth.users` | Oui |
| `projects` | Unité de pilotage ; propriétaire = user | Oui |
| `github_connections` | Connexion OAuth GitHub du user | Oui |
| `github_repositories` | Repos découverts via la connexion | Oui |
| `features` | Feature / sous-feature + branche associée | Oui |
| `activity_events` | Événements normalisés (append-oriented) | Oui |
| `project_sync_state` | État de sync GitHub par projet | Oui |

**Hors V1 (non créées) :** `project_members`, `github_branches`, `github_events`, vault secrets, teams, billing.

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
| `display_name` | `text` | NULL | Optionnel |
| `avatar_url` | `text` | NULL | Optionnel |
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

**Sécurité :** les colonnes `credentials_ciphertext` / `credentials_nonce` ne sont **pas** SELECT-ables par le rôle `authenticated`. Lecture uniquement via RPC `get_own_github_credentials()` (SECURITY DEFINER, scoped `auth.uid()`). L’API mappe un DTO sans secrets. Détail → `05_SECURITY_MODEL`.

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
| `parent_feature_id` | `uuid` | NULL, FK → `features(id)` ON DELETE CASCADE | Sous-feature |
| `name` | `text` | NOT NULL | ex. `Authentication` |
| `description` | `text` | NULL | |
| `branch_name` | `text` | NULL | ex. `feature/authentication` ; NULL si branche absente |
| `status` | `feature_status` | NOT NULL, DEFAULT `'planned'` | |
| `manual_override` | `boolean` | NOT NULL, DEFAULT `false` | Si true, sync auto ne force pas le status |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Contraintes :**

```sql
-- Une branche active unique par projet (quand branch_name est renseigné)
CREATE UNIQUE INDEX uq_features_project_branch_name
  ON features (project_id, branch_name)
  WHERE branch_name IS NOT NULL;

-- Empêcher qu’une feature soit son propre parent
CHECK (parent_feature_id IS DISTINCT FROM id);

-- Parent doit appartenir au même projet (garantie via trigger ou contrainte deferred)
-- V1 : enforce dans le service + trigger CHECK (voir §9)
```

**Indexes :**

```sql
CREATE INDEX idx_features_project_id ON features (project_id);
CREATE INDEX idx_features_parent_feature_id ON features (parent_feature_id)
  WHERE parent_feature_id IS NOT NULL;
CREATE INDEX idx_features_status ON features (project_id, status);
```

#### Mapping branche → feature (règle métier)

```text
feature/authentication
        ↓
name        = Authentication
branch_name = feature/authentication
parent      = NULL

feature/authentication-ui
        ↓
name        = Authentication UI
branch_name = feature/authentication-ui
parent      = Feature Authentication (si convention / association)
```

V1 : détection automatique des branches `feature/*` → création feature.  
L’association parent/enfant peut être :

- manuelle (utilisateur), ou
- heuristique simple (préfixe commun) — **optionnelle**, non bloquante pour le schéma.

#### Pas de table `branches` — justification

Une branche GitHub n’est **pas** un objet métier durable. Elle est :

- temporaire (souvent deleted après merge),
- une représentation Git d’une feature,
- déjà couverte par `features.branch_name` + `activity_events`.

Créer `github_branches` ajouterait une couche redondante sans valeur V1.

---

### 5.6 `activity_events`

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

### 5.7 `project_sync_state`

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

## 6. Diagramme relationnel (clés)

```text
auth.users.id
      │
      ├──── profiles.id
      │
      ├──── projects.owner_id
      │           │
      │           ├──── features.project_id
      │           │           │
      │           │           └──── features.parent_feature_id
      │           │
      │           ├──── activity_events.project_id
      │           │           │
      │           │           └──── activity_events.feature_id → features.id
      │           │
      │           └──── project_sync_state.project_id
      │
      └──── github_connections.user_id
                  │
                  └──── github_repositories.connection_id
                              │
                              └──── projects.github_repository_id
```

---

## 7. Stratégies de cycle de vie (suppression & déconnexion)

### 7.1 Branche GitHub supprimée

```text
GitHub: branch deleted (feature/authentication)
        ↓
activity_events INSERT type = branch_deleted
        ↓
features.branch_name = NULL
        ↓
SI status IN (merged, done)  → conserver status (DONE)
SI status IN (planned..pr_open) → status = archived  (ou planned — règle produit)
        ↓
Feature RESTE en base (pas de hard delete)
```

**Pourquoi :** après un merge, GitHub delete souvent la branche. Hard-delete de la feature ferait disparaître l’historique de progression — contraire au produit.

### 7.2 Feature hard-delete (utilisateur)

Autorisé uniquement via action explicite utilisateur (ex. « supprimer la feature »).

```text
DELETE features WHERE id = ...
  → CASCADE sous-features (parent_feature_id ON DELETE CASCADE)
  → activity_events.feature_id = NULL (ON DELETE SET NULL)
```

Les événements projet restent visibles dans la timeline projet.

### 7.3 Repository déconnecté du projet

```text
User unlink repo
        ↓
projects.github_repository_id = NULL
        ↓
project_sync_status → idle / error message "Repository disconnected"
        ↓
features + activity_events CONSERVÉS
```

Ne pas CASCADE DELETE les features quand le repo disparaît de la connexion.

### 7.4 Connexion GitHub révoquée / expirée

```text
github_connections.status = expired | revoked
        ↓
Sync bloquée
        ↓
UI: "Reconnect GitHub"
        ↓
Historique local (projects / features / events) CONSERVÉ
```

ON DELETE CASCADE sur `github_connections` → supprime les `github_repositories` en cache.  
Les projets passent `github_repository_id = NULL` (SET NULL) — historique intact.

### 7.5 Suppression d’un projet

```text
DELETE projects
  → CASCADE features
  → CASCADE activity_events
  → CASCADE project_sync_state
```

Action destructive explicite, confirmée côté UI.

### 7.6 Suppression du compte utilisateur

```text
DELETE auth.users
  → CASCADE profiles, projects, github_connections, ...
```

Conformité : données utilisateur retirées avec le compte.

---

## 8. Idempotence & synchronisation

### 8.1 Webhook / sync

```text
Event reçu
  ↓
Construire external_id stable
  ↓
INSERT activity_events
  ↓
UNIQUE (source, external_id) ?
  ├── OK → traiter (update feature status)
  └── CONFLICT → ignorer (déjà traité)
```

### 8.2 Construction de `external_id` (convention V1)

| Type | Exemple `external_id` |
| --- | --- |
| Push | `github:push:{delivery_id}` ou `github:push:{repo_id}:{after_sha}` |
| PR opened/merged | `github:pr:{repo_id}:{pr_number}:{action}` |
| Branch created/deleted | `github:branch:{repo_id}:{branch_name}:{action}:{ref_sha?}` |
| Commit (si sync) | `github:commit:{repo_id}:{sha}` |

Si GitHub fournit un `X-GitHub-Delivery` : le préférer comme base d’idempotence pour les webhooks.

### 8.3 Ordre de traitement

1. INSERT event (idempotent)
2. Résoudre / créer feature via `branch_name`
3. Mettre à jour `features.status` **sauf si** `manual_override = true`
4. Mettre à jour `project_sync_state`

---

## 9. Intégrité référentielle avancée

### 9.1 Parent feature même projet

PostgreSQL ne peut pas facilement exprimer « le parent doit avoir le même `project_id` » avec une FK seule.

**V1 :** trigger :

```sql
CREATE OR REPLACE FUNCTION check_feature_parent_same_project()
RETURNS trigger AS $$
BEGIN
  IF NEW.parent_feature_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM features p
    WHERE p.id = NEW.parent_feature_id
      AND p.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'parent_feature_id must belong to the same project';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 9.2 `updated_at` automatique

Trigger générique `set_updated_at()` sur les tables mutables : `profiles`, `projects`, `features`, `github_connections`, `github_repositories`, `project_sync_state`.

**Pas** sur `activity_events` (immuable).

### 9.3 Création profil à l’inscription

```sql
-- Trigger after insert on auth.users → insert profiles (id)
```

---

## 10. Row Level Security (baseline)

> Le détail threat model / chiffrement credentials est dans `05_SECURITY_MODEL`.  
> Ici : **politiques d’accès data** obligatoires.

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
-- ALL : user_id = auth.uid()
-- ATTENTION : même avec RLS, ne jamais SELECT * côté client
--   → colonnes credentials uniquement via server/service context
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

| Question | Réponse V1 |
| --- | --- |
| Qui possède quoi ? | User possède projects + github_connection ; le reste dérive. |
| `project_members` ? | Non en V1 ; `owner_id` suffit ; modèle extensible. |
| Comment représenter GitHub ? | `github_connections` + `github_repositories` ; pas de clone. |
| Branch → Feature ? | `features.branch_name` ; pas de table branches. |
| Sous-branche → sous-feature ? | `parent_feature_id`. |
| Où stocker les events ? | `activity_events`. |
| Doublons sync ? | UNIQUE `(source, external_id)`. |
| Branche supprimée ? | `branch_name = NULL` ; feature conservée. |
| Repo déconnecté ? | SET NULL sur projet ; historique conservé. |
| RLS partout ? | Oui sur toutes les tables user-data. |
| Contraintes PG ? | FK, UNIQUE, CHECK, triggers parent, enums. |
| Indexes ? | owner, project, branch, timeline, idempotence. |
| Events immuables ? | Oui — append-only. Features/projects mutables. |

---

## 16. Future Exploration (non créé en V1)

- `project_members` / rôles collab
- Table `github_branches` si besoin d’audit Git avancé
- Sources d’activité hors GitHub (`vercel`, `manual`)
- Soft-delete global (`deleted_at`)
- Historique des changements de `feature.status` (table `feature_status_history`)
- Partitionnement `activity_events` si volume élevé
- Full-text search sur features / projects

---

## 17. Critères d’acceptation du modèle

Le modèle V1 est valide si :

1. Un user authentifié ne peut lire/écrire que ses données (prouvé via RLS + tests).
2. Une feature peut exister **sans** branche (`branch_name` NULL) après merge/delete.
3. Un même événement GitHub ne crée jamais deux lignes `activity_events`.
4. La suppression d’une branche GitHub ne fait **pas** disparaître une feature `done`.
5. Aucun token GitHub n’est stocké en clair ni exposé via une policy SELECT client.
6. Le schéma tient en **7 tables** applicatives — pas plus sans justification.

---

## 18. Prochaines étapes documentaires

```text
03  Database Design          ← ce document
        ↓
04  API Contract             ← endpoints / Server Actions dérivés du modèle
        ↓
05  Security Model / RLS     ← chiffrement credentials, threat model, policies SQL finales
        ↓
06  Implementation           ← migrations + code
```

---

## Changelog document

| Version | Date | Changement |
| --- | --- | --- |
| 1.0 | 2026-09-18 | Baseline V1 — 7 tables, branch≠feature durable, idempotence, RLS, cycles de vie |
