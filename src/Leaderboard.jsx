// 리더보드 컴포넌트
import { formatCompact, formatPercent, getLeaderboard, saveToLeaderboard } from './utils'
import './Leaderboard.css'

export default function Leaderboard({ currentScore, playerName, onClose, onSaveScore }) {
    const leaderboard = getLeaderboard()

    const handleSave = () => {
        if (!playerName) return
        saveToLeaderboard({
            name: playerName,
            totalAssets: currentScore.totalAssets,
            profitRate: currentScore.profitRate,
            timestamp: Date.now()
        })
        onSaveScore?.()
    }

    const getRankIcon = (index) => {
        if (index === 0) return '🥇'
        if (index === 1) return '🥈'
        if (index === 2) return '🥉'
        return `${index + 1}`
    }

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-panel" onClick={e => e.stopPropagation()}>
                <div className="leaderboard-header">
                    <h2>🏆 리더보드</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* 현재 점수 */}
                <div className="current-score-section">
                    <h3>내 현재 성적</h3>
                    <div className="current-score">
                        <div className="score-item">
                            <span className="score-label">총 자산</span>
                            <span className="score-value">{formatCompact(currentScore.totalAssets)}</span>
                        </div>
                        <div className="score-item">
                            <span className="score-label">수익률</span>
                            <span className={`score-value ${currentScore.profitRate >= 0 ? 'profit' : 'loss'}`}>
                                {formatPercent(currentScore.profitRate)}
                            </span>
                        </div>
                    </div>
                    <button className="save-score-btn" onClick={handleSave}>
                        📝 기록 저장하기
                    </button>
                </div>

                {/* 리더보드 */}
                <div className="leaderboard-list">
                    <div className="leaderboard-list-header">
                        <span>순위</span>
                        <span>이름</span>
                        <span>총 자산</span>
                        <span>수익률</span>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="no-records">
                            <span className="no-records-icon">📊</span>
                            <p>아직 기록이 없습니다.</p>
                            <p className="no-records-sub">첫 번째 기록을 남겨보세요!</p>
                        </div>
                    ) : (
                        leaderboard.map((entry, index) => (
                            <div key={index} className={`leaderboard-item ${index < 3 ? 'top-rank' : ''}`}>
                                <span className="rank">{getRankIcon(index)}</span>
                                <span className="name">{entry.name}</span>
                                <span className="assets">{formatCompact(entry.totalAssets)}</span>
                                <span className={`profit-rate ${entry.profitRate >= 0 ? 'profit' : 'loss'}`}>
                                    {formatPercent(entry.profitRate)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
