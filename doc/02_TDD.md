# Document de Conception Technique (TDD)

## Developer Progress OS

> **Gel V1 :** le scope d’implémentation actif est défini dans [`01_PRD.md` — section « V1 = arbre + notes »](./01_PRD.md).  
> Ce TDD n’est **pas** une checklist à dérouler. Webhooks, TanStack Query, progress %, `activity_events`, machine d’états riche restent **hors V1** tant que le PRD ne les dé-gèle pas.  
> **Live aujourd’hui :** auth Supabase · OAuth GitHub · homescreen repos · sync on-demand → arbre (`parent_branch_name`) · notes persistées (Storage privé + URLs signées) · credentials via RPCs `service_role` only (après `getUser`).

| Champ | Valeur |
| --- | --- |
| **Type de document** | Technical Design Document (TDD) |
| **Statut** | Carte d’exploration — scope live = PRD V1 arbre + notes |
| **Version** | 1.2 |
| **Documents associés** | [`01_PRD.md`](./01_PRD.md) · [`03_DATABASE_DESIGN.md`](./03_DATABASE_DESIGN.md) · [`04_PREPROD_CHECKLIST.md`](./04_PREPROD_CHECKLIST.md) |
| **Stack principale** | Next.js · React · TypeScript · Tailwind CSS · Supabase · PostgreSQL · GitHub API |
| **Principe d’architecture** | Application sécurisée server-first ; GitHub comme source externe d’activité de développement |
| **Séquence docs** | `01_PRD` → `02_TDD` → `03_DATABASE_DESIGN` → `04_PREPROD_CHECKLIST` |

---

# 1. Objectif

Ce document définit l’architecture technique du **Developer Progress OS**.

Le produit est un espace de travail personnel pour développeurs, conçu pour offrir une vue centralisée de l’avancement des projets à partir de l’activité de développement réelle.

L’application n’a **pas** vocation à inspecter, comprendre ou analyser le code source.

Elle doit répondre à :

> Où en suis-je dans mes projets ?

L’application relie des projets à des repositories GitHub et utilise l’activité GitHub (branches, commits, pull requests, merges, releases et événements associés) pour représenter la progression des features.

Elle maintient son propre modèle produit :

* projects
* features
* états de features
* repositories GitHub
* branches
* activité
* intégrations
* état de synchronisation

**GitHub** reste la source de vérité de l’activité Git.

**L’application** devient la source de vérité de l’organisation personnelle des projets et du suivi des features.

---

# 2. Principes d’architecture fondamentaux

L’architecture suit les principes ci-dessous.

## 2.1 Server-first

Les opérations sensibles doivent s’exécuter côté serveur.

Le navigateur ne doit **jamais** recevoir :

* des credentials d’accès GitHub
* des client secrets GitHub
* des clés maîtres de chiffrement
* des credentials service-role de la base
* des credentials Supabase privilégiés
* des informations d’autorisation internes qui doivent rester server-side

Le client ne reçoit que les données nécessaires au rendu de l’interface courante.

---

## 2.2 Frontières de confiance explicites

Le système doit considérer **toute entrée client comme non fiable**.

Chaque mutation suit :

```text
Request
    ↓
Authentication
    ↓
Input validation
    ↓
Authorization
    ↓
Business logic
    ↓
Database operation
    ↓
Response mapping
```

L’authentification répond à :

> Qui est cet utilisateur ?

L’autorisation répond à :

> Cet utilisateur a-t-il le droit d’effectuer cette opération sur cette ressource ?

Les deux sont obligatoires.

---

## 2.3 Défense en profondeur

L’autorisation ne doit pas exister uniquement dans la couche API.

L’application doit combiner :

1. autorisation au niveau application
2. Row Level Security Supabase / PostgreSQL
3. contraintes base de données
4. validation des entrées
5. gestion sécurisée des credentials

Si une erreur d’autorisation survient côté application, le RLS doit fournir une couche de protection supplémentaire.

---

## 2.4 GitHub n’est pas la base de données de l’application

GitHub fournit l’activité de développement.

L’application stocke son propre modèle de domaine.

GitHub :

```text
repositories
branches
commits
pull requests
releases
événements GitHub
```

Application :

```text
projects
features
état des features
métadonnées projet
relations de features
normalisation d’activité
état de sync
préférences utilisateur
```

L’application ne doit **pas** tenter de recréer GitHub en interne.

---

## 2.5 Pas d’analyse de code source en V1

Le système n’a pas besoin de :

* cloner des repositories pour le fonctionnement normal
* lire des fichiers sources
* analyser le code source
* comprendre les détails d’implémentation
* inspecter des AST
* générer du code
* déterminer la complétion d’une feature via la sémantique du code

L’application suit l’activité de développement **autour** du repository.

---

# 3. Stack technique

## 3.1 Frontend

### Next.js

Utiliser la dernière version stable approuvée de Next.js disponible au moment de l’implémentation.

Architecture :

* App Router
* React Server Components par défaut
* Client Components uniquement lorsque nécessaire
* Route Handlers pour les frontières HTTP
* Server Actions pour les mutations applicatives appropriées

---

### React

Utiliser la version stable de React supportée par la version Next.js choisie.

React est responsable de la composition UI et des expériences client interactives.

---

### TypeScript

TypeScript doit tourner en mode `strict`.

Règles :

* interdiction de `any`
* types de domaine explicites
* types de réponses API explicites
* types d’entrées de mutation explicites
* validation Zod aux frontières non fiables
* éviter les assertions de type sauf justification

---

### Tailwind CSS

Utiliser la dernière version stable de Tailwind CSS disponible au moment de l’implémentation.

Tailwind porte l’implémentation du design system et le styling utilitaire.

Ne pas créer une feuille de styles globale monstrueuse.

Le CSS global doit rester minimal et fondationnel.

---

### GSAP

GSAP est utilisé pour des motions d’interface intentionnelles.

Cas d’usage potentiels :

* transitions de pages
* animations de progression de projet
* entrées de dashboard
* transitions de command palette
* animations de timeline d’activité
* micro-interactions

Les animations ne doivent pas interférer avec :

* l’accessibilité
* la navigation clavier
* l’état applicatif
* les préférences `prefers-reduced-motion`
* la performance perçue

Utiliser `prefers-reduced-motion` lorsque c’est pertinent.

---

# 4. Backend

## 4.1 Supabase

Supabase est la plateforme backend principale.

Utiliser :

* Supabase Auth
* PostgreSQL
* Row Level Security
* migrations de base de données
* Supabase Storage **V1** : bucket privé `feature-note-attachments` (images notes, URLs signées)

Supabase ne doit pas être exposé directement comme interface de données principale pour les opérations de domaine sensibles.

---

## 4.2 PostgreSQL

PostgreSQL est le store persistant de l’application.

Le schéma doit modéliser explicitement les relations de domaine.

Entités de domaine principales :

```text
users
projects
features
feature_activity
github_integrations
github_repositories
github_branches
github_sync_state
```

Des entités supplémentaires peuvent être introduites si elles sont justifiées.

---

# 5. Authentification

Supabase Auth est le système d’authentification principal.

Options initiales :

* email / password
* GitHub OAuth lorsque pertinent

L’identité utilisateur authentifiée doit provenir du **contexte d’authentification côté serveur**.

Le client ne doit jamais être considéré comme source fiable d’un `userId` pour l’autorisation.

Incorrect :

```text
GET /api/projects?userId=123
```

Correct :

```text
GET /api/projects
```

L’API dérive l’utilisateur authentifié depuis la session.

---

# 6. Autorisation

L’autorisation est **basée sur les ressources**.

Un utilisateur ne peut accéder qu’aux ressources qu’il possède, ou qui lui sont explicitement associées.

En V1, le modèle principal peut être basé sur la propriété :

```text
User
  ↓
Projects
  ↓
Features
```

Une collaboration future pourra introduire :

```text
User
  ↓
Project membership
  ↓
Project
```

L’autorisation doit intervenir **avant** l’exécution de la logique métier.

Exemple :

```text
request
  ↓
requireAuthenticatedUser()
  ↓
validateProjectId()
  ↓
authorizeProjectAccess()
  ↓
projectService.getProject()
```

---

# 7. Row Level Security

Le RLS Supabase / PostgreSQL est **obligatoire** pour les données applicatives appartenant à un utilisateur.

Règle conceptuelle d’exemple :

```text
projects.user_id = authenticated_user_id
```

Un utilisateur ne doit pas pouvoir lire le projet d’un autre même si :

* l’ID du projet est connu
* une requête malveillante est construite manuellement
* un contrôle d’autorisation côté client est contourné
* un bug API expose accidentellement un chemin de requête

Le RLS est une **seconde frontière** d’autorisation.

---

# 8. Architecture API

L’application utilise une couche API explicite.

Le frontend ne doit pas se coupler directement aux détails d’implémentation de la base.

Architecture :

```text
Browser
   ↓
Next.js application
   ↓
Server Action / Route Handler
   ↓
Authentication
   ↓
Validation
   ↓
Authorization
   ↓
Service
   ↓
Repository / data access
   ↓
Supabase / PostgreSQL
```

---

# 9. Responsabilités de l’API

La couche API est responsable de :

* le contexte d’authentification
* la validation des entrées
* l’autorisation
* l’orchestration des workflows métier
* la mise en forme des réponses
* la gestion des erreurs
* l’intégration aux APIs externes
* le traitement des webhooks

L’API ne doit pas exposer inutilement les structures brutes de base de données.

Les réponses doivent représenter des concepts applicatifs, plutôt que de renvoyer aveuglément des lignes SQL.

---

# 10. Route Handlers vs Server Actions

Les deux mécanismes sont volontairement supportés.

Ils ont des responsabilités distinctes.

## 10.1 Server Actions

Les Server Actions conviennent aux mutations originées par l’application.

Exemples :

```text
createProject
updateProject
createFeature
updateFeature
deleteFeature
associateBranch
renameFeature
archiveProject
```

Flux conceptuel :

```text
Client
  ↓
Server Action
  ↓
authenticate
  ↓
validate
  ↓
authorize
  ↓
service
  ↓
database
```

Les Server Actions ne doivent **pas** contourner l’autorisation au seul prétexte d’être server-side.

---

## 10.2 Route Handlers

Les Route Handlers conviennent lorsqu’une frontière HTTP explicite est utile.

Exemples :

```text
GET /api/projects
GET /api/projects/:projectId
GET /api/projects/:projectId/activity

POST /api/github/sync
POST /api/webhooks/github

GET /api/github/repositories
```

Les Route Handlers sont particulièrement adaptés à :

* les intégrations externes
* la communication avec l’API GitHub
* les webhooks
* les endpoints API explicites
* un futur accès CLI
* de futurs consommateurs externes

---

# 11. TanStack Query — **HORS V1**

> Gelé. V1 live = Server Components + `unstable_cache` / tags + hooks locaux.  
> Le texte ci-dessous est une esquisse vision — ne pas implémenter.

L’application est censée recevoir une activité de développement fréquente : l’état serveur peut donc devenir stale rapidement.

TanStack Query gère :

* le cache
* le refetch
* l’état stale
* la synchronisation en arrière-plan
* les états de chargement
* les états d’erreur
* l’invalidation des queries
* les mises à jour optimistes lorsque pertinent

Exemples :

```text
projects
project activity
features
GitHub activity
sync status
```

---

# 12. Stratégie de mutation

TanStack Query ne remplace pas l’architecture serveur.

Le modèle préféré est :

```text
TanStack Query
      ↓
application mutation
      ↓
Server Action / Route Handler
      ↓
service
      ↓
database
```

Après une mutation, TanStack Query est responsable de synchroniser l’état serveur côté client.

Exemple :

```text
Create Feature
      ↓
Server Action
      ↓
Database
      ↓
Success
      ↓
Invalidate project features query
      ↓
UI refetches
```

Cela empêche le client de devenir une seconde source de vérité.

---

# 13. Validation

Zod est utilisé aux frontières applicatives.

La validation intervient avant la logique métier.

Exemples :

```text
CreateProjectInput
CreateFeatureInput
UpdateFeatureInput
GitHubRepositoryInput
BranchAssociationInput
```

Structure conceptuelle :

```text
HTTP / Server Action
        ↓
Zod
        ↓
validated domain input
        ↓
service
```

Les contraintes de base de données restent nécessaires.

Zod ne remplace pas l’intégrité en base.

---

# 14. Architecture de domaine

Le projet doit utiliser une architecture **feature-based**, avec séparation claire frontend / backend et un **ordre de flow produit** via préfixes numériques.

Structure cible (alignée sur le repo) :

```text
app/
├── (01_auth)/                 # page auth publique (/)
├── (02_protected)/            # zone session (/home, …)
│   └── home/
└── api/                       # adapters Next Route Handlers (minces)

frontend/
├── components/                # UI transverse
│   ├── ui/
│   ├── layout/
│   └── states/                # error / empty / loading
└── features/                  # UI produit — ordre = parcours user
    ├── 01_authentification/
    └── 02_homescreen/
        └── github/            # UI GitHub (pas un 03 top-level)

backend/
├── controllers/               # couche HTTP unique (hors features)
└── features/                  # domaine serveur
    ├── 01_authentification/   # mutations, schemas, services
    └── 02_github/             # domain, messages, services (tokens chiffrés)

lib/
├── api/endpoints.ts           # registre des chemins /api/*
├── github/                    # client OAuth / repos (infra)
├── supabase/
├── crypto/
└── routes.ts                  # chemins pages (+ réexport API)

doc/
supabase/migrations/
__tests__/
proxy.ts                       # Next.js 16 — session + garde routes
```

Éviter les dossiers globaux fourre-tout du type :

```text
utils/
services/
hooks/
api/
```

contenant de la logique applicative sans lien.

Règles :

* logique de domaine → `backend/features/*`
* UI feature → `frontend/features/*` (présentation pure)
* controllers HTTP → `backend/controllers` uniquement
* `app/api` = adapters Next, pas de logique métier

---

# 15. Modèle de domaine cœur

## 15.1 User

Représente l’utilisateur authentifié de l’application.

L’identité est gérée par Supabase Auth.

L’application peut maintenir un enregistrement de profil pour les informations spécifiques au produit.

---

## 15.2 Project

Représente un projet de développement.

Champs conceptuels :

```text
id
user_id
name
description
github_repository_id
status
created_at
updated_at
```

---

## 15.3 Feature

Représente une unité significative de développement produit.

Exemples :

```text
Authentication
Inspection workflow
Internationalization
Admin dashboard
GitHub integration
```

Une feature appartient à un projet.

Champs conceptuels :

```text
id
project_id
name
description
status
branch_name
created_at
updated_at
```

---

# 16. Branch = Feature

Le workflow de développement de l’utilisateur établit une relation forte entre branches et features.

Pour la V1 :

```text
Git branch
      ↓
Feature
```

Une feature doit normalement avoir une branche GitHub associée.

Exemple :

```text
feature/authentication
        ↓
Authentication
```

Cette relation est une partie fondamentale du modèle produit.

Le système ne doit pas nécessiter d’analyse de code pour comprendre cette relation.

---

# 17. Cycle de vie d’une Feature

Le cycle de vie initial est :

```text
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

Ce cycle est volontairement extensible.

Une feature ne passe pas nécessairement par tous les états.

Exemple :

```text
PLANNED
   ↓
IN_PROGRESS
   ↓
PUSHED
   ↓
PR_OPEN
   ↓
MERGED
```

Les règles exactes de transition automatique évolueront pendant l’implémentation.

---

# 18. Modèle d’activité

L’activité GitHub est normalisée en activité de niveau application.

Événements potentiels :

```text
BRANCH_CREATED
COMMIT_DETECTED
PUSH_DETECTED
PR_OPENED
PR_UPDATED
PR_MERGED
PR_CLOSED
RELEASE_CREATED
```

Des événements futurs pourront inclure des déploiements.

L’activité doit contenir les métadonnées nécessaires pour expliquer ce qui s’est passé.

Exemple :

```text
feature_activity

id
feature_id
type
external_id
metadata
created_at
```

Le système doit éviter de stocker des informations sensibles sans nécessité.

---

# 19. Intégration GitHub

GitHub est l’intégration externe principale.

L’application doit supporter :

* la connexion du compte GitHub
* la découverte des repositories
* la sélection de repositories
* la découverte des branches
* l’activité de commits
* les pull requests
* les événements de merge
* l’état de synchronisation

---

# 20. Authentification GitHub

L’authentification GitHub doit utiliser une intégration OAuth sécurisée lorsque c’est possible.

L’application ne doit **pas** demander à l’utilisateur de coller un Personal Access Token permanent comme workflow par défaut.

Les credentials GitHub doivent rester server-side.

Les credentials ne doivent jamais être renvoyés au navigateur.

---

# 21. Cycle de vie des credentials GitHub

Le concept produit initial inclut un accès GitHub temporaire.

Le mécanisme exact d’expiration des tokens doit être implémenté selon le modèle OAuth / tokens supporté par GitHub — et non en assumant qu’on peut configurer arbitrairement chaque credential à 24 heures.

L’application doit exposer un état de connexion lisible :

```text
GitHub

Connected

Account:
Estime10

Connection:
Active

[Reconnect]
[Disconnect]
```

Si le credential externe expire ou devient invalide :

```text
GitHub connection expired

[Reconnect GitHub]
```

La session applicative interne et le cycle de vie du credential d’intégration GitHub doivent rester des concepts **séparés**.

---

# 22. Client API GitHub

L’accès à l’API GitHub doit être encapsulé.

Ne pas appeler GitHub directement depuis des composants aléatoires.

Utiliser une couche d’intégration dédiée :

```text
lib/github/                         # client HTTP / OAuth / mapping
backend/features/02_github/         # services + règles métier
frontend/features/02_homescreen/github/   # UI uniquement
```

Le client GitHub est responsable de :

* l’authentification
* la construction des requêtes
* la gestion des rate limits
* la normalisation des réponses
* les erreurs spécifiques GitHub

Le reste de l’application doit interagir avec des modèles de niveau application, pas avec les shapes de réponses GitHub.

---

# 23. Webhooks GitHub

Lorsque c’est pratique, les webhooks GitHub doivent être utilisés pour une activité quasi temps réel.

Exemple :

```text
GitHub
   ↓
Webhook
   ↓
POST /api/webhooks/github
   ↓
Verify signature
   ↓
Normalize event
   ↓
Update database
   ↓
Invalidate / refresh client state
```

Les signatures de webhooks doivent être vérifiées avant traitement.

L’endpoint webhook ne doit pas faire confiance à des requêtes entrantes arbitraires.

---

# 24. Synchronisation

Les webhooks ne doivent pas être le seul mécanisme de synchronisation.

L’application doit supporter une synchronisation explicite.

Exemple :

```text
[ Sync GitHub ]
```

Flux :

```text
User
 ↓
Sync project
 ↓
GitHub API
 ↓
Compare known state
 ↓
Update application database
 ↓
Update sync metadata
```

Cela apporte de la résilience si :

* un webhook est manqué
* l’application était temporairement indisponible
* un repository a été modifié avant la connexion du projet
* l’intégration a été reconnectée

---

# 25. État de synchronisation

Chaque projet connecté à GitHub doit maintenir des informations de synchronisation.

Champs conceptuels :

```text
last_synced_at
sync_status
last_successful_sync
last_sync_error
```

États possibles :

```text
IDLE
SYNCING
SUCCESS
ERROR
```

L’UI peut alors communiquer clairement la synchronisation.

Exemple :

```text
GitHub
● Synced 2 minutes ago
```

ou :

```text
GitHub
! Sync failed

[Retry]
```

---

# 26. Connexion d’un repository

L’ajout d’un projet doit suivre ce flux :

```text
Add Project
     ↓
GitHub connected?
     │
     ├── No → Connect GitHub
     │
     └── Yes
          ↓
     Fetch repositories
          ↓
     Select repository
          ↓
     Create project
          ↓
     Discover branches
          ↓
     Associate features
```

L’utilisateur ne devrait pas avoir à saisir manuellement des URLs de repository lorsque cela peut être évité.

---

# 27. Dashboard projet

Le dashboard est l’interface principale.

Son but n’est pas de reproduire GitHub.

Il doit répondre à :

```text
Sur quoi est-ce que je travaille ?
Qu’est-ce qui avance ?
Qu’est-ce que j’ai terminé ?
Qu’est-ce qui est bloqué ou inactif ?
Qu’est-ce qui a changé récemment ?
```

Exemple :

```text
Projects

FleetScan
82%

Jikowood
64%

Take The Crown
91%
```

---

# 28. Dashboard feature

Chaque projet expose la progression de ses features.

Exemple :

```text
FleetScan

Authentication
DONE

Truck management
DONE

Inspection workflow
IN PROGRESS

Photo workspace
IN PROGRESS

Offline mode
PLANNED
```

Chaque feature doit exposer l’activité pertinente.

Exemple :

```text
Inspection workflow

Branch:
feature/inspection-workflow

7 commits

Last activity:
2 hours ago

PR:
#42

Status:
IN PROGRESS
```

---

# 29. Timeline d’activité

La timeline d’activité fournit une vue chronologique du développement.

Exemple :

```text
22:31
FleetScan

Pushed feature/inspection-workflow

21:48
Jikowood

Pull request #18 merged

20:52
Take The Crown

Release created
```

La timeline n’est pas un flux brut d’activité GitHub.

Elle doit être normalisée en langage concis, orienté projet.

---

# 30. Stratégie de data fetching

Utiliser les Server Components pour les données initiales de page lorsque c’est approprié.

Utiliser TanStack Query pour l’état serveur interactif et fréquemment changeant.

Exemple :

```text
Initial Dashboard
        ↓
Server Component
        ↓
Initial data
        ↓
Client hydration
        ↓
TanStack Query
        ↓
Background synchronization
```

Pour les zones très dynamiques :

```text
Activity
GitHub sync
Feature status
Project state
```

TanStack Query peut refetch périodiquement ou réagir aux invalidations.

---

# 31. Stratégie de cache

Le cache doit refléter la volatilité des données.

Relativement stable :

```text
project metadata
repository metadata
```

Plus dynamique :

```text
feature state
activity
GitHub synchronization
pull request status
```

TanStack Query doit définir des stale times et des règles d’invalidation appropriées.

Ne pas introduire de polling agressif arbitraire.

Préférer :

```text
webhooks
+
invalidation explicite
+
background refetch
```

lorsque c’est possible.

---

# 32. Gestion des erreurs

Les erreurs doivent être catégorisées.

Exemples :

```text
AuthenticationError
AuthorizationError
ValidationError
NotFoundError
GitHubIntegrationError
GitHubRateLimitError
DatabaseError
SyncError
```

L’UI doit recevoir des erreurs sûres, orientées utilisateur.

Les détails d’implémentation internes ne doivent pas fuiter vers le client.

Ne jamais exposer :

* des erreurs SQL contenant des informations sensibles
* des credentials
* des tokens
* des stack traces internes
* des informations de connexion à la base

---

# 33. Rate limits GitHub

L’intégration GitHub doit prendre en compte les rate limits de l’API.

Le système doit :

* éviter les requêtes inutiles
* cacher les données GitHub stables
* utiliser les webhooks lorsque possible
* batcher la synchronisation lorsque pertinent
* exposer les erreurs de rate limit avec élégance
* éviter le polling agressif continu

Les requêtes à l’API GitHub doivent s’exécuter **côté serveur**.

---

# 34. Modèle de sécurité

La sécurité est une préoccupation architecturale de premier ordre.

## Authentification

Supabase Auth.

## Autorisation

Autorisation applicative + RLS.

## Validation

Zod + contraintes base de données.

## GitHub

OAuth + stockage sécurisé des credentials côté serveur.

## Webhooks

Vérification de signature.

## Secrets

Ne jamais exposer de credentials privilégiés au navigateur.

## API

HTTPS uniquement en production.

## Logging

Ne jamais logger :

```text
access tokens
refresh tokens
GitHub credentials
database passwords
secret values
```

---

# 35. Sécurité de la base de données

Les credentials service-role Supabase ne doivent **jamais** être exposés au navigateur.

L’accès Supabase côté client, s’il est utilisé, doit être contraint par le RLS.

L’accès privilégié côté serveur doit être minimisé.

Préférer des opérations base de données conscientes du contexte utilisateur lorsque c’est possible.

Toute opération service-role doit avoir une justification architecturale claire.

---

# 36. Secrets et variables d’environnement

L’application utilisera des variables d’environnement pour sa configuration runtime.

Exemples possibles :

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET

GITHUB_WEBHOOK_SECRET
```

Les variables publiques ne doivent contenir aucun credential sensible.

Les variables privées ne doivent être accessibles que dans des contextes d’exécution server-side.

Le Developer Progress OS pourra éventuellement contenir une capacité personnelle de secrets / vault, mais cela est **explicitement hors architecture cœur V1**.

---

# 37. Aucune fuite de secrets

Les valeurs sensibles ne doivent jamais apparaître dans :

* les bundles navigateur
* les props client
* les réponses API publiques
* les logs
* les événements analytics
* les messages d’erreur
* les commits Git
* les captures d’écran
* l’état de query sérialisé

Toute implémentation future de vault devra disposer d’un threat model et d’un design sécurité séparés.

---

# 38. Direction du schéma de base de données

Schéma conceptuel initial :

```text
users
─────
id
created_at

projects
────────
id
user_id
name
description
status
github_repository_id
created_at
updated_at

features
────────
id
project_id
name
description
status
branch_name
created_at
updated_at

feature_activity
────────────────
id
feature_id
type
external_id
metadata
created_at

github_integrations
───────────────────
id
user_id
github_user_id
encrypted_credentials
status
expires_at
created_at
updated_at

github_repositories
───────────────────
id
integration_id
github_repository_id
owner
name
full_name
default_branch
created_at
updated_at

github_sync_state
─────────────────
id
project_id
status
last_synced_at
last_successful_sync
last_error
```

Ce schéma est conceptuel et devra être raffiné pendant le design de la base.

---

# 39. Identifiants

Préférer des UUIDs (ou équivalents non séquentiels) pour les ressources internes de l’application.

Les IDs externes GitHub doivent être stockés séparément des IDs internes.

Exemple :

```text
projects.id
projects.github_repository_id
```

Ces champs représentent des systèmes d’identité différents.

---

# 40. Couche de mapping

Ne pas exposer les objets GitHub bruts dans toute l’application.

Utiliser des mappers.

Exemple :

```text
GitHubPullRequest
        ↓
mapGitHubPullRequest()
        ↓
PullRequestDomainModel
```

Cela empêche l’application de se coupler étroitement au format de réponse de l’API GitHub.

---

# 41. Couche service

La logique métier appartient aux services.

Exemple :

```text
projectService
featureService
githubService
syncService
activityService
```

Un service doit orchestrer le comportement de domaine.

Il ne doit pas contenir de logique UI.

---

# 42. Couche repository / accès aux données

L’accès base de données doit être isolé de l’UI et de la logique métier.

Exemple :

```text
featureRepository.create()
featureRepository.findByProject()
featureRepository.updateStatus()
```

Cela facilite les tests et l’évolution de l’implémentation base.

---

# 43. Détection des features

La V1 doit éviter de prétendre que la complétion d’une feature peut être parfaitement inférée.

L’application doit s’appuyer principalement sur la relation explicite branche ↔ feature.

Exemple :

```text
feature/authentication
        ↓
Authentication
```

Les événements GitHub mettent à jour l’état de développement de la feature.

Une association intelligente future pourra être explorée, mais l’interprétation sémantique automatique n’est **pas** requise en V1.

---

# 44. Calcul de progression

La progression doit être initialement déterministe.

Pondération conceptuelle d’exemple :

```text
PLANNED       0%
IN_PROGRESS  25%
COMMITTED    40%
PUSHED       50%
PR_OPEN      70%
MERGED       90%
DONE         100%
```

Ces valeurs sont des placeholders.

Le modèle exact de progression devra être défini après observation d’usages réels.

L’UI ne doit pas suggérer une fausse précision.

Une alternative est d’afficher des états plutôt que des pourcentages :

```text
PLANNED
IN PROGRESS
PR OPEN
MERGED
DONE
```

La visualisation en pourcentage ne doit être introduite que si elle apporte une information réellement utile.

---

# 45. Overrides manuels

L’utilisateur doit pouvoir corriger l’état applicatif lorsque l’activité GitHub ne représente pas parfaitement la réalité produit.

Exemple :

```text
Feature:
Offline mode

Git:
Branch exists

Product status:
PLANNED
```

Le système ne doit pas forcer un état automatique trompeur.

La synchronisation automatique doit fournir des **signaux**, pas supprimer le contrôle utilisateur.

---

# 46. Command Center

Une command palette est prévue comme feature UX cœur.

Commandes initiales :

```text
Open project
Create project
Create feature
Search project
Sync GitHub
Open settings
Connect GitHub
```

Commandes futures possibles :

```text
Show active projects
Show recently completed features
Show GitHub activity
```

Le command center doit être keyboard-first.

Raccourci principal :

```text
Cmd/Ctrl + K
```

---

# 47. Design responsive

L’application doit être responsive.

Le desktop est l’espace de travail principal, car l’activité de développement est généralement revue sur desktop.

Le mobile doit rester utilisable pour :

* consulter le statut des projets
* revoir l’activité
* voir les features
* naviguer basiquement entre projets

L’expérience mobile n’a pas besoin de reproduire chaque interaction desktop.

---

# 48. Accessibilité

L’accessibilité est obligatoire.

Attentes minimales :

* HTML sémantique
* navigation clavier
* états de focus visibles
* dialogs accessibles
* command palette accessible
* labels corrects
* contraste suffisant
* support du reduced motion
* informations de statut compatibles lecteurs d’écran

---

# 49. Stratégie de tests

## Tests unitaires

Utiliser Vitest pour :

* la logique de domaine
* les transitions d’état
* les mappers
* la validation
* les helpers d’autorisation
* le calcul de progression
* la normalisation des événements GitHub

---

## Tests d’intégration

Tester :

```text
API
 ↓
service
 ↓
database
```

lorsque c’est pratique.

Les chemins d’autorisation critiques doivent être testés.

---

## Tests end-to-end

Utiliser Playwright pour les workflows critiques.

Scénarios E2E initiaux :

```text
User logs in
User connects GitHub
User selects repository
Project is created
Feature is created
Branch is associated
GitHub activity is synchronized
Dashboard displays activity
Unauthorized resource is rejected
```

---

# 50. Tests d’autorisation

Les tests de sécurité doivent tenter explicitement :

```text
User A → User B project
User A → User B feature
User A → User B activity
User A → User B GitHub integration
```

Résultat attendu :

```text
DENIED
```

L’autorisation API **et** le RLS base de données doivent être testés.

---

# 51. Performance

L’application doit prioriser :

* un rendu initial rapide
* le chargement initial des données côté serveur
* un JavaScript client minimal
* des Client Components sélectifs
* une synchronisation GitHub efficace
* un cache sensé
* l’absence de polling inutile

Ne pas optimiser prématurément.

Mesurer d’abord.

---

# 52. Observabilité

L’observabilité future pourra inclure :

* le tracking d’erreurs
* le monitoring de synchronisation
* les échecs d’intégration GitHub
* la latence API
* les erreurs base de données

L’observabilité ne doit jamais capturer de valeurs secrètes.

---

# 53. CI/CD

GitHub Actions devra éventuellement exécuter :

```text
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Les pull requests doivent valider l’application avant merge.

Le déploiement production ne doit intervenir qu’après le passage des checks requis.

---

# 54. Déploiement

Architecture de déploiement initiale :

```text
Vercel
   │
   ├── Next.js application
   ├── Route Handlers
   └── Server Actions

Supabase
   │
   ├── Auth
   └── PostgreSQL

GitHub
   │
   └── Activité de développement externe
```

---

# 55. Frontières architecturales

Les frontières suivantes doivent rester explicites.

```text
UI
 ↓
Queries / Actions
 ↓
API / Server Actions
 ↓
Services
 ↓
Repositories
 ↓
Database
```

Et :

```text
Application
 ↓
GitHub Integration
 ↓
GitHub API
```

L’UI ne doit pas contenir de logique métier spécifique à GitHub.

L’UI ne doit pas contenir de logique d’autorisation comme **seul** mécanisme de sécurité.

---

# 56. Scope V1

La V1 doit se concentrer sur :

### Authentification

* authentification Supabase
* workspace protégé

### GitHub

* connexion GitHub
* découverte des repositories
* sélection de repository
* découverte des branches
* activité de commits
* pull requests
* activité de merge

### Projects

* créer un projet
* connecter un projet à un repository
* dashboard projet

### Features

* créer une feature
* associer une branche
* état de feature
* activité de feature

### Dashboard

* vue d’ensemble des projets
* progression des features
* activité récente
* état de synchronisation

### Architecture

* couche API
* Server Actions
* TanStack Query
* Zod
* RLS
* tests

---

# 57. Explicitement hors scope V1

Les éléments suivants ne font pas partie de l’implémentation initiale :

* analyse de code source
* analyse de code par IA
* compréhension automatique du code
* clonage de repository comme prérequis
* IDE
* éditeur type Notion complet
* workspace collaboratif
* permissions d’équipe
* billing
* SaaS public
* analytics avancées
* secret vault
* gestion automatique des déploiements
* support multi-providers Git

Ils pourront être considérés plus tard.

---

# 58. Future Exploration

Features futures potentielles :

```text
GitHub
├── synchronisation avancée
├── releases
├── deployments
└── GitHub Actions

Workspace
├── documentation
├── journal de projet
└── command center

# notes feature = LIVRÉ V1 (voir PRD + feature_notes)

Developer tooling
├── CLI
├── intégration projet local
└── intégration éditeur

Security
├── secret vault
├── variables d’environnement chiffrées
├── credentials temporaires
└── audit logs

Integrations
├── Vercel
├── Supabase
├── Sentry
└── autres plateformes de développement
```

Ces éléments ne doivent **pas** influencer l’architecture V1 sauf exigence concrète.

---

# 59. Architecture CLI future

Une future CLI pourrait communiquer avec l’API de l’application.

Commandes potentielles :

```bash
progress projects
progress project fleetscan
progress feature authentication
progress sync
```

L’architecture API doit donc rester suffisamment explicite pour supporter de futurs clients machine.

C’est une raison supplémentaire de ne pas rendre le frontend directement dépendant de Supabase pour toutes les opérations métier.

---

# 60. Philosophie de sécurité

Le projet suit :

```text
Never trust the client.
Never expose credentials.
Authenticate every protected operation.
Authorize every protected resource.
Validate every external input.
Protect the database with RLS.
Verify external webhook signatures.
Keep secrets server-side.
Log activity without logging secrets.
```

La sécurité n’est pas une phase finale.

La sécurité fait partie de l’architecture dès le début.

---

# 61. Philosophie de développement

L’implémentation suit :

```text
Build to understand
        ↓
Refactor to clarify
        ↓
Secure
        ↓
Test
        ↓
Automate
```

Ne pas sur-ingénier des abstractions avant de comprendre le domaine.

Ne pas introduire de librairies sans raison architecturale concrète.

Préférer du code explicite à une abstraction prématurée.

Éviter l’état global inutile.

Éviter les Client Components inutiles.

Éviter les endpoints API inutiles.

Chaque abstraction architecturale doit avoir une responsabilité claire.

---

# 62. Ordre d’implémentation initial

Séquence recommandée :

```text
1. Initialisation projet
        ↓
2. Fondation design system
        ↓
3. Configuration Supabase
        ↓
4. Authentification
        ↓
5. Workspace protégé
        ↓
6. Schéma de base de données
        ↓
7. Politiques RLS
        ↓
8. Domaine Project
        ↓
9. Architecture API / Server Actions
        ↓
10. GitHub OAuth
        ↓
11. Découverte des repositories
        ↓
12. Association Project ↔ repository
        ↓
13. Découverte des branches
        ↓
14. Modèle Feature
        ↓
15. Association Branch ↔ feature
        ↓
16. Synchronisation d’activité GitHub
        ↓
17. Modèle Activity
        ↓
18. Dashboard
        ↓
19. Synchronisation TanStack Query
        ↓
20. Webhooks
        ↓
21. Tests
        ↓
22. CI/CD
        ↓
23. Affinage UX
```

---

# 63. Definition of Done V1

> Aligné PRD **V1 = arbre + notes**. Pas de % progress / TanStack / webhooks.

La V1 est considérée fonctionnelle lorsque :

* un utilisateur peut s’authentifier (messages d’erreur génériques)
* un utilisateur peut connecter GitHub de façon sécurisée (credentials via RPC)
* un utilisateur peut voir ses repositories sur le homescreen
* l’ouverture d’un repository crée/assure le projet 1:1 et synchronise les features
* l’UI repository affiche un **arbre** de branches (trunks / open / done)
* une feature `done` survit à la suppression de la branche GitHub
* l’utilisateur peut créer / sauver / supprimer des **notes** (texte + images) sur une feature
* token GitHub expiré → redirect homescreen reconnect (pas d’overlay crash)
* l’utilisateur A ne peut pas accéder aux données de l’utilisateur B (RLS)
* les credentials GitHub sensibles n’atteignent jamais le navigateur
* le bucket notes n’est pas listable publiquement
* l’application passe lint, typecheck et build

---

# 64. Architecture finale

L’architecture cible est :

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │
                    HTTPS / Session
                           │
                           ▼
                 ┌──────────────────┐
                 │     Next.js      │
                 │                  │
                 │ Server Components│
                 │ Client Components│
                 │ Server Actions   │
                 │ Route Handlers   │
                 └────────┬─────────┘
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
      ┌─────────────┐          ┌─────────────┐
      │  Services   │          │ GitHub API  │
      └──────┬──────┘          └──────┬──────┘
             │                        │
             ▼                        │
      ┌─────────────┐                 │
      │ Repositories│                 │
      └──────┬──────┘                 │
             │                        │
             ▼                        │
      ┌─────────────┐                 │
      │  Supabase   │                 │
      │             │                 │
      │ Auth        │                 │
      │ PostgreSQL  │                 │
      │ RLS         │                 │
      └──────┬──────┘                 │
             │                        │
             └────────────┬───────────┘
                          │
                          ▼
                   PROJECT ACTIVITY
                          │
                          ▼
                     DASHBOARD
```

La boucle produit fondamentale est :

```text
GitHub activity
      ↓
Synchronization
      ↓
Normalized activity
      ↓
Feature state
      ↓
Project progress
      ↓
Developer dashboard
```

La boucle sécurité fondamentale est :

```text
Request
   ↓
Authentication
   ↓
Validation
   ↓
Authorization
   ↓
Business logic
   ↓
RLS
   ↓
Database
```

La boucle UX fondamentale est :

```text
Work normally in GitHub / Cursor
              ↓
       GitHub activity
              ↓
       Automatic sync
              ↓
     Open Developer OS
              ↓
       See where you are
```

Le produit doit rester focalisé sur cette promesse cœur :

> **Un développeur doit pouvoir ouvrir l’application et comprendre immédiatement où en sont ses projets, à partir de l’activité de développement qui s’est réellement produite.**

---

## Changelog document

| Version | Date | Changement |
| --- | --- | --- |
| 1.0 | 2026-09-18 | Création TDD FR — baseline architecture complète (64 sections) |
