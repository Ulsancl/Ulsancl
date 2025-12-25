// 뉴스 피드 컴포넌트
import { formatTime } from './utils'
import './NewsFeed.css'

export default function NewsFeed({ news, onNewsClick }) {
    if (!news || news.length === 0) {
        return (
            <div className="news-feed empty">
                <div className="news-header">
                    <span className="news-icon">📰</span>
                    <h3>실시간 뉴스</h3>
                </div>
                <p className="no-news">아직 뉴스가 없습니다...</p>
            </div>
        )
    }

    return (
        <div className="news-feed">
            <div className="news-header">
                <span className="news-icon">📰</span>
                <h3>실시간 뉴스</h3>
                <span className="news-count">{news.filter(n => !n.read).length} new</span>
            </div>

            <div className="news-list">
                {news.slice(0, 10).map(item => (
                    <div
                        key={item.id}
                        className={`news-item ${item.type} ${item.read ? 'read' : 'unread'}`}
                        onClick={() => onNewsClick?.(item)}
                    >
                        <div className="news-type-badge">
                            {item.type === 'positive' && '📈'}
                            {item.type === 'negative' && '📉'}
                            {item.type === 'market' && '🌐'}
                        </div>
                        <div className="news-content">
                            <p className="news-text">{item.text}</p>
                            <span className="news-time">{formatTime(item.timestamp)}</span>
                        </div>
                        <div className={`news-impact ${item.impact >= 0 ? 'positive' : 'negative'}`}>
                            {item.impact >= 0 ? '+' : ''}{(item.impact * 100).toFixed(1)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
