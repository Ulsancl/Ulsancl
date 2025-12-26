/**
 * GameHeader - 게임 헤더 컴포넌트
 * 로고, 게임 시간, 메뉴 버튼들을 포함
 */
import React, { memo } from 'react'
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
        <header className="header">
            <div className="header-content">
                {/* 좌측: 로고 + 날짜 (가로 배치) */}
                <div className="header-left">
                    <div className="logo">
                        <span className="logo-icon">📈</span>
                        <h1>트레이딩 게임</h1>
                    </div>
                    <div className="header-divider"></div>
                    <div className="game-time">
                        <span className="game-season">{gameTime.displaySeason || ''}</span>
                        <span className="game-date-time">{gameTime.displayDate} {gameTime.displayTime}</span>
                    </div>
                    <div className="live-indicator"><span className="live-dot"></span>LIVE</div>
                </div>

                {/* 우측: 메뉴 버튼 (2열 배치) */}
                <div className="header-actions">
                    <LevelBadge xp={totalXp} />
                    <div className="menu-grid">
                        <button className="header-btn" onClick={onShowSkills} data-tooltip="스킬">⚡</button>
                        <button className="header-btn" onClick={onShowMissions} data-tooltip="미션">📋</button>
                        <button className="header-btn" onClick={onShowAchievements} data-tooltip="업적">🏆</button>
                        <button className="header-btn" onClick={onShowLeaderboard} data-tooltip="순위">🥇</button>
                        <button className="header-btn" onClick={onShowStatistics} data-tooltip="통계">📊</button>
                        <button className="header-btn" onClick={onShowWatchlist} data-tooltip="관심">⭐</button>
                        <button className="header-btn" onClick={onShowAlertManager} data-tooltip="알림">🔔</button>
                        <button className="header-btn" onClick={onShowTradeHistory} data-tooltip="거래">📜</button>
                        <button className="header-btn" onClick={onShowSettings} data-tooltip="설정">⚙️</button>
                    </div>
                </div>
            </div>
        </header>
    )
})

export default GameHeader
