/**
 * ModalContext - 모달 상태 통합 관리 Context
 * App.jsx의 모달 관련 상태를 중앙에서 관리하여 props drilling 제거
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

const ModalContext = createContext(null)

// 모달 이름 상수
export const MODAL_NAMES = {
    ACHIEVEMENTS: 'achievements',
    TRADE_HISTORY: 'tradeHistory',
    MISSIONS: 'missions',
    LEADERBOARD: 'leaderboard',
    SETTINGS: 'settings',
    ASSET_CHART: 'assetChart',
    WATCHLIST: 'watchlist',
    STATISTICS: 'statistics',
    ALERT_MANAGER: 'alertManager',
    SKILLS: 'skills',
    SEASON_END: 'seasonEnd',
    TUTORIAL: 'tutorial',
    CHART: 'chart',
    ORDER_MANAGER: 'orderManager'
}

export function ModalProvider({ children }) {
    // 현재 활성화된 모달 (단일 모달만 열림)
    const [activeModal, setActiveModal] = useState(null)
    // 모달별 데이터 (예: chartStock, orderManagerStock 등)
    const [modalData, setModalData] = useState({})

    // 추가 상태 (여러 개가 동시에 활성화될 수 있는 것들)
    const [achievementPopup, setAchievementPopup] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [activeTab, setActiveTab] = useState('stocks')
    const [activeView, setActiveView] = useState('market')
    const [activeCrisis, setActiveCrisis] = useState(null)
    const [crisisAlert, setCrisisAlert] = useState(null)
    const [crisisHistory, setCrisisHistory] = useState([])

    // 모달 열기
    const openModal = useCallback((modalName, data = {}) => {
        setActiveModal(modalName)
        setModalData(prev => ({ ...prev, ...data }))
    }, [])

    // 모달 닫기
    const closeModal = useCallback((modalName) => {
        if (!modalName || activeModal === modalName) {
            setActiveModal(null)
        }
        // 특정 필드만 클리어
        if (modalName === MODAL_NAMES.CHART) {
            setModalData(prev => ({ ...prev, chartStock: null }))
        } else if (modalName === MODAL_NAMES.ORDER_MANAGER) {
            setModalData(prev => ({ ...prev, orderManagerStock: null }))
        }
    }, [activeModal])

    // 모달 열림 여부 체크
    const isModalOpen = useCallback((modalName) => {
        return activeModal === modalName
    }, [activeModal])

    // 업적 팝업 표시
    const showAchievementPopup = useCallback((achievement) => {
        setAchievementPopup(achievement)
        setShowConfetti(true)
        setTimeout(() => {
            setAchievementPopup(null)
            setShowConfetti(false)
        }, 3000)
    }, [])

    // 차트 열기 (편의 함수)
    const openChart = useCallback((stock) => {
        openModal(MODAL_NAMES.CHART, { chartStock: stock })
    }, [openModal])

    // 주문 관리자 열기 (편의 함수)
    const openOrderManager = useCallback((stock, side = 'buy') => {
        openModal(MODAL_NAMES.ORDER_MANAGER, { orderManagerStock: stock, orderManagerSide: side })
    }, [openModal])

    const value = useMemo(() => ({
        // 모달 상태
        activeModal,
        modalData,

        // 모달 액션
        openModal,
        closeModal,
        isModalOpen,

        // 편의 함수
        openChart,
        openOrderManager,

        // 업적 팝업
        achievementPopup,
        setAchievementPopup,
        showAchievementPopup,
        showConfetti,
        setShowConfetti,

        // 탭/뷰 상태
        activeTab,
        setActiveTab,
        activeView,
        setActiveView,

        // 위기 관련
        activeCrisis,
        setActiveCrisis,
        crisisAlert,
        setCrisisAlert,
        crisisHistory,
        setCrisisHistory,

        // 개별 모달 데이터 접근자
        chartStock: modalData.chartStock,
        orderManagerStock: modalData.orderManagerStock,
        orderManagerSide: modalData.orderManagerSide || 'buy'
    }), [
        activeModal, modalData, openModal, closeModal, isModalOpen,
        openChart, openOrderManager,
        achievementPopup, showAchievementPopup, showConfetti,
        activeTab, activeView, activeCrisis, crisisAlert, crisisHistory
    ])

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    )
}

export function useModal() {
    const context = useContext(ModalContext)
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider')
    }
    return context
}

// 특정 모달 상태만 필요할 때 사용하는 훅
export function useModalState(modalName) {
    const { isModalOpen, openModal, closeModal } = useModal()

    return {
        isOpen: isModalOpen(modalName),
        open: useCallback((data) => openModal(modalName, data), [modalName, openModal]),
        close: useCallback(() => closeModal(modalName), [modalName, closeModal])
    }
}

export default ModalContext
