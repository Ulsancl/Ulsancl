# Firebase Deployment Checklist

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
