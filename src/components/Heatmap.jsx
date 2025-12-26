// 히트맵 컴포넌트 - 전체 종목 시각화
import { formatNumber, formatPercent } from '../utils'
import { SECTORS } from '../constants'
import './Heatmap.css'

export default function Heatmap({ stocks, portfolio, onStockClick }) {
    // 변동률 기준 색상 계산
    const getColor = (changeRate) => {
        if (changeRate >= 5) return '#16a34a'
        if (changeRate >= 3) return '#22c55e'
        if (changeRate >= 1) return '#4ade80'
        if (changeRate >= 0) return '#86efac'
        if (changeRate >= -1) return '#fca5a5'
        if (changeRate >= -3) return '#f87171'
        if (changeRate >= -5) return '#ef4444'
        return '#dc2626'
    }

    // 섹터별 그룹화
    const unknownSectorKey = 'misc'
    const stocksBySector = {}
    stocks.forEach(stock => {
        const sectorKey = stock.sector || unknownSectorKey
        if (!stocksBySector[sectorKey]) {
            stocksBySector[sectorKey] = []
        }
        stocksBySector[sectorKey].push(stock)
    })

    return (
        <div className="heatmap-container">
            <h3 className="heatmap-title">🗺️ 시장 히트맵</h3>
            <div className="heatmap-legend">
                <span className="legend-item" style={{ background: '#dc2626' }}>-5%↓</span>
                <span className="legend-item" style={{ background: '#f87171' }}>-3%</span>
                <span className="legend-item" style={{ background: '#fca5a5' }}>-1%</span>
                <span className="legend-item" style={{ background: '#86efac' }}>+0%</span>
                <span className="legend-item" style={{ background: '#4ade80' }}>+1%</span>
                <span className="legend-item" style={{ background: '#22c55e' }}>+3%</span>
                <span className="legend-item" style={{ background: '#16a34a' }}>+5%↑</span>
            </div>

            <div className="heatmap-grid">
                {Object.entries(stocksBySector).map(([sector, sectorStocks]) => {
                    const sectorInfo = SECTORS[sector]
                    const sectorName = sectorInfo?.name || (sector === unknownSectorKey ? '기타' : sector)
                    const sectorColor = sectorInfo?.color || '#6b7280'

                    return (
                        <div key={sector} className="sector-group">
                            <div className="sector-label" style={{ borderColor: sectorColor }}>
                                {sectorName}
                            </div>
                            <div className="sector-stocks">
                                {sectorStocks.map(stock => {
                                    const changeRate = ((stock.price - stock.basePrice) / stock.basePrice) * 100
                                    const isHeld = portfolio?.[stock.id]
                                    return (
                                        <div
                                            key={stock.id}
                                            className={`heatmap-cell ${isHeld ? 'held' : ''}`}
                                            style={{ background: getColor(changeRate) }}
                                            onClick={() => onStockClick?.(stock)}
                                            title={`${stock.name}: ${formatNumber(stock.price)}원 (${formatPercent(changeRate)})`}
                                        >
                                            <span className="cell-code">{stock.code}</span>
                                            <span className="cell-change">{changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%</span>
                                            {isHeld && <span className="held-badge">보유</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// 포트폴리오 파이차트
export function PortfolioPieChart({ portfolio, stocks, cash, totalAssets }) {
    if (!portfolio || Object.keys(portfolio).length === 0) {
        return null
    }

    // 데이터 계산
    const data = []
    Object.entries(portfolio).forEach(([stockId, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (stock) {
            const value = stock.price * holding.quantity
            data.push({
                name: stock.name,
                code: stock.code,
                value,
                color: stock.color,
                percent: 0 // 나중에 계산
            })
        }
    })

    // 현금 추가
    data.push({
        name: '현금',
        code: 'CASH',
        value: cash,
        color: '#6b7280',
        percent: 0
    })

    // 퍼센트 계산
    data.forEach(item => {
        item.percent = (item.value / totalAssets) * 100
    })

    // SVG 파이차트 계산
    const size = 200
    const center = size / 2
    const radius = 80
    let currentAngle = -90 // 12시 방향 시작

    const segments = data.map(item => {
        const angle = (item.percent / 100) * 360
        const startAngle = currentAngle
        currentAngle += angle
        const endAngle = currentAngle

        // SVG arc 계산
        const start = polarToCartesian(center, center, radius, endAngle)
        const end = polarToCartesian(center, center, radius, startAngle)
        const largeArcFlag = angle > 180 ? 1 : 0

        return {
            ...item,
            path: `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
        }
    })

    function polarToCartesian(cx, cy, r, angle) {
        const radian = (angle * Math.PI) / 180
        return {
            x: cx + r * Math.cos(radian),
            y: cy + r * Math.sin(radian)
        }
    }

    return (
        <div className="pie-chart-container">
            <h3 className="pie-title">📊 포트폴리오 구성</h3>
            <div className="pie-chart-wrapper">
                <svg width={size} height={size} className="pie-chart">
                    {segments.map((seg, i) => (
                        <path
                            key={i}
                            d={seg.path}
                            fill={seg.color}
                            stroke="var(--color-bg-secondary)"
                            strokeWidth="2"
                            className="pie-segment"
                        >
                            <title>{seg.name}: {seg.percent.toFixed(1)}%</title>
                        </path>
                    ))}
                    <circle cx={center} cy={center} r={radius * 0.5} fill="var(--color-bg-secondary)" />
                    <text x={center} y={center - 5} textAnchor="middle" fill="var(--color-text-primary)" fontSize="14" fontWeight="600">
                        {formatNumber(Math.round(totalAssets / 100000000 * 100) / 100)}억
                    </text>
                    <text x={center} y={center + 12} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">
                        총 자산
                    </text>
                </svg>

                <div className="pie-legend">
                    {data.map((item, i) => (
                        <div key={i} className="pie-legend-item">
                            <span className="legend-color" style={{ background: item.color }}></span>
                            <span className="legend-name">{item.name}</span>
                            <span className="legend-percent">{item.percent.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
