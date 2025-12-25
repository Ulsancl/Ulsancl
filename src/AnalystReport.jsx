import React, { useState } from 'react'
import './AnalystReport.css'
import { formatNumber } from './utils'

const AnalystReport = ({ stocks, marketState, onClose }) => {
    // 리포트를 한 번만 생성하고 고정 (모달이 열릴 때 초기값으로 계산)
    const [reports] = useState(() => {
        // 시가총액 상위 20개 중 랜덤 6개
        const candidates = stocks.filter(s => s.type === 'stock' || s.type === 'etf')
        const shuffled = [...candidates].sort(() => 0.5 - Math.random())
        const targets = shuffled.slice(0, 6)

        return targets.map(stock => {
            // 분석 로직 (단순화된 알고리즘)
            const sectorTrend = marketState.sectorTrends?.[stock.sector] || 0
            const momentum = stock.momentum || 0
            const fluctuation = (Math.random() * 0.2) - 0.1 // -10 ~ +10 랜덤 변수

            // 점수 계산 (0 ~ 100)
            // 기준점 50
            // 섹터 트렌드: -0.5 ~ 0.5 -> -25 ~ +25
            // 모멘텀: 보통 -0.5 ~ 0.5 -> -20 ~ +20
            // 펀더멘털 점수 계산
            let fundamentalScore = 0
            if (stock.fundamentals) {
                // PER Score: 낮을수록 좋음 (저평가)
                if (stock.fundamentals.pe) {
                    if (stock.fundamentals.pe < 8) fundamentalScore += 15
                    else if (stock.fundamentals.pe < 15) fundamentalScore += 10
                    else if (stock.fundamentals.pe > 50) fundamentalScore -= 10
                    else if (stock.fundamentals.pe > 80) fundamentalScore -= 20
                }

                // Yield Score: 높을수록 좋음
                if (stock.fundamentals.yield) {
                    if (stock.fundamentals.yield > 5.0) fundamentalScore += 10
                    else if (stock.fundamentals.yield > 3.0) fundamentalScore += 5
                }

                // Debt Score: 부채가 너무 많으면 감점
                if (stock.fundamentals.debtRatio > 200) fundamentalScore -= 10
                if (stock.fundamentals.debtRatio > 400) fundamentalScore -= 20
            }

            // 점수 계산 (0 ~ 100)
            // 기준점 50
            // 섹터 트렌드: -0.5 ~ 0.5 -> -20 ~ +20
            // 모멘텀: 보통 -0.5 ~ 0.5 -> -20 ~ +20
            // 펀더멘털: -30 ~ +30
            let rawScore = 50 + (sectorTrend * 40) + (momentum * 40) + fundamentalScore + (fluctuation * 60)

            // 범위 제한
            const score = Math.max(10, Math.min(99, rawScore))

            let rating = 'HOLD'
            let sentiment = 'neutral'
            let recommendPrice = stock.price

            if (score >= 70) {
                rating = 'STRONG BUY'
                sentiment = 'positive'
                recommendPrice = stock.price * (1 + (score - 60) / 100 * 0.3)
            } else if (score >= 55) {
                rating = 'BUY'
                sentiment = 'positive'
                recommendPrice = stock.price * (1.10)
            } else if (score <= 30) {
                rating = 'STRONG SELL'
                sentiment = 'negative'
                recommendPrice = stock.price * (1 - (40 - score) / 100 * 0.3)
            } else if (score <= 45) {
                rating = 'SELL'
                sentiment = 'negative'
                recommendPrice = stock.price * 0.90
            }

            // 코멘트 생성
            let comments = []
            if (stock.fundamentals) {
                if (stock.fundamentals.pe < 10) comments.push("저평가 가치주")
                if (stock.fundamentals.yield > 4.0) comments.push("배당 매력 높음")
                if (stock.fundamentals.debtRatio < 50) comments.push("재무 건전성 우수")
                if (stock.fundamentals.debtRatio > 300) comments.push("재무 리스크 부각")
            }

            if (sectorTrend > 0.1) comments.push(`${stock.sector === 'tech' ? '기술주' : '해당 섹터'} 강세 지속 전망`)
            else if (sectorTrend < -0.1) comments.push(`섹터 전반적 약세 주의`)

            if (momentum > 0.15) comments.push("강력한 상승 모멘텀")
            else if (momentum < -0.15) comments.push("추세 이탈 우려")

            if (comments.length === 0) comments.push("특이사항 없음, 관망세 유지")

            return {
                id: stock.id,
                name: stock.name,
                code: stock.code,
                price: stock.price,
                rating,
                sentiment,
                score: Math.round(score),
                targetPrice: Math.round(recommendPrice),
                comment: comments.join(', ')
            }
        })
    })

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content analyst-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📑 전문 애널리스트 리포트</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="analyst-intro">
                    <span className="analyst-avatar">👨‍💼</span>
                    <div>
                        <p><strong>김진척 수석 연구원</strong></p>
                        <p className="text-muted">"현재 시장 변동성을 고려한 AI 기반 분석 결과입니다."</p>
                    </div>
                </div>

                <div className="report-grid">
                    {reports.map(item => (
                        <div key={item.id} className={`report-card ${item.sentiment}`}>
                            <div className="report-card-header">
                                <div>
                                    <span className="report-name">{item.name}</span>
                                    <span className="report-code">{item.code}</span>
                                </div>
                                <div className={`rating-badge ${item.sentiment}`}>{item.rating}</div>
                            </div>

                            <div className="report-body">
                                <div className="target-price-row">
                                    <span>현재가: {formatNumber(item.price)}</span>
                                    <span className="arrow">➔</span>
                                    <span className="target-price">목표가: {formatNumber(item.targetPrice)}</span>
                                </div>
                                <div className="score-bar-container">
                                    <div className="score-label">매수 강도</div>
                                    <div className="score-bar">
                                        <div className="score-fill" style={{ width: `${item.score}%`, backgroundColor: item.sentiment === 'positive' ? 'var(--color-profit)' : item.sentiment === 'negative' ? 'var(--color-loss)' : 'var(--color-text-secondary)' }}></div>
                                    </div>
                                </div>
                                <p className="analyst-comment">"{item.comment}"</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="modal-footer">
                    <button className="confirm-btn" onClick={onClose}>닫기</button>
                </div>
            </div>
        </div>
    )
}

export default AnalystReport
