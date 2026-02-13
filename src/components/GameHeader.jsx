import { memo } from 'react'
import { LevelBadge } from './Achievements'

const GameHeader = memo(function GameHeader({
    gameTime,
    totalXp,
    onShowSkills,
    onShowMissions,
    onShowAchievements,
    onShowLeaderboard,
    onShowStatistics,
    onShowWatchlist,
    onShowAlertManager,
    onShowTradeHistory,
    onShowSettings
}) {
    return (
        <header className="header" data-testid="game-header">
            <div className="header-content">
                <div className="header-left">
                    <div className="logo" data-testid="game-logo">
                        <span className="logo-icon">📈</span>
                        <h1>트레이딩 게임</h1>
                    </div>
                    <div className="header-divider" />
                    <div className="game-time">
                        <span className="game-season">{gameTime.displaySeason || ''}</span>
                        <span className="game-date-time">
                            {gameTime.displayDate} {gameTime.displayTime}
                        </span>
                    </div>
                    <div className="live-indicator">
                        <span className="live-dot" />
                        LIVE
                    </div>
                </div>

                <div className="header-actions">
                    <LevelBadge xp={totalXp} />
                    <div className="menu-grid">
                        <button className="header-btn" onClick={onShowSkills} data-tooltip="스킬" data-testid="open-skills">
                            ⚔️
                        </button>
                        <button className="header-btn" onClick={onShowMissions} data-tooltip="미션" data-testid="open-missions">
                            🎯
                        </button>
                        <button
                            className="header-btn"
                            onClick={onShowAchievements}
                            data-tooltip="업적"
                            data-testid="open-achievements"
                        >
                            🏆
                        </button>
                        <button
                            className="header-btn"
                            onClick={onShowLeaderboard}
                            data-tooltip="순위"
                            data-testid="open-leaderboard"
                        >
                            🥇
                        </button>
                        <button
                            className="header-btn"
                            onClick={onShowStatistics}
                            data-tooltip="통계"
                            data-testid="open-statistics"
                        >
                            📊
                        </button>
                        <button
                            className="header-btn"
                            onClick={onShowWatchlist}
                            data-tooltip="관심"
                            data-testid="open-watchlist"
                        >
                            ⭐
                        </button>
                        <button
                            className="header-btn"
                            onClick={onShowAlertManager}
                            data-tooltip="알림"
                            data-testid="open-alerts"
                        >
                            🔔
                        </button>
                        <button
                            className="header-btn"
                            onClick={onShowTradeHistory}
                            data-tooltip="거래"
                            data-testid="open-trades"
                        >
                            📜
                        </button>
                        <button
                            className="header-btn"
                            onClick={onShowSettings}
                            data-tooltip="설정"
                            data-testid="open-settings"
                        >
                            ⚙️
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
})

export default GameHeader
