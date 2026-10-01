import React, { useState, useEffect, useRef, useMemo } from 'react'
import OrderBook from './OrderBook'
import { formatPercent } from '../utils'
import TechnicalChart from './TechnicalChart'
import { aggregateObservations, formatChartPrice } from '../utils/chart-observations'
import './StockModal.css'

export default function StockModal({ stock, onClose, currentPrice, observations = [], onOpenOrder, portfolio, shortPositions, canShortSell }) {
    const [category, setCategory] = useState('ticks')
    const [subOption, setSubOption] = useState(1)
    const [chartMode, setChartMode] = useState('candle')
    const [chartWidth, setChartWidth] = useState(700)
    const chartContainerRef = useRef(null), dialogRef = useRef(null)
    useEffect(() => {
        const previous = document.activeElement
        dialogRef.current?.querySelector('.close-btn')?.focus()
        return () => previous?.focus?.()
    }, [])
    useEffect(() => {
        const node = chartContainerRef.current
        const resize = () => { const width = node?.getBoundingClientRect().width; if (width > 0) setChartWidth(Math.max(240, width - 16)) }
        resize()
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
        if (node) observer?.observe(node)
        window.addEventListener('resize', resize)
        return () => { observer?.disconnect(); window.removeEventListener('resize', resize) }
    }, [])
    const handleDialogKey = event => {
        if (event.key === 'Escape') { event.stopPropagation(); onClose(); return }
        if (event.key !== 'Tab') return
        const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled),select,[tabindex="0"]')].filter(node => node.getClientRects().length)
        const first = focusable[0], last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    const candleData = useMemo(() => aggregateObservations(observations, { kind: category, size: subOption, maxCandles: Infinity }), [observations, category, subOption])
    const fundamentals = stock.fundamentals || {}
    const fundamentalValue = (value, unit = '') => Number.isFinite(value) ? `${formatChartPrice(value)}${unit}` : '—'
    const startPrice = Number.isFinite(stock.dailyOpen) ? stock.dailyOpen : currentPrice
    const change = currentPrice - startPrice, changeRate = startPrice ? change / startPrice * 100 : 0, isUp = change >= 0
    const holdingQty = portfolio?.[stock.id]?.quantity || 0
    const shortQty = shortPositions?.[stock.id]?.quantity || 0

    return (
        <div className="chart-modal-overlay" onClick={onClose} data-testid="chart-modal-overlay">
            <div className="chart-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="stock-chart-title" onClick={e => e.stopPropagation()} onKeyDown={handleDialogKey} data-testid="chart-modal">

                {/* Header */}
                <div className="chart-modal-header">
                    <div className="chart-stock-info">
                        <div className="chart-stock-icon" style={{ background: stock.color }}>
                            {stock.code?.slice(0, 2)}
                        </div>
                        <div>
                            <h2 id="stock-chart-title">{stock.name}</h2>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{stock.code} · {stock.sector}</span>
                        </div>
                        <div style={{ marginLeft: '20px' }}>
                            <div className={`chart-price ${isUp ? 'text-profit' : 'text-loss'}`}>
                                {formatChartPrice(currentPrice)}원
                            </div>
                            <div style={{ fontSize: '14px', color: isUp ? 'var(--color-profit)' : 'var(--color-loss)' }}>
                                당일 시가 대비 {formatChartPrice(change)}원 ({formatPercent(changeRate)})
                            </div>
                        </div>
                    </div>

                    <button className="close-btn" aria-label="차트 닫기" onClick={onClose} data-testid="chart-modal-close">&times;</button>
                </div>

                <div className="timeframe-selection" aria-label="관찰 기록 집계">
                    <div className="timeframe-categories">
                        <button className={`category-btn ${category === 'ticks' ? 'active' : ''}`} aria-pressed={category === 'ticks'} onClick={() => { setCategory('ticks'); setSubOption(1) }}>관찰 횟수</button>
                        <button className={`category-btn ${category === 'days' ? 'active' : ''}`} aria-pressed={category === 'days'} onClick={() => { setCategory('days'); setSubOption(1) }}>게임일</button>
                    </div>
                    <div className="timeframe-suboptions">{(category === 'ticks' ? [1, 5, 15, 60] : [1, 3, 5]).map(size =>
                        <button key={size} className={`suboption-btn ${subOption === size ? 'active' : ''}`} aria-pressed={subOption === size} onClick={() => setSubOption(size)}>{size}{category === 'ticks' ? '회' : '일'}</button>)}</div>
                    <div className="chart-mode-toggle">
                        <button className={`mode-btn ${chartMode === 'candle' ? 'active' : ''}`} aria-pressed={chartMode === 'candle'} onClick={() => setChartMode('candle')}>캔들</button>
                        <button className={`mode-btn ${chartMode === 'technical' ? 'active' : ''}`} aria-pressed={chartMode === 'technical'} onClick={() => setChartMode('technical')}>보조지표</button>
                    </div>
                </div>
                <p className="chart-history-scope" data-testid="chart-history-scope">이번 실행에서 관찰한 가격 {observations.length.toLocaleString()}개 · 실제 거래량이 아닌 관찰 횟수입니다. 게임 1일은 실제 300초이며 게임 시각은 10분 단위로 표시됩니다. 기록이 없는 구간은 만들지 않습니다.</p>

                {/* Main Content */}
                <div className="chart-modal-content">

                    <div className="chart-panel">
                        <div className="chart-area" ref={chartContainerRef}>
                            <TechnicalChart key={`${stock.id}:${category}:${subOption}`} candleData={candleData} currentPrice={currentPrice} width={chartWidth} showIndicatorPanel={chartMode === 'technical'} />
                        </div>

                        <div className="stock-fundamentals-grid">
                            <FundItem label="시가총액 설정값" value={fundamentalValue(fundamentals.marketCap)} />
                            <FundItem label="PER" value={fundamentalValue(fundamentals.pe, '배')} />
                            <FundItem label="EPS" value={fundamentalValue(fundamentals.eps)} />
                            <FundItem label="배당률" value={fundamentalValue(fundamentals.yield ?? fundamentals.dividendYield, '%')} />
                            <FundItem label="매출 설정값" value={fundamentalValue(fundamentals.revenue)} />
                            <FundItem label="이익 설정값" value={fundamentalValue(fundamentals.profit)} />
                            <FundItem label="부채비율" value={fundamentalValue(fundamentals.debtRatio, '%')} />
                            <FundItem label="변동성" value={fundamentalValue(stock.volatility, '%')} />
                            <p className="fundamentals-note">기업 기본값은 게임 설정 자료입니다. 금액 단위가 없는 항목은 설정값으로 표시하며, 제공되지 않은 값은 —로 표시합니다.</p>
                        </div>
                    </div>

                    <div className="order-panel">
                        <OrderBook stock={stock} currentPrice={currentPrice} />
                        <div className="modal-trade-actions">
                            <button className="modal-buy-btn" onClick={() => onOpenOrder && onOpenOrder(stock, 'buy')}>
                                매수
                            </button>
                            <button
                                className="modal-sell-btn"
                                onClick={() => onOpenOrder && onOpenOrder(stock, 'sell')}
                                disabled={holdingQty === 0}
                            >
                                매도
                            </button>
                            {canShortSell && (
                                <button className="modal-sell-btn" onClick={() => onOpenOrder && onOpenOrder(stock, 'short')}>
                                    공매도
                                </button>
                            )}
                            {shortQty > 0 && (
                                <button className="modal-buy-btn" onClick={() => onOpenOrder && onOpenOrder(stock, 'cover')}>
                                    청산
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function FundItem({ label, value }) {
    return (
        <div className="fund-item">
            <span className="fund-label">{label}</span>
            <span className="fund-value">{value}</span>
        </div>
    )
}
