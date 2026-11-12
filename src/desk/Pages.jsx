import { useState } from 'react'
import { SCENARIOS, instrument, INSTRUMENTS, scenarioById } from './core'
import {
  Panel,
  Empty,
  Stat,
  Modal,
  LineChart,
  Icon,
  won,
  pct,
  tone,
  tickLabel,
  kinds,
} from './components'
export function Portfolio({ desk, openMarket }) {
  const { summary: v, account: a, command, busy } = desk
  return (
    <>
      <div className="two-column">
        <Panel
          title="보유 포지션"
          eyebrow="POSITIONS"
          extra={<span className="tag">{a.positions.length}개 상품</span>}
        >
          {v.positions.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>상품</th>
                    <th>수량</th>
                    <th>평균 / 현재</th>
                    <th>평가 손익</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {v.positions.map((p) => (
                    <tr key={p.instrumentId}>
                      <td>
                        <button className="text-button" onClick={() => openMarket(p.instrumentId)}>
                          {p.asset.symbol}
                        </button>
                        <small>
                          {kinds[p.asset.kind]} · {p.quantity > 0 ? 'LONG' : 'SHORT'}
                        </small>
                      </td>
                      <td>
                        {p.quantity}
                        <small>
                          {p.asset.unit} × {p.asset.multiplier}
                        </small>
                      </td>
                      <td>
                        {won(p.average)}
                        <small>{won(p.price)}</small>
                      </td>
                      <td className={tone(p.pnl)}>{won(p.pnl)}원</td>
                      <td>
                        <button
                          className="secondary compact"
                          disabled={busy || a.status !== 'active'}
                          onClick={() =>
                            command('order', {
                              order: {
                                instrumentId: p.instrumentId,
                                side: p.quantity > 0 ? 'sell' : 'buy',
                                quantity: Math.abs(p.quantity),
                                type: 'market',
                                reduceOnly: true,
                              },
                            })
                          }
                        >
                          청산
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="첫 포지션을 만들어 보세요"
              action={
                <button className="secondary" onClick={() => openMarket('index')}>
                  마켓으로 이동 <Icon name="arrow" size={16} />
                </button>
              }
            >
              현물로 분산하거나 파생상품으로 위험을 조절할 수 있습니다.
            </Empty>
          )}
        </Panel>
        <Panel title="위험 점검" eyebrow="RISK MONITOR">
          <dl className="risk-list">
            <div>
              <dt>총 익스포저 / 초기 자본</dt>
              <dd>{(v.grossExposure / a.initialCapital).toFixed(2)}배</dd>
            </div>
            <div>
              <dt>델타 환산 노출</dt>
              <dd>{won(v.deltaExposure)}원</dd>
            </div>
            <div>
              <dt>개시 증거금</dt>
              <dd>{won(v.initialMargin)}원</dd>
            </div>
            <div>
              <dt>유지 증거금</dt>
              <dd>{won(v.maintenanceMargin)}원</dd>
            </div>
            <div>
              <dt>주문 예약금</dt>
              <dd>{won(v.reservedOrders)}원</dd>
            </div>
            <div>
              <dt>강제 청산</dt>
              <dd className={a.liquidationCount ? 'negative' : ''}>{a.liquidationCount}회</dd>
            </div>
          </dl>
          <div className="risk-meter">
            <span
              style={{
                width: `${Math.min(100, (v.maintenanceMargin / Math.max(1, v.equity)) * 100)}%`,
              }}
            />
          </div>
          <p className="fine-print">
            순자산이 유지 증거금 아래로 내려가거나 현금이 음수가 되면 서버가 강제 청산합니다. 일별
            최대 낙폭은 장중 최저점을 모두 포착하지 않습니다.
          </p>
        </Panel>
      </div>
      <Panel title="비용과 현금 흐름" eyebrow="THE FULL PICTURE">
        <div className="stat-grid">
          <Stat
            label="실현 매매 손익 · 수수료 차감"
            value={`${won(a.realized)}원`}
            className={tone(a.realized)}
          />
          <Stat label="누적 거래 수수료" value={`${won(a.fees)}원`} />
          <Stat label="배당 · 지급 / 부담 합계" value={`${won(a.dividends)}원`} />
          <Stat
            label="공매도 차입 비용"
            value={`${won(a.financing)}원`}
            sub="연 3% · 거래일별 부과"
          />
        </div>
      </Panel>
    </>
  )
}
const presets = [
  {
    id: 'protect',
    name: '프로텍티브 풋',
    label: '하락 방어',
    detail:
      'ETF 10주와 풋 1계약을 함께 보유합니다. 풋 프리미엄을 지불해 만기 하방 위험을 줄입니다.',
    legs: [
      { instrumentId: 'index', side: 'buy', quantity: 10 },
      { instrumentId: 'index-put-35000-20', side: 'buy', quantity: 1 },
    ],
  },
  {
    id: 'covered',
    name: '커버드 콜',
    label: '상승 제한',
    detail:
      'ETF 10주를 보유하면서 콜 1계약을 매도합니다. 프리미엄을 얻지만 큰 상승의 이익을 포기합니다.',
    legs: [
      { instrumentId: 'index', side: 'buy', quantity: 10 },
      { instrumentId: 'index-call-40000-20', side: 'sell', quantity: 1 },
    ],
  },
  {
    id: 'spread',
    name: '불 콜 스프레드',
    label: '손익 범위 설계',
    detail:
      '낮은 행사가 콜을 사고 높은 행사가 콜을 팝니다. 같은 만기의 두 옵션을 동시에 체결합니다.',
    legs: [
      { instrumentId: 'index-call-35000-20', side: 'buy', quantity: 1 },
      { instrumentId: 'index-call-40000-20', side: 'sell', quantity: 1 },
    ],
  },
  {
    id: 'hedge',
    name: '현물 · 선물 헤지',
    label: '방향 노출 축소',
    detail:
      'ETF 10주 매수와 지수 선물 1계약 매도를 결합합니다. 보유 비용과 배당 때문에 손익이 정확히 0이 되지는 않습니다.',
    legs: [
      { instrumentId: 'index', side: 'buy', quantity: 10 },
      { instrumentId: 'index-future', side: 'sell', quantity: 1 },
    ],
  },
]
export function Strategies({ desk }) {
  const [active, setActive] = useState('protect'),
    [scale, setScale] = useState('1'),
    [custom, setCustom] = useState([
      { instrumentId: 'nova', side: 'buy', quantity: 1 },
      { instrumentId: 'han', side: 'sell', quantity: 1 },
    ])
  const preset = presets.find((p) => p.id === active),
    legs =
      active === 'custom'
        ? custom
        : preset.legs.map((l) => ({ ...l, quantity: l.quantity * Number(scale) }))
  const expired = legs.some((l) => instrument(l.instrumentId).expiry <= desk.account.tick)
  const values = Array.from({ length: 41 }, (_, i) => {
    const spot = desk.prices.index * (0.7 + i * 0.015)
    return {
      x: spot,
      y: legs.reduce((sum, l) => {
        const a = instrument(l.instrumentId),
          value =
            a.kind === 'option'
              ? Math.max(0, a.right === 'call' ? spot - a.strike : a.strike - spot)
              : spot
        return (
          sum +
          (value - desk.prices[l.instrumentId]) *
            (l.side === 'buy' ? 1 : -1) *
            l.quantity *
            a.multiplier
        )
      }, 0),
    }
  })
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">STRATEGY LAB</span>
        <h2>
          시장을 예측하는 것에서,
          <br />
          손익을 설계하는 것으로.
        </h2>
        <p>2–4개 주문을 하나의 전략으로 체결합니다. 모든 다리가 함께 통과해야 계좌에 반영됩니다.</p>
      </div>
      <div className="strategy-tabs">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={active === p.id ? 'active' : ''}
          >
            <span>{p.label}</span>
            <strong>{p.name}</strong>
          </button>
        ))}
        <button onClick={() => setActive('custom')} className={active === 'custom' ? 'active' : ''}>
          <span>롱숏 · 조합</span>
          <strong>직접 구성</strong>
        </button>
      </div>
      <div className="two-column">
        <Panel title={preset?.name || '나만의 바스켓'} eyebrow="BUILD YOUR POSITION">
          <p className="muted">
            {preset?.detail ||
              '서로 다른 상품을 조합하세요. 수량과 증거금은 합산된 최종 포지션으로 검증합니다.'}
          </p>
          {active !== 'custom' ? (
            <label>
              전략 세트 수
              <input
                type="number"
                min="1"
                max="1000"
                step="1"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
              />
            </label>
          ) : (
            custom.map((l, i) => (
              <div className="leg-editor" key={i}>
                <label>
                  상품 {i + 1}
                  <select
                    value={l.instrumentId}
                    onChange={(e) =>
                      setCustom(
                        custom.map((v, n) => (n === i ? { ...v, instrumentId: e.target.value } : v))
                      )
                    }
                  >
                    {INSTRUMENTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.symbol}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  방향
                  <select
                    value={l.side}
                    onChange={(e) =>
                      setCustom(
                        custom.map((v, n) => (n === i ? { ...v, side: e.target.value } : v))
                      )
                    }
                  >
                    <option value="buy">매수</option>
                    <option value="sell">매도</option>
                  </select>
                </label>
                <label>
                  수량
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={l.quantity}
                    onChange={(e) =>
                      setCustom(
                        custom.map((v, n) =>
                          n === i ? { ...v, quantity: Number(e.target.value) } : v
                        )
                      )
                    }
                  />
                </label>
                {custom.length > 2 && (
                  <button
                    aria-label={`상품 ${i + 1} 삭제`}
                    onClick={() => setCustom(custom.filter((_, n) => n !== i))}
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
          {active === 'custom' && custom.length < 4 && (
            <button
              className="secondary compact"
              onClick={() =>
                setCustom([...custom, { instrumentId: 'gold', side: 'buy', quantity: 1 }])
              }
            >
              + 다리 추가
            </button>
          )}
          <ul className="leg-list">
            {legs.map((l, i) => (
              <li key={i}>
                <span className={`tag ${l.side === 'buy' ? 'positive' : 'negative'}`}>
                  {l.side === 'buy' ? 'BUY' : 'SELL'}
                </span>
                <strong>{instrument(l.instrumentId).symbol}</strong>
                <span>
                  {l.quantity} {instrument(l.instrumentId).unit}
                </span>
              </li>
            ))}
          </ul>
          <button
            className="primary full"
            disabled={desk.busy || expired || desk.account.status !== 'active'}
            onClick={() =>
              desk.command('basket', { orders: legs.map((l) => ({ ...l, type: 'market' })) })
            }
          >
            {expired ? '포함된 옵션의 만기가 지났습니다' : '전략 일괄 주문'}
          </button>
        </Panel>
        <Panel
          title={
            active === 'custom' || active === 'hedge' ? '전략 체크포인트' : '만기 손익 시나리오'
          }
          eyebrow="UNDERSTAND THE TRADE"
        >
          {active !== 'custom' && active !== 'hedge' ? (
            <>
              <LineChart
                series={[{ name: '만기 손익 (KRW)', color: '#b9ef83', values }]}
                label="기초자산 가격이 현재의 70%에서 130%일 때 전략의 만기 손익"
                zero
              />
              <p className="fine-print">
                가로축: ETF 가격 {won(desk.prices.index * 0.7)}–{won(desk.prices.index * 1.3)}원.
                현재 중간가격으로 진입한 가정이며 수수료·배당·차입 비용은 제외합니다. 실제 체결과
                중도 평가 손익은 다릅니다.
              </p>
            </>
          ) : (
            <div className="strategy-checks">
              <h3>진입 전 세 가지</h3>
              <p>
                <b>01</b> 두 자산의 상관관계는 고정된 수익을 보장하지 않습니다.
              </p>
              <p>
                <b>02</b> 매도 포지션의 현금 유입은 이익이 아닙니다.
              </p>
              <p>
                <b>03</b> 증거금 여유와 청산 순서를 확인하세요.
              </p>
            </div>
          )}
          <div className="callout">
            옵션은 유럽형·현금 정산입니다. 동일 기초자산·만기·권리의 매수 옵션은 매도 옵션 한 계약의
            증거금에 한 번만 상계됩니다.
          </div>
        </Panel>
      </div>
    </>
  )
}
export function Campaigns({ desk, goMarket }) {
  const [next, setNext] = useState(null),
    current = scenarioById(desk.account.scenario)
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">LEARN BY DOING</span>
        <h2>
          여섯 번의 시장.
          <br />
          여섯 가지 투자 감각.
        </h2>
        <p>가상의 자본, 실제로 고민할 만한 선택. 목표 수익률과 위험 관리 과제를 함께 달성하세요.</p>
      </div>
      <Panel
        title={current.title}
        eyebrow={desk.account.status === 'active' ? 'CURRENT MISSION' : 'MISSION RESULT'}
        extra={
          <span className="tag">{desk.mode === 'practice' ? '연습 캠페인' : '공개 시즌'}</span>
        }
      >
        <div className="goals">
          {desk.goals.map((g) => (
            <div key={g.id} className={g.complete ? 'goal complete' : 'goal'}>
              <span className="goal-check">{g.complete ? '✓' : '○'}</span>
              <div>
                <strong>{g.title}</strong>
                <small>
                  {desk.account.status === 'completed'
                    ? g.complete
                      ? '달성'
                      : '미달성'
                    : g.complete
                      ? '현재 달성 · 종료까지 유지'
                      : '진행 중'}
                </small>
              </div>
            </div>
          ))}
        </div>
        <div className="mission-progress">
          <span
            style={{
              width: `${Math.min(100, ((desk.account.tick - desk.account.startedTick) / Math.max(1, desk.account.endTick - desk.account.startedTick)) * 100)}%`,
            }}
          />
        </div>
        <p className="fine-print">
          {((desk.account.tick - desk.account.startedTick) / 390).toFixed(1)} /{' '}
          {((desk.account.endTick - desk.account.startedTick) / 390).toFixed(0)}거래일 · 완주 시
          달성한 목표 수만큼 메달을 획득합니다.
        </p>
      </Panel>
      <div className="campaign-grid">
        {SCENARIOS.map((s, i) => (
          <article className={`campaign-card campaign-${s.id}`} key={s.id}>
            <div className="campaign-top">
              <span>CAMPAIGN {String(i + 1).padStart(2, '0')}</span>
              <Icon name={['portfolio', 'strategy', 'market', 'shield', 'campaign'][i]} size={38} />
            </div>
            <h3>{s.title}</h3>
            <p>{s.subtitle}</p>
            <div className="chips">
              {s.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="campaign-target">
              <span>
                수익률 목표 <b>{pct(s.target)}</b>
              </span>
              <span>
                낙폭 한도 <b>{s.drawdownLimit * 100}%</b>
              </span>
            </div>
            <button className="secondary full" onClick={() => setNext(s)}>
              캠페인 시작 <Icon name="arrow" size={16} />
            </button>
          </article>
        ))}
      </div>
      {next && (
        <Modal title={`${next.title} 시작`} onClose={() => setNext(null)}>
          <p>
            현재 연습은 결과 요약으로 남기고 새 계좌로 시작합니다. 보유 포지션을 다시 열려면 계정
            화면에서 현재 연습 파일을 먼저 내려받으세요.
          </p>
          <div className="button-row">
            <button className="secondary" onClick={() => setNext(null)}>
              돌아가기
            </button>
            <button
              className="primary"
              disabled={desk.busy}
              onClick={async () => {
                await desk.startScenario(next.id)
                setNext(null)
                goMarket()
              }}
            >
              새 연습 시작
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
export function Journal({ desk }) {
  const { account: a, summary: v, returns } = desk
  const points = [...a.equityHistory]
  if (points.at(-1)?.tick !== a.tick)
    points.push({
      tick: a.tick,
      equity: v.equity,
      benchmark: points.at(-1)?.benchmark || a.initialCapital,
    })
  return (
    <>
      <Panel title="자산의 궤적" eyebrow="PERFORMANCE">
        <div className="stat-grid">
          {[
            ['day', '최근 1거래일'],
            ['week', '최근 5거래일'],
            ['month', '최근 20거래일'],
            ['season', '참가 이후'],
          ].map(([k, label]) => (
            <Stat key={k} label={label} value={pct(returns[k])} className={tone(returns[k])} />
          ))}
        </div>
        <LineChart
          series={[
            {
              name: '내 순자산',
              color: '#b9ef83',
              values: points.map((p) => ({ x: p.tick, y: p.equity })),
            },
            {
              name: '코어 200 · 일별 기준',
              color: '#8291ab',
              values: a.equityHistory.map((p) => ({ x: p.tick, y: p.benchmark })),
            },
          ]}
          label="내 순자산과 코어 200 기준 자산의 일별 추이"
        />
        <p className="fine-print">
          수익률은 비용을 반영한 순자산 기준입니다. 기간 시작 이전의 최근 일별 평가액을 기준으로
          비교하며, 참가 기간이 짧으면 집계 전으로 표시합니다.
        </p>
      </Panel>
      <Panel title={`체결 기록 · 최근 ${a.fills.length}건`} eyebrow="TRADE JOURNAL">
        {a.fills.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>시각</th>
                  <th>상품</th>
                  <th>방향 / 사유</th>
                  <th>수량</th>
                  <th>체결가</th>
                  <th>수수료</th>
                  <th>실현 손익</th>
                </tr>
              </thead>
              <tbody>
                {a.fills.map((f) => (
                  <tr key={f.id}>
                    <td>{tickLabel(f.tick)}</td>
                    <td>{instrument(f.instrumentId).symbol}</td>
                    <td>
                      {f.side === 'buy' ? '매수' : '매도'}
                      <small>{f.reason}</small>
                    </td>
                    <td>{f.quantity}</td>
                    <td>{won(f.price)}</td>
                    <td>{won(f.fee)}</td>
                    <td className={tone(f.realized)}>{won(f.realized)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="아직 체결된 거래가 없습니다">
            첫 거래부터 수수료와 손익을 함께 기록합니다.
          </Empty>
        )}
      </Panel>
      {desk.practice.history.length > 0 && (
        <Panel title="이전 연습 결과" eyebrow="YOUR PROGRESS">
          <div className="history-grid">
            {desk.practice.history.map((h, i) => (
              <div key={i}>
                <strong>{SCENARIOS.find((s) => s.id === h.scenario)?.title || '연습'}</strong>
                <span className={tone(h.returnRate)}>{pct(h.returnRate)}</span>
                <small>{h.completed ? `완주 · 메달 ${h.medals}/3` : '중도 종료'}</small>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  )
}
