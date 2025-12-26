# Stock Trading Game v1.0.0
Date: 2025-12-26

## Highlights
- Engine refactor with a single entrypoint in src/engine
- Price calculation rules unified; crisis/season/news impacts normalized
- Save data versioning and migration support

## Changes
- constants split into domain modules under src/constants
- App responsibilities split across hooks (useGameState/useUiState/useTrading/useGameLoop)
- ESM consistency across engine modules

## Fixes
- Tutorial modal close behavior stabilized
- run_game.bat browser launch updated to avoid Windows "WW" error
- Playwright E2E selectors and waits hardened

## Developer Notes
- Jest config renamed to jest.config.cjs
- New test helper: e2e/testUtils.ts

## Tests
- npm run test:e2e

## Migration Notes
- Prefer importing from src/constants/index.js and src/engine/index.js
