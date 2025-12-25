// 시즌 종료 모달 - 1년 트레이딩 리포트
import { formatNumber, formatPercent } from './utils'
import { ACHIEVEMENTS } from './constants'
import './SeasonEnd.css'

export default function SeasonEndModal({
    year,
    totalAssets,
    initialCapital,
    totalProfit,
    totalTrades,
    winStreak,
    maxWinStreak,
    tradeHistory,
    unlockedAchievements,
    assetHistory,
    onStartNewSeason,
    onClose
}) {
    // 수익률 계산
    const profitRate = ((totalAssets - initialCapital) / initialCapital) * 100

    // 거래 통계 계산
    const profitTrades = tradeHistory.filter(t => t.type === 'sell' && t.profit > 0)
    const lossTrades = tradeHistory.filter(t => t.type === 'sell' && t.profit < 0)
    const winRate = profitTrades.length + lossTrades.length > 0
        ? (profitTrades.length / (profitTrades.length + lossTrades.length)) * 100
        : 0

    // 최대 수익/손실 거래
    const maxProfitTrade = tradeHistory.filter(t => t.profit).reduce((max, t) =>
        (t.profit > (max?.profit || 0)) ? t : max, null)
    const maxLossTrade = tradeHistory.filter(t => t.profit).reduce((min, t) =>
        (t.profit < (min?.profit || 0)) ? t : min, null)

    // 총 수익/손실
    const totalGain = profitTrades.reduce((sum, t) => sum + t.profit, 0)
    const totalLoss = Math.abs(lossTrades.reduce((sum, t) => sum + t.profit, 0))
    const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? Infinity : 0

    // 올해 달성 업적
    const yearAchievements = Object.keys(unlockedAchievements)
        .map(id => ACHIEVEMENTS[id])
        .filter(Boolean)
        .slice(-10) // 최근 10개만

    // 등급 결정
    const getGrade = (rate) => {
        if (rate >= 100) return { grade: 'S+', color: '#ffd700', title: '전설적 트레이더' }
        if (rate >= 50) return { grade: 'S', color: '#ff6b6b', title: '마스터 트레이더' }
        if (rate >= 30) return { grade: 'A+', color: '#ff9f43', title: '프로 트레이더' }
        if (rate >= 20) return { grade: 'A', color: '#feca57', title: '숙련된 트레이더' }
        if (rate >= 10) return { grade: 'B+', color: '#48dbfb', title: '성장하는 트레이더' }
        if (rate >= 0) return { grade: 'B', color: '#1dd1a1', title: '안정적 트레이더' }
        if (rate >= -10) return { grade: 'C', color: '#a29bfe', title: '보수적 트레이더' }
        if (rate >= -30) return { grade: 'D', color: '#636e72', title: '학습이 필요한 트레이더' }
        return { grade: 'F', color: '#2d3436', title: '다시 도전하세요!' }
    }

    const gradeInfo = getGrade(profitRate)

    return (
        <div className="season-end-overlay">
            <div className="season-end-modal">
                <div className="season-end-header">
                    <h1>🎉 {year}년 시즌 종료!</h1>
                    <p className="season-subtitle">1년간의 트레이딩 여정이 끝났습니다</p>
                </div>

                {/* 등급 표시 */}
                <div className="grade-section">
                    <div className="grade-badge" style={{ backgroundColor: gradeInfo.color }}>
                        {gradeInfo.grade}
                    </div>
                    <div className="grade-title">{gradeInfo.title}</div>
                </div>

                {/* 핵심 지표 */}
                <div className="stats-grid">
                    <div className="stat-box">
                        <div className="stat-label">총 자산</div>
                        <div className="stat-value">{formatNumber(totalAssets)}원</div>
                    </div>
                    <div className={`stat-box ${profitRate >= 0 ? 'positive' : 'negative'}`}>
                        <div className="stat-label">수익률</div>
                        <div className="stat-value">{formatPercent(profitRate)}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">총 수익</div>
                        <div className={`stat-value ${totalProfit >= 0 ? 'profit' : 'loss'}`}>
                            {totalProfit >= 0 ? '+' : ''}{formatNumber(totalProfit)}원
                        </div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">총 거래</div>
                        <div className="stat-value">{totalTrades}회</div>
                    </div>
                </div>

                {/* 상세 통계 */}
                <div className="detailed-stats">
                    <h3>📊 상세 통계</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">승률</span>
                            <span className="detail-value">{winRate.toFixed(1)}%</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">수익 거래</span>
                            <span className="detail-value text-profit">{profitTrades.length}회</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">손실 거래</span>
                            <span className="detail-value text-loss">{lossTrades.length}회</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">손익비</span>
                            <span className="detail-value">{profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">최대 연승</span>
                            <span className="detail-value">{maxWinStreak || winStreak}연승</span>
                        </div>
                        {maxProfitTrade && (
                            <div className="detail-item">
                                <span className="detail-label">최대 수익</span>
                                <span className="detail-value text-profit">+{formatNumber(maxProfitTrade.profit)}원</span>
                            </div>
                        )}
                        {maxLossTrade && (
                            <div className="detail-item">
                                <span className="detail-label">최대 손실</span>
                                <span className="detail-value text-loss">{formatNumber(maxLossTrade.profit)}원</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 달성 업적 */}
                {yearAchievements.length > 0 && (
                    <div className="achievements-section">
                        <h3>🏆 달성 업적</h3>
                        <div className="achievement-list">
                            {yearAchievements.map(ach => (
                                <div key={ach.id} className="achievement-item">
                                    <span className="ach-icon">{ach.icon}</span>
                                    <span className="ach-name">{ach.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 버튼 */}
                <div className="season-end-actions">
                    <button className="btn-new-season" onClick={onStartNewSeason}>
                        🚀 {year + 1}년 시즌 시작
                    </button>
                    <button className="btn-continue" onClick={onClose}>
                        계속 진행
                    </button>
                </div>
            </div>
        </div>
    )
}
