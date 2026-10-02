import { useMemo } from 'react'
import { formatNumber } from '../utils'
import { getTickSize } from '../engine/priceCalculator'
import { formatChartPrice } from '../utils/chart-observations'
import './OrderBook.css'

const seededRandom = seed => {
    const value = Math.sin(seed) * 10000
    return value - Math.floor(value)
}

// Display-only depth. It neither consumes the market PRNG nor executes orders.
export function buildIllustrativeOrderBook(stock, centerPrice) {
    if (!Number.isFinite(centerPrice) || centerPrice <= 0) return { asks: [], bids: [] }
    const adjacentPrice = (price, direction) => {
        const epsilon = Math.max(Number.EPSILON * Math.abs(price) * 16, getTickSize(price, stock.type) * 1e-9)
        const tick = getTickSize(direction > 0 ? price : price - epsilon, stock.type)
        const index = direction > 0 ? Math.floor((price + epsilon) / tick) + 1 : Math.ceil((price - epsilon) / tick) - 1
        const candidate = Number((index * tick).toFixed(8))
        const nextTick = getTickSize(candidate, stock.type)
        return Number(((direction > 0 ? Math.ceil(candidate / nextTick - 1e-8) : Math.floor(candidate / nextTick + 1e-8)) * nextTick).toFixed(8))
    }
    const seed = [...String(stock.id)].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 100000, 7)
    const level = (price, offset) => ({
        price,
        amount: Math.floor((500 + seededRandom(seed) * 1500) * Math.max(.3, 1 - offset * .07)
            * (.7 + seededRandom(seed + price) * .6))
    })
    const asks = [], bids = []
    let ask = centerPrice, bid = centerPrice
    for (let i = 0; i < 10; i++) {
        ask = adjacentPrice(ask, 1)
        asks.push(level(ask, i))
        bid = adjacentPrice(bid, -1)
        if (bid > 0) bids.push(level(bid, i))
    }
    return { asks: asks.reverse(), bids }
}

export default function OrderBook({ stock, currentPrice }) {
    const { asks, bids } = useMemo(() => buildIllustrativeOrderBook({ id: stock.id, type: stock.type }, currentPrice), [stock.id, stock.type, currentPrice])
    const maxVolume = Math.max(1, ...asks.map(level => level.amount), ...bids.map(level => level.amount))
    const lowestAsk = asks.at(-1)?.price
    const highestBid = bids[0]?.price
    const rows = (levels, side, nearest) => levels.map(level => <div key={level.price}
        className={`order-row ${side} ${level.price === nearest ? 'nearest' : ''}`} data-price={level.price}>
        <span className="order-price">{formatChartPrice(level.price)}</span>
        <span className="order-amount">{formatNumber(level.amount)}</span>
        <span className={`volume-bar ${side}`} style={{ width: `${level.amount / maxVolume * 100}%` }} />
    </div>)
    return <div className="order-book">
        <p className="order-book-note">표시용 가상 호가 · 실제 주문 잔량 아님</p>
        <div className="order-book-header"><span>가격 · 원</span><span>예시 수량</span></div>
        <div className="order-book-content">
            <div className="asks-container">{rows(asks, 'ask', lowestAsk)}</div>
            <div className="current-price-display">
                <strong>{formatChartPrice(currentPrice)}</strong>
                <span className="spread-info">간격: {lowestAsk !== undefined && highestBid !== undefined
                    ? formatChartPrice(Number((lowestAsk - highestBid).toFixed(8))) : '—'}</span>
            </div>
            <div className="bids-container">{rows(bids, 'bid', highestBid)}</div>
        </div>
    </div>
}
