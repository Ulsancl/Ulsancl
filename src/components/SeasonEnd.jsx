import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatNumber, formatPercent } from '../utils'
import { ACHIEVEMENTS } from '../constants'
import {
    ensureAuth,
    getCurrentSeason,
    reportClientError,
    submitGameScore
} from '../firebase/config'
import './SeasonEnd.css'

const SUBMIT_STATUS = {
    IDLE: 'idle',
    AUTHENTICATING: 'authenticating',
    SUBMITTING: 'submitting',
    SUCCESS: 'success',
    ERROR: 'error'
}

function getGrade(rate) {
    if (rate >= 100) return { grade: 'S+', color: '#ffd700', title: '전설의 트레이더' }
    if (rate >= 50) return { grade: 'S', color: '#ff6b6b', title: '마스터 트레이더' }
    if (rate >= 30) return { grade: 'A+', color: '#ff9f43', title: '프로 트레이더' }
    if (rate >= 20) return { grade: 'A', color: '#feca57', title: '숙련된 트레이더' }
    if (rate >= 10) return { grade: 'B+', color: '#48dbfb', title: '성장형 트레이더' }
    if (rate >= 0) return { grade: 'B', color: '#1dd1a1', title: '안정형 트레이더' }
    if (rate >= -10) return { grade: 'C', color: '#a29bfe', title: '보수형 트레이더' }
    if (rate >= -30) return { grade: 'D', color: '#636e72', title: '학습이 필요한 트레이더' }
    return { grade: 'F', color: '#2d3436', title: '다시 도전하세요' }
}

function calculateMaxDrawdown(assetHistory) {
    if (!Array.isArray(assetHistory) || assetHistory.length < 2) return 0

    let peak = Number(assetHistory[0]?.value) || 0
    let maxDrawdown = 0

    for (const point of assetHistory) {
        const value = Number(point?.value) || 0
        if (value > peak) peak = value

        if (peak > 0) {
            const drawdown = ((peak - value) / peak) * 100
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown
            }
        }
    }

    return maxDrawdown
}

function normalizeSubmitError(error) {
    const code = error?.code
    const message = error?.message

    if (code === 'functions/failed-precondition' || code === 'functions/permission-denied') {
        return '앱 검증(App Check)에 실패했습니다. 잠시 후 다시 시도해 주세요.'
    }
    if (code === 'functions/unauthenticated') {
        return '인증에 실패했습니다. 다시 시도해 주세요.'
    }
    if (code === 'functions/resource-exhausted' || code === 'RATE_LIMITED') {
        return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    }
    if (code === 'REPLAY_MISMATCH') {
        return '서버 검증에 실패했습니다. 새 시즌에서 다시 제출해 주세요.'
    }
    if (code === 'INVALID_CHECKSUM') {
        return '기록 무결성 검증에 실패했습니다. 게임을 재시작 후 다시 시도해 주세요.'
    }
    if (code === 'SEASON_NOT_FOUND' || code === 'SEASON_ENDED') {
        return '유효한 시즌 정보를 찾을 수 없습니다.'
    }

    return message || '점수 제출에 실패했습니다.'
}

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
    tradeLogApi,
    onStartNewSeason,
    onClose
}) {
    const [submitStatus, setSubmitStatus] = useState(SUBMIT_STATUS.IDLE)
    const [submitResult, setSubmitResult] = useState(null)
    const [submitError, setSubmitError] = useState(null)
    const [seasonId, setSeasonId] = useState(null)

    const tradeLogs = tradeLogApi?.tradeLogs || []
    const buildPayload = tradeLogApi?.buildPayload

    const profitRate = ((totalAssets - initialCapital) / initialCapital) * 100

    const profitTrades = useMemo(
        () => tradeHistory.filter((trade) => trade.type === 'sell' && trade.profit > 0),
        [tradeHistory]
    )
    const lossTrades = useMemo(
        () => tradeHistory.filter((trade) => trade.type === 'sell' && trade.profit < 0),
        [tradeHistory]
    )

    const winRate = useMemo(() => {
        const totalSettledTrades = profitTrades.length + lossTrades.length
        if (totalSettledTrades === 0) return 0
        return (profitTrades.length / totalSettledTrades) * 100
    }, [lossTrades.length, profitTrades.length])

    const maxProfitTrade = useMemo(
        () =>
            tradeHistory
                .filter((trade) => typeof trade.profit === 'number')
                .reduce(
                    (best, trade) => (trade.profit > (best?.profit ?? Number.NEGATIVE_INFINITY) ? trade : best),
                    null
                ),
        [tradeHistory]
    )

    const maxLossTrade = useMemo(
        () =>
            tradeHistory
                .filter((trade) => typeof trade.profit === 'number')
                .reduce(
                    (worst, trade) => (trade.profit < (worst?.profit ?? Number.POSITIVE_INFINITY) ? trade : worst),
                    null
                ),
        [tradeHistory]
    )

    const totalGain = useMemo(
        () => profitTrades.reduce((sum, trade) => sum + trade.profit, 0),
        [profitTrades]
    )
    const totalLoss = useMemo(
        () => Math.abs(lossTrades.reduce((sum, trade) => sum + trade.profit, 0)),
        [lossTrades]
    )
    const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? Infinity : 0

    const yearAchievements = useMemo(
        () =>
            Object.keys(unlockedAchievements)
                .map((id) => ACHIEVEMENTS[id])
                .filter(Boolean)
                .slice(-10),
        [unlockedAchievements]
    )

    const maxDrawdown = useMemo(() => calculateMaxDrawdown(assetHistory), [assetHistory])
    const gradeInfo = useMemo(() => getGrade(profitRate), [profitRate])

    useEffect(() => {
        const fetchSeason = async () => {
            try {
                const season = await getCurrentSeason()
                if (season) {
                    setSeasonId(season.id)
                    tradeLogApi?.setSeasonId?.(season.id)
                }
            } catch (error) {
                reportClientError('season_fetch_failed', error, { source: 'season_end_modal' })
            }
        }

        fetchSeason()
    }, [tradeLogApi])

    const handleSubmitScore = useCallback(async () => {
        if (!seasonId) {
            setSubmitError('시즌 정보를 찾을 수 없습니다.')
            setSubmitStatus(SUBMIT_STATUS.ERROR)
            return
        }

        try {
            setSubmitStatus(SUBMIT_STATUS.AUTHENTICATING)
            await ensureAuth()

            setSubmitStatus(SUBMIT_STATUS.SUBMITTING)
            const payload = buildPayload?.({ seasonId })
            if (!payload) {
                throw new Error('제출 가능한 거래 로그가 없습니다.')
            }

            const response = await submitGameScore(payload)
            const result = response.data

            if (!result?.success) {
                const error = new Error(result?.error || '점수 제출에 실패했습니다.')
                if (result?.errorCode) {
                    error.code = result.errorCode
                }
                throw error
            }

            setSubmitResult({
                rank: result.rank,
                score: result.score,
                isNewHighScore: result.isNewHighScore,
                portfolioValue: result.portfolioValue
            })
            setSubmitStatus(SUBMIT_STATUS.SUCCESS)
        } catch (error) {
            reportClientError('score_submit_failed', error, {
                seasonId,
                tradeCount: tradeLogs.length
            })
            setSubmitError(normalizeSubmitError(error))
            setSubmitStatus(SUBMIT_STATUS.ERROR)
        }
    }, [buildPayload, seasonId, tradeLogs.length])

    return (
        <div className="season-end-overlay">
            <div className="season-end-modal">
                <div className="season-end-header">
                    <h1>🎊 {year}년 시즌 종료!</h1>
                    <p className="season-subtitle">1년간의 트레이딩 성과를 분석합니다.</p>
                </div>

                <div className="grade-section">
                    <div className="grade-badge" style={{ backgroundColor: gradeInfo.color }}>
                        {gradeInfo.grade}
                    </div>
                    <div className="grade-title">{gradeInfo.title}</div>
                </div>

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
                        <div className="stat-label">총 손익</div>
                        <div className={`stat-value ${totalProfit >= 0 ? 'profit' : 'loss'}`}>
                            {totalProfit >= 0 ? '+' : ''}
                            {formatNumber(totalProfit)}원
                        </div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">총 거래</div>
                        <div className="stat-value">{totalTrades}회</div>
                    </div>
                </div>

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
                            <span className="detail-value">
                                {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">최대 연승</span>
                            <span className="detail-value">{maxWinStreak || winStreak}연승</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">최대 낙폭</span>
                            <span className="detail-value text-loss">{maxDrawdown.toFixed(1)}%</span>
                        </div>

                        {maxProfitTrade && (
                            <div className="detail-item">
                                <span className="detail-label">최대 수익</span>
                                <span className="detail-value text-profit">
                                    +{formatNumber(maxProfitTrade.profit)}원
                                </span>
                            </div>
                        )}

                        {maxLossTrade && (
                            <div className="detail-item">
                                <span className="detail-label">최대 손실</span>
                                <span className="detail-value text-loss">
                                    {formatNumber(maxLossTrade.profit)}원
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {yearAchievements.length > 0 && (
                    <div className="achievements-section">
                        <h3>🏆 시즌 업적</h3>
                        <div className="achievement-list">
                            {yearAchievements.map((achievement) => (
                                <div key={achievement.id} className="achievement-item">
                                    <span className="ach-icon">{achievement.icon}</span>
                                    <span className="ach-name">{achievement.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="submit-section">
                    <h3>🌍 글로벌 랭킹 등록</h3>

                    {submitStatus === SUBMIT_STATUS.IDLE && (
                        <div className="submit-idle">
                            <p className="submit-description">
                                결과를 서버에서 검증한 뒤 시즌 랭킹에 등록합니다.
                            </p>
                            <button
                                className="btn-submit-score"
                                onClick={handleSubmitScore}
                                disabled={!seasonId || !buildPayload || tradeLogs.length === 0}
                            >
                                점수 제출하기
                            </button>
                            {!seasonId && (
                                <p className="submit-warning">시즌 정보를 불러오는 중입니다.</p>
                            )}
                            {tradeLogs.length === 0 && (
                                <p className="submit-warning">제출 가능한 거래 로그가 없습니다.</p>
                            )}
                        </div>
                    )}

                    {submitStatus === SUBMIT_STATUS.AUTHENTICATING && (
                        <div className="submit-loading">
                            <div className="loading-spinner" />
                            <span>인증 중...</span>
                        </div>
                    )}

                    {submitStatus === SUBMIT_STATUS.SUBMITTING && (
                        <div className="submit-loading">
                            <div className="loading-spinner" />
                            <span>서버 검증 중...</span>
                            <p className="submit-note">거래 로그 리플레이를 통해 점수를 계산합니다.</p>
                        </div>
                    )}

                    {submitStatus === SUBMIT_STATUS.SUCCESS && submitResult && (
                        <div className="submit-success">
                            <div className="success-icon">✅</div>
                            <div className="success-message">
                                {submitResult.isNewHighScore ? (
                                    <span className="new-highscore">신기록 달성!</span>
                                ) : (
                                    <span>점수가 등록되었습니다.</span>
                                )}
                            </div>
                            <div className="result-stats">
                                <div className="result-item">
                                    <span className="result-label">순위</span>
                                    <span className="result-value rank">#{submitResult.rank}</span>
                                </div>
                                <div className="result-item">
                                    <span className="result-label">점수</span>
                                    <span className="result-value">{submitResult.score?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {submitStatus === SUBMIT_STATUS.ERROR && (
                        <div className="submit-error">
                            <div className="error-icon">⚠️</div>
                            <div className="error-message">{submitError}</div>
                            <button
                                className="btn-retry"
                                onClick={() => {
                                    setSubmitStatus(SUBMIT_STATUS.IDLE)
                                    setSubmitError(null)
                                }}
                            >
                                다시 시도
                            </button>
                        </div>
                    )}
                </div>

                <div className="season-end-actions">
                    <button className="btn-new-season" onClick={onStartNewSeason}>
                        {year + 1}년 시즌 시작
                    </button>
                    <button className="btn-continue" onClick={onClose}>
                        계속 진행
                    </button>
                </div>
            </div>
        </div>
    )
}
