# Firebase Deployment Checklist

## Leaderboard integrity status

Online score submission is **disabled by default**. The callable returns
`SUBMISSION_DISABLED` unless the Functions runtime environment contains
`UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION=true`. Do not set this variable on a
public deployment. It is an explicit escape hatch for isolated development
tests, not a security control that makes scores trustworthy.

The browser's market currently uses `Math.random` and obtains the Firebase
season only when the season-end dialog opens. The server instead replays a
separate deterministic market using a season secret. Client-supplied ticks and
timestamps can be forged. A valid server replay therefore does not prove the
reported trades took place during actual play. Before enabling public ranking,
the game needs a server-issued session, server-checked elapsed time, and one
shared authoritative market and trade record. Revalidate the full client and
server flow and remove the unsafe override as part of that redesign.

Local gameplay and saved games remain available without Firebase.

## 1) Configure project values

1. Copy `.env.example` to `.env` and fill all `VITE_FIREBASE_*` values.
2. Set real project id in `.firebaserc`:
   - Replace `YOUR_PROJECT_ID` with your Firebase project id.
3. Confirm App Check site key:
   - `VITE_RECAPTCHA_SITE_KEY` for production build.
   - `VITE_APPCHECK_DEBUG_TOKEN` only for local debug.

## 2) Pre-deploy quality gate

Run in repository root:

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

Run in `functions/`:

```bash
npm run lint
npm run build
```

## 3) Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

## 4) Post-deploy validation

1. Verify active season document exists in `seasons/{seasonId}`.
2. Verify seed exists only in `seasonSecrets/{seasonId}` (not in `seasons`).
3. Submit one score from client and confirm:
   - `leaderboard/{seasonId}/entries/*` is updated.
   - `leaderboard/{seasonId}/snapshot/top50` is updated.
4. Check function logs for structured submission events (`submitScore:event`).
