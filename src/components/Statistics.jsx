// 고급 통계 컴포넌트
import { useMemo } from 'react'
import { formatPercent } from '../utils'
import { formatChartPrice } from '../utils/chart-observations'
import { INITIAL_CAPITAL } from '../constants'
import './Statistics.css'

function calculateTradeStatistics(tradeHistory, assetHistory = [], totalAssets) {
    if (!tradeHistory?.length) return null
    const closed = tradeHistory.filter(t => t.type === 'sell' || t.type === 'cover')
    const settled = closed.filter(t => Number.isFinite(t.profit))
    const wins = settled.filter(t => t.profit > 0)
    const losses = settled.filter(t => t.profit < 0)
    const totalGain = wins.reduce((sum, t) => sum + t.profit, 0)
    const totalLoss = -losses.reduce((sum, t) => sum + t.profit, 0)

    // Only the retained observations define this drawdown window, not an invented lifetime peak.
    let peak = null, maxDrawdown = null
    const history = Array.isArray(assetHistory) ? assetHistory : []
    history.forEach(point => {
        if (!Number.isFinite(point?.value)) return
        peak = peak === null ? point.value : Math.max(peak, point.value)
        if (peak > 0) maxDrawdown = Math.max(maxDrawdown ?? 0, (peak - point.value) / peak * 100)
    })

    const returns = []
    for (let i = 1; i < history.length; i++) {
        const previous = history[i - 1]?.value, current = history[i]?.value
        if (!Number.isFinite(previous) || previous <= 0 || !Number.isFinite(current)) continue
        const value = (current - previous) / previous
        if (Number.isFinite(value)) returns.push(value)
    }
    const meanReturn = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : null
    const returnStdDev = returns.length >= 2
        ? Math.sqrt(returns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) / returns.length)
        : null

    let maxWinStreak = 0, maxLossStreak = 0, winStreak = 0, lossStreak = 0
    closed.forEach(trade => {
        if (Number.isFinite(trade.profit) && trade.profit > 0) {
            winStreak++
            lossStreak = 0
        } else if (Number.isFinite(trade.profit) && trade.profit < 0) {
            lossStreak++
            winStreak = 0
        } else {
            // Break-even or unrecorded P/L ends a streak; neither is a loss.
            winStreak = 0
            lossStreak = 0
        }
        maxWinStreak = Math.max(maxWinStreak, winStreak)
        maxLossStreak = Math.max(maxLossStreak, lossStreak)
    })

    return {
        totalTrades: tradeHistory.length,
        buyTrades: tradeHistory.filter(t => t.type === 'buy').length,
        sellTrades: tradeHistory.filter(t => t.type === 'sell').length,
        shortTrades: tradeHistory.filter(t => t.type === 'short').length,
        coverTrades: tradeHistory.filter(t => t.type === 'cover').length,
        settledTrades: settled.length, closedTrades: closed.length,
        wins: wins.length, losses: losses.length, breakEven: settled.length - wins.length - losses.length,
        winRate: settled.length ? wins.length / settled.length * 100 : null,
        avgProfit: wins.length ? totalGain / wins.length : null,
        avgLoss: losses.length ? totalLoss / losses.length : null,
        profitFactor: totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? Infinity : null,
        totalReturn: Number.isFinite(totalAssets) ? (totalAssets - INITIAL_CAPITAL) / INITIAL_CAPITAL * 100 : null,
        maxDrawdown, meanReturn, returnStdDev,
        returnIntervals: returns.length, candidateIntervals: Math.max(0, history.length - 1),
        maxWinStreak, maxLossStreak
    }
}

const percent = (value, digits = 1) => Number.isFinite(value) ? `${value.toFixed(digits)}%` : '—'
const money = value => Number.isFinite(value) ? `${formatChartPrice(value)}원` : '—'

export default function StatisticsPanel({ tradeHistory, assetHistory, totalAssets, onClose }) {
    const stats = useMemo(() => calculateTradeStatistics(tradeHistory, assetHistory, totalAssets), [tradeHistory, assetHistory, totalAssets])

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
                                <span className="summary-value">{stats.totalReturn === null ? '—' : formatPercent(stats.totalReturn)}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">승률</span>
                                <span className="summary-value">{percent(stats.winRate)}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">총이익 / 총손실</span>
                                <span className="summary-value">{stats.profitFactor === Infinity ? '∞' : stats.profitFactor?.toFixed(2) ?? '—'}</span>
                            </div>
                            <div className={`summary-card ${stats.maxDrawdown < 10 ? 'good' : 'warning'}`}>
                                <span className="summary-label">기록 구간 최대낙폭</span>
                                <span className="summary-value">{percent(stats.maxDrawdown)}</span>
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
                                <span className="stat-label">공매도 / 공매도 청산</span>
                                <span className="stat-value">{stats.shortTrades} / {stats.coverTrades}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">수익 / 손실 / 본전</span>
                                <span className="stat-value">
                                    <span className="win">{stats.wins}</span> / <span className="loss">{stats.losses}</span> / {stats.breakEven}
                                </span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">평균 수익</span>
                                <span className="stat-value profit">{money(stats.avgProfit)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">평균 손실</span>
                                <span className="stat-value loss">{stats.avgLoss === null ? '—' : money(-stats.avgLoss)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">기록 수익률 평균</span>
                                <span className="stat-value">{percent(stats.meanReturn === null ? null : stats.meanReturn * 100, 3)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">기록 수익률 변동성</span>
                                <span className="stat-value">{percent(stats.returnStdDev === null ? null : stats.returnStdDev * 100, 3)}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">유효 수익률 구간</span>
                                <span className="stat-value">{stats.returnIntervals} / {stats.candidateIntervals}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">청산 손익 기록</span>
                                <span className="stat-value">{stats.settledTrades} / {stats.closedTrades}</span>
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
                                        <div className="bar-fill win" style={{ width: `${stats.winRate ?? 0}%` }}></div>
                                    </div>
                                    <span className="bar-value">{percent(stats.winRate, 0)}</span>
                                </div>
                                <div className="bar-item">
                                    <span className="bar-label">기록 낙폭</span>
                                    <div className="bar-track">
                                        <div className="bar-fill risk" style={{ width: `${Math.min(100, stats.maxDrawdown ?? 0)}%` }}></div>
                                    </div>
                                    <span className="bar-value">{percent(stats.maxDrawdown, 0)}</span>
                                </div>
                            </div>
                            <p>승률은 손익이 기록된 매도·공매도 청산 중 수익 거래 비율입니다. 본전 거래는 연승·연패를 끊습니다.</p>
                            <p>수익률 평균·변동성은 보존된 자산 기록 사이의 단순수익률과 표준편차이며 연율 수치가 아닙니다. 직전 자산이 0 이하인 구간은 제외합니다. 낙폭도 이 기록 구간에 한정됩니다.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
