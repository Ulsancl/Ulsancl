/**
 * CrisisUI - 위기 이벤트 UI 컴포넌트
 * 활성 위기 상태 표시 및 위기 알림
 */
import React, { memo, useEffect, useState } from 'react'
import { CRISIS_TYPES, BOOM_EVENTS, getActiveCrisis } from '../game/CrisisEvents'
import './CrisisUI.css'

/**
 * 위기 알림 배너
 */
export const CrisisAlert = memo(function CrisisAlert({ crisis, onClose }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (crisis) {
            setIsVisible(true)
            const timer = setTimeout(() => setIsVisible(false), 10000)
            return () => clearTimeout(timer)
        }
    }, [crisis?.id])

    if (!crisis || !isVisible) return null

    const isPositive = crisis.baseImpact && crisis.baseImpact[0] > 0
    const alertClass = isPositive ? 'crisis-alert positive' : 'crisis-alert negative'

    return (
        <div className={alertClass}>
            <div className="crisis-alert-content">
                <span className="crisis-icon">{crisis.icon}</span>
                <div className="crisis-alert-text">
                    <span className="crisis-title">
                        {isPositive ? '🎉 호재 발생!' : '🚨 위기 발생!'}
                    </span>
                    <span className="crisis-name">{crisis.name}</span>
                </div>
                <button className="crisis-close" onClick={() => { setIsVisible(false); onClose?.() }}>×</button>
            </div>
            <div className="crisis-alert-bar">
                <div className="crisis-alert-progress" style={{ animationDuration: '10s' }} />
            </div>
        </div>
    )
})

/**
 * 활성 위기 상태 표시 위젯
 */
export const CrisisStatusWidget = memo(function CrisisStatusWidget({ crisis }) {
    if (!crisis) return null

    const { phase, daysRemaining, currentImpact, name, icon, severity } = crisis
    const isPositive = currentImpact > 0

    const phaseLabels = {
        onset: '시작 단계',
        peak: '절정 단계',
        recovery: '회복 단계'
    }

    const severityColors = {
        extreme: '#ef5350',
        high: '#ff9800',
        medium: '#ffc107',
        positive: '#26a69a'
    }

    const progressPercent = phase === 'onset' ? 30 : phase === 'peak' ? 60 : 90
    const impactPercent = Math.abs(currentImpact * 100).toFixed(1)

    return (
        <div className={`crisis-status-widget ${isPositive ? 'positive' : 'negative'}`}>
            <div className="crisis-status-header">
                <span className="crisis-icon-large">{icon}</span>
                <div className="crisis-status-info">
                    <span className="crisis-status-name">{name}</span>
                    <span className="crisis-status-phase" style={{ color: severityColors[severity] || severityColors.medium }}>
                        {phaseLabels[phase] || phase}
                    </span>
                </div>
            </div>

            <div className="crisis-status-details">
                <div className="crisis-detail-row">
                    <span className="detail-label">시장 영향</span>
                    <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : '-'}{impactPercent}%
                    </span>
                </div>
                <div className="crisis-detail-row">
                    <span className="detail-label">남은 기간</span>
                    <span className="detail-value">{daysRemaining || '?'}일</span>
                </div>
            </div>

            <div className="crisis-progress-bar">
                <div className="crisis-phase-markers">
                    <span className={phase === 'onset' ? 'active' : ''}>시작</span>
                    <span className={phase === 'peak' ? 'active' : ''}>절정</span>
                    <span className={phase === 'recovery' ? 'active' : ''}>회복</span>
                </div>
                <div className="crisis-progress-track">
                    <div
                        className="crisis-progress-fill"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundColor: isPositive ? '#26a69a' : severityColors[severity] || '#ff9800'
                        }}
                    />
                </div>
            </div>

            {/* 영향받는 섹터 표시 */}
            {crisis.affectedSectors && (
                <div className="crisis-affected-sectors">
                    <span className="affected-label">영향 섹터:</span>
                    <div className="affected-tags">
                        {crisis.affectedSectors.map(sector => (
                            <span key={sector} className="sector-tag negative">{sector}</span>
                        ))}
                        {crisis.benefitSectors?.map(sector => (
                            <span key={sector} className="sector-tag positive">{sector}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
})

/**
 * 위기 히스토리 패널
 */
export const CrisisHistory = memo(function CrisisHistory({ crisisHistory = [] }) {
    if (crisisHistory.length === 0) {
        return (
            <div className="crisis-history empty">
                <span className="empty-icon">📊</span>
                <span>아직 발생한 위기가 없습니다</span>
            </div>
        )
    }

    return (
        <div className="crisis-history">
            <h3 className="crisis-history-title">📜 위기 히스토리</h3>
            <div className="crisis-history-list">
                {crisisHistory.slice(-10).reverse().map((crisis, idx) => {
                    const isPositive = crisis.impact > 0
                    return (
                        <div key={idx} className={`crisis-history-item ${isPositive ? 'positive' : 'negative'}`}>
                            <span className="history-icon">{crisis.icon}</span>
                            <div className="history-info">
                                <span className="history-name">{crisis.name}</span>
                                <span className="history-date">Day {crisis.startDay}</span>
                            </div>
                            <span className={`history-impact ${isPositive ? 'positive' : 'negative'}`}>
                                {isPositive ? '+' : ''}{(crisis.impact * 100).toFixed(1)}%
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

/**
 * 위기 발생 확률 미터 (긴장감 연출용)
 */
export const CrisisProbabilityMeter = memo(function CrisisProbabilityMeter({ marketState }) {
    const { volatility = 1, trend = 0 } = marketState || {}

    // 위기 발생 위험도 계산 (0-100)
    const riskLevel = Math.min(100, Math.max(0,
        (volatility - 1) * 50 + // 변동성 기여
        Math.abs(trend) * 30 +   // 강한 트렌드
        Math.random() * 10       // 약간의 랜덤성
    ))

    const riskLabel = riskLevel < 30 ? '안정' : riskLevel < 60 ? '주의' : riskLevel < 80 ? '경계' : '위험'
    const riskColor = riskLevel < 30 ? '#26a69a' : riskLevel < 60 ? '#ffc107' : riskLevel < 80 ? '#ff9800' : '#ef5350'

    return (
        <div className="crisis-probability-meter">
            <div className="meter-header">
                <span className="meter-label">시장 불안정 지수</span>
                <span className="meter-value" style={{ color: riskColor }}>{riskLabel}</span>
            </div>
            <div className="meter-bar">
                <div
                    className="meter-fill"
                    style={{
                        width: `${riskLevel}%`,
                        backgroundColor: riskColor
                    }}
                />
            </div>
            <div className="meter-scale">
                <span>안정</span>
                <span>위험</span>
            </div>
        </div>
    )
})

export default {
    CrisisAlert,
    CrisisStatusWidget,
    CrisisHistory,
    CrisisProbabilityMeter
}
