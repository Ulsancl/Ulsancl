// 업적 시스템 컴포넌트
import { ACHIEVEMENTS, LEVELS } from '../constants'
import { calculateLevel } from '../utils'
import './Achievements.css'

// 레벨 표시 컴포넌트
export function LevelBadge({ xp }) {
    const levelInfo = calculateLevel(xp, LEVELS)

    return (
        <div className="level-badge">
            <div className="level-icon">Lv.{levelInfo.level}</div>
            <div className="level-info">
                <span className="level-name">{levelInfo.name}</span>
                <div className="level-progress-bar">
                    <div
                        className="level-progress-fill"
                        style={{ width: `${levelInfo.progress}%` }}
                    />
                </div>
                {levelInfo.xpToNext > 0 && (
                    <span className="level-xp-text">{levelInfo.xpToNext} XP to next</span>
                )}
            </div>
        </div>
    )
}

// 업적 알림 팝업
export function AchievementPopup({ achievement, onClose }) {
    if (!achievement) return null

    return (
        <div className="achievement-popup" onClick={onClose}>
            <div className="achievement-popup-content">
                <div className="achievement-glow"></div>
                <span className="achievement-popup-icon">{achievement.icon}</span>
                <h3>업적 달성!</h3>
                <p className="achievement-name">{achievement.name}</p>
                <p className="achievement-desc">{achievement.desc}</p>
                <span className="achievement-xp">+{achievement.xp} XP</span>
            </div>
        </div>
    )
}

// 업적 목록 패널
export function AchievementsPanel({ unlockedAchievements, totalXp, onClose }) {
    const allAchievements = Object.values(ACHIEVEMENTS)
    const levelInfo = calculateLevel(totalXp, LEVELS)

    return (
        <div className="achievements-panel-overlay" onClick={onClose}>
            <div className="achievements-panel" onClick={e => e.stopPropagation()}>
                <div className="achievements-header">
                    <h2>🏆 업적 & 레벨</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="level-section">
                    <div className="current-level">
                        <span className="level-number">Lv.{levelInfo.level}</span>
                        <span className="level-title">{levelInfo.name}</span>
                    </div>
                    <div className="xp-bar-container">
                        <div className="xp-bar">
                            <div className="xp-fill" style={{ width: `${levelInfo.progress}%` }}></div>
                        </div>
                        <span className="xp-text">
                            {totalXp} XP {levelInfo.xpToNext > 0 && `(다음 레벨까지 ${levelInfo.xpToNext} XP)`}
                        </span>
                    </div>
                    {levelInfo.perks.length > 0 && (
                        <div className="perks">
                            <span className="perks-label">혜택:</span>
                            {levelInfo.perks.map((perk, i) => (
                                <span key={i} className="perk-badge">{perk}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="achievements-grid">
                    {allAchievements.map(ach => {
                        const unlocked = unlockedAchievements[ach.id]
                        return (
                            <div key={ach.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
                                <span className="achievement-icon">{ach.icon}</span>
                                <div className="achievement-info">
                                    <span className="achievement-name">{ach.name}</span>
                                    <span className="achievement-desc">{ach.desc}</span>
                                </div>
                                <span className="achievement-xp">{unlocked ? '✓' : `${ach.xp} XP`}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
