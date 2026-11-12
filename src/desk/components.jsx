import { useId } from 'react'
export const won = (n) =>
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n || 0)
export const pct = (n) => (n == null ? '집계 전' : `${n > 0 ? '+' : ''}${(n * 100).toFixed(2)}%`)
export const tone = (n) => (n > 0 ? 'positive' : n < 0 ? 'negative' : '')
export const tickLabel = (tick) =>
  `D${Math.floor(tick / 390) + 1} ${String(9 + Math.floor((tick % 390) / 60)).padStart(2, '0')}:${String((tick % 390) % 60).padStart(2, '0')}`
export const kinds = {
  stock: '주식',
  etf: 'ETF',
  bond: '채권',
  commodity: '원자재',
  crypto: '가상자산',
  fx: '외환',
  future: '선물',
  option: '옵션',
}
export function Icon({ name, size = 20 }) {
  const paths = {
    market: 'M3 17V9m6 11V4m6 12V7m6 11V2',
    portfolio: 'M4 7h16v13H4zM8 7V3h8v4M4 12h16M10 12v3h4v-3',
    strategy: 'M3 18l6-7 5 3 7-11M16 3h5v5',
    campaign: 'M6 3v18M6 4h13l-3 5 3 5H6',
    journal: 'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
    rank: 'M3 21v-8h6v8M9 21V4h6v17M15 21V9h6v12',
    account: 'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21v-3a8 8 0 0 1 16 0v3',
    shield: 'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 12l3 3 5-6',
    arrow: 'M4 12h16M14 6l6 6-6 6',
    close: 'M5 5l14 14M19 5L5 19',
    clock: 'M12 7v5l4 2M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0',
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.market} />
    </svg>
  )
}
export function Panel({ title, eyebrow, extra, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {extra}
      </div>
      {children}
    </section>
  )
}
export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-mark">↗</span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}
export function Stat({ label, value, sub, className = '' }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong className={className}>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  )
}
export function Modal({ title, children, onClose }) {
  const titleId = useId()
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          if (e.key === 'Tab') {
            const items = [
              ...e.currentTarget.querySelectorAll('button, input, select, textarea, a[href]'),
            ].filter((el) => !el.disabled)
            const first = items[0],
              last = items.at(-1)
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault()
              last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
        }}
      >
        <div className="panel-heading">
          <h2 id={titleId}>{title}</h2>
          <button autoFocus className="icon-button" aria-label="닫기" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
export function CandleChart({ data, label }) {
  const W = 720,
    H = 270,
    pad = 44
  if (!data?.length) return <div className="chart-loading">시세를 불러오고 있습니다.</div>
  const min = Math.min(...data.map((d) => d.low)),
    max = Math.max(...data.map((d) => d.high)),
    range = Math.max(max - min, max * 0.002)
  const y = (v) => H - 28 - ((v - min + range * 0.1) / (range * 1.2)) * (H - 50),
    step = (W - pad - 15) / Math.max(30, data.length),
    end = data.at(-1)
  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} 캔들 차트. 최저 ${won(min)}원, 최고 ${won(max)}원, 최근 ${won(end.close)}원.`}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const value = min + (range * i) / 4
          return (
            <g key={i}>
              <line x1="8" x2={W - pad} y1={y(value)} y2={y(value)} className="grid-line" />
              <text x={W - pad + 6} y={y(value) + 4} className="chart-text">
                {won(value)}
              </text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const x = 12 + i * step,
            color = d.close >= d.open ? '#69d3b0' : '#ed8793'
          return (
            <g key={d.tick}>
              <title>
                {tickLabel(d.tick)} 시가 {won(d.open)} 고가 {won(d.high)} 저가 {won(d.low)} 종가{' '}
                {won(d.close)}
              </title>
              <line x1={x} x2={x} y1={y(d.high)} y2={y(d.low)} stroke={color} />
              <rect
                x={x - Math.max(2, step * 0.28)}
                y={Math.min(y(d.open), y(d.close))}
                width={Math.max(4, step * 0.56)}
                height={Math.max(1.4, Math.abs(y(d.open) - y(d.close)))}
                fill={color}
              />
            </g>
          )
        })}
        <line
          x1="8"
          x2={W - pad}
          y1={y(end.close)}
          y2={y(end.close)}
          stroke="#b9ef83"
          strokeDasharray="3 5"
          opacity=".45"
        />
        <text x="8" y={H - 3} className="chart-text">
          {tickLabel(data[0].tick)}
        </text>
        <text x={W - pad} y={H - 3} textAnchor="end" className="chart-text">
          {tickLabel(end.tick)}
        </text>
      </svg>
      <figcaption>모의 시장 · 원화 기준 · 지난 시세만 표시</figcaption>
    </figure>
  )
}
export function LineChart({ series, label, zero = false }) {
  const all = series.flatMap((s) => s.values.map((v) => v.y)),
    max = Math.max(...all, zero ? 0 : -Infinity),
    min = Math.min(...all, zero ? 0 : Infinity),
    range = Math.max(1, max - min)
  const xs = series.flatMap((s) => s.values.map((v) => v.x)),
    xmin = Math.min(...xs),
    xmax = Math.max(...xs),
    x = (v) => 18 + ((v - xmin) / Math.max(1, xmax - xmin)) * 624,
    y = (v) => 160 - ((v - min) / range) * 135
  return (
    <figure className="line-chart">
      <svg viewBox="0 0 660 190" role="img" aria-label={label}>
        {[0, 0.5, 1].map((n) => (
          <line
            key={n}
            x1="18"
            x2="642"
            y1={25 + 135 * n}
            y2={25 + 135 * n}
            className="grid-line"
          />
        ))}
        {zero && (
          <line x1="18" x2="642" y1={y(0)} y2={y(0)} stroke="#788494" strokeDasharray="4 4" />
        )}
        {series.map((s) => (
          <path
            key={s.name}
            d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(v.x)},${y(v.y)}`).join(' ')}
            stroke={s.color}
            strokeWidth="2"
            fill="none"
          />
        ))}
        <text x="18" y="186" className="chart-text">
          {won(min)}
        </text>
        <text x="642" y="186" className="chart-text" textAnchor="end">
          최고 {won(max)}
        </text>
      </svg>
      <figcaption>
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
