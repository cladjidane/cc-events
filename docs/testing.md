# Tests & environnements

## Unitaires
- Commande : `pnpm test` ou `pnpm test:unit`
- Couverture : `pnpm test:coverage`
- Vitest tourne en jsdom, alias `@` pointe sur la racine.

## Intégration (Prisma + SQLite)
- Commande : `pnpm test:integration`
- Utilise un schéma dédié SQLite `prisma/schema.test.prisma` (client généré dans `node_modules/.prisma/test-client`).
- La base de test est `./tmp/test.db` et est recréée à chaque run.

## E2E (Playwright)
- Commande : `pnpm test:e2e`
- Variables requises : `E2E_BASE_URL=http://localhost:3333`
- Activer une instance locale : `pnpm dev` (ou `pnpm start` après build) avant de lancer les tests.
- Rapports : un reporter HTML est produit dans `playwright-report`.

## Base de données de test (SQLite)
- Fichier recommandé `.env.test` :
  ```
  DATABASE_URL="file:./tmp/test.db"
  NEXTAUTH_SECRET="test-secret"
  NEXTAUTH_URL="http://localhost:3333"
  E2E_BASE_URL="http://localhost:3333"
  ```
- Préparation rapide :
  ```
  cp .env.test .env
  pnpm prisma db push --skip-generate
  ```
- Pour des scénarios E2E, ajouter un seed léger (events/registrations) via `prisma/seed.ts` ou un script dédié.

## MCP integration
- Pour faire tourner Playwright avec le MCP live, exporter aussi `EVENTLITE_API_URL` / `EVENTLITE_API_KEY` côté MCP si vous voulez valider les flux bout en bout.
