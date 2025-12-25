import React, { useState, useEffect, useRef, useCallback } from 'react'
import { formatNumber } from './utils'
import './OrderBook.css'

// 호가 틱 사이즈 계산
function getTickSize(price) {
    if (price < 1000) return 1
    if (price < 5000) return 5
    if (price < 10000) return 10
    if (price < 50000) return 50
    if (price < 100000) return 100
    if (price < 500000) return 500
    return 1000
}

// 시드 기반 랜덤
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

export default function OrderBook({ stock, currentPrice }) {
    const [orderBook, setOrderBook] = useState({ asks: [], bids: [] })
    const prevPriceRef = useRef(currentPrice)
    const initRef = useRef(false)
    const stockIdRef = useRef(stock.id)

    // 호가 데이터 초기화/재생성
    const generateOrderBook = useCallback((centerPrice) => {
        const tickSize = getTickSize(centerPrice)
        const baseVolume = Math.floor(500 + seededRandom(stock.id) * 1500)

        const asks = []
        const bids = []

        // 현재가 기준으로 틱 단위 정렬
        const basePrice = Math.round(centerPrice / tickSize) * tickSize

        // 매도 호가 (현재가 위로 10단계) - 낮은 가격부터 높은 가격 순
        for (let i = 1; i <= 10; i++) {
            const price = basePrice + tickSize * i
            const distanceFactor = Math.max(0.3, 1 - (i * 0.07))
            const amount = Math.floor(baseVolume * distanceFactor * (0.7 + seededRandom(stock.id + i) * 0.6))
            asks.push({ price, amount, originalAmount: amount })
        }

        // 매수 호가 (현재가 아래로 10단계) - 높은 가격부터 낮은 가격 순
        for (let i = 1; i <= 10; i++) {
            const price = basePrice - tickSize * i
            if (price <= 0) continue
            const distanceFactor = Math.max(0.3, 1 - (i * 0.07))
            const amount = Math.floor(baseVolume * distanceFactor * (0.7 + seededRandom(stock.id + i + 100) * 0.6))
            bids.push({ price, amount, originalAmount: amount })
        }

        // 매도호가: 높은 가격 → 낮은 가격 (위에서 아래로)
        asks.sort((a, b) => b.price - a.price)
        // 매수호가: 높은 가격 → 낮은 가격 (위에서 아래로)
        bids.sort((a, b) => b.price - a.price)

        return { asks, bids }
    }, [stock.id])

    // 주식 변경 또는 초기화
    useEffect(() => {
        if (stockIdRef.current !== stock.id) {
            stockIdRef.current = stock.id
            initRef.current = false
        }

        if (!initRef.current) {
            setOrderBook(generateOrderBook(currentPrice))
            prevPriceRef.current = currentPrice
            initRef.current = true
        }
    }, [stock.id, currentPrice, generateOrderBook])

    // 가격 변동에 따른 호가 업데이트
    useEffect(() => {
        if (!initRef.current) return

        const prevPrice = prevPriceRef.current
        const priceDiff = currentPrice - prevPrice
        const tickSize = getTickSize(currentPrice)

        // 가격이 크게 변했으면 호가창 재생성
        if (Math.abs(priceDiff) > tickSize * 3) {
            setOrderBook(generateOrderBook(currentPrice))
            prevPriceRef.current = currentPrice
            return
        }

        if (Math.abs(priceDiff) < tickSize * 0.1) {
            prevPriceRef.current = currentPrice
            return
        }

        setOrderBook(prev => {
            let { asks, bids } = {
                asks: prev.asks.map(a => ({ ...a })),
                bids: prev.bids.map(b => ({ ...b }))
            }

            const basePrice = Math.round(currentPrice / tickSize) * tickSize

            if (priceDiff > 0) {
                // 가격 상승 = 매도 호가 소진
                // 현재가보다 낮은 매도호가 제거 (체결됨)
                asks = asks.filter(a => a.price > basePrice)

                // 최저 매도호가 수량 감소
                if (asks.length > 0) {
                    const lowestAsk = asks[asks.length - 1]
                    const consumed = Math.floor(lowestAsk.amount * (0.15 + seededRandom(Date.now()) * 0.25))
                    lowestAsk.amount = Math.max(10, lowestAsk.amount - consumed)
                    lowestAsk.consuming = true // 소진 중 표시
                }

                // 위에 새 매도호가 추가
                while (asks.length < 10) {
                    const topPrice = asks.length > 0 ? asks[0].price + tickSize : basePrice + tickSize * 11
                    const newAmount = Math.floor(200 + seededRandom(Date.now() + asks.length) * 1500)
                    asks.unshift({ price: topPrice, amount: newAmount, originalAmount: newAmount, isNew: true })
                }

                // 매수호가 조정 - 새로운 최고가 추가
                while (bids.length > 0 && bids[0].price >= basePrice) {
                    bids.shift()
                }
                while (bids.length < 10) {
                    const topBidPrice = bids.length > 0 ? bids[0].price + tickSize : basePrice - tickSize
                    if (topBidPrice > 0) {
                        const newAmount = Math.floor(300 + seededRandom(Date.now() + bids.length + 50) * 1200)
                        bids.unshift({ price: topBidPrice, amount: newAmount, originalAmount: newAmount, isNew: true })
                    } else {
                        break
                    }
                }
                // 초과분 제거
                bids = bids.slice(0, 10)
            } else if (priceDiff < 0) {
                // 가격 하락 = 매수 호가 소진
                // 현재가보다 높은 매수호가 제거 (체결됨)
                bids = bids.filter(b => b.price < basePrice)

                // 최고 매수호가 수량 감소 (더 공격적으로)
                if (bids.length > 0) {
                    const highestBid = bids[0]
                    const consumed = Math.floor(highestBid.amount * (0.25 + seededRandom(Date.now()) * 0.35))
                    highestBid.amount = Math.max(10, highestBid.amount - consumed)
                    highestBid.consuming = true
                }

                // 아래에 새 매수호가 추가
                while (bids.length < 10) {
                    const bottomPrice = bids.length > 0 ? bids[bids.length - 1].price - tickSize : basePrice - tickSize * 11
                    if (bottomPrice > 0) {
                        const newAmount = Math.floor(200 + seededRandom(Date.now() + bids.length) * 1500)
                        bids.push({ price: bottomPrice, amount: newAmount, originalAmount: newAmount, isNew: true })
                    } else {
                        break
                    }
                }

                // 매도호가 조정 - 새로운 최저가 추가
                while (asks.length > 0 && asks[asks.length - 1].price <= basePrice) {
                    asks.pop()
                }
                while (asks.length < 10) {
                    const bottomAskPrice = asks.length > 0 ? asks[asks.length - 1].price - tickSize : basePrice + tickSize
                    const newAmount = Math.floor(300 + seededRandom(Date.now() + asks.length + 50) * 1200)
                    asks.push({ price: bottomAskPrice, amount: newAmount, originalAmount: newAmount, isNew: true })
                }
                asks.sort((a, b) => b.price - a.price)
                asks = asks.slice(0, 10)
            }

            // 실시간 수량 변동 (모든 호가에 랜덤 변화)
            asks = asks.map((ask, i) => {
                const change = Math.floor((seededRandom(Date.now() + i * 7) - 0.45) * 80)
                return {
                    ...ask,
                    amount: Math.max(5, ask.amount + change),
                    isNew: false,
                    consuming: false
                }
            })
            bids = bids.map((bid, i) => {
                const change = Math.floor((seededRandom(Date.now() + i * 11 + 200) - 0.45) * 80)
                return {
                    ...bid,
                    amount: Math.max(5, bid.amount + change),
                    isNew: false,
                    consuming: false
                }
            })

            // 정렬 확인
            asks.sort((a, b) => b.price - a.price)
            bids.sort((a, b) => b.price - a.price)

            return { asks, bids }
        })

        prevPriceRef.current = currentPrice
    }, [currentPrice, generateOrderBook])

    const { asks, bids } = orderBook

    const maxVolume = Math.max(
        ...asks.map(a => a.originalAmount || a.amount || 1),
        ...bids.map(b => b.originalAmount || b.amount || 1),
        1
    )

    // 현재가 기준 최근접 호가
    const lowestAsk = asks.length > 0 ? asks[asks.length - 1]?.price : null
    const highestBid = bids.length > 0 ? bids[0]?.price : null

    return (
        <div className="order-book">
            <div className="order-book-header">
                <span>호가</span>
                <span>잔량</span>
            </div>
            <div className="order-book-content">
                {/* 매도 호가 (Asks) - 위쪽: 높은가격→낮은가격 */}
                <div className="asks-container">
                    {asks.map((ask, i) => (
                        <div key={`ask-${i}`} className={`order-row ask ${ask.price === lowestAsk ? 'nearest' : ''}`}>
                            <div className="order-price">{formatNumber(ask.price)}</div>
                            <div className="order-amount">
                                {formatNumber(ask.amount)}
                            </div>
                            <div
                                className="volume-bar ask"
                                style={{ width: `${(ask.amount / maxVolume) * 100}%` }}
                            />
                        </div>
                    ))}
                </div>

                {/* 현재가 표시 */}
                <div className="current-price-display">
                    <strong className={currentPrice >= prevPriceRef.current ? 'up' : 'down'}>
                        {formatNumber(currentPrice)}
                    </strong>
                    <span className="spread-info">
                        스프레드: {lowestAsk && highestBid ? formatNumber(lowestAsk - highestBid) : '-'}
                    </span>
                </div>

                {/* 매수 호가 (Bids) - 아래쪽: 높은가격→낮은가격 */}
                <div className="bids-container">
                    {bids.map((bid, i) => (
                        <div key={`bid-${i}`} className={`order-row bid ${bid.price === highestBid ? 'nearest' : ''}`}>
                            <div className="order-price">{formatNumber(bid.price)}</div>
                            <div className="order-amount">
                                {formatNumber(bid.amount)}
                            </div>
                            <div
                                className="volume-bar bid"
                                style={{ width: `${(bid.amount / maxVolume) * 100}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
