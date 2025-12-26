/**
 * TechnicalChart - 기술적 분석 차트 컴포넌트
 * RSI, MACD, 볼린저밴드, 이동평균선 표시
 */
import React, { useMemo, useState, memo } from 'react'
import {
    calculateSMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands,
    analyzeTrend,
    generateSignals
} from '../game/TechnicalAnalysis'
import { formatCompact } from '../utils'
import './TechnicalChart.css'

// 기술적 지표 설정
const INDICATOR_CONFIGS = {
    sma5: { name: 'SMA 5', color: '#FFD700', period: 5 },
    sma20: { name: 'SMA 20', color: '#00BFFF', period: 20 },
    sma60: { name: 'SMA 60', color: '#FF69B4', period: 60 },
    bb: { name: '볼린저 밴드', upperColor: 'rgba(147, 112, 219, 0.5)', lowerColor: 'rgba(147, 112, 219, 0.5)', middleColor: '#9370DB' },
}

/**
 * 메인 가격 차트 + 이동평균선 + 볼린저밴드
 */
const PriceChart = memo(function PriceChart({
    candleData,
    priceHistory,
    width,
    height,
    showSMA,
    showBB,
    currentPrice
}) {
    if (!candleData || candleData.length === 0 || !width || !height) {
        return <div className="chart-loading">데이터 로딩중...</div>
    }

    const padding = { top: 20, right: 60, bottom: 30, left: 10 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // 가격 범위 계산
    const prices = priceHistory || candleData.map(d => d.close)
    const bb = showBB && prices.length >= 20 ? calculateBollingerBands(prices) : null

    let allValues = [...candleData.map(d => d.high), ...candleData.map(d => d.low)]
    if (bb) {
        allValues = [...allValues, ...bb.upper, ...bb.lower]
    }

    const dataMin = Math.min(...allValues)
    const dataMax = Math.max(...allValues)
    const priceRange = dataMax - dataMin || 1
    const pricePadding = priceRange * 0.05
    const minPrice = dataMin - pricePadding
    const maxPrice = dataMax + pricePadding
    const adjustedRange = maxPrice - minPrice

    const priceToY = (price) => {
        return padding.top + chartHeight - ((price - minPrice) / adjustedRange) * chartHeight
    }

    const candleWidth = Math.max(Math.min(chartWidth / candleData.length * 0.7, 12), 3)
    const gap = chartWidth / candleData.length

    // SMA 계산
    const sma5 = showSMA.sma5 && prices.length >= 5 ? calculateSMA(prices, 5) : null
    const sma20 = showSMA.sma20 && prices.length >= 20 ? calculateSMA(prices, 20) : null
    const sma60 = showSMA.sma60 && prices.length >= 60 ? calculateSMA(prices, 60) : null

    // Y축 그리드
    const yTicks = []
    const tickCount = 5
    for (let i = 0; i <= tickCount; i++) {
        yTicks.push(minPrice + (adjustedRange / tickCount) * i)
    }

    // 캔들 렌더링
    const candles = candleData.map((candle, i) => {
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
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} />
            </g>
        )
    })

    // SMA 라인 생성 함수
    const createSMAPath = (smaData, offset) => {
        if (!smaData || smaData.length === 0) return null
        return smaData.map((value, i) => {
            const dataIndex = offset + i
            if (dataIndex >= candleData.length) return null
            const x = padding.left + (dataIndex * gap) + gap / 2
            const y = priceToY(value)
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        }).filter(Boolean).join(' ')
    }

    // 볼린저 밴드 영역 생성
    const createBBArea = () => {
        if (!bb || bb.upper.length === 0) return null
        const offset = prices.length - bb.upper.length

        const upperPath = bb.upper.map((value, i) => {
            const dataIndex = offset + i
            if (dataIndex >= candleData.length) return null
            const x = padding.left + (dataIndex * gap) + gap / 2
            const y = priceToY(value)
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        }).filter(Boolean).join(' ')

        const lowerPath = [...bb.lower].reverse().map((value, i) => {
            const originalIndex = bb.lower.length - 1 - i
            const dataIndex = offset + originalIndex
            if (dataIndex >= candleData.length) return null
            const x = padding.left + (dataIndex * gap) + gap / 2
            const y = priceToY(value)
            return `L ${x} ${y}`
        }).filter(Boolean).join(' ')

        return upperPath + ' ' + lowerPath + ' Z'
    }

    const lastIsUp = currentPrice >= candleData[candleData.length - 1].open
    const lastY = priceToY(currentPrice)

    return (
        <svg width={width} height={height} className="technical-chart-svg">
            {/* 그리드 */}
            {yTicks.map((price, i) => {
                const y = priceToY(price)
                return (
                    <g key={i}>
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                            stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                        <text x={width - padding.right + 5} y={y + 4} fill="#888" fontSize="10">
                            {formatCompact(price)}
                        </text>
                    </g>
                )
            })}

            {/* 볼린저 밴드 영역 */}
            {showBB && bb && (
                <path d={createBBArea()} fill="rgba(147, 112, 219, 0.15)" />
            )}

            {/* 캔들 */}
            {candles}

            {/* SMA 라인들 */}
            {showSMA.sma5 && sma5 && (
                <path d={createSMAPath(sma5, prices.length - sma5.length)}
                    fill="none" stroke={INDICATOR_CONFIGS.sma5.color} strokeWidth="1.5" />
            )}
            {showSMA.sma20 && sma20 && (
                <path d={createSMAPath(sma20, prices.length - sma20.length)}
                    fill="none" stroke={INDICATOR_CONFIGS.sma20.color} strokeWidth="1.5" />
            )}
            {showSMA.sma60 && sma60 && (
                <path d={createSMAPath(sma60, prices.length - sma60.length)}
                    fill="none" stroke={INDICATOR_CONFIGS.sma60.color} strokeWidth="1.5" />
            )}

            {/* 볼린저 밴드 중심선 */}
            {showBB && bb && (
                <path d={createSMAPath(bb.middle, prices.length - bb.middle.length)}
                    fill="none" stroke={INDICATOR_CONFIGS.bb.middleColor} strokeWidth="1" strokeDasharray="4 2" />
            )}

            {/* 현재가 라인 */}
            <line x1={padding.left} y1={lastY} x2={width - padding.right} y2={lastY}
                stroke={lastIsUp ? '#26a69a' : '#ef5350'} strokeWidth={1} strokeDasharray="5 3" />
            <rect x={width - padding.right} y={lastY - 10} width={55} height={20}
                fill={lastIsUp ? '#26a69a' : '#ef5350'} rx={3} />
            <text x={width - padding.right + 5} y={lastY + 4} fill="white" fontSize="11" fontWeight="bold">
                {formatCompact(currentPrice)}
            </text>
        </svg>
    )
})

/**
 * RSI 차트
 */
const RSIChart = memo(function RSIChart({ priceHistory, width, height }) {
    const rsi = useMemo(() => {
        if (!priceHistory || priceHistory.length < 15) return null
        return calculateRSI(priceHistory)
    }, [priceHistory])

    if (!rsi || rsi.length === 0 || !width || !height) {
        return <div className="indicator-chart rsi-chart">RSI 데이터 부족</div>
    }

    const padding = { top: 10, right: 60, bottom: 20, left: 10 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const gap = chartWidth / rsi.length
    const valueToY = (value) => padding.top + chartHeight - (value / 100) * chartHeight

    const pathD = rsi.map((value, i) => {
        const x = padding.left + i * gap + gap / 2
        const y = valueToY(value)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')

    const currentRSI = rsi[rsi.length - 1]
    const rsiColor = currentRSI > 70 ? '#ef5350' : currentRSI < 30 ? '#26a69a' : '#888'

    return (
        <div className="indicator-chart rsi-chart">
            <div className="indicator-label">
                <span>RSI (14)</span>
                <span className="indicator-value" style={{ color: rsiColor }}>
                    {currentRSI.toFixed(1)}
                </span>
            </div>
            <svg width={width} height={height}>
                {/* 과매수/과매도 영역 */}
                <rect x={padding.left} y={valueToY(100)} width={chartWidth} height={valueToY(70) - valueToY(100)}
                    fill="rgba(239, 83, 80, 0.1)" />
                <rect x={padding.left} y={valueToY(30)} width={chartWidth} height={valueToY(0) - valueToY(30)}
                    fill="rgba(38, 166, 154, 0.1)" />

                {/* 기준선 */}
                <line x1={padding.left} y1={valueToY(70)} x2={width - padding.right} y2={valueToY(70)}
                    stroke="rgba(239, 83, 80, 0.5)" strokeDasharray="3 3" />
                <line x1={padding.left} y1={valueToY(50)} x2={width - padding.right} y2={valueToY(50)}
                    stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                <line x1={padding.left} y1={valueToY(30)} x2={width - padding.right} y2={valueToY(30)}
                    stroke="rgba(38, 166, 154, 0.5)" strokeDasharray="3 3" />

                {/* RSI 라인 */}
                <path d={pathD} fill="none" stroke="#9370DB" strokeWidth="2" />

                {/* 레이블 */}
                <text x={width - padding.right + 5} y={valueToY(70) + 4} fill="#ef5350" fontSize="9">70</text>
                <text x={width - padding.right + 5} y={valueToY(50) + 4} fill="#888" fontSize="9">50</text>
                <text x={width - padding.right + 5} y={valueToY(30) + 4} fill="#26a69a" fontSize="9">30</text>
            </svg>
        </div>
    )
})

/**
 * MACD 차트
 */
const MACDChart = memo(function MACDChart({ priceHistory, width, height }) {
    const macd = useMemo(() => {
        if (!priceHistory || priceHistory.length < 35) return null
        return calculateMACD(priceHistory)
    }, [priceHistory])

    if (!macd || macd.histogram.length === 0 || !width || !height) {
        return <div className="indicator-chart macd-chart">MACD 데이터 부족</div>
    }

    const padding = { top: 10, right: 60, bottom: 20, left: 10 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const allValues = [...macd.macdLine, ...macd.signalLine, ...macd.histogram]
    const maxAbs = Math.max(...allValues.map(Math.abs))
    const range = maxAbs * 2

    const gap = chartWidth / macd.histogram.length
    const valueToY = (value) => padding.top + chartHeight / 2 - (value / range) * chartHeight

    const macdPathD = macd.macdLine.map((value, i) => {
        const x = padding.left + i * gap + gap / 2
        const y = valueToY(value)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')

    const signalPathD = macd.signalLine.map((value, i) => {
        const x = padding.left + i * gap + gap / 2
        const y = valueToY(value)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')

    const currentHist = macd.histogram[macd.histogram.length - 1]

    return (
        <div className="indicator-chart macd-chart">
            <div className="indicator-label">
                <span>MACD (12,26,9)</span>
                <span className="indicator-value" style={{ color: currentHist >= 0 ? '#26a69a' : '#ef5350' }}>
                    {currentHist.toFixed(0)}
                </span>
            </div>
            <svg width={width} height={height}>
                {/* 제로 라인 */}
                <line x1={padding.left} y1={valueToY(0)} x2={width - padding.right} y2={valueToY(0)}
                    stroke="rgba(255,255,255,0.3)" />

                {/* 히스토그램 */}
                {macd.histogram.map((value, i) => {
                    const x = padding.left + i * gap + gap / 2
                    const barWidth = Math.max(gap * 0.6, 2)
                    const barHeight = Math.abs(valueToY(value) - valueToY(0))
                    const y = value >= 0 ? valueToY(value) : valueToY(0)
                    const color = value >= 0 ? 'rgba(38, 166, 154, 0.6)' : 'rgba(239, 83, 80, 0.6)'
                    return <rect key={i} x={x - barWidth / 2} y={y} width={barWidth} height={barHeight} fill={color} />
                })}

                {/* MACD 라인 */}
                <path d={macdPathD} fill="none" stroke="#00BFFF" strokeWidth="1.5" />

                {/* 시그널 라인 */}
                <path d={signalPathD} fill="none" stroke="#FF6B6B" strokeWidth="1.5" />
            </svg>
        </div>
    )
})

/**
 * 신호 패널
 */
const SignalPanel = memo(function SignalPanel({ priceHistory }) {
    const analysis = useMemo(() => {
        if (!priceHistory || priceHistory.length < 30) return null
        return {
            trend: analyzeTrend(priceHistory),
            signals: generateSignals(priceHistory)
        }
    }, [priceHistory])

    if (!analysis) {
        return <div className="signal-panel">데이터 부족</div>
    }

    const { trend, signals } = analysis
    const trendColor = trend.trend === 'uptrend' ? '#26a69a' : trend.trend === 'downtrend' ? '#ef5350' : '#888'
    const trendIcon = trend.trend === 'uptrend' ? '📈' : trend.trend === 'downtrend' ? '📉' : '➡️'
    const trendLabel = trend.trend === 'uptrend' ? '상승 추세' : trend.trend === 'downtrend' ? '하락 추세' : '횡보'

    return (
        <div className="signal-panel">
            <div className="trend-indicator" style={{ borderColor: trendColor }}>
                <span className="trend-icon">{trendIcon}</span>
                <div className="trend-info">
                    <span className="trend-label" style={{ color: trendColor }}>{trendLabel}</span>
                    <div className="trend-strength">
                        <div className="strength-bar">
                            <div className="strength-fill" style={{ width: `${trend.strength}%`, backgroundColor: trendColor }} />
                        </div>
                        <span>{trend.strength}%</span>
                    </div>
                </div>
            </div>

            {signals.length > 0 && (
                <div className="signals-list">
                    {signals.slice(0, 3).map((signal, i) => (
                        <div key={i} className={`signal-item signal-${signal.type}`}>
                            <span className="signal-type">{signal.type === 'buy' ? '🟢 매수' : '🔴 매도'}</span>
                            <span className="signal-message">{signal.message}</span>
                            <span className={`signal-strength strength-${signal.strength}`}>
                                {signal.strength === 'strong' ? '강함' : '보통'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {signals.length === 0 && (
                <div className="no-signals">현재 특별한 신호 없음</div>
            )}

            {(trend.goldenCross || trend.deathCross) && (
                <div className="cross-alert">
                    {trend.goldenCross && <span className="golden-cross">✨ 골든 크로스!</span>}
                    {trend.deathCross && <span className="death-cross">💀 데드 크로스!</span>}
                </div>
            )}
        </div>
    )
})

/**
 * 메인 컴포넌트
 */
export default function TechnicalChart({
    candleData,
    priceHistory,
    currentPrice,
    width = 600,
    height = 400,
    showIndicatorPanel = true
}) {
    const [showSMA, setShowSMA] = useState({ sma5: true, sma20: true, sma60: false })
    const [showBB, setShowBB] = useState(false)
    const [activeIndicator, setActiveIndicator] = useState('rsi') // 'rsi', 'macd', 'both'

    const prices = useMemo(() => {
        if (priceHistory && priceHistory.length > 0) return priceHistory
        if (candleData && candleData.length > 0) return candleData.map(d => d.close)
        return []
    }, [priceHistory, candleData])

    const mainChartHeight = showIndicatorPanel ? height * 0.6 : height
    const indicatorHeight = showIndicatorPanel ? (height * 0.4) / (activeIndicator === 'both' ? 2 : 1) : 0

    return (
        <div className="technical-chart-container">
            {/* 지표 토글 버튼 */}
            <div className="indicator-toggles">
                <div className="toggle-group">
                    <button
                        className={`toggle-btn ${showSMA.sma5 ? 'active' : ''}`}
                        onClick={() => setShowSMA(prev => ({ ...prev, sma5: !prev.sma5 }))}
                        style={{ '--indicator-color': INDICATOR_CONFIGS.sma5.color }}
                    >
                        MA5
                    </button>
                    <button
                        className={`toggle-btn ${showSMA.sma20 ? 'active' : ''}`}
                        onClick={() => setShowSMA(prev => ({ ...prev, sma20: !prev.sma20 }))}
                        style={{ '--indicator-color': INDICATOR_CONFIGS.sma20.color }}
                    >
                        MA20
                    </button>
                    <button
                        className={`toggle-btn ${showSMA.sma60 ? 'active' : ''}`}
                        onClick={() => setShowSMA(prev => ({ ...prev, sma60: !prev.sma60 }))}
                        style={{ '--indicator-color': INDICATOR_CONFIGS.sma60.color }}
                    >
                        MA60
                    </button>
                    <button
                        className={`toggle-btn ${showBB ? 'active' : ''}`}
                        onClick={() => setShowBB(!showBB)}
                        style={{ '--indicator-color': INDICATOR_CONFIGS.bb.middleColor }}
                    >
                        BB
                    </button>
                </div>

                {showIndicatorPanel && (
                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${activeIndicator === 'rsi' ? 'active' : ''}`}
                            onClick={() => setActiveIndicator('rsi')}
                        >
                            RSI
                        </button>
                        <button
                            className={`toggle-btn ${activeIndicator === 'macd' ? 'active' : ''}`}
                            onClick={() => setActiveIndicator('macd')}
                        >
                            MACD
                        </button>
                        <button
                            className={`toggle-btn ${activeIndicator === 'both' ? 'active' : ''}`}
                            onClick={() => setActiveIndicator('both')}
                        >
                            둘다
                        </button>
                    </div>
                )}
            </div>

            {/* 메인 차트 */}
            <div className="main-chart-area" style={{ height: mainChartHeight }}>
                <PriceChart
                    candleData={candleData}
                    priceHistory={prices}
                    width={width}
                    height={mainChartHeight}
                    showSMA={showSMA}
                    showBB={showBB}
                    currentPrice={currentPrice}
                />
            </div>

            {/* 보조 지표 */}
            {showIndicatorPanel && (
                <div className="indicator-charts-area">
                    {(activeIndicator === 'rsi' || activeIndicator === 'both') && (
                        <RSIChart priceHistory={prices} width={width} height={indicatorHeight} />
                    )}
                    {(activeIndicator === 'macd' || activeIndicator === 'both') && (
                        <MACDChart priceHistory={prices} width={width} height={indicatorHeight} />
                    )}
                </div>
            )}

            {/* 신호 패널 */}
            <SignalPanel priceHistory={prices} />
        </div>
    )
}
