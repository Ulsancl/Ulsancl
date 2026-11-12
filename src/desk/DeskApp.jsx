import { useEffect, useState } from 'react'
import { useDesk } from './useDesk'
import Market from './Market'
import { Portfolio, Strategies, Campaigns, Journal } from './Pages'
import { Account, Leaderboard, Admin } from './Operations'
import { SCENARIOS } from './core'
import { Icon, Stat, won, pct, tone, tickLabel } from './components'
import './desk.css'
const pages = [
  ['market', '트레이딩', 'MARKET OVERVIEW'],
  ['portfolio', '포트폴리오', 'PORTFOLIO & RISK'],
  ['strategy', '전략 연구실', 'STRATEGY LAB'],
  ['campaign', '캠페인', 'CAMPAIGNS'],
  ['journal', '투자 일지', 'PERFORMANCE JOURNAL'],
  ['rank', '리더보드', 'LEADERBOARD'],
  ['account', '계정 · 저장', 'YOUR WORKSPACE'],
]
export default function DeskApp() {
  const desk = useDesk(),
    [page, updatePage] = useState(() =>
      pages.some(([key]) => key === location.hash.slice(1)) ? location.hash.slice(1) : 'market'
    ),
    [selected, setSelected] = useState('nova')
  const setPage = (next) => {
    if (next !== page) history.pushState(null, '', '#' + next)
    updatePage(next)
  }
  useEffect(() => {
    const back = () =>
      updatePage(
        pages.some(([key]) => key === location.hash.slice(1)) ? location.hash.slice(1) : 'market'
      )
    addEventListener('popstate', back)
    return () => removeEventListener('popstate', back)
  }, [])
  const nav = desk.cloud?.admin ? [...pages, ['shield', '운영 콘솔', 'OPERATIONS']] : pages
  const currentPage = nav.find(([key]) => key === page) || pages[0],
    scenario = SCENARIOS.find((s) => s.id === desk.account.scenario)
  const openMarket = (id) => {
    setSelected(id)
    setPage('market')
  }
  return (
    <div className="desk-app">
      <a className="skip-link" href="#main-content">
        본문으로 이동
      </a>
      <aside className="sidebar">
        <a href="/" className="brand" aria-label="마켓 데스크 홈">
          <svg viewBox="0 0 36 36" width="32" height="32" aria-hidden="true">
            <path d="M4 29V7h6l8 13 8-13h6v22h-6V17l-8 12-8-12v12z" fill="currentColor" />
          </svg>
          <span>
            MARKET
            <br />
            <b>
              DESK<span className="brand-dot">.</span>
            </b>
          </span>
        </a>
        <span className="sidebar-label">INVESTING SIMULATOR</span>
        <nav aria-label="주 메뉴">
          {nav.map(([key, label]) => (
            <button
              key={key}
              className={page === key ? 'active' : ''}
              aria-current={page === key ? 'page' : undefined}
              onClick={() => setPage(key)}
            >
              <Icon name={key} />
              <span>{label}</span>
              {page === key && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="simulation-label">
            <span className="status-dot" /> 가상 시장 · 실제 투자 감각
          </div>
          <p>
            가상 자본으로 실험하고,
            <br />
            당신만의 원칙을 만드세요.
          </p>
          <small>MARKET DESK / 02.00</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            WORKSPACE <span>/</span> <strong>{currentPage[2]}</strong>
          </span>
          <div className="topbar-actions">
            <span className={`mode-badge ${desk.mode === 'online' ? 'verified' : ''}`}>
              <span className="status-dot" />
              {desk.mode === 'online' ? '서버 검증 시즌' : 'PRACTICE'}
            </span>
            <button
              className="user-avatar"
              aria-label="계정 열기"
              onClick={() => setPage('account')}
            >
              {(desk.cloud?.profile?.displayName || desk.user?.displayName || 'ME').slice(0, 2)}
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex="-1">
          <div className="page-header">
            <div>
              <span className="eyebrow">MAKE YOUR NEXT MOVE</span>
              <h1>{currentPage[1]}</h1>
              <p>
                {desk.mode === 'practice' ? scenario.title : desk.session?.season.title}
                <span className="dot-separator">·</span>
                {tickLabel(desk.account.tick)}
                <span className="dot-separator">·</span>
                {desk.account.status === 'active'
                  ? '진행 중'
                  : desk.account.status === 'completed'
                    ? '종료'
                    : '지급 불능'}
              </p>
            </div>
            <div className="mode-switch">
              <button
                className={desk.mode === 'practice' ? 'active' : ''}
                onClick={() => desk.setMode('practice')}
              >
                연습 계좌
              </button>
              <button
                className={desk.mode === 'online' ? 'active' : ''}
                onClick={() => (desk.session ? desk.setMode('online') : setPage('account'))}
              >
                공개 시즌 ↗
              </button>
            </div>
          </div>
          {desk.storageError && (
            <div className="notice error" role="alert">
              {desk.storageError}{' '}
              <button className="text-button" onClick={() => setPage('account')}>
                저장 관리
              </button>
            </div>
          )}
          {desk.error && (
            <div className="notice error" role="alert">
              {desk.error}
              <button
                aria-label="오류 닫기"
                className="icon-button"
                onClick={() => desk.setError('')}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {desk.notice && (
            <div className="notice" role="status">
              {desk.notice}
              <button
                aria-label="알림 닫기"
                className="icon-button"
                onClick={() => desk.setNotice('')}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {desk.mode === 'online' && desk.cloud?.control.message && (
            <div className="notice">운영 공지 · {desk.cloud.control.message}</div>
          )}
          {desk.session?.catchingUp && desk.mode === 'online' && (
            <div className="notice">
              서버에서 이전 기간을 정산하고 있습니다. 정산 완료 후 주문할 수 있습니다.
            </div>
          )}
          <div className="account-strip">
            <Stat label="총 순자산" value={won(desk.summary?.equity)} sub="KRW · 비용 반영" />
            <Stat
              label="참가 이후 수익률"
              value={pct(desk.summary?.returnRate)}
              className={tone(desk.summary?.returnRate)}
              sub={`평가 손익 ${won(desk.summary?.unrealized)}원`}
            />
            <Stat
              label="주문 가능 금액"
              value={won(desk.summary?.available)}
              sub={`현금 ${won(desk.account.cash)}원`}
            />
            <Stat
              label="일별 최대 낙폭"
              value={pct(-desk.account.maxDrawdown)}
              sub={`체결 ${desk.account.trades}회 · 청산 ${desk.account.liquidationCount}회`}
            />
          </div>
          {desk.mode === 'practice' && (
            <div className="time-controls" role="group" aria-label="연습 시장 시간">
              <div>
                <Icon name="clock" size={17} />
                <strong>시장 시간</strong>
                <span>가속해서 전략을 확인하세요</span>
              </div>
              <div className="button-row">
                <button
                  className={desk.playing ? 'active' : ''}
                  disabled={desk.busy || desk.account.status !== 'active'}
                  onClick={() => desk.setPlaying(!desk.playing)}
                >
                  {desk.playing ? 'Ⅱ 일시정지' : '▷ 자동 진행'}
                </button>
                <select
                  className="speed-select"
                  aria-label="자동 진행 속도"
                  value={desk.speed}
                  onChange={(e) => desk.setSpeed(Number(e.target.value))}
                >
                  <option value={1}>1분/초</option>
                  <option value={30}>30분/초</option>
                  <option value={390}>1일/초</option>
                </select>
                {[
                  [1, '+1분'],
                  [30, '+30분'],
                  [390, '+1일'],
                  [3900, '+10일'],
                ].map(([ticks, label]) => (
                  <button
                    disabled={desk.busy || desk.account.status !== 'active'}
                    key={ticks}
                    onClick={() => desk.step(ticks)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {page === 'market' && (
            <Market desk={desk} selected={selected} setSelected={setSelected} />
          )}
          {page === 'portfolio' && <Portfolio desk={desk} openMarket={openMarket} />}
          {page === 'strategy' && <Strategies desk={desk} />}
          {page === 'campaign' && <Campaigns desk={desk} goMarket={() => setPage('market')} />}
          {page === 'journal' && <Journal desk={desk} />}
          {page === 'rank' && <Leaderboard desk={desk} />}
          {page === 'account' && <Account desk={desk} />}
          {page === 'shield' && <Admin desk={desk} />}
          <footer className="desk-footer">
            <span>VIRTUAL CAPITAL. REAL CONVICTION.</span>
            <nav className="button-row" aria-label="서비스 안내">
              <a href="/privacy">개인정보</a>
              <a href="/delete-account">데이터 삭제</a>
              <a href="/support">도움말</a>
            </nav>
            <small>
              모든 자산과 시세는 투자 학습용 모형입니다. 실제 돈을 입금하거나 출금하지 않습니다.
            </small>
          </footer>
        </main>
      </div>
    </div>
  )
}
