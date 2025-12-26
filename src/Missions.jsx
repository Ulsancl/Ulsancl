// 미션 시스템 컴포넌트
import { MISSIONS } from './constants'
import { formatNumber, formatCompact } from './utils'
import './Missions.css'

export default function MissionsPanel({ missionProgress, completedMissions, onClaimReward, onClose }) {
    const renderMission = (mission) => {
        const progress = missionProgress?.[mission.id] || 0
        const isCompleted = completedMissions?.[mission.id]
        const progressPercent = Math.min(100, (progress / mission.target) * 100)
        const canClaim = progressPercent >= 100 && !isCompleted

        return (
            <div key={mission.id} className={`mission-card ${isCompleted ? 'completed' : ''} ${canClaim ? 'claimable' : ''}`}>
                <div className="mission-info">
                    <div className="mission-header">
                        <span className="mission-name">{mission.name}</span>
                        {isCompleted && <span className="completed-badge">✓ 완료</span>}
                    </div>
                    <p className="mission-desc">{mission.desc}</p>
                    <div className="mission-progress-bar">
                        <div className="mission-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="mission-progress-text">
                        {formatNumber(progress)} / {formatNumber(mission.target)}
                    </div>
                </div>
                <div className="mission-rewards">
                    <span className="reward-xp">+{mission.reward.xp} XP</span>
                    <span className="reward-cash">+{formatCompact(mission.reward.cash)}</span>
                    {canClaim && (
                        <button className="claim-btn" onClick={() => onClaimReward(mission)}>
                            수령
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="missions-overlay" onClick={onClose}>
            <div className="missions-panel" onClick={e => e.stopPropagation()}>
                <div className="missions-header">
                    <h2>📋 미션</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="missions-content">
                    <section className="mission-section">
                        <h3>🌅 일일 미션</h3>
                        <p className="mission-reset">매일 자정에 리셋됩니다</p>
                        {MISSIONS.daily.map(m => renderMission(m, 'daily'))}
                    </section>

                    <section className="mission-section">
                        <h3>📅 주간 미션</h3>
                        <p className="mission-reset">매주 월요일에 리셋됩니다</p>
                        {MISSIONS.weekly.map(m => renderMission(m, 'weekly'))}
                    </section>
                </div>
            </div>
        </div>
    )
}
