// 고급 통계 컴포넌트
import { useMemo } from 'react'
import { formatPercent, formatCompact } from './utils'
import { INITIAL_CAPITAL } from './constants'
import './Statistics.css'

export default function StatisticsPanel({ tradeHistory, assetHistory, totalAssets, onClose }) {
    const stats = useMemo(() => {
        if (!tradeHistory || tradeHistory.length === 0) {
            return null
        }

        const sells = tradeHistory.filter(t => t.type === 'sell')
        const wins = sells.filter(t => t.profit > 0)
        const losses = sells.filter(t => t.profit < 0)

        // 기본 통계
        const totalTrades = tradeHistory.length
        const winRate = sells.length > 0 ? (wins.length / sells.length) * 100 : 0

        // 평균 손익
        const totalProfit = wins.reduce((sum, t) => sum + t.profit, 0)
        const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0))
        const avgProfit = wins.length > 0 ? totalProfit / wins.length : 0
        const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0

        // 손익비 (Profit Factor)
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0

        // 총 수익률
        const totalReturn = ((totalAssets - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100

        // 최대 낙폭 (MDD)
        let maxDrawdown = 0
        let peak = INITIAL_CAPITAL
        if (assetHistory && assetHistory.length > 0) {
            assetHistory.forEach(h => {
                if (h.value > peak) peak = h.value
                const drawdown = ((peak - h.value) / peak) * 100
                if (drawdown > maxDrawdown) maxDrawdown = drawdown
            })
        }

        // 샤프 비율 (간단화된 버전)
        let sharpeRatio = 0
        if (assetHistory && assetHistory.length > 1) {
            const returns = []
            for (let i = 1; i < assetHistory.length; i++) {
                const r = (assetHistory[i].value - assetHistory[i - 1].value) / assetHistory[i - 1].value
                returns.push(r)
            }
            const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
            const stdDev = Math.sqrt(variance)
            sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0
        }

        // 평균 보유 시간 계산 (간단화)
        const avgHoldingTime = sells.length > 0
            ? sells.reduce((sum, t) => sum + (t.holdingTime || 60), 0) / sells.length
            : 0

        // 연속 승/패
        let maxWinStreak = 0, maxLossStreak = 0
        let currentWinStreak = 0, currentLossStreak = 0
        sells.forEach(t => {
            if (t.profit > 0) {
                currentWinStreak++
                currentLossStreak = 0
                if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak
            } else {
                currentLossStreak++
                currentWinStreak = 0
                if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak
            }
        })

        return {
            totalTrades,
            sellTrades: sells.length,
            buyTrades: tradeHistory.filter(t => t.type === 'buy').length,
            winRate,
            avgProfit,
            avgLoss,
            profitFactor,
            totalReturn,
            maxDrawdown,
            sharpeRatio,
            avgHoldingTime,
            maxWinStreak,
            maxLossStreak,
            wins: wins.length,
            losses: losses.length,
        }
    }, [tradeHistory, assetHistory, totalAssets])

    return (
        <div className="statistics-overlay" onClick={onClose}>
            <div className="statistics-panel" onClick={e => e.stopPropagation()}>
                <div className="statistics-header">
                    <h2>📊 고급 통계</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {!stats ? (
                    <div className="no-stats">
                        <span>📈</span>
                        <p>통계를 계산하려면 먼저 거래를 시작하세요!</p>
                    </div>
                ) : (
                    <div className="statistics-content">
                        {/* 요약 카드 */}
                        <div className="stats-summary">
                            <div className={`summary-card ${stats.totalReturn >= 0 ? 'profit' : 'loss'}`}>
                                <span className="summary-label">총 수익률</span>
                                <span className="summary-value">{formatPercent(stats.totalReturn)}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">승률</span>
                                <span className="summary-value">{stats.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">손익비</span>
                                <span className="summary-value">{stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}</span>
                            </div>
                            <div className={`summary-card ${stats.maxDrawdown < 10 ? 'good' : 'warning'}`}>
                                <span className="summary-label">MDD</span>
                                <span className="summary-value">-{stats.maxDrawdown.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* 상세 통계 */}
                        <div className="stats-grid">
                            <div className="stat-row">
                                <span className="stat-label">총 거래 횟수</span>
                                <span className="stat-value">{stats.totalTrades}회</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">매수 / 매도</span>
                                <span className="stat-value">{stats.buyTrades} / {stats.sellTrades}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">승리 / 패배</span>
                                <span className="stat-value">
                                    <span className="win">{stats.wins}</span> / <span className="loss">{stats.losses}</span>
                                </span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">평균 수익</span>
                                <span className="stat-value profit">{formatCompact(stats.avgProfit)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">평균 손실</span>
                                <span className="stat-value loss">-{formatCompact(stats.avgLoss)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">샤프 비율</span>
                                <span className="stat-value">{stats.sharpeRatio.toFixed(3)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">최대 연승</span>
                                <span className="stat-value profit">{stats.maxWinStreak}연승</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">최대 연패</span>
                                <span className="stat-value loss">{stats.maxLossStreak}연패</span>
                            </div>
                        </div>

                        {/* 성과 분석 */}
                        <div className="performance-analysis">
                            <h4>📈 성과 분석</h4>
                            <div className="analysis-bars">
                                <div className="bar-item">
                                    <span className="bar-label">승률</span>
                                    <div className="bar-track">
                                        <div className="bar-fill win" style={{ width: `${stats.winRate}%` }}></div>
                                    </div>
                                    <span className="bar-value">{stats.winRate.toFixed(0)}%</span>
                                </div>
                                <div className="bar-item">
                                    <span className="bar-label">리스크</span>
                                    <div className="bar-track">
                                        <div className="bar-fill risk" style={{ width: `${Math.min(100, stats.maxDrawdown * 2)}%` }}></div>
                                    </div>
                                    <span className="bar-value">{stats.maxDrawdown.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
