# Daybreak 보안 발견 사항 검증

Daybreak의 2026-10-03 저장소 스캔에서 보고한 항목입니다. 아래 수정은 검토 브랜치의 코드와 로컬 회귀 테스트 기준이며, 운영 배포 또는 Daybreak 재스캔 완료를 뜻하지 않습니다. 기존 발견 사항은 재검증 전까지 열린 상태로 둡니다.

- [Uncollateralized short sales and double-counted proceeds allow arbitrary verified leaderboard scores](https://chatgpt.com/mcp-app/connector_openai_defense_factory/open_defense_factory#/findings/acf_435817baf72995cf271624bc9cbf0bec) (high)
- [Caller-selected replay horizon bypasses season timing and duration](https://chatgpt.com/mcp-app/connector_openai_defense_factory/open_defense_factory#/findings/acf_0b4a9bfb940958f60312e0cf4ab5eca4) (medium)
- [Season-active check can race finalization, allowing leaderboard writes after closure](https://chatgpt.com/mcp-app/connector_openai_defense_factory/open_defense_factory#/findings/acf_7072ffa8a52411d67c6a39b7d3dde6f0) (medium)
- [Unbounded client-controlled replay horizon can consume a Cloud Function until timeout](https://chatgpt.com/mcp-app/connector_openai_defense_factory/open_defense_factory#/findings/acf_9ed5e336e829612ff0bac954d4766e99) (medium)
- [Legacy season fallback can expose the replay seed through a public season document](https://chatgpt.com/mcp-app/connector_openai_defense_factory/open_defense_factory#/findings/acf_cff9b2018da1e5005143a8b307f061c6) (medium)
- [Packaged loopback UI can be clickjacked by an arbitrary website](https://chatgpt.com/mcp-app/connector_openai_defense_factory/open_defense_factory#/findings/acf_0f3722a669dc71528f83e8fad924be95) (low)
- [Cross-site navigation can replace the cached offline shell with a non-HTML packaged resource](https://chatgpt.com/mcp-app/connector_openai_defense_factory/open_defense_factory#/findings/acf_faf9ead357e7dda14447040329cc2595) (low)

점수 제출은 기본적으로 계속 비활성화되어 있습니다. 리플레이의 수치·작업량 제한, 정확한 시즌 기간과 서버 시간 검사, 점수 트랜잭션 내 시즌·시드 재검사를 적용했습니다. 기존 공매도 담보 회계 및 입력 검증도 다시 테스트했습니다.

시즌 문서는 클라이언트에서 직접 읽을 수 없으며 `getActiveSeason`이 선택한 공개 필드만 반환합니다. 기존 공개 문서의 시드를 재사용하는 경로를 제거했습니다. 배포 시 Functions, Firestore 규칙, 웹 클라이언트를 함께 적용해야 합니다. 이전 공개 시드가 실제로 존재했다면 해당 시즌을 종료하고 새로운 비공개 시드로 새 시즌을 만들어야 합니다. 이 작업은 운영 데이터를 수정하지 않습니다.

로컬 웹 서버는 프레임 삽입을 차단하고, 서비스 워커는 검증된 HTML 시작 문서만 오프라인 시작 화면에 저장합니다.
