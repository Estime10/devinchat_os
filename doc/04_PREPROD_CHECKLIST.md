# Checklist pré-prod

À faire **avant / au passage en production**, pas pendant le développement local.

Docs : [`01_PRD`](./01_PRD.md) (V1 = arbre + notes) · [`03_DATABASE_DESIGN`](./03_DATABASE_DESIGN.md) (6 tables live).

## Auth — anti-bot & anti-spam

- [ ] **Vercel BotID** sur les server actions `loginUser` et `registerUser` (`checkBotId()` + `initBotId` / `withBotId`)
- [ ] **Rate limit** IP + email (ex. Upstash Redis) — ~5 tentatives / 15 min, réponse soft côté action
- [ ] **Messages login génériques** — ne pas distinguer « email inconnu » vs « mauvais mot de passe » ✅ (`Identifiants incorrects.`)
- [ ] **Rate limits Supabase Auth** — resserrer dans le dashboard (2e filet)

## GitHub OAuth — setup local / prod

- [ ] Créer une **GitHub OAuth App** (Developer settings)
  - Homepage URL : URL de l’app
  - Authorization callback URL : `{APP_ORIGIN}/api/github/callback` (ex. `http://localhost:3000/api/github/callback`)
- [ ] Env serveur :
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_CREDENTIALS_ENCRYPTION_KEY` (`openssl rand -base64 32`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` présent **server-only** (jamais `NEXT_PUBLIC_`)
- [ ] Appliquer la migration `github_connections`
- [ ] Appliquer la migration `github_credentials_column_guard` (SELECT credentials fermé)
- [ ] Appliquer la migration `upsert_own_github_connection` (écriture credentials via RPC — signature remplacée ensuite par `server_only`)
- [ ] Appliquer la migration `github_credentials_write_guard` (REVOKE colonnes credentials — étape intermédiaire)
- [ ] Appliquer `github_credentials_server_only` (P0 : REVOKE INSERT/UPDATE table + GRANT `UPDATE(status)` ; RPCs credentials `service_role` only + `p_user_id`)
- [ ] **Preuve P0.1** (SQL) :
  - `has_column_privilege('authenticated','public.github_connections','credentials_ciphertext','UPDATE')` → `false`
  - `has_table_privilege('authenticated','public.github_connections','INSERT')` → `false`
  - `has_column_privilege('authenticated','public.github_connections','status','UPDATE')` → `true`
- [ ] **Preuve P0.2** (SQL) :
  - `has_function_privilege('authenticated','public.get_own_github_credentials(uuid)','EXECUTE')` → `false`
  - `has_function_privilege('service_role','public.get_own_github_credentials(uuid)','EXECUTE')` → `true`
- [ ] Vérifier `markOwnGithubConnectionExpired` (401 GitHub → `status = expired`)
- [ ] Vérifier connect → authorize → callback → status `connected` sur `/home`

## Notes / Storage

- [ ] Appliquer `feature_note_attachments` + `feature_note_attachments_private` (bucket privé, SELECT owner-only)
- [ ] Vérifier qu’une URL d’attachment **sans** signature renvoie 400/403
- [ ] Vérifier remove image + save → objet storage disparu (GC serveur)

## Notes

- [ ] **Scopes** : `read:user` + `repo` (minimum GitHub pour repos privés). L’app n’émet que des GET (`githubApiGet`). Migration GitHub App (Contents: Read) = post-V1.
- Rate limit in-memory : à éviter en serverless (instances multiples).
- Une OAuth App GitHub = **une** callback URL (souvent une app local + une app prod).
