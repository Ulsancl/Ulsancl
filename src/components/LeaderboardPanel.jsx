import { useCallback, useEffect, useState } from 'react'
import {
    getCurrentSeason,
    getCurrentUserId,
    getLeaderboardSnapshot,
    getUserEntry,
    reportClientError
} from '../firebase/config'
import './LeaderboardPanel.css'

const REFRESH_INTERVAL = 60000

const ERROR_STATE = {
    NONE: 'none',
    NO_SEASON: 'no_season',
    NETWORK: 'network'
}

function resolveErrorMessage(errorState) {
    if (errorState === ERROR_STATE.NO_SEASON) {
        return '활성 시즌 정보를 찾을 수 없습니다.'
    }
    if (errorState === ERROR_STATE.NETWORK) {
        return '랭킹 정보를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.'
    }
    return ''
}

export function LeaderboardPanel({ isOpen, onClose, seasonId: propSeasonId }) {
    const [leaderboard, setLeaderboard] = useState(null)
    const [userEntry, setUserEntry] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorState, setErrorState] = useState(ERROR_STATE.NONE)
    const [seasonId, setSeasonId] = useState(propSeasonId || null)
    const [seasonInfo, setSeasonInfo] = useState(null)

    useEffect(() => {
        setSeasonId(propSeasonId || null)
    }, [propSeasonId])

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true)
        setErrorState(ERROR_STATE.NONE)

        try {
            let activeSeasonId = seasonId

            if (!activeSeasonId) {
                const season = await getCurrentSeason()
                if (!season) {
                    setSeasonInfo(null)
                    setLeaderboard(null)
                    setUserEntry(null)
                    setErrorState(ERROR_STATE.NO_SEASON)
                    setLoading(false)
                    return
                }

                activeSeasonId = season.id
                setSeasonId(season.id)
                setSeasonInfo(season)
            }

            const snapshot = await getLeaderboardSnapshot(activeSeasonId)
            if (!snapshot) {
                setErrorState(ERROR_STATE.NETWORK)
                setLoading(false)
                return
            }

            setLeaderboard(snapshot)

            const uid = getCurrentUserId()
            if (uid) {
                const entry = await getUserEntry(activeSeasonId, uid)
                setUserEntry(entry)
            } else {
                setUserEntry(null)
            }
        } catch (error) {
            reportClientError('leaderboard_panel_fetch_failed', error, {
                seasonId: seasonId || propSeasonId || null
            })
            setErrorState(ERROR_STATE.NETWORK)
        } finally {
            setLoading(false)
        }
    }, [propSeasonId, seasonId])

    useEffect(() => {
        if (!isOpen) return undefined

        fetchLeaderboard()
        const refreshTimer = setInterval(fetchLeaderboard, REFRESH_INTERVAL)
        return () => clearInterval(refreshTimer)
    }, [fetchLeaderboard, isOpen])

    if (!isOpen) return null

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-panel" onClick={(event) => event.stopPropagation()}>
                <div className="leaderboard-header">
                    <h2>글로벌 랭킹</h2>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {seasonInfo && (
                    <div className="season-info">
                        <span className="season-name">{seasonInfo.name || `시즌 ${seasonId}`}</span>
                        <span className="participant-count">
                            참가자 {leaderboard?.totalParticipants?.toLocaleString() || 0}명
                        </span>
                    </div>
                )}

                <div className="leaderboard-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner" />
                            <span>로딩 중...</span>
                        </div>
                    ) : errorState !== ERROR_STATE.NONE ? (
                        <div className="error-state">
                            <span className="error-icon">⚠️</span>
                            <span>{resolveErrorMessage(errorState)}</span>
                            <button onClick={fetchLeaderboard}>다시 시도</button>
                        </div>
                    ) : (
                        <>
                            {userEntry && (
                                <div className="user-rank-card">
                                    <div className="rank-badge my-rank">#{userEntry.rank}</div>
                                    <div className="user-info">
                                        <span className="label">내 순위</span>
                                        <span className="score">
                                            {userEntry.profitRate >= 0 ? '+' : ''}
                                            {userEntry.profitRate?.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="user-stats">
                                        <span>총 자산: ₩{userEntry.portfolioValue?.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="leaderboard-list">
                                {leaderboard?.entries?.length > 0 ? (
                                    leaderboard.entries.map((entry, index) => (
                                        <LeaderboardEntry
                                            key={`${entry.uid || 'unknown'}-${index}`}
                                            entry={entry}
                                            rank={entry.rank || index + 1}
                                            isCurrentUser={entry.uid === getCurrentUserId()}
                                        />
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <span className="empty-icon">📊</span>
                                        <span>아직 제출된 기록이 없습니다.</span>
                                        <span className="sub-text">
                                            시즌 종료 화면에서 점수를 제출해 랭킹에 등록하세요.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="leaderboard-footer">
                    <span className="update-time">
                        마지막 업데이트:{' '}
                        {leaderboard?.updatedAt
                            ? new Date(leaderboard.updatedAt).toLocaleTimeString('ko-KR')
                            : '-'}
                    </span>
                    <button className="refresh-btn" onClick={fetchLeaderboard} disabled={loading}>
                        새로고침
                    </button>
                </div>
            </div>
        </div>
    )
}

function LeaderboardEntry({ entry, rank, isCurrentUser }) {
    const getRankClass = (value) => {
        if (value === 1) return 'gold'
        if (value === 2) return 'silver'
        if (value === 3) return 'bronze'
        if (value <= 10) return 'top10'
        return ''
    }

    const getRankLabel = (value) => {
        if (value === 1) return '🥇'
        if (value === 2) return '🥈'
        if (value === 3) return '🥉'
        return `#${value}`
    }

    return (
        <div className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''} ${getRankClass(rank)}`}>
            <div className="rank-col">
                <span className={`rank-badge ${getRankClass(rank)}`}>{getRankLabel(rank)}</span>
            </div>
            <div className="player-col">
                <span className="player-name">{entry.displayName || `Player_${entry.uid?.slice(0, 6)}`}</span>
                {isCurrentUser && <span className="me-badge">ME</span>}
            </div>
            <div className="score-col">
                <span className={`profit-rate ${entry.profitRate >= 0 ? 'positive' : 'negative'}`}>
                    {entry.profitRate >= 0 ? '+' : ''}
                    {entry.profitRate?.toFixed(2)}%
                </span>
                <span className="portfolio-value">₩{entry.portfolioValue?.toLocaleString()}</span>
            </div>
            <div className="stats-col">
                <span className="stat">승률 {entry.winRate?.toFixed(0)}%</span>
                <span className="stat">거래 {entry.totalTrades}회</span>
            </div>
        </div>
    )
}

export default LeaderboardPanel
