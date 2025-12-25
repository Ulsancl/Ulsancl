import React from 'react'
import './TickerTape.css'
import { formatNumber, formatPercent } from './utils'

const TickerTape = ({ news, stocks }) => {
    // 최신 뉴스 5개와 시가총액 상위 10개 종목을 섞어서 표시
    const recentNews = news.slice(0, 5)
    const topStocks = [...stocks]
        .sort((a, b) => b.price * (b.totalShares || 1000000) - a.price * (a.totalShares || 1000000))
        .slice(0, 10)

    // 표시할 아이템 리스트 생성
    const tapeItems = []

    // 뉴스 아이템 추가
    recentNews.forEach(n => {
        tapeItems.push({
            type: 'news',
            content: n.text,
            id: `news-${n.id}`,
            sentiment: n.type
        })
    })

    // 주식 아이템 추가
    topStocks.forEach(s => {
        const change = (s.price - (s.prevClose || s.basePrice)) / (s.prevClose || s.basePrice) * 100
        tapeItems.push({
            type: 'stock',
            name: s.name,
            price: s.price,
            change: change,
            id: `stock-${s.id}`
        })
    })

    // 셔플 (선택 사항, 지금은 그냥 번갈아가며 섞거나 뉴스 먼저)
    // 단순하게 뉴스 -> 주식 순으로 나열하되, 반복해서 부드럽게 보이게 함
    const displayItems = [...tapeItems, ...tapeItems] // 복제해서 끊김 없는 스크롤 구현

    return (
        <div className="ticker-tape-container">
            <div className="ticker-track">
                {displayItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="ticker-item">
                        {item.type === 'news' ? (
                            <span className={`ticker-news ${item.sentiment}`}>
                                <span className="ticker-label">NEWS</span> {item.content}
                            </span>
                        ) : (
                            <span className="ticker-stock">
                                <span className="stock-name">{item.name}</span>
                                <span className="stock-price">{formatNumber(item.price)}</span>
                                <span className={`stock-change ${item.change >= 0 ? 'up' : 'down'}`}>
                                    {item.change >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(item.change))}
                                </span>
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TickerTape
