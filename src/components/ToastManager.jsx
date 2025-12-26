import React, { useEffect } from 'react'
import './ToastManager.css'

const ToastItem = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id)
        }, toast.duration || 3000)

        return () => clearTimeout(timer)
    }, [toast, onRemove])

    return (
        <div className={`toast-item toast-${toast.type} ${toast.animationClass || ''}`}>
            <div className="toast-icon">{getIcon(toast.type)}</div>
            <div className="toast-content">
                <div className="toast-message">{toast.message}</div>
                {toast.subMessage && <div className="toast-sub">{toast.subMessage}</div>}
            </div>
            <button className="toast-close" onClick={() => onRemove(toast.id)}>&times;</button>
        </div>
    )
}

const getIcon = (type) => {
    switch (type) {
        case 'success': return '✅'
        case 'error': return '❌'
        case 'info': return 'ℹ️'
        case 'warning': return '⚠️'
        case 'achievement': return '🏆'
        default: return '📢'
    }
}

export default function ToastManager({ toasts, removeToast }) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    )
}
