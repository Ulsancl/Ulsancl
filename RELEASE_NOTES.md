# 1.15.0 검토 후보 — 2026-10-02

- 공매도 예치 증거금과 평가손익을 순자산에 포함하고 공통 회계식으로 UI·신용 평가·자산 기록을 맞춥니다.
- 공매도 청산/강제 정산 내역, 예약 부분 체결의 레버리지 원금, 저장된 일일 통계를 보존합니다.
- 합성 과거 가격을 실제 세션 관측 기록으로 교체합니다. 고정 OHLC, 소수 가격, 같은 시각의 보조지표, 평탄 RSI/MACD, 0원 자산 기록과 키보드 확인을 지원합니다.
- 저장 형식 v4와 기존 새 시즌 정책을 유지하며, 지원하지 않는 원문을 별도 보존하고 보호 실패 시 덮어쓰기를 중단합니다. 현재 진행/원문 다운로드와 게임 범위 초기화를 제공합니다.
- 배포 캐시의 업데이트 정체와 다른 앱 캐시 삭제를 수정하고, 로컬 화면 전체의 오프라인 실행을 검증합니다.
- 공개 v1.14 및 서버 배포는 변경하지 않았습니다. 서버 엔진/거래 로그 형식 3.0.0은 유지하며 로컬/서버 회계 일치를 주장하지 않습니다.

이전 릴리스 기록은 아래에 그대로 보존합니다.

---

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
