/**
 * useModals - 모달 상태 관리 훅
 * 여러 모달의 열림/닫힘 상태를 중앙에서 관리
 */
import { useState, useCallback } from 'react'

// 모달 타입 정의
export const MODAL_TYPES = {
    CHART: 'chart',
    ACHIEVEMENTS: 'achievements',
    TRADE_HISTORY: 'tradeHistory',
    MISSIONS: 'missions',
    LEADERBOARD: 'leaderboard',
    SETTINGS: 'settings',
    ASSET_CHART: 'assetChart',
    WATCHLIST: 'watchlist',
    STATISTICS: 'statistics',
    ALERT_MANAGER: 'alertManager',
    ORDER_MANAGER: 'orderManager',
    SKILLS: 'skills',
    SEASON_END: 'seasonEnd',
    TUTORIAL: 'tutorial'
}

export const useModals = () => {
    // 현재 열린 모달
    const [openModal, setOpenModal] = useState(null)

    // 모달별 데이터 (예: 차트에서 선택된 주식)
    const [modalData, setModalData] = useState({})

    // 모달 열기
    const openModalWithData = useCallback((modalType, data = null) => {
        setOpenModal(modalType)
        if (data !== null) {
            setModalData(prev => ({ ...prev, [modalType]: data }))
        }
    }, [])

    // 모달 닫기
    const closeModal = useCallback(() => {
        setOpenModal(null)
    }, [])

    // 특정 모달이 열려있는지 확인
    const isOpen = useCallback((modalType) => {
        return openModal === modalType
    }, [openModal])

    // 모달 데이터 가져오기
    const getModalData = useCallback((modalType) => {
        return modalData[modalType] || null
    }, [modalData])

    // 편의 함수들
    const showChart = useCallback((stock) => openModalWithData(MODAL_TYPES.CHART, stock), [openModalWithData])
    const showAchievements = useCallback(() => openModalWithData(MODAL_TYPES.ACHIEVEMENTS), [openModalWithData])
    const showTradeHistory = useCallback(() => openModalWithData(MODAL_TYPES.TRADE_HISTORY), [openModalWithData])
    const showMissions = useCallback(() => openModalWithData(MODAL_TYPES.MISSIONS), [openModalWithData])
    const showLeaderboard = useCallback(() => openModalWithData(MODAL_TYPES.LEADERBOARD), [openModalWithData])
    const showSettings = useCallback(() => openModalWithData(MODAL_TYPES.SETTINGS), [openModalWithData])
    const showAssetChart = useCallback(() => openModalWithData(MODAL_TYPES.ASSET_CHART), [openModalWithData])
    const showWatchlist = useCallback(() => openModalWithData(MODAL_TYPES.WATCHLIST), [openModalWithData])
    const showStatistics = useCallback(() => openModalWithData(MODAL_TYPES.STATISTICS), [openModalWithData])
    const showAlertManager = useCallback(() => openModalWithData(MODAL_TYPES.ALERT_MANAGER), [openModalWithData])
    const showOrderManager = useCallback((stock) => openModalWithData(MODAL_TYPES.ORDER_MANAGER, stock), [openModalWithData])
    const showSkills = useCallback(() => openModalWithData(MODAL_TYPES.SKILLS), [openModalWithData])

    return {
        openModal,
        modalData,
        openModalWithData,
        closeModal,
        isOpen,
        getModalData,
        // 편의 함수들
        showChart,
        showAchievements,
        showTradeHistory,
        showMissions,
        showLeaderboard,
        showSettings,
        showAssetChart,
        showWatchlist,
        showStatistics,
        showAlertManager,
        showOrderManager,
        showSkills
    }
}

export default useModals
