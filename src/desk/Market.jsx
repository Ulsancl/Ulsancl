import { useEffect, useMemo, useState } from 'react'
import { INSTRUMENTS, instrument, candles, quote, previewOrder, newsAt, optionValue } from './core'
import { api } from './client'
import { Panel, CandleChart, won, pct, tone, kinds, tickLabel } from './components'
export default function Market({ desk, selected, setSelected }) {
  const { account, market, mode, prices, summary, command, busy } = desk
  const [filter, setFilter] = useState('all'),
    [search, setSearch] = useState(''),
    [interval, setInterval] = useState(5),
    [remoteChart, setRemoteChart] = useState(null),
    [chartError, setChartError] = useState('')
  const [side, setSide] = useState('buy'),
    [type, setType] = useState('market'),
    [quantity, setQuantity] = useState('1'),
    [price, setPrice] = useState(''),
    [reduceOnly, setReduceOnly] = useState(false)
  const asset = instrument(selected),
    current = prices[selected],
    previous =
      mode === 'practice'
        ? quote(selected, { ...market, tick: Math.max(0, account.tick - 390) }).price
        : null
  const greeks =
    asset.kind === 'option'
      ? optionValue(
          prices[asset.underlying],
          asset.strike,
          Math.max(0, asset.expiry - account.tick) / (390 * 252),
          instrument(asset.underlying).volatility,
          asset.right,
          0.03,
          instrument(asset.underlying).dividend
        )
      : null
  const list = INSTRUMENTS.filter(
    (a) =>
      (filter === 'all'
        ? !['option', 'future'].includes(a.kind)
        : filter === 'derivatives'
          ? ['option', 'future'].includes(a.kind)
          : a.kind === filter) &&
      `${a.name} ${a.symbol}`.toLowerCase().includes(search.toLowerCase())
  )
  const localChart = useMemo(
    () =>
      mode === 'practice'
        ? candles(
            selected,
            { seed: market.seed, scenario: market.scenario, tick: account.tick },
            interval
          )
        : [],
    [mode, selected, market.seed, market.scenario, account.tick, interval]
  )
  useEffect(() => {
    if (mode !== 'online') return
    let active = true
    setChartError('')
    setRemoteChart(null)
    api({ op: 'chart', instrumentId: selected, interval })
      .then((r) => {
        if (active) setRemoteChart(r.candles)
      })
      .catch((e) => {
        if (active) setChartError(e.message)
      })
    return () => {
      active = false
    }
  }, [mode, selected, interval, account.tick])
  const order = {
    instrumentId: selected,
    side,
    type,
    quantity: Number(quantity),
    reduceOnly,
    ...(type !== 'market' ? { price: Number(price) } : {}),
  }
  let preview
  try {
    preview =
      mode === 'practice'
        ? previewOrder(account, market, order)
        : {
            price: current,
            notional: current * Number(quantity) * asset.multiplier,
            fee: Math.max(
              1,
              Math.ceil((current * Number(quantity) * asset.multiplier * asset.feeBps) / 10000)
            ),
          }
  } catch {
    preview = null
  }
  const expired = asset.expiry && account.tick >= asset.expiry
  const news = mode === 'practice' ? newsAt(market) : desk.session?.market.news || []
  return (
    <>
      <label className="mobile-instrument">
        거래 상품
        <select
          aria-label="거래 상품"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value)
            setPrice(String(prices[e.target.value]))
            setReduceOnly(false)
          }}
        >
          {INSTRUMENTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.symbol} · {a.name}
            </option>
          ))}
        </select>
      </label>
      <div className="terminal-grid">
        <Panel title="마켓 워치" eyebrow="EXPLORE" className="watchlist">
          <label className="search">
            <span>상품 검색</span>
            <input
              aria-label="상품 검색"
              placeholder="상품명 또는 심볼"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="chips">
            {[
              ['all', '현물'],
              ['derivatives', '파생상품'],
            ].map(([v, l]) => (
              <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>
                {l}
              </button>
            ))}
          </div>
          <div className="watch-rows">
            {list.map((a) => (
              <button
                key={a.id}
                className={`watch-row ${a.id === selected ? 'selected' : ''}`}
                onClick={() => {
                  setSelected(a.id)
                  setPrice(String(prices[a.id]))
                  setReduceOnly(false)
                }}
              >
                <span className="asset-avatar" style={{ '--asset-color': a.color }}>
                  {a.symbol.slice(0, 1)}
                </span>
                <span>
                  <strong>{a.symbol}</strong>
                  <small>{a.name}</small>
                </span>
                <span className="watch-price">
                  <strong>{won(prices[a.id])}</strong>
                  <small>
                    {a.expiry && account.tick >= a.expiry ? '만기 종료' : kinds[a.kind]}
                  </small>
                </span>
              </button>
            ))}
            {!list.length && <p className="muted pad">검색 결과가 없습니다.</p>}
          </div>
          <div className="watch-foot">
            <span className="status-dot" /> 29개 상품 · 모의 시세
          </div>
        </Panel>
        <div className="market-center">
          <Panel
            title={asset.name}
            eyebrow={`${asset.symbol} / ${kinds[asset.kind]}`}
            extra={
              <span className="tag">
                {asset.unit} · 승수 {asset.multiplier}
              </span>
            }
          >
            <div className="quote-line">
              <strong>
                {won(current)}
                <small> KRW</small>
              </strong>
              {previous > 0 && (
                <span className={tone(current / previous - 1)}>
                  {pct(current / previous - 1)} <small>1거래일 전 대비</small>
                </span>
              )}
            </div>
            <div className="chart-toolbar">
              <span>PRICE ACTION</span>
              <div className="segmented">
                {[
                  [1, '1분'],
                  [5, '5분'],
                  [30, '30분'],
                  [390, '일'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={interval === v ? 'active' : ''}
                    onClick={() => setInterval(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {chartError ? (
              <p role="alert" className="notice error">
                {chartError}
              </p>
            ) : (
              <CandleChart
                data={mode === 'practice' ? localChart : remoteChart}
                label={asset.name}
              />
            )}
            <div className="instrument-details">
              <span>
                수수료 <b>{asset.feeBps / 100}%</b>
              </span>
              <span>
                기본 스프레드 <b>{asset.spreadBps / 100}%</b>
              </span>
              {asset.expiry && (
                <span>
                  잔존 만기 <b>{Math.max(0, (asset.expiry - account.tick) / 390).toFixed(1)}일</b>
                </span>
              )}
            </div>
            {greeks && (
              <div className="instrument-details" aria-label="옵션 민감도">
                <span>
                  델타 <b>{greeks.delta.toFixed(3)}</b>
                </span>
                <span>
                  감마 <b>{greeks.gamma.toFixed(5)}</b>
                </span>
                <span>
                  세타 · 1거래일 <b>{greeks.theta.toFixed(1)}</b>
                </span>
                <span>
                  베가 · 변동성 1%p <b>{greeks.vega.toFixed(1)}</b>
                </span>
                <small>단위당 모형값 · 계약은 ×{asset.multiplier}</small>
              </div>
            )}
            <p className="instrument-description">{asset.description}</p>
          </Panel>
          <Panel title="시장 브리핑" eyebrow="THE CONTEXT">
            <div className="briefing">
              <span className="briefing-number">01</span>
              <div>
                <span className="tag">시장 구조</span>
                <h3>
                  {asset.kind === 'option'
                    ? '방향만큼 중요한 시간과 변동성'
                    : asset.kind === 'future'
                      ? '증거금은 최대 손실이 아닙니다'
                      : '가격보다 먼저, 나만의 투자 가설'}
                </h3>
                <p>
                  {asset.kind === 'option'
                    ? '프리미엄은 만기까지의 시간과 변동성을 반영합니다. 동일 만기의 옵션을 조합해 손익 범위를 설계해 보세요.'
                    : asset.kind === 'future'
                      ? '작은 증거금으로 큰 명목 금액에 노출됩니다. 평가 손실과 유지 증거금을 함께 확인하세요.'
                      : '진입 이유와 청산 기준을 정한 뒤 거래하세요. 장기 보유의 배당, 단기 매매의 거래 비용이 모두 계좌에 반영됩니다.'}
                </p>
              </div>
            </div>
            {news.map((n) => (
              <article className="news-item" key={n.tick}>
                <small>{tickLabel(n.tick)}</small>
                <strong>{n.title}</strong>
                <p>{n.detail}</p>
              </article>
            ))}
          </Panel>
        </div>
        <Panel title="주문하기" eyebrow="EXECUTION" className="ticket">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await command('order', { order })
            }}
          >
            <div className="side-switch">
              <button
                type="button"
                className={side === 'buy' ? 'buy active' : ''}
                onClick={() => setSide('buy')}
              >
                매수 / 롱
              </button>
              <button
                type="button"
                className={side === 'sell' ? 'sell active' : ''}
                onClick={() => setSide('sell')}
              >
                매도 / 숏
              </button>
            </div>
            <label>
              주문 유형
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="market">시장가 · 즉시 체결</option>
                <option value="limit">지정가 · 당일 유효</option>
                <option value="stop">스톱 · 시장가 전환</option>
              </select>
            </label>
            <label>
              수량 <span>{asset.unit}</span>
              <input
                aria-label="주문 수량"
                type="number"
                min="1"
                max="1000000"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            {type !== 'market' && (
              <label>
                {type === 'limit' ? '지정 가격' : '발동 가격'}
                <input
                  aria-label="주문 가격"
                  type="number"
                  min="1"
                  max="10000000000"
                  step="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
              />
              청산 전용 · 포지션 축소만
            </label>
            <dl className="order-estimate">
              <div>
                <dt>명목 거래액</dt>
                <dd>{won(preview?.notional)}원</dd>
              </div>
              <div>
                <dt>예상 수수료</dt>
                <dd>{won(preview?.fee)}원</dd>
              </div>
              <div>
                <dt>주문 가능 금액</dt>
                <dd>{won(summary.available)}원</dd>
              </div>
            </dl>
            <button
              className={`primary full ${side === 'sell' ? 'danger' : ''}`}
              disabled={busy || expired || account.status !== 'active'}
            >
              {desk.pendingRequest
                ? '이전 요청 처리 여부 확인'
                : expired
                  ? '만기가 지난 상품'
                  : `${side === 'buy' ? '매수' : '매도'} 주문`}
            </button>
            <p className="fine-print">
              {asset.kind === 'future'
                ? '개시 증거금 20% · 유지 12%. 명목 거래액은 매수 비용이 아닙니다.'
                : '보유 수량보다 많이 매도하면 공매도 포지션이 생성됩니다.'}{' '}
              체결 가격에는 스프레드·시장 충격이 반영됩니다. 시장가는 유동성 한도만 체결하고 잔량은
              취소합니다.
            </p>
          </form>
          <div className="ticket-note">
            <span className="eyebrow">YOUR EDGE</span>
            <p>
              수익률은 결과.
              <br />
              <strong>위험 관리는 전략.</strong>
            </p>
          </div>
        </Panel>
      </div>
      <Panel title={`미체결 주문 ${account.orders.length}`} eyebrow="OPEN ORDERS">
        {account.orders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>상품</th>
                  <th>유형 / 방향</th>
                  <th>잔량</th>
                  <th>가격</th>
                  <th>만료</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {account.orders.map((o) => (
                  <tr key={o.id}>
                    <td>{instrument(o.instrumentId).symbol}</td>
                    <td>
                      {o.type === 'limit' ? '지정가' : o.triggered ? '스톱 발동' : '스톱'} /{' '}
                      {o.side === 'buy' ? '매수' : '매도'}
                    </td>
                    <td>{o.remaining}</td>
                    <td>{won(o.price)}</td>
                    <td>{tickLabel(o.expiresTick)}</td>
                    <td>
                      <button
                        disabled={busy}
                        className="text-button"
                        onClick={() => command('cancel', { orderId: o.id })}
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-inline">
            대기 중인 주문이 없습니다. 지정가·스톱 주문은 당일 시장 종료까지 유효합니다.
          </p>
        )}
      </Panel>
    </>
  )
}
