// 주문 관리 컴포넌트
import { useState } from 'react'
import { formatNumber } from './utils'
import { getTickSize, getMinPrice, normalizePrice } from './engine'
import './OrderManager.css'

export default function OrderManager({ stock, currentPrice, portfolio, cash, onPlaceOrder, onClose, initialSide = 'buy' }) {
    const stockType = stock.type || 'stock'
    const minPrice = getMinPrice(stockType)
    const normalizeTargetPrice = (value) => {
        const numeric = Number.isFinite(value) ? value : minPrice
        return normalizePrice(numeric, stockType)
    }
    const normalizedInitialSide = initialSide === 'buy' ? 'buy' : 'sell'

    const [orderType, setOrderType] = useState('limit')
    const [side, setSide] = useState(normalizedInitialSide)
    const [quantity, setQuantity] = useState(1)
    const [targetPrice, setTargetPrice] = useState(() => normalizeTargetPrice(currentPrice))

    const normalizedTargetPrice = normalizeTargetPrice(targetPrice)
    const holding = portfolio?.[stock.id]
    const buyPriceBasis = orderType === 'limit' ? normalizedTargetPrice : currentPrice
    const maxBuyQty = Math.floor(cash / Math.max(buyPriceBasis, minPrice))
    const maxSellQty = holding?.quantity || 0

    const handleSubmit = () => {
        if (quantity <= 0) return
        if (side === 'buy' && quantity > maxBuyQty) return
        if (side === 'sell' && quantity > maxSellQty) return

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

                    {/* 매수/매도 */}
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
                            </div>
                        </div>
                    )}

                    {/* 목표가 */}
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
                            {side === 'buy' ? `최대 ${maxBuyQty}주 매수 가능` : `보유 ${maxSellQty}주`}
                        </div>
                    </div>

                    {/* 예상 금액 */}
                    <div className="order-summary">
                        <span>예상 {side === 'buy' ? '매수' : '매도'} 금액</span>
                        <span className="summary-value">{formatNumber(normalizedTargetPrice * quantity)}원</span>
                    </div>

                    <button
                        className={`submit-order-btn ${side}`}
                        onClick={handleSubmit}
                        disabled={
                            quantity <= 0 ||
                            (side === 'buy' && quantity > maxBuyQty) ||
                            (side === 'sell' && quantity > maxSellQty)
                        }
                    >
                        {orderType === 'limit' && `지정가 ${side === 'buy' ? '매수' : '매도'} 주문`}
                        {orderType === 'stopLoss' && '손절 주문 등록'}
                        {orderType === 'takeProfit' && '익절 주문 등록'}
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
