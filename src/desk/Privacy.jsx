import { useEffect, useState } from 'react'
import { api, configured, emailAuth, loginGoogle, logout, observeAuth } from './client'
import { Modal, Panel } from './components'
import { SAVE_KEY } from './storage'
import './desk.css'

export function DeleteAccount({ user, busy, run, onAccepted }) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  return (
    <>
      <button className="secondary" disabled={!user || busy} onClick={() => setOpen(true)}>
        공개 계정 삭제
      </button>
      {open && (
        <Modal title="계정과 공개 기록 삭제" onClose={() => setOpen(false)}>
          <p>
            로그인 계정, 프로필, 공개 시즌 계좌·거래 기록과 순위, 관련 신고 기록을 삭제합니다. 접수
            즉시 순위에서 숨기고 거래를 중지하며, 삭제는 되돌릴 수 없습니다.
          </p>
          <p>
            서버 정리는 순차 진행됩니다. 이 기기의 연습 저장과 직접 내려받은 파일은 별도로 지워야
            합니다. 보안용 삭제 접수 기록은 최대 30일 보관됩니다.
          </p>
          <label>
            확인을 위해 DELETE를 입력하세요
            <input
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <button
            className="primary full"
            disabled={busy || confirmation !== 'DELETE'}
            onClick={() =>
              run(async () => {
                await api({ op: 'deleteAccount', confirmation })
                await logout()
                setOpen(false)
                onAccepted(
                  '계정 삭제를 접수했습니다. 공개 순위에서 제외됐으며 서버 기록을 순차 삭제합니다.'
                )
              })
            }
          >
            계정 삭제 요청
          </button>
          <p className="fine-print">
            최근 5분 이내 로그인이 필요합니다. 요청이 거절되면 로그아웃 후 다시 로그인하세요.
          </p>
        </Modal>
      )}
    </>
  )
}

export function LocalDeletion({ busy = false }) {
  const [open, setOpen] = useState(false)
  const [legacy, setLegacy] = useState(false)
  return (
    <>
      <button className="secondary" disabled={busy} onClick={() => setOpen(true)}>
        이 기기 연습 기록 삭제
      </button>
      {open && (
        <Modal title="이 기기 저장 삭제" onClose={() => setOpen(false)}>
          <p>
            MARKET DESK 연습 계좌, 투자 일지, 캠페인 결과와 자동 백업을 지웁니다. 내려받은 파일과
            다른 기기의 저장은 직접 삭제해야 합니다.
          </p>
          <label className="checkbox">
            <input type="checkbox" checked={legacy} onChange={(e) => setLegacy(e.target.checked)} />
            기존 /classic 게임 저장도 삭제
          </label>
          <button
            className="primary full"
            onClick={async () => {
              const erase = () => {
                localStorage.removeItem(SAVE_KEY)
                localStorage.removeItem(SAVE_KEY + '.backup')
                if (legacy) {
                  for (const key of [
                    'stockTradingGame',
                    'stockTradingGame:originals:v1',
                    'stockGame_settings',
                  ])
                    localStorage.removeItem(key)
                }
              }
              if (navigator.locks) await navigator.locks.request(SAVE_KEY, erase)
              else erase()
              location.assign('/delete-account?local=cleared')
            }}
          >
            연습 기록 영구 삭제
          </button>
        </Modal>
      )}
    </>
  )
}

export default function PrivacyPage() {
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(
    new URLSearchParams(location.search).has('local') ? '이 기기의 선택한 저장을 삭제했습니다.' : ''
  )
  const [error, setError] = useState('')
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('')
  useEffect(() => observeAuth(setUser), [])
  const run = async (action) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      setError(e.message || '요청을 처리하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }
  const deletion = location.pathname.startsWith('/delete-account')
  const support = location.pathname.startsWith('/support')
  return (
    <main className="policy-page">
      <a className="eyebrow" href="/">
        ← MARKET DESK
      </a>
      <h1>
        {deletion ? '계정 · 데이터 삭제' : support ? '도움말과 개발자 문의' : '개인정보 처리 안내'}
      </h1>
      <p className="muted">MARKET DESK · 개발자 standard__bae · 시행일 2026년 11월 12일</p>
      <nav className="button-row" aria-label="서비스 안내">
        <a href="/privacy">개인정보</a>
        <a href="/delete-account">데이터 삭제</a>
        <a href="/support">도움말</a>
      </nav>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {deletion ? (
        <>
          <Panel title="공개 계정 삭제" eyebrow="ACCOUNT DELETION">
            <p>
              앱을 다시 설치하지 않고 이 페이지에서 계정과 관련 서버 데이터 삭제를 요청할 수
              있습니다.
            </p>
            {!configured ? (
              <p>
                현재 공개 계정 서비스는 운영하지 않습니다. 로그인 계정이나 서버 거래 기록은 생성되지
                않으며, 아래에서 기기에 저장한 연습 기록을 삭제할 수 있습니다.
              </p>
            ) : user ? (
              <>
                <p>{user.email || '로그인한 계정'}</p>
                <DeleteAccount user={user} busy={busy} run={run} onAccepted={setMessage} />
                <button className="text-button" disabled={busy} onClick={() => run(logout)}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <p>본인 확인을 위해 삭제할 계정으로 로그인하세요.</p>
                <button className="secondary" disabled={busy} onClick={() => run(loginGoogle)}>
                  Google로 로그인
                </button>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(() => emailAuth(email, password, false))
                  }}
                >
                  <label>
                    이메일
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label>
                    비밀번호
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    이메일 로그인
                  </button>
                </form>
              </>
            )}
          </Panel>
          <Panel title="기기에 저장된 연습 기록" eyebrow="LOCAL DATA">
            <p>연습은 로그인 없이 기기에 저장됩니다. 삭제하면 복구할 수 없습니다.</p>
            <LocalDeletion busy={busy} />
          </Panel>
        </>
      ) : support ? (
        <>
          <Panel title="플레이 시작하기" eyebrow="QUICK START">
            <ol>
              <li>트레이딩에서 종목과 주문 수량을 고르고 가상 자본으로 첫 주문을 체결하세요.</li>
              <li>시간 진행 버튼으로 시장을 움직이고 포트폴리오에서 비용과 손익을 확인하세요.</li>
              <li>캠페인에서 목표를 고르거나 전략 연구실에서 헤지와 옵션 조합을 실험하세요.</li>
              <li>계정 · 저장에서 연습 기록을 내려받아 보관할 수 있습니다.</li>
            </ol>
            <p>
              첫 실행과 업데이트에는 인터넷이 필요합니다. 최초 로딩이 완료된 뒤에는 캐시가 유지되는
              동안 오프라인 연습을 지원합니다. 시세·기업·자본은 모두 가상이며 실제 수익이나 출금은
              없습니다.
            </p>
          </Panel>
          <Panel title="개발자 문의" eyebrow="STANDARD__BAE">
            <p>
              <a href="https://github.com/Ulsancl/Ulsancl/issues" rel="noreferrer">
                GitHub 문의 게시판
              </a>
              에서 버그와 개선 의견을 남길 수 있습니다. 공개 게시판이므로 이메일, 비밀번호, 계정
              식별자 등 개인정보를 올리지 마세요.
            </p>
            <p>
              계정 데이터 삭제는 <a href="/delete-account">삭제 페이지</a>를 이용하세요.
            </p>
          </Panel>
        </>
      ) : (
        <>
          <Panel title="연습 모드" eyebrow="ON YOUR DEVICE">
            <p>
              연습 계좌, 주문·거래 내역, 캠페인 진행과 저장 백업은 브라우저의 기기 저장소에
              보관합니다. 연습 기록을 서버로 전송하지 않으며 광고·분석 SDK를 사용하지 않습니다.
            </p>
            <p>
              웹 호스팅 제공자는 사이트 제공과 보안을 위해 IP 주소·접속 기록을 처리할 수 있습니다.
              브라우저 자체의 데이터 처리는 해당 브라우저의 개인정보 정책에 따릅니다.
            </p>
          </Panel>
          <Panel title="공개 계정과 서버 시즌" eyebrow="OPTIONAL ONLINE PLAY">
            <p>
              {configured
                ? '공개 계정 서비스가 연결된 버전입니다.'
                : '현재 배포에서는 공개 계정 서비스를 운영하지 않습니다.'}{' '}
              공개 서비스를 이용하는 경우 이메일·계정 ID·인증 정보, 닉네임, 선택한 국가·지역·연령대,
              가상 거래·성과 기록, 신고 내용과 운영 처리 기록을 계정 관리·거래 검증·순위·신고 처리에
              사용합니다.
            </p>
            <p>
              이메일 인증과 서버 처리는 Google Firebase를 사용합니다. 인증 비밀번호는 Firebase
              Authentication에서 관리하며 게임 운영자에게 노출하지 않습니다. 정확한 위치, 생년월일,
              연락처, 실제 금융 계좌·결제 정보를 요청하지 않습니다.
            </p>
            <p>
              순위 공개를 선택하면 닉네임·선택한 분류·성과가 다른 이용자에게 보입니다. 계정 화면에서
              공개 동의를 철회할 수 있습니다. 지역과 연령대는 이용자가 직접 선택하는 정보입니다.
            </p>
          </Panel>
          <Panel title="삭제와 보관" eyebrow="YOUR CONTROL">
            <p>
              <a href="/delete-account">계정 · 데이터 삭제</a>에서 기기 저장을 지우거나 로그인한
              공개 계정 삭제를 요청할 수 있습니다. 서버 계정 삭제는 공개 노출과 거래를 즉시
              중지하고, 로그인 계정·프로필·계좌·과거 시즌·순위와 관련 신고·감사 기록을 순차
              삭제합니다. 보통 24시간 안에 처리하며 지연이나 실패는 운영자가 확인합니다.
            </p>
            <p>
              지연 요청이 기록을 다시 생성하지 못하도록 계정 ID와 삭제 접수·완료 시각만 최대 30일
              유지합니다. 별도로 내려받은 파일과 다른 기기의 저장은 이용자가 삭제해야 합니다. 운영
              백업을 사용하는 경우 보관 만료까지 남을 수 있으며 복원 시 삭제 요청을 다시 적용해야
              합니다.
            </p>
          </Panel>
          <Panel title="문의와 변경" eyebrow="STANDARD__BAE">
            <p>
              개발자: standard__bae. 서비스 관련 문의는 <a href="/support">도움말</a>을 이용하세요.
              데이터 처리 방식이 변경되면 이 페이지의 시행일과 내용을 갱신합니다.
            </p>
          </Panel>
        </>
      )}
    </main>
  )
}
