/**
 * 공통 UI 컴포넌트
 * 재사용 가능한 기본 UI 요소들
 */

import React from 'react'
import { formatCompact, formatNumber } from '../utils'
import './CommonUI.css'

// 로딩 스피너
export const Spinner = ({ size = 'md', color = 'primary' }) => (
    <div className={`spinner spinner-${size} spinner-${color}`}>
        <div className="spinner-ring"></div>
    </div>
)

// 모달 래퍼
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-content modal-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    )
}

// 버튼 컴포넌트
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    className = '',
    ...props
}) => (
    <button
        className={`btn btn-${variant} btn-${size} ${className}`}
        disabled={disabled}
        onClick={onClick}
        {...props}
    >
        {children}
    </button>
)

// 배지 컴포넌트
export const Badge = ({ children, variant = 'default', size = 'sm' }) => (
    <span className={`badge badge-${variant} badge-${size}`}>
        {children}
    </span>
)

// 카드 컴포넌트
export const Card = ({ children, className = '', onClick, ...props }) => (
    <div
        className={`card ${className}`}
        onClick={onClick}
        {...props}
    >
        {children}
    </div>
)

// 진행률 바
export const ProgressBar = ({ value, max = 100, color = 'primary', showLabel = false }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
        <div className="progress-bar-container">
            <div
                className={`progress-bar progress-${color}`}
                style={{ width: `${percentage}%` }}
            />
            {showLabel && (
                <span className="progress-label">{percentage.toFixed(0)}%</span>
            )}
        </div>
    )
}

// 툴팁 래퍼
export const Tooltip = ({ children, text, position = 'top' }) => (
    <div className={`tooltip-wrapper tooltip-${position}`} data-tooltip={text}>
        {children}
    </div>
)

// 금액 표시 (색상 자동)
export const Amount = ({ value, showSign = true }) => {
    const isPositive = value >= 0
    const sign = showSign ? (isPositive ? '+' : '') : ''

    const absValue = Math.abs(value)
    const formatted = format === 'compact'
        ? formatCompact(absValue)
        : formatNumber(absValue)

    return (
        <span className={`amount ${isPositive ? 'positive' : 'negative'}`}>
            {sign}{value < 0 ? '-' : ''}{formatted}
        </span>
    )
}
