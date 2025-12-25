/**
 * TradeModeSection - 거래 모드 및 수량/금액 입력 섹션
 */
import React, { memo, useCallback, useMemo } from 'react'
import { SHORT_SELLING, LEVERAGE_OPTIONS } from '../constants'

const TradeModeSection = memo(function TradeModeSection({
    tradeMode,
    amountMode,
    quantity,
    inputAmount,
    leverage,
    canShortSell,
    onTradeModeChange,
    onAmountModeChange,
    onQuantityChange,
    onInputAmountChange,
    onLeverageChange
}) {
    const quickAmounts = useMemo(() => [100000, 500000, 1000000, 5000000, 10000000], [])

    const handleInputChange = useCallback((e) => {
        const val = e.target.value.replace(/[^0-9]/g, '')
        onInputAmountChange(val)
    }, [onInputAmountChange])

    const handleQuickAmount = useCallback((amount) => {
        const current = parseInt(inputAmount) || 0
        onInputAmountChange(String(current + amount))
    }, [inputAmount, onInputAmountChange])

    const handleClearAmount = useCallback(() => {
        onInputAmountChange('')
    }, [onInputAmountChange])

    return (
        <section className="trade-mode-section">
            <div className="trade-mode-toggle">
                <button
                    className={`mode-btn ${tradeMode === 'long' ? 'active' : ''}`}
                    onClick={() => onTradeModeChange('long')}
                >
                    📈 롱
                </button>
                <button
                    className={`mode-btn short ${tradeMode === 'short' ? 'active' : ''} ${!canShortSell ? 'disabled' : ''}`}
                    onClick={() => canShortSell && onTradeModeChange('short')}
                    title={!canShortSell ? `Lv.${SHORT_SELLING.minLevel} 필요` : ''}
                >
                    🐻 숏
                </button>
            </div>

            <div className="trade-mode-toggle">
                <button
                    className={`mode-btn ${!amountMode ? 'active' : ''}`}
                    onClick={() => onAmountModeChange(false)}
                >
                    수량
                </button>
                <button
                    className={`mode-btn ${amountMode ? 'active' : ''}`}
                    onClick={() => onAmountModeChange(true)}
                >
                    금액
                </button>
            </div>

            {amountMode ? (
                <div className="amount-input-section">
                    <input
                        type="text"
                        className="amount-input"
                        value={inputAmount ? parseInt(inputAmount).toLocaleString() : ''}
                        onChange={handleInputChange}
                        placeholder="금액 입력"
                    />
                    <div className="quick-amounts">
                        {quickAmounts.map(amount => (
                            <button key={amount} onClick={() => handleQuickAmount(amount)}>
                                +{amount >= 10000000 ? '1천만' : amount >= 1000000 ? `${amount / 1000000}백만` : `${amount / 10000}만`}
                            </button>
                        ))}
                        <button className="clear-btn" onClick={handleClearAmount}>C</button>
                    </div>
                </div>
            ) : (
                <div className="quantity-section">
                    <button
                        className="qty-btn"
                        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    >
                        -
                    </button>
                    <span className="qty-display">{quantity}주</span>
                    <button
                        className="qty-btn"
                        onClick={() => onQuantityChange(quantity + 1)}
                    >
                        +
                    </button>
                    <button
                        className="qty-btn-quick"
                        onClick={() => onQuantityChange(quantity + 10)}
                    >
                        +10
                    </button>
                    <button
                        className="qty-btn-quick"
                        onClick={() => onQuantityChange(quantity + 100)}
                    >
                        +100
                    </button>
                </div>
            )}

            <select
                className="leverage-select"
                value={leverage}
                onChange={(e) => onLeverageChange(e.target.value)}
            >
                {LEVERAGE_OPTIONS.map(l => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                ))}
            </select>
        </section>
    )
})

export default TradeModeSection
