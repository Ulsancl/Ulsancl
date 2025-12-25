/**
 * DashboardCard - 대시보드 통계 카드 컴포넌트
 */
import React, { memo } from 'react'
import { formatCompact, formatPercent, formatNumber } from '../utils'
import { CREDIT_TRADING } from '../constants'

// 통계 카드
export const StatCard = memo(({ label, value, variant = '', onClick, clickable = false }) => (
    <div
        className={`stat-card ${variant}`}
        onClick={onClick}
        style={clickable ? { cursor: 'pointer' } : {}}
    >
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
    </div>
))

StatCard.displayName = 'StatCard'

// 대시보드 그리드
export const DashboardGrid = memo(({
    totalAssets,
    profitRate,
    cash,
    stockValue,
    onAssetClick
}) => (
    <div className="dashboard-grid">
        <StatCard
            label="총 자산"
            value={formatCompact(totalAssets)}
            variant="stat-total"
            onClick={onAssetClick}
            clickable
        />
        <StatCard
            label="수익률"
            value={formatPercent(profitRate)}
            variant={`stat-profit ${profitRate >= 0 ? 'positive' : 'negative'}`}
        />
        <StatCard
            label="현금"
            value={formatCompact(cash)}
            variant="stat-cash"
        />
        <StatCard
            label="투자금"
            value={formatCompact(stockValue)}
            variant="stat-stock"
        />
    </div>
))

DashboardGrid.displayName = 'DashboardGrid'

// 신용 거래 카드
export const CreditTradingCard = memo(({
    canUseCredit,
    marginCallActive,
    creditUsed,
    creditInterest,
    maxCreditLimit,
    availableCredit,
    cash,
    onBorrow,
    onRepay
}) => {
    if (!canUseCredit) return null

    return (
        <div className={`credit-trading-card ${marginCallActive ? 'margin-call' : ''}`}>
            <div className="credit-header">
                <span className="credit-title">💳 신용 거래</span>
                {marginCallActive && <span className="margin-call-badge">⚠️ 마진콜</span>}
            </div>
            <div className="credit-info-grid">
                <div className="credit-info">
                    <span className="credit-label">대출금</span>
                    <span className="credit-value negative">{formatCompact(creditUsed)}</span>
                </div>
                <div className="credit-info">
                    <span className="credit-label">이자</span>
                    <span className="credit-value negative">{formatCompact(creditInterest)}</span>
                </div>
                <div className="credit-info">
                    <span className="credit-label">한도</span>
                    <span className="credit-value">{formatCompact(maxCreditLimit)}</span>
                </div>
                <div className="credit-info">
                    <span className="credit-label">가용</span>
                    <span className="credit-value positive">{formatCompact(availableCredit)}</span>
                </div>
            </div>
            <div className="credit-actions">
                <button
                    className="credit-btn borrow"
                    onClick={() => {
                        const amount = prompt('대출 금액을 입력하세요 (원)', String(Math.min(availableCredit, 10000000)))
                        if (amount) onBorrow(parseInt(amount))
                    }}
                    disabled={availableCredit <= 0}
                >
                    💵 대출
                </button>
                <button
                    className="credit-btn repay"
                    onClick={() => {
                        const amount = prompt('상환 금액을 입력하세요 (원)', String(Math.min(cash, creditUsed + creditInterest)))
                        if (amount) onRepay(parseInt(amount))
                    }}
                    disabled={creditUsed + creditInterest <= 0}
                >
                    💰 상환
                </button>
            </div>
        </div>
    )
})

CreditTradingCard.displayName = 'CreditTradingCard'

export default { StatCard, DashboardGrid, CreditTradingCard }
