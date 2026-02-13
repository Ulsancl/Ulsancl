/**
 * DashboardPanel - 대시보드 패널 컴포넌트
 * 총 자산, 수익률, 현금, 투자금 표시 및 신용거래 섹션
 */
import React, { memo, useCallback } from 'react'
import { formatCompact, formatPercent } from '../utils'

const DashboardPanel = memo(function DashboardPanel({
    totalAssets,
    profitRate,
    cash,
    stockValue,
    canUseCredit,
    marginCallActive,
    creditUsed,
    creditInterest,
    maxCreditLimit,
    availableCredit,
    onBorrowCredit,
    onRepayCredit,
    onShowAssetChart
}) {
    const handleBorrow = useCallback(() => {
        const amount = prompt('대출 금액을 입력하세요 (원)', String(Math.min(availableCredit, 10000000)))
        if (amount) onBorrowCredit(parseInt(amount, 10))
    }, [availableCredit, onBorrowCredit])

    const handleRepay = useCallback(() => {
        const amount = prompt('상환 금액을 입력하세요 (원)', String(Math.min(cash, creditUsed + creditInterest)))
        if (amount) onRepayCredit(parseInt(amount, 10))
    }, [cash, creditUsed, creditInterest, onRepayCredit])

    return (
        <section className="dashboard" data-testid="dashboard-panel">
            <div className="dashboard-grid">
                <div
                    className="stat-card stat-total"
                    onClick={onShowAssetChart}
                    style={{ cursor: 'pointer' }}
                    data-testid="open-asset-chart"
                >
                    <div className="stat-label">총 자산</div>
                    <div className="stat-value" data-testid="total-assets-value">{formatCompact(totalAssets)}</div>
                </div>
                <div className={`stat-card stat-profit ${profitRate >= 0 ? 'positive' : 'negative'}`}>
                    <div className="stat-label">수익률</div>
                    <div className="stat-value" data-testid="profit-rate-value">{formatPercent(profitRate)}</div>
                </div>
                <div className="stat-card stat-cash">
                    <div className="stat-label">현금</div>
                    <div className="stat-value" data-testid="cash-value">{formatCompact(cash)}</div>
                </div>
                <div className="stat-card stat-stock">
                    <div className="stat-label">투자금</div>
                    <div className="stat-value" data-testid="stock-value">{formatCompact(stockValue)}</div>
                </div>
            </div>

            {/* 신용 거래 섹션 */}
            {canUseCredit && (
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
                            onClick={handleBorrow}
                            disabled={availableCredit <= 0}
                        >
                            💵 대출
                        </button>
                        <button
                            className="credit-btn repay"
                            onClick={handleRepay}
                            disabled={creditUsed + creditInterest <= 0}
                        >
                            💰 상환
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
})

export default DashboardPanel
