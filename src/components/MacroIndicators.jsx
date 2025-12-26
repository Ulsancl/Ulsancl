
import React from 'react'
import { MACRO_CONFIG } from '../constants'
import './MacroIndicators.css'

export default function MacroIndicators({ macro }) {
    if (!macro) return null

    const indicators = [
        { key: 'interestRate', title: '기준금리', ...MACRO_CONFIG.interestRate, unit: '%' },
        { key: 'inflation', title: '인플레이션', ...MACRO_CONFIG.inflation, unit: '%' },
        { key: 'gdpGrowth', title: 'GDP 성장률', ...MACRO_CONFIG.gdpGrowth, unit: '%' },
    ]

    return (
        <div className="macro-indicators-container">
            {indicators.map((ind) => {
                const value = macro[ind.key]
                // 기본값 대비 편차에 따른 색상 (높으면 빨강, 낮으면 파랑 등 컨텍스트에 따라 다름)
                // 금리: 높으면 긴축(악재?), 인플레: 높으면 악재, GDP: 높으면 호재
                let statusClass = ''
                if (ind.key === 'gdpGrowth') {
                    if (value > ind.base + 0.5) statusClass = 'positive'
                    else if (value < ind.base - 0.5) statusClass = 'negative'
                } else {
                    // 금리, 인플레는 급격히 높으면 시장에 부담 (일반론)
                    if (value > ind.base + 1.0) statusClass = 'negative'
                    else if (value < ind.base - 1.0) statusClass = 'positive'
                }

                return (
                    <div key={ind.key} className={`macro-card ${statusClass}`}>
                        <div className="macro-title">{ind.title}</div>
                        <div className="macro-value-wrapper">
                            <span className="macro-value">{value.toFixed(2)}{ind.unit}</span>
                            {/* 변화 방향 화살표나 미니 그래프가 있으면 좋겠지만 일단 숫자로 */}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
