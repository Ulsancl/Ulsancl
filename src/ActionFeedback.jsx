import React, { useEffect } from 'react'
import './ActionFeedback.css'

const FeedbackItem = ({ item, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(item.id)
        }, 1000)
        return () => clearTimeout(timer)
    }, [item, onRemove])

    // Randomize slight x position for natural feel
    const randomX = React.useMemo(() => Math.random() * 40 - 20, [])

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
