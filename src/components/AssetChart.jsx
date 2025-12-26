// 자산 변동 차트 컴포넌트
import { useMemo } from 'react'
import { formatCompact, formatPercent } from '../utils'
import { INITIAL_CAPITAL } from '../constants'
import './AssetChart.css'

export default function AssetChart({ assetHistory, onClose }) {
    const chartData = useMemo(() => {
        if (!assetHistory || assetHistory.length < 2) return null

        const values = assetHistory.map(h => h.value)
        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min || 1

        // SVG 경로 생성
        const width = 600
        const height = 200
        const padding = 40

        const points = assetHistory.map((h, i) => {
            const x = padding + (i / (assetHistory.length - 1)) * (width - padding * 2)
            const y = height - padding - ((h.value - min) / range) * (height - padding * 2)
            return { x, y, ...h }
        })

        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

        return { points, pathD, areaD, min, max, width, height, padding }
    }, [assetHistory])

    if (!chartData) {
        return (
            <div className="asset-chart-overlay" onClick={onClose}>
                <div className="asset-chart-panel" onClick={e => e.stopPropagation()}>
                    <div className="asset-chart-header">
                        <h2>📈 자산 변동 차트</h2>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="no-data">
                        <span>📊</span>
                        <p>아직 충분한 데이터가 없습니다.</p>
                        <p className="sub">게임을 진행하면 자산 변동이 기록됩니다.</p>
                    </div>
                </div>
            </div>
        )
    }

    const { points, pathD, areaD, min, max, width, height, padding } = chartData
    const currentValue = points[points.length - 1]?.value || INITIAL_CAPITAL
    const profitRate = ((currentValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100
    const isProfit = profitRate >= 0

    return (
        <div className="asset-chart-overlay" onClick={onClose}>
            <div className="asset-chart-panel" onClick={e => e.stopPropagation()}>
                <div className="asset-chart-header">
                    <h2>📈 자산 변동 차트</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="asset-summary">
                    <div className="summary-item">
                        <span className="label">현재 자산</span>
                        <span className="value">{formatCompact(currentValue)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">최고</span>
                        <span className="value high">{formatCompact(max)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">최저</span>
                        <span className="value low">{formatCompact(min)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">수익률</span>
                        <span className={`value ${isProfit ? 'profit' : 'loss'}`}>{formatPercent(profitRate)}</span>
                    </div>
                </div>

                <div className="chart-container">
                    <svg viewBox={`0 0 ${width} ${height}`} className="asset-svg">
                        {/* 그리드 라인 */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const y = padding + ratio * (height - padding * 2)
                            const value = max - ratio * (max - min)
                            return (
                                <g key={i}>
                                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--color-border)" strokeDasharray="4" />
                                    <text x={padding - 5} y={y + 4} textAnchor="end" fill="var(--color-text-muted)" fontSize="10">
                                        {formatCompact(value)}
                                    </text>
                                </g>
                            )
                        })}

                        {/* 시작선 (원금) */}
                        {min < INITIAL_CAPITAL && max > INITIAL_CAPITAL && (
                            <line
                                x1={padding}
                                y1={height - padding - ((INITIAL_CAPITAL - min) / (max - min)) * (height - padding * 2)}
                                x2={width - padding}
                                y2={height - padding - ((INITIAL_CAPITAL - min) / (max - min)) * (height - padding * 2)}
                                stroke="var(--color-accent)"
                                strokeDasharray="6"
                                strokeWidth="1"
                            />
                        )}

                        {/* 영역 */}
                        <path d={areaD} fill={isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'} />

                        {/* 라인 */}
                        <path d={pathD} fill="none" stroke={isProfit ? 'var(--color-profit)' : 'var(--color-loss)'} strokeWidth="2" />

                        {/* 포인트들 */}
                        {points.filter((_, i) => i % Math.ceil(points.length / 10) === 0 || i === points.length - 1).map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="4" fill={isProfit ? 'var(--color-profit)' : 'var(--color-loss)'} />
                        ))}
                    </svg>
                </div>

                <div className="chart-footer">
                    <span>총 {assetHistory.length}개의 기록</span>
                </div>
            </div>
        </div>
    )
}
