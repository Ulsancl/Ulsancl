# Public-service operator runbook

The repository works as a standalone offline practice game. No production Firebase project or credentials are included. Public operation requires an explicitly selected project, billing for Functions/Scheduler, and the setup below. The initial public season is deliberately capped at **100 accounts**; do not remove that guard without redesigning sweep pagination, budget, snapshot publication and load tests.

## Local validation

Use Node 24.19+ with npm 11.9.0 for web tooling, Node 22 for deployed Functions, and Java 21. The service CI also runs on Node 22 with npm 11.9.0; npm 10 interprets the web lockfile’s ranged security overrides differently. Install root and Functions dependencies separately, then build Functions. Firebase CLI 15 is a development tool, not a runtime dependency.

```sh
npm ci
npm ci --prefix functions
npm run build --prefix functions
npx firebase-tools@15 emulators:start --project demo-stockdesk --only auth,firestore,functions
```

Ports: Auth 9299, Firestore 8282, Functions 5201. Start the web server with `VITE_DESK_EMULATORS=true npm run dev`; emulator access is compiled only in Vite DEV mode and only on localhost/127.0.0.1. Set `FIRESTORE_EMULATOR_HOST=127.0.0.1:8282` and `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9299` when running `node --test functions/tests/desk-service.test.cjs`. This test suite deletes only its `demo-stockdesk` emulator data. Never point it at a real project. Firebase's emulator does not run scheduled functions automatically; call `riskSweep` in the local service or run the service tests to produce standings.

The Functions CLI may ignore NO_PROXY for local control requests. In an environment with a mandatory outbound HTTP proxy, use a separate local-emulator-only process with the HTTP proxy variables removed after downloading emulator dependencies. Keep the proxy and trusted CA for external downloads and services.

## Production setup

1. Choose the intended Firebase project explicitly (`firebase use --add`). Enable Firestore Native mode, Google sign-in and/or email/password, email verification, authorized domains, password policy and Firebase App Check with reCAPTCHA v3. Never configure the old anonymous score path for the new desk.
2. Copy `.env.desk.example` to `.env.local`, filling only Firebase public web config and the App Check site key. No service-account keys or admin passwords belong in Vite variables. Build with `npm run build`; production builds cannot enable emulator mode.
3. From a trusted operator environment deploy Firestore rules/indexes and Functions, then verify index readiness and the generated `deskRiskSweep` Cloud Scheduler job. Deploy Hosting only after the smoke checks below. Deployment is a separate operation from creating this code/PR.
4. Create and verify an operator account. Using Application Default Credentials with the required project roles, run `node functions/scripts/desk-admin.cjs PROJECT grant UID REASON`. The tool preserves other claims, records the action, and revokes refresh tokens. Sign in again to obtain the new claim. Revoke with the same command and `revoke`. The desk callable, legacy score submission and both legacy season administration endpoints explicitly check token revocation and disabled/deleted users on every authenticated request. Removing a custom claim alone does not invalidate an already issued token; use the revocation command. Disable the identity in Firebase Auth for an incident and investigate active sessions. There is no first-user-is-admin behavior.
5. Open the operator console, enter a meaningful reason, and create a 252-day season. Start at 5 or 10 seconds per simulated minute. The first release has a 100-person cap; choose a small cohort while monitoring cost/latency. Users save a profile and join once per season.

## Trust boundary

All new `desk*` Firestore collections are denied by the existing default-deny rules, including reads. The Admin SDK is the only writer. `deskApi` enforces App Check outside the emulator, verified non-anonymous membership for private actions and the `admin` custom claim for operator actions. Do not expose seed-bearing `deskSeasons` through Firestore rules. The legacy `seasons` seed-bearing documents stay denied as well.

Clients submit only instrument, side, quantity, order kind and an optimistic revision/request ID. Server transactions own clock, cash, positions, receipts and results. Orders are bound to the account’s season so a retry cannot land in a newly joined season. Concurrent updates conflict; retries with the same request ID/payload cannot execute twice. A transport failure retains the request ID until checked. The last 64 receipts are retained; old revisions also prevent delayed replay. Invalid operations commit no partial account mutations. User input never supplies authoritative prices or the private random seed.

Rate limits allow 120 authenticated requests per minute. App Check limits unauthorized clients, but is not a complete cost-control mechanism. Set budget alerts, Cloud Functions request/error alerts and IAM restrictions before launch; there is no claim of resistance to unlimited distributed traffic. Public standings reads use bounded data for up to 100 participants and check current profile visibility. Private collections and report content are never returned by public operations.

## Settlement, standings and moderation

The scheduled sweep runs every minute, processes the oldest 100 active accounts, and handles suspended accounts too. Each call has bounded catch-up; accounts not caught up cannot trade or join standings. A scheduled run publishes one atomic common-time standings document. Failed or still-catching-up accounts are omitted. Terminal accounts retain their final loss/return. The UI marks standings older than two minutes as stale. All eligible accounts in a snapshot share the same comparison tick; newly joined or updated traders appear on the next sweep. Account inactivity cannot freeze losses.

Monitor `deskHealth/riskSweep` (`at`, `updated`, `failed`, `scanned`), Functions latency/errors and Scheduler failures. Investigate a missed run or nonzero failures. The UI flags active accounts without updates for 120 seconds. These are initial operational indicators, not proof of full scale readiness. Concurrency, capacity and the one-minute cadence need load validation before increasing the cap.

Public profiles contain nickname and optional self-declared country/region/age band, not birth dates or location tracking. Public-ranking consent can be withdrawn at any time; queries read current visibility so old snapshots do not undo withdrawal. Country/region/age fields lock during an active season. Filtered cohorts need five eligible accounts with sufficient period history. Since-entry returns allow different joining times and are labeled accordingly.

Reports are private, one report per reporter/target/UTC day. Operators review, resolve, suspend or restore accounts with a reason. Self-suspension is prevented. Suspension blocks new user commands and hides rankings, but server settlement continues. The emergency order switch blocks additions while permitting cancel and reduce-only orders. Every operational mutation records a server-owned audit entry. Early season closure is irreversible; it caps the clock and the sweep completes settlement at the closing mark.

## Prelaunch smoke checks and incidents

- Verify anonymous/unverified orders and non-admin operator calls are denied through the deployed callable (not just UI hiding), App Check rejects missing/invalid tokens, and direct Firestore account/seed reads and writes fail.
- With test identities, save profile, join, buy/sell, retry the same request, trigger a revision conflict, inspect fills, place/cancel a limit and trade an option spread. Confirm periodic background settlement while logged out.
- Confirm rankings refresh, missing history stays unranked, cohort suppression works, consent removal is immediate, report submission reaches the private operator queue, and suspend/restore/kill-switch actions are audited.
- Check mobile, offline practice and `/classic` saved accounts. Do not migrate classic or imported wealth into public accounts.
- For an execution incident: disable new orders with an explanatory notice; preserve logs, account documents, receipts, seeds and audit data; keep sweeps running unless the engine itself is corrupt. If the engine is at fault, pause Scheduler explicitly and mark the service unavailable while comparing a backup. Never silently reset participant balances.

Enable managed Firestore backups/export with project access controls. Configure TTL on `deskLimits.expiresAt`; review reports and archives under an explicit retention policy before launch (a reasonable starting proposal: resolved reports 90 days and season records 1 year). Account deletion is available in the account screen and `/delete-account`, including for unverified registered accounts. A sign-in within five minutes and explicit DELETE confirmation are required. The request transaction immediately fences further commands, withdraws ranking visibility and removes the active account. Deploy and verify `deskPrivacySweep` (every ten minutes): it deletes Firebase Auth, profiles, season archives/entries/snapshot rows and associated reports/audit entries in bounded retryable batches. Failed steps retain their pending job. Monitor `deskHealth/privacySweep.failed`, job age and backlog; investigate requests older than 24 hours. Only a uid/timestamp deletion fence remains for up to 30 days and the sweep removes expired fences even without TTL. Backups must expire under the operator's retention configuration and deletion requests must be reapplied after restoring a backup. Ordinary report/archive age-based retention still needs an explicit operator policy. Roll back web/Functions as a compatible pair and retain v2 documents; old `/classic` code is not a schema rollback for v2 accounts.

All desk API reads, including bootstrap and rankings, require a signed-in identity and use the same 120-requests-per-minute UID quota. The signed-out client stays in local practice and prompts for login before ranking queries. Empty identities and profiles with server-recorded `hasJoinedSeason: false` do not enumerate seasons during erasure: the callable attempts their bounded cleanup immediately, with a separate `identity-pending` retry queue. Each privacy sweep reserves 20 jobs for game-data erasure and independently processes up to 20 identity jobs, so unverified signup/deletion traffic cannot consume the participant queue budget. The participation flag is set transactionally by the server; legacy profiles with no flag receive the conservative full cleanup. Associated reports and audit records are still erased for nonparticipants.
