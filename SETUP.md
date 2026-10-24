# Setup and integration status

Install declared dependencies with `npm ci`, then run `npm run build` for TypeScript validation. `npm run dev` starts the source CLI and `npm start` runs the built CLI.

No Gmail credentials or token are included. `AuthHelper` expects your own `credentials.json` and an authorized `token.json` in the working directory. Both are ignored. The first-consent exchange is intentionally incomplete and throws after printing a URL; this repository cannot complete a new account connection as shipped. Do not follow older claims that it automatically exchanges a code or saves a fresh token.

For future integration, implement and test your own authorization-code exchange, least-privilege consent, secure token storage/refresh and mocked action tests. Repair the documented approval-state and persistence gaps before enabling mailbox writes. This publication does not create an OAuth account/client, request permissions or authorize live Gmail actions.

There is no LLM configuration, hosted AI backend or public service. See [README.md](README.md) for functionality and limits.
