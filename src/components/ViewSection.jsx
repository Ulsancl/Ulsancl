/**
 * ViewSection - 뷰 모드 전환 컴포넌트
 */
import React, { memo } from 'react'

const VIEW_CONFIG = [
    { id: 'market', label: '시장' },
    { id: 'heatmap', label: '히트맵' },
    { id: 'portfolio', label: '포트폴리오' }
]

const ViewSection = memo(function ViewSection({ activeView, onViewChange }) {
    return (
        <section className="view-section">
            <div className="view-buttons">
                {VIEW_CONFIG.map(view => (
                    <button
                        key={view.id}
                        className={`view-btn ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => onViewChange(view.id)}
                    >
                        {view.label}
                    </button>
                ))}
            </div>
        </section>
    )
})

export default ViewSection
