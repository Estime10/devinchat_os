# Checklist pré-prod

À faire **avant / au passage en production**, pas pendant le développement local.

## Auth — anti-bot & anti-spam

- [ ] **Vercel BotID** sur les server actions `loginUser` et `registerUser` (`checkBotId()` + `initBotId` / `withBotId`)
- [ ] **Rate limit** IP + email (ex. Upstash Redis) — ~5 tentatives / 15 min, réponse soft côté action
- [ ] **Messages login génériques** — ne pas distinguer « email inconnu » vs « mauvais mot de passe »
- [ ] **Rate limits Supabase Auth** — resserrer dans le dashboard (2e filet)

## Notes

- BotID : tester depuis le vrai formulaire en prod/preview Vercel (pas via curl).
- Rate limit in-memory : à éviter en serverless (instances multiples).
