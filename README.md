# Gmail Workflow Prototype

A TypeScript prototype that maps text objectives to Gmail API reads, searches, drafts and label actions, with in-memory state and approval hooks.

## What is implemented

`DecisionEngine` uses deterministic keyword matching and field extraction, not an LLM or learned planner. `GmailClient` wraps Gmail API operations for message reads/search, draft creation/update/deletion, labels, read status, archive and trash. The code has no email-send operation. `DOMParser` exposes illustrative DOM-to-state helpers; it is not a packaged browser extension.

`Agent` coordinates a decision cycle, questions and pending actions. `StateManager` logs metadata but does not persist or reload state. This is an unfinished integration scaffold, not a complete autonomous email product. Examples use `example.com` addresses; no mailbox exports, customer messages, credentials or access tokens are included.

## Local setup and current blockers

Node.js 22 or later and npm:

```sh
npm ci
npm run build
```

For source development, `npm run dev` invokes `tsx watch src/index.ts`. The CLI would require your own Gmail OAuth client and authorized token before it can access a mailbox. Nothing in this repository authenticates as the author's account. Do not run it against a real mailbox expecting a fully tested approval boundary.

The OAuth helper reads root-level `credentials.json` and `token.json`, which are ignored. Its fresh-consent function prints an authorization URL and then deliberately throws: authorization-code capture/exchange is not implemented. Existing documentation that claimed an automatically completed first-run flow was inaccurate. See [SETUP.md](SETUP.md) for the present boundary.

## Backend, AI and safety limitations

There is no hosted service, public demo URL, model provider, paid AI gateway, API key, shared spending budget or AI inference component. A clone cannot access the author's mailbox or private model infrastructure. A separately configured Gmail OAuth backend/client is required for real API calls. This publication did not connect an account, add scopes, create credentials, send messages or exercise live Gmail operations.

Approval handling is incomplete: `approveAction` calls an executor path that rechecks `requiresApproval` and can requeue an approved action. Draft creation may occur without an explicit per-draft approval when called with real credentials. Search/read results are not fully fed back into the planner's context; persistence is a stub. The confidence score is heuristic and not calibrated. Authentication, least-privilege scope design, approval-state transitions, durable storage and mocked integration coverage need further work before real use. Existing requested OAuth scopes include mailbox modification and composition; no new scopes were granted as part of publication.

## Source and verification

This repository preserves the original history of `sidsurana/Untitled`; it is distinct from the Kaizen proposal demo and the application-demo repositories. The reachable history was audited before public visibility. No unit-test suite existed in the original source. The TypeScript build passes. No live Gmail calls or browser automation were performed. Dependency installation reports four moderate npm advisories in the existing dependency tree; no breaking upgrade was applied. A successful TypeScript build does not establish functional correctness.

[ARCHITECTURE.md](ARCHITECTURE.md) retains the original architecture notes with a current-status correction. No user code was discarded or history rewritten.

## License and affiliation

[MIT](LICENSE) for user-owned code, copyright 2026 Siddarth Surana. Dependencies retain their upstream licenses. This independent prototype is not affiliated with or endorsed by Google or Gmail. Trademarks and Google APIs remain subject to their owners' rights and terms.
