/**
 * StockCard - 개별 주식 카드 컴포넌트
 * React.memo로 불필요한 리렌더링 방지
 * CSS Modules 사용
 */
import React, { memo } from 'react'
import styles from './StockCard.module.css'
import { formatNumber, formatPercent, formatCompact } from '../utils'
import { WatchButton } from './Watchlist'
import { SHORT_SELLING } from '../constants'

// 상품 타입 라벨
const getProductTypeLabel = (type) => {
    const labels = {
        stock: '주식',
        etf: 'ETF',
        crypto: '코인',
        bond: '채권',
        commodity: '원자재'
    }
    return labels[type] || '주식'
}

const StockCard = memo(({
    stock,
    index,
    isInitialized,
    holding,
    shortPos,
    priceChange,
    isWatched,
    estimatedQty,
    tradeMode,
    cash,
    onBuy,
    onSellAll,
    onShortSell,
    onCoverShort,
    onToggleWatchlist,
    onOpenChart,
    onOpenOrderManager
}) => {
    const dailyChangeRate = stock.dailyOpen
        ? ((stock.price - stock.dailyOpen) / stock.dailyOpen) * 100
        : 0
    const isUp = dailyChangeRate >= 0
    const heldQty = holding?.quantity || 0
    const shortQty = shortPos?.quantity || 0
    const shortPnl = shortPos ? (shortPos.entryPrice - stock.price) * shortPos.quantity : 0

    // CSS Module 클래스 조합
    const cardClassName = [
        styles.card,
        isInitialized ? styles.initialized : ''
    ].filter(Boolean).join(' ')

    const priceClassName = [
        styles.price,
        isUp ? styles.up : styles.down,
        priceChange === 'up' ? styles.flashUp : '',
        priceChange === 'down' ? styles.flashDown : ''
    ].filter(Boolean).join(' ')

    return (
        <div
            className={cardClassName}
            style={{ '--animation-delay': `${index * 0.03}s` }}
        >
            <div className={styles.left}>
                <div className={styles.headerRow}>
                    <WatchButton
                        isWatched={isWatched}
                        onClick={() => onToggleWatchlist(stock.id)}
                    />
                    <div className={styles.icon} style={{ background: stock.color }}>
                        {stock.code?.slice(0, 2)}
                    </div>
                    <div className={styles.nameGroup}>
                        <span className={styles.name}>{stock.name}</span>
                        <span className={styles.code}>
                            {stock.code} · {getProductTypeLabel(stock.type)}
                        </span>
                    </div>
                </div>
            </div>

            {/* 가격 정보 */}
            <div className={styles.center} onClick={() => onOpenChart(stock)}>
                <div className={priceClassName}>
                    {formatNumber(stock.price)}원
                </div>
                <div className={`${styles.change} ${isUp ? styles.positive : styles.negative}`}>
                    {isUp ? '▲' : '▼'} {formatPercent(dailyChangeRate)}
                </div>
            </div>

            {/* 메타 정보 */}
            <div className={styles.meta}>
                <div className={styles.ohlcInline}>
                    <span className={`${styles.ohlcMini} ${styles.high}`}>
                        H {formatCompact(stock.dailyHigh || stock.price)}
                    </span>
                    <span className={`${styles.ohlcMini} ${styles.low}`}>
                        L {formatCompact(stock.dailyLow || stock.price)}
                    </span>
                </div>
                {(heldQty > 0 || shortQty > 0) && (
                    <div className={styles.positionsInline}>
                        {heldQty > 0 && (
                            <span className={`${styles.posBadge} ${styles.long}`}>📈{heldQty}</span>
                        )}
                        {shortQty > 0 && (
                            <span className={`${styles.posBadge} ${shortPnl >= 0 ? styles.shortProfit : styles.short}`}>
                                🐻{shortQty}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.right}>
                <div className={styles.quickButtons}>
                    {tradeMode === 'long' ? (
                        <>
                            <button
                                className={`${styles.quickBtn} ${styles.buy}`}
                                onClick={() => onBuy(stock, estimatedQty)}
                                disabled={cash < stock.price * estimatedQty || estimatedQty < 1}
                                title={`${estimatedQty}주 매수`}
                            >
                                매수
                            </button>
                            {heldQty > 0 && (
                                <button
                                    className={`${styles.quickBtn} ${styles.sellAll}`}
                                    onClick={() => onSellAll(stock)}
                                    title={`${heldQty}주 전량 매도`}
                                >
                                    전량매도
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                className={`${styles.quickBtn} ${styles.short}`}
                                onClick={() => onShortSell(stock, estimatedQty)}
                                disabled={cash < stock.price * estimatedQty * SHORT_SELLING.marginRate || estimatedQty < 1}
                                title={`${estimatedQty}주 공매도`}
                            >
                                공매도
                            </button>
                            {shortQty > 0 && (
                                <button
                                    className={`${styles.quickBtn} ${styles.coverAll}`}
                                    onClick={() => onCoverShort(stock, shortQty)}
                                    title={`${shortQty}주 전량 청산`}
                                >
                                    전량청산
                                </button>
                            )}
                        </>
                    )}
                </div>
                <button
                    className={styles.detailBtn}
                    onClick={() => onOpenOrderManager(stock, tradeMode === 'long' ? 'buy' : 'short')}
                    title="상세 주문"
                >
                    ⚙️
                </button>
            </div>
        </div>
    )
}, (prevProps, nextProps) => {
    return (
        prevProps.stock.price === nextProps.stock.price &&
        prevProps.stock.dailyHigh === nextProps.stock.dailyHigh &&
        prevProps.stock.dailyLow === nextProps.stock.dailyLow &&
        prevProps.holding?.quantity === nextProps.holding?.quantity &&
        prevProps.shortPos?.quantity === nextProps.shortPos?.quantity &&
        prevProps.priceChange === nextProps.priceChange &&
        prevProps.isWatched === nextProps.isWatched &&
        prevProps.estimatedQty === nextProps.estimatedQty &&
        prevProps.tradeMode === nextProps.tradeMode &&
        prevProps.cash === nextProps.cash &&
        prevProps.isInitialized === nextProps.isInitialized
    )
})

StockCard.displayName = 'StockCard'

export default StockCard
