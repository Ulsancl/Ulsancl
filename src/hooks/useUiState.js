import { useState } from 'react'

export const useUiState = () => {
    const [quantity, setQuantity] = useState(1)
    const [amountMode, setAmountMode] = useState(false)
    const [inputAmount, setInputAmount] = useState('')
    const [leverage, setLeverage] = useState('1x')
    const [tradeMode, setTradeMode] = useState('long')

    const [achievementPopup, setAchievementPopup] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showSkills, setShowSkills] = useState(false)
    const [showTutorial, setShowTutorial] = useState(false)

    const [chartStock, setChartStock] = useState(null)
    const [showAchievements, setShowAchievements] = useState(false)
    const [showTradeHistory, setShowTradeHistory] = useState(false)
    const [showMissions, setShowMissions] = useState(false)
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showAssetChart, setShowAssetChart] = useState(false)
    const [showWatchlist, setShowWatchlist] = useState(false)
    const [showStatistics, setShowStatistics] = useState(false)
    const [showAlertManager, setShowAlertManager] = useState(false)
    const [orderManagerStock, setOrderManagerStock] = useState(null)
    const [orderManagerSide, setOrderManagerSide] = useState('buy')
    const [activeTab, setActiveTab] = useState('stocks')
    const [activeView, setActiveView] = useState('market')

    const [showSeasonEnd, setShowSeasonEnd] = useState(false)

    const [activeCrisis, setActiveCrisis] = useState(null)
    const [crisisAlert, setCrisisAlert] = useState(null)
    const [crisisHistory, setCrisisHistory] = useState([])

    return {
        quantity, setQuantity,
        amountMode, setAmountMode,
        inputAmount, setInputAmount,
        leverage, setLeverage,
        tradeMode, setTradeMode,
        achievementPopup, setAchievementPopup,
        showConfetti, setShowConfetti,
        showSkills, setShowSkills,
        showTutorial, setShowTutorial,
        chartStock, setChartStock,
        showAchievements, setShowAchievements,
        showTradeHistory, setShowTradeHistory,
        showMissions, setShowMissions,
        showLeaderboard, setShowLeaderboard,
        showSettings, setShowSettings,
        showAssetChart, setShowAssetChart,
        showWatchlist, setShowWatchlist,
        showStatistics, setShowStatistics,
        showAlertManager, setShowAlertManager,
        orderManagerStock, setOrderManagerStock,
        orderManagerSide, setOrderManagerSide,
        activeTab, setActiveTab,
        activeView, setActiveView,
        showSeasonEnd, setShowSeasonEnd,
        activeCrisis, setActiveCrisis,
        crisisAlert, setCrisisAlert,
        crisisHistory, setCrisisHistory
    }
}

export default useUiState
