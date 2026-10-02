# 저장 원문 보존

게임의 공개 저장 형식은 기존 버전 4와 `stockTradingGame` 키를 유지한다. 이번 변경은 읽을 수 없는 저장을 새 게임의 자동 저장이 덮어쓰는 경로를 막는다. 새 가져오기 기능이나 임의 복원 기능은 추가하지 않는다.

## 읽기와 자동 저장

- 버전 4의 유효한 저장은 종전처럼 읽는다. 기존 부분 저장과 증거금 필드가 없는 구형 공매도 포지션도 지원한다. 값이 제공된 금융 숫자와 컬렉션 구조는 검증한다.
- 버전 4 미만의 저장은 종전 정책대로 새 시즌 상태로 시작하지만, 먼저 원문 문자열을 보관한다.
- 손상된 JSON, 잘못된 저장 구조, 지원하지 않는 미래 버전은 원문을 보관하고 새 게임 상태를 사용한다. 미래 버전의 원문을 버전 4로 수정하지 않는다.
- 보관 위치는 별도 키 `stockTradingGame:originals:v1`이다. 원문의 공백, 개행, 문자와 미지의 필드를 그대로 유지한다. 동일 문자열은 중복 보관하지 않고 자동 삭제하지 않는다.
- 보관함 쓰기 후 동일 문자열을 다시 읽어 확인한 경우에만 게임 저장을 교체할 수 있다. 저장 공간 부족, 접근 오류 또는 확인 실패 시 원래 게임 저장을 유지하고 자동 저장을 중단한다. 실패 원인이 해소되면 다음 저장 시 다시 확인한다.
- 이미 있는 보관함이 손상되어 읽을 수 없으면 그것을 교체하거나 비우지 않는다. 게임 저장도 교체하지 않는다.
- `saveGame`을 `loadGame`보다 먼저 호출해도 같은 보호 절차를 거친다.

이는 같은 브라우저·같은 출처의 로컬 저장이다. 브라우저 데이터 삭제, 장치 손실 또는 보관함을 포함한 저장 공간의 외부 삭제를 방지하지 않는다. 원문과 현재 상태의 파일 다운로드를 별도로 제공한다.

## 공개 API

`src/utils.js`에서 다음 API를 노출한다.

| API | 결과 |
| --- | --- |
| `getSaveStatus()` | `{mode, reason, backupCount}` 복사본 |
| `listSaveBackups()` | `{id, createdAt, reason, version, bytes}[]` 복사본. 원문은 포함하지 않는다. |
| `readSaveBackup(id)` | 보관한 정확한 원문 문자열. 찾거나 읽을 수 없으면 예외. |
| `createSaveExport(snapshot)` | 현재 게임의 기존 버전 4 JSON 문자열. 입력 및 브라우저 저장을 변경하지 않는다. |
| `saveGame(snapshot)` | 확인까지 성공하면 `true`, 실패하면 `false` |
| `resetGame()` | 게임 저장만 삭제한 뒤 확인 성공 시 `true`, 실패 시 `false` |

`createdAt`은 Unix 시각의 밀리초, `bytes`는 UTF-8 인코딩 길이이다. 원문 버전을 판독할 수 없으면 `version`은 `null`이다. 현재 상태 다운로드에 원문 보관함이나 실행 중 차트 관찰 기록을 합쳐 넣지 않는다.

상태 모드:

- `normal`: 원문 보관이 필요하지 않은 정상 저장 상태.
- `protected`: 원문을 보관하고 확인했다. 현재 게임의 자동 저장이 가능하다.
- `memory`: 저장이나 확인에 실패했거나 초기화 후 재시작을 기다린다. 현재 메모리 상태는 파일로 내보낼 수 있다.

`reason` 값은 원문 종류(`legacy-version`, `future-version`, `invalid-json`, `invalid-save`, `invalid-version`), 보관된 원문 존재(`retained-originals`), 실패 원인(`backup-failed`, `backup-unverified`, `backup-unreadable`, `storage-unavailable`, `save-failed`, `save-unverified`, `reset-failed`, `reset-unverified`, `invalid-current-state`), 재시작 대기(`reset-pending`) 중 하나이며 정상 초기 상태는 빈 문자열이다.

## 초기화 범위

`resetGame()`은 `stockTradingGame`만 삭제한다. 원문 보관함, 별도 설정, 다른 앱의 키는 보존한다. 초기화하려는 현재 원문도 보존이 필요하면 먼저 보관하고 확인해야 한다. 보호에 실패하면 삭제하지 않는다.

초기화 성공 뒤 같은 문서의 저장은 잠근다. 따라서 `beforeunload`나 남은 자동 저장 타이머가 초기화 이전 React 상태를 다시 쓰지 않는다. 실제 새 문서에서 모듈이 다시 로드되면 잠금이 해제된다. 설정 UI는 성공 시 페이지를 다시 연다.

## 검증

`saveLoad.test.js`는 기존 시즌 초기화와 부분 저장의 호환성을 확인한다. `saveProtection.test.js`는 원문 일치, 한글·보충 문자와 UTF-8 길이, 손상·미래 버전, 잘못된 금융 값, 저장 공간 및 읽기 확인 실패, 재시도, 보관함 손상, 중복 방지, 범위가 제한된 초기화, 종료 이벤트 잠금, 상태 다운로드의 비변경성과 재무 필드 보존을 검증한다.
