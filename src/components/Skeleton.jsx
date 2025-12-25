/**
 * Skeleton - 로딩 스켈레톤 컴포넌트
 * 콘텐츠 로딩 중 표시할 플레이스홀더
 */
import React from 'react'
import './Skeleton.css'

// 기본 스켈레톤
export const Skeleton = ({
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    className = '',
    animate = true
}) => (
    <div
        className={`skeleton ${animate ? 'animate' : ''} ${className}`}
        style={{ width, height, borderRadius }}
    />
)

// 텍스트 스켈레톤
export const SkeletonText = ({ lines = 3, lastLineWidth = '60%' }) => (
    <div className="skeleton-text">
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                width={i === lines - 1 ? lastLineWidth : '100%'}
                height="14px"
                style={{ marginBottom: i < lines - 1 ? '8px' : 0 }}
            />
        ))}
    </div>
)

// 아바타 스켈레톤
export const SkeletonAvatar = ({ size = 40 }) => (
    <Skeleton
        width={`${size}px`}
        height={`${size}px`}
        borderRadius="50%"
    />
)

// 카드 스켈레톤
export const SkeletonCard = () => (
    <div className="skeleton-card">
        <div className="skeleton-card-header">
            <SkeletonAvatar size={36} />
            <div className="skeleton-card-title">
                <Skeleton width="60%" height="14px" />
                <Skeleton width="40%" height="12px" />
            </div>
        </div>
        <div className="skeleton-card-body">
            <SkeletonText lines={2} />
        </div>
        <div className="skeleton-card-footer">
            <Skeleton width="80px" height="32px" borderRadius="6px" />
            <Skeleton width="80px" height="32px" borderRadius="6px" />
        </div>
    </div>
)

// 주식 카드 스켈레톤
export const SkeletonStockCard = () => (
    <div className="skeleton-stock-card">
        <div className="skeleton-stock-left">
            <SkeletonAvatar size={36} />
            <div className="skeleton-stock-info">
                <Skeleton width="80px" height="14px" />
                <Skeleton width="50px" height="11px" />
            </div>
        </div>
        <div className="skeleton-stock-center">
            <Skeleton width="70px" height="18px" />
            <Skeleton width="50px" height="12px" />
        </div>
        <div className="skeleton-stock-right">
            <Skeleton width="60px" height="28px" borderRadius="6px" />
            <Skeleton width="60px" height="28px" borderRadius="6px" />
        </div>
    </div>
)

// 주식 리스트 스켈레톤
export const SkeletonStockList = ({ count = 6 }) => (
    <div className="skeleton-stock-list">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonStockCard key={i} />
        ))}
    </div>
)

// 대시보드 스켈레톤
export const SkeletonDashboard = () => (
    <div className="skeleton-dashboard">
        <div className="skeleton-stat-grid">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-stat-card">
                    <Skeleton width="60px" height="12px" />
                    <Skeleton width="100px" height="24px" />
                </div>
            ))}
        </div>
    </div>
)

export default {
    Skeleton,
    SkeletonText,
    SkeletonAvatar,
    SkeletonCard,
    SkeletonStockCard,
    SkeletonStockList,
    SkeletonDashboard
}
