// 거래 내역 컴포넌트
/** @typedef {import('../types').Trade} Trade */
/** @typedef {import('../types').Stock} Stock */
import { formatNumber, formatDate } from '../utils'
import { formatChartPrice } from '../utils/chart-observations'
import './TradeHistory.css'

const TRADE_LABELS = { buy: '매수', sell: '매도', short: '공매도', cover: '공매도 청산' }
const TOTAL_LABELS = { buy: '매수 지출', sell: '매도대금 · 수수료 반영', short: '예치 증거금', cover: '청산 현금 증감' }
const signedMoney = value => `${value > 0 ? '+' : ''}${formatChartPrice(value)}원`

/**
 * @param {{ trades: Trade[], stocks: Stock[], onClose: () => void }} props
 */
export default function TradeHistory({ trades, stocks = [], onClose }) {
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
        shortTrades: trades.filter(t => t.type === 'short').length,
        coverTrades: trades.filter(t => t.type === 'cover').length,
        realizedProfit: trades.filter(t => t.type === 'sell' || t.type === 'cover').reduce((sum, t) => sum + (Number.isFinite(t.profit) ? t.profit : 0), 0)
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
                        <span className="stat-label">공매도</span>
                        <span className="stat-value">{stats.shortTrades}회</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">공매도 청산</span>
                        <span className="stat-value">{stats.coverTrades}회</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">실현 손익</span>
                        <span data-testid="history-realized-profit" data-value={stats.realizedProfit} className={`stat-value ${stats.realizedProfit >= 0 ? 'profit' : 'loss'}`}>
                            {signedMoney(stats.realizedProfit)}
                        </span>
                    </div>
                </div>

                <div className="trade-list">
                    {trades.slice().reverse().map(trade => {
                        const stock = stocks.find(s => String(s.id) === String(trade.stockId))
                        const isClose = trade.type === 'sell' || trade.type === 'cover'
                        return (
                            <div key={trade.id} className={`trade-item ${trade.type}`} data-trade-type={trade.type} data-trade-reason={trade.reason || ''}>
                                <div className="trade-info">
                                    <div className="trade-stock">
                                        <div className="trade-icon" style={{ background: stock?.color || '#666' }}>
                                            {stock?.code?.slice(0, 2) || '??'}
                                        </div>
                                        <div className="trade-details">
                                            <span className="trade-name">{stock?.name || '알 수 없는 종목'}</span>
                                            <span className="trade-meta">
                                                {formatNumber(trade.quantity)}{stock?.type === 'stock' || stock?.type === 'etf' || !stock?.type ? '주' : '개'} × {formatChartPrice(trade.price)}원
                                            </span>
                                        </div>
                                    </div>
                                    <div className="trade-type-badge">
                                        {TRADE_LABELS[trade.type] || '거래'}
                                    </div>
                                </div>

                                {trade.reason && <span className="trade-reason">{trade.reason === 'short-liquidation' ? '공매도 강제청산' : trade.reason === 'credit-liquidation' ? '신용 강제청산' : trade.reason}</span>}

                                <div className="trade-values">
                                    <span className="trade-total"><small>{TOTAL_LABELS[trade.type] || '거래 금액'}</small>{trade.type === 'cover' ? signedMoney(trade.total) : `${formatChartPrice(trade.total)}원`}</span>
                                    {isClose && Number.isFinite(trade.profit) && (
                                        <span className={`trade-profit ${trade.profit >= 0 ? 'profit' : 'loss'}`}>
                                            <small>실현 손익</small>{signedMoney(trade.profit)}
                                            {Number.isFinite(trade.profitRate) && <small>({trade.profitRate.toFixed(1)}%)</small>}
                                        </span>
                                    )}
                                    <span className="trade-time">{formatDate(trade.timestamp)}</span>
                                </div>
                                {trade.type === 'cover' && Number.isFinite(trade.marginReturned) && <p className="trade-settlement-note">반환 증거금 {formatChartPrice(trade.marginReturned)}원에 실현 손익을 더한 현금 증감입니다.</p>}
                                {trade.type === 'sell' && trade.borrowedRepayment > 0 && <p className="trade-settlement-note">차입금 {formatChartPrice(trade.borrowedRepayment)}원 상환 · 현금 증감 {signedMoney(trade.total - trade.borrowedRepayment)}</p>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
