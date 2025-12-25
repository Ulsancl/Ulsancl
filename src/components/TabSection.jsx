/**
 * TabSection - 상품 유형 탭 컴포넌트
 */
import React, { memo } from 'react'

const TAB_CONFIG = [
    { id: 'stocks', label: '📊 주식' },
    { id: 'etf', label: '📈 ETF' },
    { id: 'crypto', label: '₿ 코인' },
    { id: 'bond', label: '🏦 채권' },
    { id: 'commodity', label: '🛢️ 원자재' }
]

const TabSection = memo(function TabSection({ activeTab, onTabChange }) {
    return (
        <section className="tab-section">
            <div className="tab-buttons">
                {TAB_CONFIG.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </section>
    )
})

export default TabSection
