# Stock Trading Game

Browser-based stock trading simulation game built with React + Vite.

## Core Features

- Real-time market simulation loop
- Long/short trading and order workflows
- Season-end score verification via Firebase Functions
- Firebase-backed global leaderboard snapshot
- Desktop + mobile E2E coverage with Playwright

## Local Development

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Firebase Setup

1. Copy `.env.example` to `.env` and set real `VITE_FIREBASE_*` values.
2. Replace project id in `.firebaserc`.
3. Follow `docs/FIREBASE_DEPLOYMENT.md` for deploy and validation steps.
