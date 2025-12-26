/**
 * VirtualizedStockList - 자체 구현 가상화 주식 목록
 * 외부 의존성 없이 대량의 주식을 효율적으로 렌더링
 */
import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react'
import StockListItem from './StockListItem'

const ITEM_HEIGHT = 80 // 각 주식 카드의 높이
const OVERSCAN = 5 // 화면 밖 추가 렌더링 개수

/**
 * 가상화된 주식 리스트 컴포넌트
 */
const VirtualizedStockList = memo(function VirtualizedStockList({
    stocks,
    portfolio,
    shortPositions,
    priceChanges,
    watchlist,
    estimatedQty,
    tradeMode,
    cash,
    isInitialized,
    onToggleWatchlist,
    onShowChart,
    onBuy,
    onSellAll,
    onShortSell,
    onCoverShort,
    onOpenOrderManager,
    getProductTypeLabel,
    height = 600
}) {
    const containerRef = useRef(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(height)

    // 컨테이너 크기 감지
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height || height)
            }
        })

        observer.observe(container)
        return () => observer.disconnect()
    }, [height])

    // 스크롤 핸들러
    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop)
    }, [])

    // 보이는 아이템 범위 계산
    const { startIndex, endIndex, totalHeight } = useMemo(() => {
        const totalHeight = stocks.length * ITEM_HEIGHT
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
        const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + 2 * OVERSCAN
        const endIndex = Math.min(stocks.length - 1, startIndex + visibleCount)

        return { startIndex, endIndex, totalHeight }
    }, [stocks.length, scrollTop, containerHeight])

    // 보이는 아이템만 렌더링
    const visibleItems = useMemo(() => {
        const items = []
        for (let i = startIndex; i <= endIndex; i++) {
            const stock = stocks[i]
            if (!stock) continue

            items.push(
                <div
                    key={stock.id}
                    style={{
                        height: ITEM_HEIGHT,
                        position: 'absolute',
                        top: i * ITEM_HEIGHT,
                        left: 0,
                        right: 0
                    }}
                >
                    <StockListItem
                        stock={stock}
                        index={i}
                        isInitialized={isInitialized}
                        holding={portfolio[stock.id]}
                        shortPosition={shortPositions[stock.id]}
                        priceChange={priceChanges[stock.id]}
                        isWatched={watchlist.includes(stock.id)}
                        estimatedQty={estimatedQty}
                        tradeMode={tradeMode}
                        cash={cash}
                        onToggleWatchlist={onToggleWatchlist}
                        onShowChart={onShowChart}
                        onBuy={onBuy}
                        onSellAll={onSellAll}
                        onShortSell={onShortSell}
                        onCoverShort={onCoverShort}
                        onOpenOrderManager={onOpenOrderManager}
                        getProductTypeLabel={getProductTypeLabel}
                    />
                </div>
            )
        }
        return items
    }, [
        startIndex,
        endIndex,
        stocks,
        portfolio,
        shortPositions,
        priceChanges,
        watchlist,
        estimatedQty,
        tradeMode,
        cash,
        isInitialized,
        onToggleWatchlist,
        onShowChart,
        onBuy,
        onSellAll,
        onShortSell,
        onCoverShort,
        onOpenOrderManager,
        getProductTypeLabel
    ])

    if (stocks.length === 0) {
        return (
            <div className="empty-stock-list" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                color: '#888'
            }}>
                <p>📭 표시할 종목이 없습니다.</p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="virtualized-stock-list"
            style={{
                height: containerHeight,
                overflow: 'auto',
                position: 'relative'
            }}
            onScroll={handleScroll}
        >
            <div
                style={{
                    height: totalHeight,
                    position: 'relative'
                }}
            >
                {visibleItems}
            </div>
        </div>
    )
})

export default VirtualizedStockList
