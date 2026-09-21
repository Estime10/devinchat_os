# Checklist pré-prod

À faire **avant / au passage en production**, pas pendant le développement local.

## Auth — anti-bot & anti-spam

- [ ] **Vercel BotID** sur les server actions `loginUser` et `registerUser` (`checkBotId()` + `initBotId` / `withBotId`)
- [ ] **Rate limit** IP + email (ex. Upstash Redis) — ~5 tentatives / 15 min, réponse soft côté action
- [ ] **Messages login génériques** — ne pas distinguer « email inconnu » vs « mauvais mot de passe »
- [ ] **Rate limits Supabase Auth** — resserrer dans le dashboard (2e filet)

## GitHub OAuth — setup local / prod

- [ ] Créer une **GitHub OAuth App** (Developer settings)
  - Homepage URL : URL de l’app
  - Authorization callback URL : `{APP_ORIGIN}/api/github/callback` (ex. `http://localhost:3000/api/github/callback`)
- [ ] Env serveur :
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_CREDENTIALS_ENCRYPTION_KEY` (`openssl rand -base64 32`)
- [ ] Appliquer la migration `github_connections`
- [ ] Appliquer la migration `github_credentials_column_guard` (SELECT credentials fermé ; RPC `get_own_github_credentials`)
- [ ] Appliquer la migration `upsert_own_github_connection` (écriture credentials via RPC — corrige `github_error=persist` au reconnect)
- [ ] Vérifier connect → authorize → callback → status `connected` sur `/home`

## Notes

- [ ] **Scopes** : `read:user` + `repo` (minimum GitHub pour repos privés). L’app n’émet que des GET (`githubApiGet`). Migration GitHub App (Contents: Read) = post-V1.
- Rate limit in-memory : à éviter en serverless (instances multiples).
- Une OAuth App GitHub = **une** callback URL (souvent une app local + une app prod).
