/**
 * StockListItem - 개별 주식 카드 컴포넌트
 * React.memo로 최적화되어 해당 주식의 props가 변경될 때만 리렌더링
 */
import React, { memo, useCallback } from 'react'
import { WatchButton } from './Watchlist'
import { formatNumber, formatPercent, formatCompact } from '../utils'
import { SHORT_SELLING } from '../constants'

const StockListItem = memo(function StockListItem({
    stock,
    index,
    isInitialized,
    holding,
    shortPosition,
    priceChange,
    isWatched,
    estimatedQty,
    tradeMode,
    cash,
    onToggleWatchlist,
    onShowChart,
    onBuy,
    onSellAll,
    onShortSell,
    onCoverShort,
    onOpenOrderManager,
    getProductTypeLabel
}) {
    const heldQty = holding?.quantity || 0
    const shortQty = shortPosition?.quantity || 0
    const shortPnl = shortPosition ? (shortPosition.entryPrice - stock.price) * shortPosition.quantity : 0

    const dailyChangeRate = stock.dailyOpen ? ((stock.price - stock.dailyOpen) / stock.dailyOpen) * 100 : 0
    const isUp = dailyChangeRate >= 0

    const handleBuy = useCallback(() => {
        onBuy(stock, estimatedQty)
    }, [stock, estimatedQty, onBuy])

    const handleSellAll = useCallback(() => {
        onSellAll(stock)
    }, [stock, onSellAll])

    const handleShortSell = useCallback(() => {
        onShortSell(stock, estimatedQty)
    }, [stock, estimatedQty, onShortSell])

    const handleCoverShort = useCallback(() => {
        onCoverShort(stock, shortQty)
    }, [stock, shortQty, onCoverShort])

    const handleShowChart = useCallback(() => {
        onShowChart(stock)
    }, [stock, onShowChart])

    const handleOpenOrderManager = useCallback(() => {
        onOpenOrderManager(stock, tradeMode === 'long' ? 'buy' : 'short')
    }, [stock, tradeMode, onOpenOrderManager])

    return (
        <div
            className={`stock-card stock-card-compact ${isInitialized ? 'initialized' : ''}`}
            style={{ '--animation-delay': `${index * 0.03}s` }}
        >
            <div className="stock-left">
                <div className="stock-header-row">
                    <WatchButton isWatched={isWatched} onClick={() => onToggleWatchlist(stock.id)} />
                    <div className="stock-icon" style={{ background: stock.color }}>{stock.code?.slice(0, 2)}</div>
                    <div className="stock-name-group">
                        <span className="stock-name">{stock.name}</span>
                        <span className="stock-code">{stock.code} · {getProductTypeLabel(stock.type)}</span>
                    </div>
                </div>
            </div>

            {/* 가격 정보 - 클릭하면 상세 차트 열림 */}
            <div className="stock-center" onClick={handleShowChart}>
                <div className={`stock-price ${isUp ? 'text-profit' : 'text-loss'} ${priceChange === 'up' ? 'flash-up' : priceChange === 'down' ? 'flash-down' : ''}`}>
                    {formatNumber(stock.price)}원
                </div>
                <div className={`stock-change ${isUp ? 'positive' : 'negative'}`}>
                    {isUp ? '▲' : '▼'} {formatPercent(dailyChangeRate)}
                </div>
            </div>

            {/* 일일 고가/저가 + 보유 정보 */}
            <div className="stock-meta">
                <div className="stock-ohlc-inline">
                    <span className="ohlc-mini high">H {formatCompact(stock.dailyHigh || stock.price)}</span>
                    <span className="ohlc-mini low">L {formatCompact(stock.dailyLow || stock.price)}</span>
                </div>
                {(heldQty > 0 || shortQty > 0) && (
                    <div className="stock-positions-inline">
                        {heldQty > 0 && <span className="pos-badge long">📈{heldQty}</span>}
                        {shortQty > 0 && <span className={`pos-badge short ${shortPnl >= 0 ? 'profit' : 'loss'}`}>🐻{shortQty}</span>}
                    </div>
                )}
            </div>

            <div className="stock-right">
                {/* 간소화된 퀵 버튼 */}
                <div className="quick-trade-buttons">
                    {tradeMode === 'long' ? (
                        <>
                            <button
                                className="quick-btn buy"
                                onClick={handleBuy}
                                disabled={cash < stock.price * estimatedQty || estimatedQty < 1}
                                title={`${estimatedQty}주 매수`}
                            >
                                매수
                            </button>
                            {heldQty > 0 && (
                                <button
                                    className="quick-btn sell-all"
                                    onClick={handleSellAll}
                                    title={`${heldQty}주 전량 매도`}
                                >
                                    전량매도
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                className="quick-btn short"
                                onClick={handleShortSell}
                                disabled={cash < stock.price * estimatedQty * SHORT_SELLING.marginRate || estimatedQty < 1}
                                title={`${estimatedQty}주 공매도`}
                            >
                                공매도
                            </button>
                            {shortQty > 0 && (
                                <button
                                    className="quick-btn cover-all"
                                    onClick={handleCoverShort}
                                    title={`${shortQty}주 전량 청산`}
                                >
                                    전량청산
                                </button>
                            )}
                        </>
                    )}
                </div>
                {/* 상세 주문 버튼 */}
                <button
                    className="detail-order-btn"
                    onClick={handleOpenOrderManager}
                    title="상세 주문"
                >
                    ⚙️
                </button>
            </div>
        </div>
    )
})

export default StockListItem
