/**
 * GameContext - 게임 전역 상태 Context
 * prop drilling 제거 및 상태 관리 중앙화
 */
import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { INITIAL_CAPITAL } from '../constants'

// 액션 타입
const ACTIONS = {
    // 자금 관련
    SET_CASH: 'SET_CASH',
    UPDATE_CASH: 'UPDATE_CASH',

    // 포트폴리오
    SET_PORTFOLIO: 'SET_PORTFOLIO',
    UPDATE_PORTFOLIO: 'UPDATE_PORTFOLIO',
    REMOVE_FROM_PORTFOLIO: 'REMOVE_FROM_PORTFOLIO',

    // 공매도
    SET_SHORT_POSITIONS: 'SET_SHORT_POSITIONS',
    UPDATE_SHORT_POSITION: 'UPDATE_SHORT_POSITION',
    REMOVE_SHORT_POSITION: 'REMOVE_SHORT_POSITION',

    // 신용 거래
    SET_CREDIT: 'SET_CREDIT',

    // 통계
    INCREMENT_TRADES: 'INCREMENT_TRADES',
    UPDATE_PROFIT: 'UPDATE_PROFIT',
    UPDATE_WIN_STREAK: 'UPDATE_WIN_STREAK',

    // 레벨/업적
    ADD_XP: 'ADD_XP',
    UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',
    UNLOCK_SKILL: 'UNLOCK_SKILL',

    // 기타
    ADD_TRADE: 'ADD_TRADE',
    ADD_ORDER: 'ADD_ORDER',
    REMOVE_ORDER: 'REMOVE_ORDER',

    // 일괄 업데이트
    LOAD_GAME: 'LOAD_GAME',
    RESET_GAME: 'RESET_GAME'
}

// 초기 상태
const initialState = {
    cash: INITIAL_CAPITAL,
    portfolio: {},
    shortPositions: {},
    creditUsed: 0,
    creditInterest: 0,
    tradeHistory: [],
    pendingOrders: [],
    unlockedAchievements: {},
    unlockedSkills: {},
    totalXp: 0,
    totalTrades: 0,
    winStreak: 0,
    maxWinStreak: 0,
    totalProfit: 0,
    totalDividends: 0,
    dailyTrades: 0,
    dailyProfit: 0,
    missionProgress: {},
    completedMissions: {},
    assetHistory: [],
    watchlist: [],
    alerts: [],
    currentDay: 1
}

// 리듀서
function gameReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_CASH:
            return { ...state, cash: action.payload }

        case ACTIONS.UPDATE_CASH:
            return { ...state, cash: state.cash + action.payload }

        case ACTIONS.SET_PORTFOLIO:
            return { ...state, portfolio: action.payload }

        case ACTIONS.UPDATE_PORTFOLIO:
            return {
                ...state,
                portfolio: {
                    ...state.portfolio,
                    [action.payload.stockId]: action.payload.holding
                }
            }

        case ACTIONS.REMOVE_FROM_PORTFOLIO: {
            const { [action.payload]: _, ...rest } = state.portfolio
            return { ...state, portfolio: rest }
        }

        case ACTIONS.SET_SHORT_POSITIONS:
            return { ...state, shortPositions: action.payload }

        case ACTIONS.UPDATE_SHORT_POSITION:
            return {
                ...state,
                shortPositions: {
                    ...state.shortPositions,
                    [action.payload.stockId]: action.payload.position
                }
            }

        case ACTIONS.REMOVE_SHORT_POSITION: {
            const { [action.payload]: _, ...rest } = state.shortPositions
            return { ...state, shortPositions: rest }
        }

        case ACTIONS.SET_CREDIT:
            return {
                ...state,
                creditUsed: action.payload.creditUsed ?? state.creditUsed,
                creditInterest: action.payload.creditInterest ?? state.creditInterest
            }

        case ACTIONS.INCREMENT_TRADES:
            return {
                ...state,
                totalTrades: state.totalTrades + 1,
                dailyTrades: state.dailyTrades + 1
            }

        case ACTIONS.UPDATE_PROFIT:
            return {
                ...state,
                totalProfit: state.totalProfit + action.payload,
                dailyProfit: state.dailyProfit + action.payload
            }

        case ACTIONS.UPDATE_WIN_STREAK:
            const newStreak = action.payload.reset ? 0 : state.winStreak + 1
            return {
                ...state,
                winStreak: newStreak,
                maxWinStreak: Math.max(state.maxWinStreak, newStreak)
            }

        case ACTIONS.ADD_XP:
            return { ...state, totalXp: state.totalXp + action.payload }

        case ACTIONS.UNLOCK_ACHIEVEMENT:
            return {
                ...state,
                unlockedAchievements: {
                    ...state.unlockedAchievements,
                    [action.payload]: true
                }
            }

        case ACTIONS.UNLOCK_SKILL:
            return {
                ...state,
                unlockedSkills: {
                    ...state.unlockedSkills,
                    [action.payload.id]: (state.unlockedSkills[action.payload.id] || 0) + 1
                }
            }

        case ACTIONS.ADD_TRADE:
            return {
                ...state,
                tradeHistory: [...state.tradeHistory, action.payload]
            }

        case ACTIONS.ADD_ORDER:
            return {
                ...state,
                pendingOrders: [...state.pendingOrders, action.payload]
            }

        case ACTIONS.REMOVE_ORDER:
            return {
                ...state,
                pendingOrders: state.pendingOrders.filter(o => o.id !== action.payload)
            }

        case ACTIONS.LOAD_GAME:
            return { ...state, ...action.payload }

        case ACTIONS.RESET_GAME:
            return { ...initialState }

        default:
            return state
    }
}

// Context 생성
const GameStateContext = createContext(null)
const GameDispatchContext = createContext(null)

// Provider 컴포넌트
export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState)

    // 메모이즈된 액션 함수들
    const actions = useMemo(() => ({
        setCash: (amount) => dispatch({ type: ACTIONS.SET_CASH, payload: amount }),
        updateCash: (delta) => dispatch({ type: ACTIONS.UPDATE_CASH, payload: delta }),

        updatePortfolio: (stockId, holding) =>
            dispatch({ type: ACTIONS.UPDATE_PORTFOLIO, payload: { stockId, holding } }),
        removeFromPortfolio: (stockId) =>
            dispatch({ type: ACTIONS.REMOVE_FROM_PORTFOLIO, payload: stockId }),

        updateShortPosition: (stockId, position) =>
            dispatch({ type: ACTIONS.UPDATE_SHORT_POSITION, payload: { stockId, position } }),
        removeShortPosition: (stockId) =>
            dispatch({ type: ACTIONS.REMOVE_SHORT_POSITION, payload: stockId }),

        setCredit: (creditUsed, creditInterest) =>
            dispatch({ type: ACTIONS.SET_CREDIT, payload: { creditUsed, creditInterest } }),

        incrementTrades: () => dispatch({ type: ACTIONS.INCREMENT_TRADES }),
        updateProfit: (profit) => dispatch({ type: ACTIONS.UPDATE_PROFIT, payload: profit }),
        updateWinStreak: (reset = false) =>
            dispatch({ type: ACTIONS.UPDATE_WIN_STREAK, payload: { reset } }),

        addXp: (xp) => dispatch({ type: ACTIONS.ADD_XP, payload: xp }),
        unlockAchievement: (id) => dispatch({ type: ACTIONS.UNLOCK_ACHIEVEMENT, payload: id }),
        unlockSkill: (id) => dispatch({ type: ACTIONS.UNLOCK_SKILL, payload: { id } }),

        addTrade: (trade) => dispatch({ type: ACTIONS.ADD_TRADE, payload: trade }),
        addOrder: (order) => dispatch({ type: ACTIONS.ADD_ORDER, payload: order }),
        removeOrder: (orderId) => dispatch({ type: ACTIONS.REMOVE_ORDER, payload: orderId }),

        loadGame: (savedState) => dispatch({ type: ACTIONS.LOAD_GAME, payload: savedState }),
        resetGame: () => dispatch({ type: ACTIONS.RESET_GAME })
    }), [])

    return (
        <GameStateContext.Provider value={state}>
            <GameDispatchContext.Provider value={actions}>
                {children}
            </GameDispatchContext.Provider>
        </GameStateContext.Provider>
    )
}

// 커스텀 훅
export function useGameState() {
    const context = useContext(GameStateContext)
    if (context === null) {
        throw new Error('useGameState must be used within a GameProvider')
    }
    return context
}

export function useGameActions() {
    const context = useContext(GameDispatchContext)
    if (context === null) {
        throw new Error('useGameActions must be used within a GameProvider')
    }
    return context
}

// 셀렉터 훅 (성능 최적화)
export function useGameSelector(selector) {
    const state = useGameState()
    return useMemo(() => selector(state), [state, selector])
}

export { ACTIONS }
export default { GameProvider, useGameState, useGameActions, useGameSelector }
