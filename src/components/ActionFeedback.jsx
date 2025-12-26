import React, { useEffect } from 'react'
import './ActionFeedback.css'

const FeedbackItem = ({ item, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(item.id)
        }, 1000)
        return () => clearTimeout(timer)
    }, [item, onRemove])

    // Deterministic offset based on id to keep renders pure
    const randomX = React.useMemo(() => {
        const seed = String(item.id ?? '')
        let hash = 0
        for (let i = 0; i < seed.length; i++) {
            hash = (hash * 31 + seed.charCodeAt(i)) | 0
        }
        return (Math.abs(hash) % 41) - 20
    }, [item.id])

    return (
        <div
            className={`feedback-item ${item.type}`}
            style={{
                left: item.x,
                top: item.y,
                '--random-x': `${randomX}px`
            }}
        >
            {item.text}
        </div>
    )
}

export default function ActionFeedback({ items, onRemove }) {
    return (
        <div className="feedback-container">
            {items.map(item => (
                <FeedbackItem key={item.id} item={item} onRemove={onRemove} />
            ))}
        </div>
    )
}
