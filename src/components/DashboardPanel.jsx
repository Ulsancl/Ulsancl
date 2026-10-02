/**
 * DashboardPanel - 대시보드 패널 컴포넌트
 * 총 자산, 수익률, 현금, 투자금 표시 및 신용거래 섹션
 */
import React, { memo, useCallback } from 'react'
import { formatCompact, formatPercent, formatNumber } from '../utils'

const DashboardPanel = memo(function DashboardPanel({
    totalAssets,
    profitRate,
    cash,
    stockValue,
    shortMargin = 0, shortValue = 0, leverageDebt = 0,
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
                    role="button" tabIndex={0} aria-label="자산 변동 기록 열기"
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onShowAssetChart?.() } }}
                    style={{ cursor: 'pointer' }}
                    data-testid="open-asset-chart"
                >
                    <div className="stat-label">순자산</div>
                    <div className="stat-value" data-testid="total-assets-value" data-value={totalAssets} title={`${formatNumber(totalAssets)}원`}>{formatCompact(totalAssets)}</div>
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
                    <div className="stat-label">보유 상품 평가액</div>
                    <div className="stat-value" data-testid="stock-value">{formatCompact(stockValue)}</div>
                </div>
            </div>

            <details className="account-detail" data-testid="account-detail">
                <summary>순자산 구성 <span>현재 평가액 · 원</span></summary>
                <div className="account-detail-grid">
                    {[
                        ['cash', '현금', cash], ['longValue', '보유 상품 평가액', stockValue],
                        ['shortMargin', '공매도 예치금', shortMargin], ['shortValue', '공매도 미실현 손익', shortValue],
                        ['creditUsed', '신용 대출 차감', -(creditUsed || 0)], ['creditInterest', '미지급 이자 차감', -(creditInterest || 0)],
                        ['leverageDebt', '레버리지 차입금 차감', -leverageDebt], ['totalAssets', '순자산 합계', totalAssets]
                    ].map(([id, label, value]) => <div key={id}><span>{label}</span><output data-account-key={id} data-value={value} data-unit="KRW">{formatNumber(Object.is(value, -0) ? 0 : value)}원</output></div>)}
                </div>
                <p>공매도 예치금과 평가손익을 합산하고 모든 차입금을 차감합니다. 자산 변동 차트는 일정 간격의 기록을 보여 줍니다.</p>
            </details>

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
