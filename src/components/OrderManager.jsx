// 주문 관리 컴포넌트
import { useState } from 'react'
import { formatNumber } from '../utils'
import { getTickSize, getMinPrice, normalizePrice } from '../engine'
import { SHORT_SELLING } from '../constants'
import './OrderManager.css'

export default function OrderManager({
    stock,
    currentPrice,
    portfolio,
    shortPositions,
    cash,
    onPlaceOrder,
    onShortSell,
    onCoverShort,
    canShortSell,
    onClose,
    initialSide = 'buy'
}) {
    const stockType = stock.type || 'stock'
    const minPrice = getMinPrice(stockType)
    const normalizeTargetPrice = (value) => {
        const numeric = Number.isFinite(value) ? value : minPrice
        return normalizePrice(numeric, stockType)
    }

    // initialSide 정규화 (buy, sell, short, cover)
    const normalizedInitialSide = ['buy', 'sell', 'short', 'cover'].includes(initialSide)
        ? initialSide
        : 'buy'

    const [orderType, setOrderType] = useState('limit')
    const [side, setSide] = useState(normalizedInitialSide)
    const [quantity, setQuantity] = useState(1)
    const [targetPrice, setTargetPrice] = useState(() => normalizeTargetPrice(currentPrice))

    const normalizedTargetPrice = normalizeTargetPrice(targetPrice)
    const holding = portfolio?.[stock.id]
    const shortPosition = shortPositions?.[stock.id]
    const buyPriceBasis = orderType === 'limit' ? normalizedTargetPrice : currentPrice
    const maxBuyQty = Math.floor(cash / Math.max(buyPriceBasis, minPrice))
    const maxSellQty = holding?.quantity || 0
    const maxShortQty = Math.floor(cash / (currentPrice * SHORT_SELLING.marginRate))
    const maxCoverQty = shortPosition?.quantity || 0

    // 현재 side에 따른 최대 수량 계산
    const getMaxQty = () => {
        switch (side) {
            case 'buy': return maxBuyQty
            case 'sell': return maxSellQty
            case 'short': return maxShortQty
            case 'cover': return maxCoverQty
            default: return 0
        }
    }

    const handleSubmit = () => {
        if (quantity <= 0) return

        const maxQty = getMaxQty()
        if (quantity > maxQty) return

        // 공매도/청산은 즉시 실행
        if (side === 'short') {
            if (onShortSell) {
                onShortSell(stock, quantity)
                onClose()
            }
            return
        }

        if (side === 'cover') {
            if (onCoverShort) {
                onCoverShort(stock, quantity)
                onClose()
            }
            return
        }

        // 매수/매도는 지정가 주문
        onPlaceOrder({
            stockId: stock.id,
            stockName: stock.name,
            type: orderType,
            side,
            quantity,
            targetPrice: normalizedTargetPrice,
            createdAt: Date.now()
        })

        onClose()
    }

    // 버튼 텍스트 결정
    const getSubmitButtonText = () => {
        if (orderType === 'stopLoss') return '손절 주문 등록'
        if (orderType === 'takeProfit') return '익절 주문 등록'

        switch (side) {
            case 'buy': return '지정가 매수 주문'
            case 'sell': return '지정가 매도 주문'
            case 'short': return `🐻 공매도 ${quantity}주`
            case 'cover': return `🐻 청산 ${quantity}주`
            default: return '주문'
        }
    }

    // 수량 정보 텍스트
    const getQtyInfoText = () => {
        switch (side) {
            case 'buy': return `최대 ${maxBuyQty}주 매수 가능`
            case 'sell': return `보유 ${maxSellQty}주`
            case 'short': return `최대 ${maxShortQty}주 공매도 가능 (증거금 ${(SHORT_SELLING.marginRate * 100).toFixed(0)}%)`
            case 'cover': return `공매도 ${maxCoverQty}주 보유`
            default: return ''
        }
    }

    return (
        <div className="order-manager-overlay" onClick={onClose}>
            <div className="order-manager" onClick={e => e.stopPropagation()}>
                <div className="order-header">
                    <div className="order-stock-info">
                        <div className="order-stock-icon" style={{ background: stock.color }}>
                            {stock.code.slice(0, 2)}
                        </div>
                        <div>
                            <h3>{stock.name}</h3>
                            <span className="current-price">현재가: {formatNumber(currentPrice)}원</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="order-form">
                    {/* 주문 유형 */}
                    <div className="order-section">
                        <label>주문 유형</label>
                        <div className="order-type-buttons">
                            <button
                                className={`order-type-btn ${orderType === 'limit' ? 'active' : ''}`}
                                onClick={() => setOrderType('limit')}
                            >
                                📋 지정가
                            </button>
                            <button
                                className={`order-type-btn ${orderType === 'stopLoss' ? 'active' : ''}`}
                                onClick={() => { setOrderType('stopLoss'); setSide('sell') }}
                            >
                                🛑 손절
                            </button>
                            <button
                                className={`order-type-btn ${orderType === 'takeProfit' ? 'active' : ''}`}
                                onClick={() => { setOrderType('takeProfit'); setSide('sell') }}
                            >
                                🎯 익절
                            </button>
                        </div>
                    </div>

                    {/* 매수/매도/공매도/청산 */}
                    {orderType === 'limit' && (
                        <div className="order-section">
                            <label>주문 방향</label>
                            <div className="side-buttons">
                                <button
                                    className={`side-btn buy ${side === 'buy' ? 'active' : ''}`}
                                    onClick={() => setSide('buy')}
                                >
                                    매수
                                </button>
                                <button
                                    className={`side-btn sell ${side === 'sell' ? 'active' : ''}`}
                                    onClick={() => setSide('sell')}
                                    disabled={maxSellQty === 0}
                                >
                                    매도
                                </button>
                                <button
                                    className={`side-btn short ${side === 'short' ? 'active' : ''}`}
                                    onClick={() => setSide('short')}
                                    disabled={!canShortSell}
                                    title={!canShortSell ? `공매도는 Lv.${SHORT_SELLING.minLevel} 이상 필요` : ''}
                                >
                                    🐻 공매도
                                </button>
                                <button
                                    className={`side-btn cover ${side === 'cover' ? 'active' : ''}`}
                                    onClick={() => setSide('cover')}
                                    disabled={maxCoverQty === 0}
                                >
                                    🐻 청산
                                </button>
                            </div>
                            {!canShortSell && (side === 'short' || side === 'cover') && (
                                <div className="short-warning">
                                    ⚠️ 공매도는 Lv.{SHORT_SELLING.minLevel} 이상 필요합니다
                                </div>
                            )}
                        </div>
                    )}

                    {/* 목표가 (공매도/청산은 시장가) */}
                    {(side !== 'short' && side !== 'cover') && (
                        <div className="order-section">
                            <label>
                                {orderType === 'limit' && (side === 'buy' ? '매수 희망가' : '매도 희망가')}
                                {orderType === 'stopLoss' && '손절가 (이하 시 매도)'}
                                {orderType === 'takeProfit' && '익절가 (이상 시 매도)'}
                            </label>
                            <div className="price-input-group">
                                <button onClick={() => setTargetPrice(p => normalizeTargetPrice(p - getTickSize(Math.max(p, minPrice), stockType)))}>-</button>
                                <input
                                    type="number"
                                    min={minPrice}
                                    step={getTickSize(Math.max(normalizedTargetPrice, minPrice), stockType)}
                                    value={normalizedTargetPrice}
                                    onChange={(e) => {
                                        const next = parseFloat(e.target.value)
                                        if (Number.isNaN(next)) {
                                            setTargetPrice(minPrice)
                                            return
                                        }
                                        setTargetPrice(normalizeTargetPrice(next))
                                    }}
                                />
                                <button onClick={() => setTargetPrice(p => normalizeTargetPrice(p + getTickSize(Math.max(p, minPrice), stockType)))}>+</button>
                                <span className="price-unit">원</span>
                            </div>
                            <div className="price-diff">
                                현재가 대비: {((normalizedTargetPrice - currentPrice) / currentPrice * 100).toFixed(2)}%
                            </div>
                        </div>
                    )}

                    {/* 공매도/청산 시장가 안내 */}
                    {(side === 'short' || side === 'cover') && (
                        <div className="order-section">
                            <label>체결 가격</label>
                            <div className="market-price-info">
                                <span className="market-price-label">시장가 즉시 체결</span>
                                <span className="market-price-value">{formatNumber(currentPrice)}원</span>
                            </div>
                            {side === 'short' && (
                                <div className="margin-info">
                                    필요 증거금: {formatNumber(Math.ceil(currentPrice * quantity * SHORT_SELLING.marginRate))}원
                                </div>
                            )}
                            {side === 'cover' && shortPosition && (
                                <div className="pnl-preview">
                                    예상 손익: {formatNumber((shortPosition.entryPrice - currentPrice) * quantity)}원
                                </div>
                            )}
                        </div>
                    )}

                    {/* 수량 */}
                    <div className="order-section">
                        <label>수량</label>
                        <div className="qty-input-group">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                            <button onClick={() => setQuantity(q => q + 1)}>+</button>
                            <span className="qty-unit">주</span>
                        </div>
                        <div className="qty-info">
                            {getQtyInfoText()}
                        </div>
                    </div>

                    {/* 예상 금액 */}
                    <div className="order-summary">
                        <span>
                            {side === 'buy' && '예상 매수 금액'}
                            {side === 'sell' && '예상 매도 금액'}
                            {side === 'short' && '필요 증거금'}
                            {side === 'cover' && '예상 청산 금액'}
                        </span>
                        <span className="summary-value">
                            {side === 'short'
                                ? formatNumber(Math.ceil(currentPrice * quantity * SHORT_SELLING.marginRate))
                                : formatNumber((side === 'short' || side === 'cover' ? currentPrice : normalizedTargetPrice) * quantity)
                            }원
                        </span>
                    </div>

                    <button
                        className={`submit-order-btn ${side}`}
                        onClick={handleSubmit}
                        disabled={
                            quantity <= 0 ||
                            quantity > getMaxQty() ||
                            (side === 'short' && !canShortSell)
                        }
                    >
                        {getSubmitButtonText()}
                    </button>
                </div>
            </div>
        </div>
    )
}

// 예약 주문 목록
export function PendingOrders({ orders, stocks, onCancelOrder }) {
    if (!orders || orders.length === 0) return null

    return (
        <div className="pending-orders">
            <h4>📋 예약 주문 ({orders.length})</h4>
            <div className="pending-orders-list">
                {orders.map(order => {
                    const stock = stocks.find(s => s.id === order.stockId)
                    return (
                        <div key={order.id || order.createdAt} className={`pending-order ${order.type}`}>
                            <div className="pending-order-info">
                                <span className="order-badge">
                                    {order.type === 'limit' && '지정가'}
                                    {order.type === 'stopLoss' && '🛑 손절'}
                                    {order.type === 'takeProfit' && '🎯 익절'}
                                </span>
                                <span className="order-stock">{stock?.name || '알 수 없음'}</span>
                                <span className="order-details">
                                    {order.side === 'buy' ? '매수' : '매도'} {order.quantity}주 @ {formatNumber(order.targetPrice)}원
                                </span>
                            </div>
                            <button className="cancel-order-btn" onClick={() => onCancelOrder(order)}>
                                취소
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
