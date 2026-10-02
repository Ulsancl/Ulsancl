import React, { useMemo, useState } from 'react'
import { generateSignals } from '../game/TechnicalAnalysis'
import { alignedIndicators, priceDomain, formatChartPrice, observationTime } from '../utils/chart-observations'
import './TechnicalChart.css'

const COLORS = { sma5: '#f2ca65', sma20: '#63c5f5', sma60: '#ef9ccb', bbMiddle: '#b3a0f4', macd: '#63c5f5', signal: '#f5a383' }
const fields = [['open','시가'],['high','고가'],['low','저가'],['close','종가']]

export default function TechnicalChart({ candleData = [], currentPrice, width = 700, showIndicatorPanel = true }) {
    const [shown, setShown] = useState({ sma5: true, sma20: true, sma60: false, bb: false })
    const [selectedId, setSelectedId] = useState(null), [hoverId, setHoverId] = useState(null)
    const [endId, setEndId] = useState(null), [windowSize, setWindowSize] = useState(60)
    const indicators = useMemo(() => alignedIndicators(candleData), [candleData])
    const signals = useMemo(() => generateSignals(candleData.map(c => c.close)), [candleData])
    const endIndex = endId ? candleData.findIndex(c => c.id === endId) : candleData.length - 1
    const end = endIndex >= 0 ? endIndex + 1 : candleData.length, start = Math.max(0, end - windowSize)
    const visible = candleData.slice(start, end), n = visible.length
    const selected = visible.find(c => c.id === hoverId) || candleData.find(c => c.id === selectedId) || visible.at(-1)
    const selectedGlobal = selected ? candleData.findIndex(c => c.id === selected.id) : -1
    const expired = selectedId && !candleData.some(c => c.id === selectedId)
    const w = Math.max(240, width), left = 12, right = w < 400 ? 84 : 102, plotWidth = w - left - right
    const x = i => left + (i + .5) * plotWidth / Math.max(n, 1)
    const priceTop = 24, priceBottom = 240, rsiTop = 302, rsiBottom = 372, macdTop = 421, macdBottom = 491
    const height = showIndicatorPanel ? 529 : 286
    const live = end === candleData.length && !endId
    const values = visible.flatMap(c => [c.high, c.low])
    if (live && Number.isFinite(currentPrice)) values.push(currentPrice)
    if (showIndicatorPanel) for (const key of ['sma5','sma20','sma60','bbUpper','bbLower']) {
        if (shown[key] || (shown.bb && key.startsWith('bb'))) values.push(...indicators[key].slice(start,end).filter(Number.isFinite))
    }
    const domain = priceDomain(values), y = value => priceTop + (domain.max - value) / (domain.max - domain.min) * (priceBottom - priceTop)
    const rsiY = value => rsiBottom - value / 100 * (rsiBottom - rsiTop)
    const macdLimit = Math.max(1e-10, ...['macd','signal','histogram'].flatMap(key => indicators[key].slice(start,end).filter(Number.isFinite).map(Math.abs))) * 1.15
    const macdY = value => (macdTop + macdBottom) / 2 - value / macdLimit * (macdBottom - macdTop) / 2
    const line = (values, toY) => {
        let moving = true
        return values.slice(start,end).map((value,i) => {
            if (!Number.isFinite(value)) { moving = true; return '' }
            const command = moving ? 'M' : 'L'; moving = false; return `${command}${x(i)},${toY(value)}`
        }).join(' ')
    }
    const curve = (key, toY, color) => {
        const items = indicators[key].slice(start,end), valid = items.map((v,i) => Number.isFinite(v) ? i : -1).filter(i => i >= 0)
        return <g key={key} data-indicator={key}><path data-testid={`indicator-${key}`} d={line(indicators[key],toY)} fill="none" stroke={color} strokeWidth="1.5" />{valid.length === 1 && <circle cx={x(valid[0])} cy={toY(items[valid[0]])} r="2.5" fill={color} />}</g>
    }
    const indexAt = event => {
        const rect = event.currentTarget.getBoundingClientRect(), px = (event.clientX - rect.left) * w / Math.max(1,rect.width)
        return Math.max(0,Math.min(n - 1,Math.floor((px - left) / plotWidth * n)))
    }
    const pin = index => {
        const candle = candleData[Math.max(0,Math.min(candleData.length - 1,index))]; if (!candle) return
        setSelectedId(candle.id); setHoverId(null)
        const targetEnd = index < start ? Math.min(candleData.length,index + windowSize) : index >= end ? index + 1 : end
        setEndId(candleData[Math.max(0,targetEnd - 1)]?.id || null)
    }
    const keyboard = event => {
        if (!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key)) return
        if (event.key === 'Escape' && !endId && !selectedId && !hoverId) return
        event.preventDefault(); event.stopPropagation()
        if (event.key === 'Escape') { setSelectedId(null); setEndId(null); setHoverId(null); return }
        const index = selectedGlobal < 0 ? end - 1 : selectedGlobal
        pin(event.key === 'Home' ? 0 : event.key === 'End' ? candleData.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : 1))
    }
    if (!n) return <div className="chart-empty" role="status">관찰 기록이 아직 없습니다. 시뮬레이션에서 실제로 관찰한 가격만 표시합니다.</div>
    const ticks = [...new Set([0,Math.floor((n - 1)/2),n - 1])]
    const selectedLocal = selectedGlobal - start
    return <section className="technical-chart-container" aria-label="관찰 가격 차트">
        <div className="chart-toolbar">
            <div className="chart-window-actions"><label>표시 봉 <select value={windowSize} onChange={e => setWindowSize(Number(e.target.value))}><option value="30">30</option><option value="60">60</option><option value="120">120</option></select></label>
                <button onClick={() => { setSelectedId(null); setHoverId(null); setEndId(null) }} aria-pressed={!endId}>최신 따라가기</button></div>
            <span>{endId ? '선택 구간 고정' : '최신 관찰 추적'} · {start + 1}–{end} / {candleData.length}봉</span>
        </div>
        {showIndicatorPanel && <div className="indicator-toggles" aria-label="가격 보조지표">{[['sma5','MA 5'],['sma20','MA 20'],['sma60','MA 60'],['bb','볼린저 밴드']].map(([key,label]) => <button key={key} aria-pressed={shown[key]} onClick={() => setShown(previous => ({...previous,[key]:!previous[key]}))} style={{'--indicator-color':COLORS[key] || COLORS.bbMiddle}}>{label}</button>)}</div>}
        <div className="candle-readout" data-testid="candle-readout" data-candle-id={selected.id} data-first-sequence={selected.firstSequence} data-last-sequence={selected.lastSequence}>
            <div className="candle-time"><strong>{observationTime(selected)} → {observationTime(selected,true)}</strong><span>{selected.complete ? '집계 완료' : '진행 중'}{selected.partial ? ' · 일부 구간만 관찰' : ''} · 관찰 {selected.count}회</span></div>
            <dl>{fields.map(([key,label]) => <div key={key}><dt>{label}</dt><dd data-ohlc={key} data-value={selected[key]}>{formatChartPrice(selected[key])}</dd></div>)}</dl>
            {showIndicatorPanel && <p className="selected-indicators">RSI <output data-selected-indicator="rsi" data-value={indicators.rsi[selectedGlobal] ?? ''}>{formatChartPrice(indicators.rsi[selectedGlobal])}</output> · MACD <output data-selected-indicator="macd" data-value={indicators.macd[selectedGlobal] ?? ''}>{formatChartPrice(indicators.macd[selectedGlobal])}</output> · Signal <output data-selected-indicator="signal" data-value={indicators.signal[selectedGlobal] ?? ''}>{formatChartPrice(indicators.signal[selectedGlobal])}</output></p>}
        </div>
        {expired && <p role="status" className="chart-help">선택한 기록이 이번 실행의 보관 범위를 벗어났습니다.</p>}
        <svg className="technical-chart-svg" viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="group" aria-label="가격과 지표. 방향키로 봉 선택, Home과 End로 처음과 마지막, Escape로 최신 추적" tabIndex="0" onKeyDown={keyboard}
            onPointerMove={e => setHoverId(visible[indexAt(e)]?.id || null)} onPointerLeave={() => setHoverId(null)} onPointerDown={e => { e.currentTarget.focus(); pin(start + indexAt(e)) }}>
            <rect width={w} height={height} fill="transparent" />
            {Array.from({length:5},(_,i) => { const price = domain.min + (domain.max-domain.min)*i/4; return <g key={i}><line x1={left} x2={w-right} y1={y(price)} y2={y(price)} className="chart-grid"/><text x={w-right+6} y={y(price)+4} className="axis-label">{formatChartPrice(price,(domain.max-domain.min)/4)}</text></g> })}
            {showIndicatorPanel && shown.bb && <g data-testid="bollinger-band">{curve('bbUpper',y,'#8977c5')}{curve('bbLower',y,'#8977c5')}{curve('bbMiddle',y,COLORS.bbMiddle)}</g>}
            {visible.map((c,i) => { const up=c.close>=c.open,bodyHeight=Math.abs(y(c.open)-y(c.close)),bodyWidth=Math.max(.5,Math.min(11,plotWidth/n*.64));return <g key={c.id} className={up?'candle-up':'candle-down'} data-candle-id={c.id} data-first-sequence={c.firstSequence} data-last-sequence={c.lastSequence} data-open={c.open} data-high={c.high} data-low={c.low} data-close={c.close} data-x={x(i)}>
                <title>{observationTime(c)} 시가 {formatChartPrice(c.open)}, 고가 {formatChartPrice(c.high)}, 저가 {formatChartPrice(c.low)}, 종가 {formatChartPrice(c.close)}</title>
                <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke="currentColor" />
                {bodyHeight<.8 ? <line x1={x(i)-bodyWidth/2} x2={x(i)+bodyWidth/2} y1={y(c.close)} y2={y(c.close)} stroke="currentColor" strokeWidth="1.5"/> : <rect x={x(i)-bodyWidth/2} y={Math.min(y(c.open),y(c.close))} width={bodyWidth} height={bodyHeight} fill="currentColor"/>}
            </g>})}
            {showIndicatorPanel && ['sma5','sma20','sma60'].filter(key=>shown[key]).map(key=>curve(key,y,COLORS[key]))}
            {live && Number.isFinite(currentPrice) && <g data-testid="current-price-marker" data-value={currentPrice}><line x1={left} x2={w-right} y1={y(currentPrice)} y2={y(currentPrice)} stroke="#b3c8d9" strokeDasharray="4 4"/><rect x={w-right} y={y(currentPrice)-10} width={right} height="20" fill="#284452"/><text x={w-right+5} y={y(currentPrice)+4} className="current-price-label">{formatChartPrice(currentPrice)}</text></g>}
            {ticks.map(i=><text key={i} x={x(i)} y={267} textAnchor={i===0?'start':i===n-1?'end':'middle'} className="axis-label">{observationTime(visible[i])}</text>)}
            {showIndicatorPanel && <>
                <text x={left} y={290} className="pane-label">RSI 14 · {candleData.length<15?'15봉 필요':'동일한 봉 시각'}</text>
                {[30,50,70].map(value=><g key={value}><line x1={left} x2={w-right} y1={rsiY(value)} y2={rsiY(value)} className="chart-grid"/><text x={w-right+6} y={rsiY(value)+4} className="axis-label">{value}</text></g>)}
                {curve('rsi',rsiY,'#baa5ef')}
                <text x={left} y={407} className="pane-label">MACD 12 / 26 / 9 · {candleData.length<34?'34봉 필요':'동일한 봉 시각'}</text>
                <line x1={left} x2={w-right} y1={macdY(0)} y2={macdY(0)} className="chart-grid"/>
                <text x={w-right+6} y={macdY(0)+4} className="axis-label">0</text>
                {indicators.histogram.slice(start,end).map((value,i)=>Number.isFinite(value)&&<rect key={visible[i].id} data-indicator="histogram" data-x={x(i)} data-value={value} x={x(i)-Math.max(.5,plotWidth/n*.5)/2} y={Math.min(macdY(0),macdY(value))} width={Math.max(.5,plotWidth/n*.5)} height={Math.max(.5,Math.abs(macdY(value)-macdY(0)))} fill={value>=0?'#397f75':'#ac6264'}/>)}
                {curve('macd',macdY,COLORS.macd)}{curve('signal',macdY,COLORS.signal)}
                {ticks.map(i=><text key={i} x={x(i)} y={519} textAnchor={i===0?'start':i===n-1?'end':'middle'} className="axis-label">{observationTime(visible[i])}</text>)}
            </>}
            {selectedLocal>=0 && selectedLocal<n && <g data-testid="chart-crosshair" data-candle-id={selected.id}><line x1={x(selectedLocal)} x2={x(selectedLocal)} y1={priceTop} y2={showIndicatorPanel?macdBottom:priceBottom} stroke="#dfebf5" strokeDasharray="3 3" opacity=".65"/><circle cx={x(selectedLocal)} cy={y(selected.close)} r="3" fill="#dfebf5"/></g>}
        </svg>
        <p className="chart-help">클릭·터치로 구간 고정 · ← → 봉 이동 · Home / End · Escape 최신 추적. 시가·종가는 관찰한 첫 값과 마지막 값이며 실제 체결 데이터가 아닙니다.</p>
        {showIndicatorPanel && <div className="signal-panel"><strong>최신 관찰봉의 계산 조건</strong><span>{signals.length ? signals.map(signal=>signal.message).join(' · ') : candleData.length<30 ? '조건 비교에는 30봉 이상이 필요합니다.' : '현재 교차·경계 조건 없음'}</span><small>진행 중인 봉을 포함한 지표 설명입니다. 게임 가격에서 계산하며 실제 투자 결과를 보장하지 않습니다.</small></div>}
    </section>
}
