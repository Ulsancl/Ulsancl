// 워치리스트 컴포넌트
import { formatNumber, formatPercent } from '../utils'
import './Watchlist.css'

export default function Watchlist({
    watchlist,
    stocks,
    onToggleWatch,
    onStockClick,
    onClose
}) {
    const watchedStocks = stocks.filter(s => watchlist?.includes(s.id))

    return (
        <div className="watchlist-overlay" onClick={onClose}>
            <div className="watchlist-panel" onClick={e => e.stopPropagation()}>
                <div className="watchlist-header">
                    <h2>⭐ 관심 종목</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {watchedStocks.length === 0 ? (
                    <div className="watchlist-empty">
                        <span className="empty-icon">⭐</span>
                        <p>관심 종목이 없습니다.</p>
                        <p className="empty-hint">종목 카드의 ⭐ 버튼을 눌러 추가하세요</p>
                    </div>
                ) : (
                    <div className="watchlist-items">
                        {watchedStocks.map(stock => {
                            const changeRate = ((stock.price - stock.basePrice) / stock.basePrice) * 100
                            const isUp = changeRate >= 0

                            return (
                                <div
                                    key={stock.id}
                                    className="watchlist-item"
                                    onClick={() => onStockClick?.(stock)}
                                >
                                    <div className="watchlist-item-info">
                                        <div className="item-icon" style={{ background: stock.color }}>
                                            {stock.code?.slice(0, 2)}
                                        </div>
                                        <div className="item-details">
                                            <span className="item-name">{stock.name}</span>
                                            <span className="item-code">{stock.code}</span>
                                        </div>
                                    </div>

                                    <div className="watchlist-item-price">
                                        <span className={`price ${isUp ? 'up' : 'down'}`}>
                                            {formatNumber(stock.price)}원
                                        </span>
                                        <span className={`change ${isUp ? 'up' : 'down'}`}>
                                            {isUp ? '▲' : '▼'} {formatPercent(changeRate)}
                                        </span>
                                    </div>

                                    <button
                                        className="remove-watch-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onToggleWatch(stock.id)
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// 워치 버튼 (종목 카드용)
export function WatchButton({ isWatched, onClick }) {
    return (
        <button
            className={`watch-btn ${isWatched ? 'watched' : ''}`}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            title={isWatched ? '관심 종목 해제' : '관심 종목 추가'}
        >
            {isWatched ? '★' : '☆'}
        </button>
    )
}
