import { useEffect, useState } from 'react'
import { COUNTRY_CODES } from './core'
import { api, loginGoogle, logout, emailAuth, resetPassword } from './client'
import { downloadSave, SAVE_KEY } from './storage'
import { Panel, Empty, Modal, Stat, won, pct, tone } from './components'
const countryNames = new Intl.DisplayNames(['ko'], { type: 'region' })
const countries = [
  ['', '선택 안 함'],
  ...COUNTRY_CODES.map((code) => [code, countryNames.of(code)]).sort((a, b) =>
    a[1].localeCompare(b[1], 'ko')
  ),
  ['OTHER', '기타'],
]
const ages = [
  ['', '선택 안 함'],
  ['under18', '18세 미만'],
  ['18-24', '18–24세'],
  ['25-34', '25–34세'],
  ['35-44', '35–44세'],
  ['45-54', '45–54세'],
  ['55plus', '55세 이상'],
]
function CountryField({ value, onChange, all = false }) {
  return (
    <label>
      국가
      <select aria-label="국가" value={value} onChange={(e) => onChange(e.target.value)}>
        {countries.map(([v, l]) => (
          <option value={v} key={v}>
            {!v && all ? '모든 국가' : l}
          </option>
        ))}
      </select>
    </label>
  )
}
function AgeField({ value, onChange, all = false }) {
  return (
    <label>
      연령대
      <select aria-label="연령대" value={value} onChange={(e) => onChange(e.target.value)}>
        {ages.map(([v, l]) => (
          <option value={v} key={v}>
            {!v && all ? '모든 연령대' : l}
          </option>
        ))}
      </select>
    </label>
  )
}
export function Account({ desk }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [signup, setSignup] = useState(false)
  const [profile, setProfile] = useState({
    displayName: '',
    country: '',
    region: '',
    ageBand: '',
    publicRanking: false,
  })
  useEffect(() => {
    if (desk.cloud?.profile) setProfile(desk.cloud.profile)
  }, [desk.cloud?.profile])
  const field = (key, value) => setProfile({ ...profile, [key]: value })
  return (
    <>
      <div className="two-column">
        <Panel title="내 계정" eyebrow="IDENTITY">
          {!desk.configured ? (
            <Empty title="지금은 연습 모드입니다">
              공개 시즌 서버를 연결하면 계정 로그인, 검증된 순위와 신고 기능을 사용할 수 있습니다.
              연습은 로그인 없이 이용할 수 있습니다.
            </Empty>
          ) : desk.user ? (
            <>
              <div className="identity">
                <span className="user-avatar">
                  {(desk.user.displayName || desk.user.email || 'M')[0]}
                </span>
                <div>
                  <strong>{desk.user.displayName || desk.user.email}</strong>
                  <small>
                    {desk.cloud?.member ? '인증된 계정' : '이메일 인증 후 다시 로그인하세요'}
                  </small>
                </div>
              </div>
              <div className="season-card">
                <span className="eyebrow">PUBLIC SEASON</span>
                <h3>{desk.cloud?.season?.title || '개설된 시즌이 없습니다'}</h3>
                <p>
                  공개 계좌는 서버 시계로 진행됩니다. 참가 후 초기화할 수 없으며 연습 자산을 가져올
                  수 없습니다.
                </p>
                {desk.cloud?.season && (
                  <span className="tag">
                    정원 {desk.cloud.season.members} / 100명 · 시장 1분 = 실제{' '}
                    {desk.cloud.season.tickMs / 1000}초
                  </span>
                )}
                <button
                  className="primary full"
                  disabled={
                    desk.busy || !desk.cloud?.member || !desk.cloud?.profile || !desk.cloud?.season
                  }
                  onClick={desk.join}
                >
                  공개 시즌 참가 / 이어하기
                </button>
              </div>
              <div className="button-row">
                <button
                  className="secondary"
                  disabled={desk.busy}
                  onClick={() => desk.run(desk.refresh)}
                >
                  계정 새로고침
                </button>
                <button
                  className="text-button"
                  disabled={desk.busy}
                  onClick={() => desk.run(logout)}
                >
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="muted">인증된 계정으로 공개 시즌에 참가하세요.</p>
              <button
                className="secondary full"
                onClick={() => desk.run(loginGoogle)}
                disabled={desk.busy}
              >
                Google로 계속하기
              </button>
              <div className="divider">또는 이메일</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  desk.run(async () => {
                    const message = await emailAuth(email, password, signup)
                    desk.setNotice(message)
                    await desk.refresh()
                  })
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
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    minLength="8"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button className="primary full" disabled={desk.busy}>
                  {signup ? '가입하고 인증 메일 받기' : '이메일 로그인'}
                </button>
              </form>
              <div className="button-row">
                <button className="text-button" onClick={() => setSignup(!signup)}>
                  {signup ? '로그인으로' : '새 계정 만들기'}
                </button>
                <button
                  className="text-button"
                  disabled={!email || desk.busy}
                  onClick={() =>
                    desk.run(async () => {
                      await resetPassword(email)
                      desk.setNotice('비밀번호 재설정 메일을 요청했습니다.')
                    })
                  }
                >
                  비밀번호 재설정
                </button>
              </div>
            </>
          )}
        </Panel>
        <Panel title="공개 프로필" eyebrow="YOUR CHOICE">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              desk.run(async () => {
                await api({ op: 'profile', profile })
                await desk.refresh()
                desk.setNotice('프로필을 저장했습니다.')
              })
            }}
          >
            <fieldset disabled={!desk.cloud?.member || desk.busy}>
              <label>
                닉네임
                <input
                  maxLength="24"
                  required
                  value={profile.displayName}
                  onChange={(e) => field('displayName', e.target.value)}
                />
              </label>
              <div className="form-grid">
                <CountryField value={profile.country} onChange={(v) => field('country', v)} />
                <AgeField value={profile.ageBand} onChange={(v) => field('ageBand', v)} />
              </div>
              <label>
                지역 <span>시·도 단위 권장</span>
                <input
                  maxLength="40"
                  placeholder="예: 울산"
                  value={profile.region}
                  onChange={(e) => field('region', e.target.value)}
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={profile.publicRanking}
                  onChange={(e) => field('publicRanking', e.target.checked)}
                />
                닉네임·국가·지역·연령대와 성과를 순위에 공개합니다.
              </label>
              <p className="fine-print">
                생년월일이나 실제 위치를 수집하지 않습니다. 직접 선택한 정보이며 인증된 인구통계가
                아닙니다. 참가 시즌 동안 분류는 고정되며 공개 동의는 언제든 철회할 수 있습니다.
              </p>
              <button className="secondary full">프로필 저장</button>
            </fieldset>
          </form>
        </Panel>
      </div>
      <Panel title="연습 기록과 보관" eyebrow="LOCAL WORKSPACE">
        <div className="save-grid">
          <div>
            <h3>이 브라우저에 자동 저장</h3>
            <p className="muted">
              새 연습과 기존 주식 게임의 저장은 별도로 보관합니다. 다른 기기로 옮길 때는 연습 파일을
              사용하세요.
            </p>
            <small>
              현재 연습 순자산{' '}
              {won(desk.mode === 'practice' ? desk.summary.equity : desk.practice.account.cash)}원 ·
              저장{' '}
              {desk.practice.savedAt
                ? new Date(desk.practice.savedAt).toLocaleString('ko-KR')
                : '대기'}
            </small>
          </div>
          <div className="button-stack">
            <button className="secondary" onClick={() => downloadSave(desk.practice)}>
              연습 파일 내보내기
            </button>
            <label className="secondary upload-button">
              연습 파일 가져오기
              <input
                aria-label="연습 파일 가져오기"
                type="file"
                accept="application/json,.json"
                onChange={(e) => desk.importSave(e.target.files[0])}
              />
            </label>
            <button
              className="text-button"
              onClick={() =>
                desk.run(async () => {
                  const raw = localStorage.getItem(SAVE_KEY + '.backup')
                  if (!raw) throw new Error('보관된 이전 백업이 없습니다.')
                  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'marketdesk-backup.json'
                  a.click()
                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                })
              }
            >
              직전 자동 백업 내려받기
            </button>
            {desk.storageError && (
              <button className="text-button" onClick={() => downloadSave(desk.practice, true)}>
                보존된 원본 내려받기
              </button>
            )}
            <a className="text-button" href="/classic">
              기존 게임과 저장 열기 ↗
            </a>
          </div>
        </div>
      </Panel>
      <Panel title="시장 규칙" eyebrow="KNOW THE MODEL">
        <div className="rules-grid">
          <p>
            <strong>가상 자산 · 가상 자본</strong>시세는 상관관계·변동성·시장 사건을 반영한
            모형입니다. 실제 시장 데이터나 현금 수익이 아닙니다.
          </p>
          <p>
            <strong>거래 비용과 유동성</strong>원화 정수 단위로 회계 처리합니다. 스프레드·시장
            충격·수수료와 분당 체결 한도가 적용됩니다.
          </p>
          <p>
            <strong>파생상품</strong>선물은 원금을 이동하지 않고 손익을 정산합니다. 옵션은
            유럽형·현금 정산이며 조기 행사는 지원하지 않습니다.
          </p>
          <p>
            <strong>기간 성과와 공개 범위</strong>기간 수익률은 순자산과 일별 평가 기록을
            비교합니다. 세부 분류는 공개 참가자 5명 이상일 때 표시합니다.
          </p>
        </div>
      </Panel>
    </>
  )
}
export function Leaderboard({ desk }) {
  const [filters, setFilters] = useState({
      period: 'season',
      country: '',
      region: '',
      ageBand: '',
    }),
    [result, setResult] = useState(null),
    [report, setReport] = useState(null),
    [category, setCategory] = useState('suspicious-trading'),
    [detail, setDetail] = useState('')
  const update = (k, v) =>
    setFilters({ ...filters, [k]: v, ...(k === 'country' && !v ? { region: '' } : {}) })
  const load = () => desk.run(async () => setResult(await api({ op: 'leaderboard', ...filters })))
  useEffect(() => {
    if (!desk.configured) return
    let active = true
    api({ op: 'leaderboard' })
      .then((result) => {
        if (active) setResult(result)
      })
      .catch((error) => {
        if (active) desk.setError(error.message)
      })
    return () => {
      active = false
    }
  }, [desk.configured, desk.setError])
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">SHARED MARKET, DIFFERENT STRATEGIES</span>
        <h2>
          같은 시장에서,
          <br />
          당신의 전략은 어디쯤인가요?
        </h2>
        <p>
          서버가 같은 시각으로 정산한 공개 계좌를 비교합니다. 연습 기록은 순위에 포함되지 않습니다.
        </p>
      </div>
      <Panel
        title="시즌 리더보드"
        eyebrow="VERIFIED PERFORMANCE"
        extra={<span className="tag">{result?.season?.title || '시즌 대기'}</span>}
      >
        <form
          className="leaderboard-filters"
          onSubmit={(e) => {
            e.preventDefault()
            load()
          }}
        >
          <label>
            비교 기간
            <select value={filters.period} onChange={(e) => update('period', e.target.value)}>
              <option value="season">참가 이후</option>
              <option value="day">최근 1거래일</option>
              <option value="week">최근 5거래일</option>
              <option value="month">최근 20거래일</option>
            </select>
          </label>
          <CountryField all value={filters.country} onChange={(v) => update('country', v)} />
          <label>
            지역
            <input
              placeholder="모든 지역"
              maxLength="40"
              value={filters.region}
              disabled={!filters.country}
              onChange={(e) => update('region', e.target.value)}
            />
          </label>
          <AgeField all value={filters.ageBand} onChange={(v) => update('ageBand', v)} />
          <button className="secondary" disabled={!desk.configured || desk.busy}>
            순위 조회
          </button>
        </form>
        {result?.stale && (
          <p className="notice">서버 정산이 지연됐습니다. 마지막 집계 기준의 순위입니다.</p>
        )}
        {result?.entries.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>투자자</th>
                  <th>국가 · 지역</th>
                  <th>연령대</th>
                  <th>수익률</th>
                  <th>일별 최대 낙폭</th>
                  <th>체결</th>
                  <th>신고</th>
                </tr>
              </thead>
              <tbody>
                {result.entries.map((r) => (
                  <tr key={r.uid}>
                    <td className="rank-number">{String(r.rank).padStart(2, '0')}</td>
                    <td>{r.displayName}</td>
                    <td>
                      {countries.find(([c]) => c === r.country)?.[1] || '미선택'}
                      <small>{r.region}</small>
                    </td>
                    <td>{ages.find(([a]) => a === r.ageBand)?.[1]}</td>
                    <td className={tone(r.returnRate)}>{pct(r.returnRate)}</td>
                    <td>{pct(-r.drawdown)}</td>
                    <td>{r.trades}</td>
                    <td>
                      <button
                        className="text-button"
                        disabled={!desk.cloud?.member}
                        onClick={() => {
                          setReport(r)
                          setDetail('')
                        }}
                      >
                        신고
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              !desk.configured
                ? '공개 서버 연결을 기다리고 있습니다'
                : result?.cohortPending
                  ? '비교할 참가자가 더 필요합니다'
                  : '아직 집계된 순위가 없습니다'
            }
          >
            {result?.cohortPending
              ? '세부 분류는 해당 기간의 공개 참가자가 5명 이상일 때만 표시합니다.'
              : '시즌 참가, 공개 동의와 서버 정산이 완료되면 여기에 나타납니다. 존재하지 않는 참가자나 점수를 표시하지 않습니다.'}
          </Empty>
        )}
        <p className="fine-print">
          {result?.snapshotAt
            ? `집계 ${new Date(result.snapshotAt).toLocaleString('ko-KR')} · `
            : ''}
          국가·지역·연령대는 자기 신고 정보입니다. 참가 이후 순위는 참가 시점 차이가 있으며, 기간별
          순위는 필요한 거래일을 채운 계좌만 포함합니다.
        </p>
      </Panel>
      {report && (
        <Modal title={`${report.displayName} 신고`} onClose={() => setReport(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              desk.run(async () => {
                await api({ op: 'report', targetUid: report.uid, category, detail })
                setReport(null)
                desk.setNotice('운영자에게 신고가 접수됐습니다.')
              })
            }}
          >
            <label>
              유형
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="suspicious-trading">비정상 거래 의심</option>
                <option value="nickname">부적절한 닉네임</option>
                <option value="abuse">서비스 악용</option>
                <option value="other">기타</option>
              </select>
            </label>
            <label>
              내용
              <textarea
                maxLength="1000"
                minLength="3"
                required
                rows="4"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </label>
            <p className="fine-print">
              운영자만 내용을 확인합니다. 같은 참가자에 대한 신고는 UTC 기준 하루 한 번 가능합니다.
            </p>
            <button className="primary full" disabled={desk.busy}>
              신고 접수
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
export function Admin({ desk }) {
  const [overview, setOverview] = useState(null),
    [reason, setReason] = useState(''),
    [message, setMessage] = useState(''),
    [title, setTitle] = useState('MARKET DESK 시즌 1'),
    [tickMs, setTickMs] = useState('5000'),
    [target, setTarget] = useState(''),
    [action, setAction] = useState(null)
  const refresh = async () => {
    const r = await api({ op: 'adminOverview' })
    setOverview(r)
    return r
  }
  useEffect(() => {
    if (!desk.cloud?.admin) return
    let active = true
    api({ op: 'adminOverview' })
      .then((result) => {
        if (active) setOverview(result)
      })
      .catch((error) => {
        if (active) desk.setError(error.message)
      })
    return () => {
      active = false
    }
  }, [desk.cloud?.admin, desk.setError])
  if (!desk.cloud?.admin)
    return (
      <Empty title="운영자 권한이 필요합니다">
        서버에서 부여한 관리자 계정만 사용할 수 있습니다.
      </Empty>
    )
  return (
    <>
      <Panel
        title="운영 현황"
        eyebrow="CONTROL ROOM"
        extra={
          <button
            className="secondary compact"
            disabled={desk.busy}
            onClick={() => desk.run(refresh)}
          >
            새로고침
          </button>
        }
      >
        <div className="stat-grid">
          <Stat label="활성 계좌 · 최대 100건" value={overview?.accounts ?? '—'} />
          <Stat label="2분 이상 정산 지연" value={overview?.staleAccounts ?? '—'} />
          <Stat label="미처리 신고 · 최대 100건" value={overview?.reports.length ?? '—'} />
          <Stat
            label="신규 주문"
            value={overview ? (overview.control.newOrdersEnabled ? '허용' : '중지') : '조회 중'}
          />
        </div>
      </Panel>
      <div className="two-column">
        <Panel title="시즌과 주문 제어" eyebrow="OPERATIONS">
          <label>
            감사 기록 사유
            <textarea
              required
              maxLength="300"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="모든 변경에 남길 구체적인 사유"
            />
          </label>
          <label>
            서비스 공지
            <input maxLength="200" value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <div className="button-row">
            <button
              className="secondary"
              disabled={desk.busy || !reason.trim() || !overview}
              onClick={() =>
                setAction({
                  op: 'adminFlags',
                  newOrdersEnabled: !overview.control.newOrdersEnabled,
                  message,
                })
              }
            >
              {overview?.control.newOrdersEnabled ? '신규 주문 일시 중지' : '신규 주문 재개'}
            </button>
            <button
              className="secondary"
              disabled={desk.busy || !reason.trim() || !overview?.season}
              onClick={() => setAction({ op: 'adminSeason', action: 'close' })}
            >
              현재 시즌 종료
            </button>
          </div>
          <p className="fine-print">
            주문 중지 중에도 취소·청산 전용 주문과 위험 정산은 계속됩니다.
          </p>
          <label>
            새 시즌 제목
            <input maxLength="60" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            시장 1분의 실제 길이
            <select value={tickMs} onChange={(e) => setTickMs(e.target.value)}>
              <option value="1000">1초</option>
              <option value="5000">5초</option>
              <option value="10000">10초</option>
              <option value="60000">60초</option>
            </select>
          </label>
          <button
            className="primary full"
            disabled={desk.busy || !reason.trim() || !overview || !title.trim()}
            onClick={() =>
              setAction({ op: 'adminSeason', action: 'create', title, tickMs: Number(tickMs) })
            }
          >
            252거래일 시즌 개설
          </button>
        </Panel>
        <Panel title="신고와 계정 제재" eyebrow="MODERATION">
          <label>
            계정 ID
            <input value={target} maxLength="128" onChange={(e) => setTarget(e.target.value)} />
          </label>
          <div className="button-row">
            <button
              className="secondary"
              disabled={!target || !reason.trim() || desk.busy}
              onClick={() =>
                setAction({ op: 'adminModerate', action: 'suspend', targetUid: target })
              }
            >
              거래 정지
            </button>
            <button
              className="secondary"
              disabled={!target || !reason.trim() || desk.busy}
              onClick={() =>
                setAction({ op: 'adminModerate', action: 'restore', targetUid: target })
              }
            >
              정지 해제
            </button>
          </div>
          {overview?.reports.map((r) => (
            <article className="report-card" key={r.id}>
              <strong>{r.category}</strong>
              <small>대상 {r.targetUid}</small>
              <p>{r.detail}</p>
              <div className="button-row">
                <button
                  className="secondary compact"
                  disabled={!reason.trim() || desk.busy}
                  onClick={() =>
                    setAction({
                      op: 'adminModerate',
                      action: 'resolve',
                      reportId: r.id,
                      targetUid: r.targetUid,
                    })
                  }
                >
                  신고 처리
                </button>
                <button
                  className="secondary compact"
                  disabled={!reason.trim() || desk.busy}
                  onClick={() =>
                    setAction({
                      op: 'adminModerate',
                      action: 'suspend',
                      reportId: r.id,
                      targetUid: r.targetUid,
                    })
                  }
                >
                  정지 후 처리
                </button>
              </div>
            </article>
          ))}
          {!overview?.reports.length && <p className="empty-inline">미처리 신고가 없습니다.</p>}
        </Panel>
      </div>
      <Panel title="최근 감사 기록" eyebrow="AUDIT TRAIL">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>시각</th>
                <th>작업</th>
                <th>관리자</th>
                <th>사유</th>
              </tr>
            </thead>
            <tbody>
              {overview?.audit.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.at).toLocaleString('ko-KR')}</td>
                  <td>{r.action}</td>
                  <td>{r.actorUid}</td>
                  <td>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {action && (
        <Modal title="운영 변경 확인" onClose={() => setAction(null)}>
          <p>
            {action.op === 'adminSeason'
              ? action.action === 'close'
                ? '현재 시즌을 종료합니다. 계좌는 종료 시각으로 정산되며 재개할 수 없습니다.'
                : `새 시즌 «${title}»을 개설합니다.`
              : action.op === 'adminFlags'
                ? `신규 주문을 ${action.newOrdersEnabled ? '허용' : '중지'}합니다.`
                : `${action.targetUid} 계정에 ${action.action} 처리를 적용합니다.`}
          </p>
          <p className="callout">기록 사유: {reason}</p>
          <div className="button-row">
            <button className="secondary" onClick={() => setAction(null)}>
              취소
            </button>
            <button
              className="primary"
              disabled={desk.busy}
              onClick={() =>
                desk.run(async () => {
                  await api({ ...action, revision: overview.control.revision, reason })
                  setAction(null)
                  await refresh()
                  await desk.refresh()
                  desk.setNotice('운영 변경을 적용하고 감사 기록에 저장했습니다.')
                })
              }
            >
              확인하고 적용
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
