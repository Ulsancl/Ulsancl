import React, { useState, useEffect, useRef, useMemo } from 'react'
import OrderBook from './OrderBook'
import { formatNumber, formatPercent, formatCompact } from './utils'
import TechnicalChart from './components/TechnicalChart'
import './StockModal.css'

// 순수 SVG 캔들스틱 차트 컴포넌트
function CandlestickChart({ data, width, height, currentPrice }) {
    if (!data || data.length === 0 || !width || !height) {
        return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>데이터 로딩중...</div>
    }

    const padding = { top: 20, right: 60, bottom: 30, left: 10 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const allHighs = data.map(d => d.high)
    const allLows = data.map(d => d.low)
    const dataMin = Math.min(...allLows)
    const dataMax = Math.max(...allHighs)
    const priceRange = dataMax - dataMin || 1
    const pricePadding = priceRange * 0.05

    const minPrice = dataMin - pricePadding
    const maxPrice = dataMax + pricePadding
    const adjustedRange = maxPrice - minPrice

    const priceToY = (price) => {
        return padding.top + chartHeight - ((price - minPrice) / adjustedRange) * chartHeight
    }

    const candleWidth = Math.max(Math.min(chartWidth / data.length * 0.7, 12), 3)
    const gap = chartWidth / data.length

    const yTicks = []
    const tickCount = 5
    for (let i = 0; i <= tickCount; i++) {
        const price = minPrice + (adjustedRange / tickCount) * i
        yTicks.push(price)
    }

    const gridLines = yTicks.map((price, i) => {
        const y = priceToY(price)
        return (
            <line
                key={`grid-${i}`}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="3 3"
            />
        )
    })

    // Y축 레이블 포맷 (정밀도 유지)
    const formatYLabel = (price) => {
        const rounded = Math.round(price)
        // 가격 범위에 따라 적절한 포맷 선택
        if (rounded >= 1000000) {
            return (rounded / 10000).toFixed(0) + '만'
        }
        return formatNumber(rounded)
    }

    const yLabels = yTicks.map((price, i) => {
        const y = priceToY(price)
        return (
            <text
                key={`label-${i}`}
                x={width - padding.right + 5}
                y={y + 4}
                fill="#888"
                fontSize="10"
                textAnchor="start"
            >
                {formatYLabel(price)}
            </text>
        )
    })

    const candles = data.map((candle, i) => {
        const x = padding.left + (i * gap) + gap / 2
        const isUp = candle.close >= candle.open
        const color = isUp ? '#26a69a' : '#ef5350'

        const yHigh = priceToY(candle.high)
        const yLow = priceToY(candle.low)
        const yOpen = priceToY(candle.open)
        const yClose = priceToY(candle.close)

        const bodyTop = Math.min(yOpen, yClose)
        const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1)

        return (
            <g key={i}>
                <line x1={x} y1={yHigh} x2={x} y2={Math.min(yOpen, yClose)} stroke={color} strokeWidth={1} />
                <line x1={x} y1={Math.max(yOpen, yClose)} x2={x} y2={yLow} stroke={color} strokeWidth={1} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} stroke={color} strokeWidth={1} />
            </g>
        )
    })

    const lastCandle = data[data.length - 1]
    const lastY = priceToY(currentPrice || lastCandle.close)
    const lastIsUp = (currentPrice || lastCandle.close) >= lastCandle.open

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <rect x={0} y={0} width={width} height={height} fill="transparent" />
            {gridLines}
            {yLabels}
            {candles}
            <line x1={padding.left} y1={lastY} x2={width - padding.right} y2={lastY} stroke={lastIsUp ? '#26a69a' : '#ef5350'} strokeWidth={1} strokeDasharray="5 3" />
            <rect x={width - padding.right} y={lastY - 10} width={55} height={20} fill={lastIsUp ? '#26a69a' : '#ef5350'} rx={3} />
            <text x={width - padding.right + 5} y={lastY + 4} fill="white" fontSize="11" fontWeight="bold">
                {formatCompact(currentPrice || lastCandle.close)}
            </text>
        </svg>
    )
}

// 시간프레임별 틱 수 (1틱 = 1초 기준)
const TIMEFRAME_TICKS = {
    'tick-1': 1,
    'tick-3': 3,
    'tick-5': 5,
    'tick-15': 15,
    'tick-30': 30,
    'tick-60': 60,
    'min-1': 60,
    'min-3': 180,
    'min-5': 300,
    'min-15': 900,
    'min-30': 1800,
    'min-60': 3600,
    'day-1': 86400,
    'day-3': 259200,
    'day-5': 432000,
    'week-1': 604800,
    'week-3': 1814400,
    'month-1': 2592000,
    'month-3': 7776000,
}

const TIMEFRAME_LABELS = {
    'tick-1': '1틱', 'tick-3': '3틱', 'tick-5': '5틱', 'tick-15': '15틱', 'tick-30': '30틱', 'tick-60': '60틱',
    'min-1': '1분', 'min-3': '3분', 'min-5': '5분', 'min-15': '15분', 'min-30': '30분', 'min-60': '60분',
    'day-1': '1일', 'day-3': '3일', 'day-5': '5일',
    'week-1': '1주', 'week-3': '3주',
    'month-1': '1월', 'month-3': '3월',
}

const CATEGORY_OPTIONS = {
    'tick': [1, 3, 5, 15, 30, 60],
    'min': [1, 3, 5, 15, 30, 60],
    'day': [1, 3, 5],
    'week': [1, 3],
    'month': [1, 3]
}

const CATEGORY_LABELS = {
    'tick': '틱',
    'min': '분',
    'day': '일',
    'week': '주',
    'month': '월'
}

// 기본 틱 데이터 생성 (일관된 가격 움직임)
function generateBaseTickData(currentPrice, tickCount, volatility, seed = 12345) {
    const ticks = []
    let price = currentPrice

    // 간단한 시드 기반 랜덤 (일관성 유지)
    const seededRandom = (i) => {
        const x = Math.sin(seed + i) * 10000
        return x - Math.floor(x)
    }

    // 현재 가격에서 과거로 역산
    for (let i = tickCount - 1; i >= 0; i--) {
        ticks.unshift({
            index: i,
            price: Math.round(price),
            time: Date.now() - (tickCount - i) * 1000
        })

        // 이전 가격 계산 (역방향)
        const change = price * volatility * (seededRandom(i) - 0.5)
        price = price - change
    }

    return ticks
}

// 틱 데이터를 캔들로 집계
function aggregateTicksToCandles(ticks, ticksPerCandle, maxCandles = 60) {
    if (!ticks || ticks.length === 0) return []

    const candles = []
    const totalCandles = Math.min(Math.ceil(ticks.length / ticksPerCandle), maxCandles)
    const startIndex = Math.max(0, ticks.length - totalCandles * ticksPerCandle)

    for (let i = 0; i < totalCandles; i++) {
        const candleStartIndex = startIndex + i * ticksPerCandle
        const candleEndIndex = Math.min(candleStartIndex + ticksPerCandle, ticks.length)
        const candleTicks = ticks.slice(candleStartIndex, candleEndIndex)

        if (candleTicks.length === 0) continue

        const prices = candleTicks.map(t => t.price)
        const open = candleTicks[0].price
        const close = candleTicks[candleTicks.length - 1].price
        const high = Math.max(...prices)
        const low = Math.min(...prices)

        candles.push({
            index: i,
            open,
            close,
            high,
            low,
            time: candleTicks[0].time
        })
    }

    return candles
}

export default function StockModal({ stock, onClose, currentPrice, tradeHistory, history, onOpenOrder }) {
    const [category, setCategory] = useState('min')
    const [subOption, setSubOption] = useState(1)
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
    const [chartMode, setChartMode] = useState('candle') // 'candle' | 'technical'
    const chartContainerRef = useRef(null)

    // 기본 틱 데이터 저장 (일관성 유지를 위해)
    const baseTickDataRef = useRef(null)
    const lastPriceRef = useRef(currentPrice)

    const timeframeKey = `${category}-${subOption}`
    const ticksPerCandle = TIMEFRAME_TICKS[timeframeKey] || 60

    // 차트 크기 감지
    useEffect(() => {
        const updateSize = () => {
            if (chartContainerRef.current) {
                const rect = chartContainerRef.current.getBoundingClientRect()
                setChartSize({ width: rect.width, height: rect.height })
            }
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        const timer = setTimeout(updateSize, 100)
        return () => {
            window.removeEventListener('resize', updateSize)
            clearTimeout(timer)
        }
    }, [])

    // 기본 틱 데이터 초기화 (주식별로 한 번만)
    useEffect(() => {
        const volatility = (stock.volatility || 2) / 100
        // 충분한 틱 데이터 생성 (약 3시간분 = 10800틱)
        const tickCount = 10800
        const seed = stock.id * 1000 + stock.price // 주식별 고유 시드
        baseTickDataRef.current = generateBaseTickData(currentPrice, tickCount, volatility * 0.01, seed)
        lastPriceRef.current = currentPrice
    }, [stock.id])

    // 가격 변동 시 틱 데이터 업데이트
    useEffect(() => {
        if (!baseTickDataRef.current || baseTickDataRef.current.length === 0) return

        // 새 틱 추가
        const newTick = {
            index: baseTickDataRef.current.length,
            price: currentPrice,
            time: Date.now()
        }

        baseTickDataRef.current.push(newTick)

        // 최대 틱 수 유지 (오래된 것 제거)
        if (baseTickDataRef.current.length > 20000) {
            baseTickDataRef.current = baseTickDataRef.current.slice(-15000)
            // 인덱스 재정렬
            baseTickDataRef.current.forEach((t, i) => t.index = i)
        }

        lastPriceRef.current = currentPrice
    }, [currentPrice])

    // 현재 시간프레임에 맞는 캔들 데이터 계산
    const candleData = useMemo(() => {
        if (!baseTickDataRef.current || baseTickDataRef.current.length === 0) {
            return []
        }

        return aggregateTicksToCandles(baseTickDataRef.current, ticksPerCandle, 60)
    }, [baseTickDataRef.current?.length, ticksPerCandle, currentPrice])

    // 카테고리 변경
    const handleCategoryChange = (newCategory) => {
        setCategory(newCategory)
        setSubOption(CATEGORY_OPTIONS[newCategory][0])
    }

    // 펀더멘털 데이터
    const fundamentals = stock.fundamentals || {}

    // 가격 변동 계산
    const startPrice = candleData.length > 0 ? candleData[0].open : currentPrice
    const change = currentPrice - startPrice
    const changeRate = startPrice ? (change / startPrice) * 100 : 0
    const isUp = change >= 0

    return (
        <div className="chart-modal-overlay" onClick={onClose}>
            <div className="chart-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="chart-modal-header">
                    <div className="chart-stock-info">
                        <div className="chart-stock-icon" style={{ background: stock.color }}>
                            {stock.code?.slice(0, 2)}
                        </div>
                        <div>
                            <h2>{stock.name}</h2>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{stock.code} · {stock.sector}</span>
                        </div>
                        <div style={{ marginLeft: '20px' }}>
                            <div className={`chart-price ${isUp ? 'text-profit' : 'text-loss'}`}>
                                {formatNumber(currentPrice)}원
                            </div>
                            <div style={{ fontSize: '14px', color: isUp ? 'var(--color-profit)' : 'var(--color-loss)' }}>
                                {isUp ? '▲' : '▼'} {formatNumber(Math.abs(change))} ({formatPercent(Math.abs(changeRate))})
                            </div>
                        </div>
                    </div>

                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Timeframe Selection */}
                <div className="timeframe-selection">
                    <div className="timeframe-categories">
                        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`category-btn ${category === cat ? 'active' : ''}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="timeframe-suboptions">
                        {CATEGORY_OPTIONS[category].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setSubOption(opt)}
                                className={`suboption-btn ${subOption === opt ? 'active' : ''}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div className="current-timeframe">
                        {TIMEFRAME_LABELS[timeframeKey]}봉
                    </div>

                    {/* 차트 모드 토글 */}
                    <div className="chart-mode-toggle">
                        <button
                            className={`mode-btn ${chartMode === 'candle' ? 'active' : ''}`}
                            onClick={() => setChartMode('candle')}
                        >
                            📊 캔들
                        </button>
                        <button
                            className={`mode-btn ${chartMode === 'technical' ? 'active' : ''}`}
                            onClick={() => setChartMode('technical')}
                        >
                            📈 기술적 분석
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="chart-modal-content">

                    <div className="chart-panel">
                        <div className="chart-area" ref={chartContainerRef}>
                            {/* 기술적 분석은 최소 15개 캔들 필요 */}
                            {chartMode === 'candle' || candleData.length < 15 ? (
                                <CandlestickChart
                                    data={candleData}
                                    width={chartSize.width}
                                    height={chartSize.height}
                                    currentPrice={currentPrice}
                                />
                            ) : (
                                <TechnicalChart
                                    candleData={candleData}
                                    priceHistory={candleData.map(c => c.close)}
                                    currentPrice={currentPrice}
                                    width={chartSize.width}
                                    height={chartSize.height}
                                    showIndicatorPanel={true}
                                />
                            )}
                        </div>

                        <div className="stock-fundamentals-grid">
                            <FundItem label="시가총액" value={formatCompact(fundamentals.marketCap || 0)} />
                            <FundItem label="PER" value={fundamentals.pe || '-'} />
                            <FundItem label="EPS" value={formatNumber(fundamentals.eps || 0)} />
                            <FundItem label="배당률" value={formatPercent(fundamentals.dividendYield || 0)} />
                            <FundItem label="매출액" value={formatCompact(fundamentals.revenue || 0)} />
                            <FundItem label="영업이익" value={formatCompact(fundamentals.profit || 0)} />
                            <FundItem label="부채비율" value={formatPercent(fundamentals.debtRatio || 0)} />
                            <FundItem label="변동성" value={stock.volatility ? stock.volatility + '%' : '-'} />
                        </div>
                    </div>

                    <div className="order-panel">
                        <OrderBook stock={stock} currentPrice={currentPrice} />
                        <div className="modal-trade-actions">
                            <button className="modal-buy-btn" onClick={() => onOpenOrder && onOpenOrder(stock, 'buy')}>
                                매수
                            </button>
                            <button className="modal-sell-btn" onClick={() => onOpenOrder && onOpenOrder(stock, 'sell')}>
                                매도
                            </button>
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
