// 거래 내역 컴포넌트
import { formatNumber, formatCompact, formatDate } from './utils'
import './TradeHistory.css'

export default function TradeHistory({ trades, stocks, onClose }) {
    if (!trades || trades.length === 0) {
        return (
            <div className="trade-history-overlay" onClick={onClose}>
                <div className="trade-history-panel" onClick={e => e.stopPropagation()}>
                    <div className="trade-history-header">
                        <h2>📜 거래 내역</h2>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="no-trades">
                        <span className="no-trades-icon">📋</span>
                        <p>아직 거래 내역이 없습니다.</p>
                    </div>
                </div>
            </div>
        )
    }

    // 통계 계산
    const stats = {
        totalTrades: trades.length,
        buyTrades: trades.filter(t => t.type === 'buy').length,
        sellTrades: trades.filter(t => t.type === 'sell').length,
        totalBuyAmount: trades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.total, 0),
        totalSellAmount: trades.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.total, 0),
        realizedProfit: trades.filter(t => t.type === 'sell').reduce((sum, t) => sum + (t.profit || 0), 0)
    }

    return (
        <div className="trade-history-overlay" onClick={onClose}>
            <div className="trade-history-panel" onClick={e => e.stopPropagation()}>
                <div className="trade-history-header">
                    <h2>📜 거래 내역</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="trade-stats">
                    <div className="stat-item">
                        <span className="stat-label">총 거래</span>
                        <span className="stat-value">{stats.totalTrades}회</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">매수</span>
                        <span className="stat-value buy">{stats.buyTrades}회</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">매도</span>
                        <span className="stat-value sell">{stats.sellTrades}회</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">실현 손익</span>
                        <span className={`stat-value ${stats.realizedProfit >= 0 ? 'profit' : 'loss'}`}>
                            {stats.realizedProfit >= 0 ? '+' : ''}{formatCompact(stats.realizedProfit)}
                        </span>
                    </div>
                </div>

                <div className="trade-list">
                    {trades.slice().reverse().map(trade => {
                        const stock = stocks.find(s => s.id === trade.stockId)
                        return (
                            <div key={trade.id} className={`trade-item ${trade.type}`}>
                                <div className="trade-info">
                                    <div className="trade-stock">
                                        <div className="trade-icon" style={{ background: stock?.color || '#666' }}>
                                            {stock?.code?.slice(0, 2) || '??'}
                                        </div>
                                        <div className="trade-details">
                                            <span className="trade-name">{stock?.name || '알 수 없는 종목'}</span>
                                            <span className="trade-meta">
                                                {trade.quantity}주 × {formatNumber(trade.price)}원
                                            </span>
                                        </div>
                                    </div>
                                    <div className="trade-type-badge">
                                        {trade.type === 'buy' ? '매수' : '매도'}
                                    </div>
                                </div>

                                <div className="trade-values">
                                    <span className="trade-total">{formatCompact(trade.total)}</span>
                                    {trade.type === 'sell' && trade.profit !== undefined && (
                                        <span className={`trade-profit ${trade.profit >= 0 ? 'profit' : 'loss'}`}>
                                            {trade.profit >= 0 ? '+' : ''}{formatCompact(trade.profit)}
                                            <small>({trade.profitRate?.toFixed(1)}%)</small>
                                        </span>
                                    )}
                                    <span className="trade-time">{formatDate(trade.timestamp)}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
