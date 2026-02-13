/**
 * engine.ts - Server-Side Replay Engine
 * 
 * Replays a complete game session using the same deterministic logic as the client.
 * Uses shared engine modules copied from client source via copy-engine.cjs.
 * 
 * CRITICAL: This must produce IDENTICAL results to client for same seed + tradeLogs
 * 
 * @module replay/engine
 * @version 3.0.0
 */

// Import shared engine modules (copied from client by copy-engine.cjs)
import { createRng } from '../shared/rng';
import { calculatePriceChange } from '../shared/priceCalculator';
import { updateMarketState } from '../shared/marketState';
import { INITIAL_STOCKS, INITIAL_CAPITAL } from '../shared/constants';

// ============================================
// TYPES
// ============================================

export interface TradeAction {
    tick: number;
    type: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
    stockId: string;
    quantity: number;
    orderType?: 'market' | 'limit';
    limitPrice?: number;
}

export interface ReplayOptions {
    initialCapital: number;
    totalTicks: number;
    ticksPerDay?: number;
}

export interface ReplayResult {
    finalScore: number;
    portfolioValue: number;
    cashBalance: number;
    profitRate: number;
    totalAssets: number;
    winRate: number;
    totalTrades: number;
    profitableTrades: number;
    maxDrawdown: number;
    valid: boolean;
    error?: string;
}

interface Stock {
    id: string;
    name: string;
    price: number;
    basePrice: number;
    dailyOpen: number;
    dailyHigh: number;
    dailyLow: number;
    prevClose: number;
    type: string;
    sector: string;
    momentum: number;
    fundamentals?: {
        pe?: number;
        marketCap?: number;
        debtRatio?: number;
        yield?: number;
    };
}

interface PortfolioItem {
    stockId: string;
    quantity: number;
    averagePrice: number;
    totalCost: number;
}

interface ShortPosition {
    stockId: string;
    quantity: number;
    entryPrice: number;
}

interface MarketState {
    trend: number;
    volatility: number;
    sectorTrends: Record<string, number>;
    macro?: {
        interestRate: number;
        inflation: number;
        gdpGrowth: number;
    };
}

// ============================================
// CONSTANTS
// ============================================

const TICKS_PER_DAY = 42; // Market hours: 9:00 - 16:00 = 7 hours = 42 ticks (10min each)
const COMMISSION_RATE = 0.00015; // 0.015% per trade
const TAX_RATE = 0.0023; // 0.23% tax on sell

// ============================================
// MAIN REPLAY FUNCTION
// ============================================

/**
 * Replay a complete game session
 * 
 * @param seed - RNG seed loaded from Firestore (server-only)
 * @param tradeLogs - Trade actions from client payload
 * @param options - Replay configuration
 * @returns Complete replay result with final score
 */
export function replayGame(
    seed: string,
    tradeLogs: TradeAction[],
    options: ReplayOptions
): ReplayResult {
    // Initialize RNG with season seed
    const rng = createRng(seed);

    // Initialize game state
    let cash = options.initialCapital || INITIAL_CAPITAL;
    const portfolio = new Map<string, PortfolioItem>();
    const shortPositions = new Map<string, ShortPosition>();

    // Initialize stocks from shared constants
    const stocks: Stock[] = initializeStocks();

    // Initialize market state
    let marketState: MarketState = {
        trend: 0,
        volatility: 1,
        sectorTrends: {}
    };

    // Trade tracking for statistics
    let profitableTrades = 0;
    let completedTrades = 0;
    let maxPortfolioValue = options.initialCapital;
    let maxDrawdown = 0;

    // Sort trades by tick for sequential processing
    const sortedTrades = [...tradeLogs].sort((a, b) => a.tick - b.tick);
    let tradeIndex = 0;

    // Active news/events (simplified for replay)
    const activeNewsEffects: any[] = [];
    let activeGlobalEvent: any = null;

    // Game day tracking
    let currentDay = 0;
    const ticksPerDay = options.ticksPerDay || TICKS_PER_DAY;

    // ========================================
    // MAIN REPLAY LOOP
    // ========================================

    try {
        for (let tick = 0; tick <= options.totalTicks; tick++) {
            // Check for new day
            const newDay = Math.floor(tick / ticksPerDay);
            if (newDay > currentDay) {
                currentDay = newDay;
                // Apply new day price reset
                applyNewTradingDay(stocks);
            }

            // Update market state (uses RNG deterministically)
            marketState = updateMarketState(
                marketState as unknown as Record<string, unknown>,
                activeGlobalEvent,
                rng as unknown as undefined
            ) as MarketState;

            // Update all stock prices (uses RNG deterministically)
            updateAllPrices(stocks, marketState, currentDay, activeNewsEffects, activeGlobalEvent, rng);

            // Process trades at this tick
            while (tradeIndex < sortedTrades.length && sortedTrades[tradeIndex].tick === tick) {
                const trade = sortedTrades[tradeIndex];

                const result = executeTrade(
                    trade,
                    stocks,
                    portfolio,
                    shortPositions,
                    cash
                );

                if (!result.success) {
                    // Trade failed - this indicates a replay mismatch or cheat attempt
                    return {
                        finalScore: 0,
                        portfolioValue: 0,
                        cashBalance: cash,
                        profitRate: -100,
                        totalAssets: 0,
                        winRate: 0,
                        totalTrades: tradeLogs.length,
                        profitableTrades: 0,
                        maxDrawdown: 100,
                        valid: false,
                        error: `Trade failed at tick ${tick}: ${result.error}`
                    };
                }

                cash = result.newCash;

                // Track trade outcomes
                if (result.realized !== undefined) {
                    completedTrades++;
                    if (result.realized > 0) {
                        profitableTrades++;
                    }
                }

                tradeIndex++;
            }

            // Calculate current portfolio value for drawdown tracking
            const currentValue = calculatePortfolioValue(stocks, portfolio, shortPositions, cash);
            if (currentValue > maxPortfolioValue) {
                maxPortfolioValue = currentValue;
            }
            const drawdown = ((maxPortfolioValue - currentValue) / maxPortfolioValue) * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // ========================================
        // CALCULATE FINAL RESULTS
        // ========================================

        const finalPortfolioValue = calculatePortfolioValue(stocks, portfolio, shortPositions, cash);
        const totalAssets = finalPortfolioValue;
        const profitRate = ((totalAssets - options.initialCapital) / options.initialCapital) * 100;

        // Score is profit rate * 100 (so 50% = 5000 score)
        const finalScore = Math.round(profitRate * 100);

        return {
            finalScore,
            portfolioValue: finalPortfolioValue,
            cashBalance: cash,
            profitRate,
            totalAssets,
            winRate: completedTrades > 0 ? (profitableTrades / completedTrades) * 100 : 0,
            totalTrades: tradeLogs.length,
            profitableTrades,
            maxDrawdown,
            valid: true
        };

    } catch (error) {
        console.error('Replay engine error:', error);
        return {
            finalScore: 0,
            portfolioValue: 0,
            cashBalance: 0,
            profitRate: -100,
            totalAssets: 0,
            winRate: 0,
            totalTrades: tradeLogs.length,
            profitableTrades: 0,
            maxDrawdown: 100,
            valid: false,
            error: `Replay error: ${(error as Error).message}`
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Initialize stocks from shared constants
 */
function initializeStocks(): Stock[] {
    // Use shared INITIAL_STOCKS from copied constants
    return INITIAL_STOCKS.map((stock: any) => ({
        ...stock,
        dailyOpen: stock.price,
        dailyHigh: stock.price,
        dailyLow: stock.price,
        prevClose: stock.price,
        momentum: 0
    }));
}

/**
 * Apply new trading day reset
 */
function applyNewTradingDay(stocks: Stock[]): void {
    for (const stock of stocks) {
        stock.prevClose = stock.dailyOpen;
        stock.dailyOpen = stock.price;
        stock.dailyHigh = stock.price;
        stock.dailyLow = stock.price;
        stock.momentum = (stock.momentum || 0) * 0.5; // Momentum decay
    }
}

/**
 * Update all stock prices using deterministic RNG
 */
function updateAllPrices(
    stocks: Stock[],
    marketState: MarketState,
    gameDay: number,
    activeNewsEffects: any[],
    activeGlobalEvent: any,
    rng: unknown
): void {
    for (const stock of stocks) {
        const newPrice = calculatePriceChange(
            stock,
            marketState,
            gameDay,
            activeNewsEffects as never[],
            activeGlobalEvent,
            rng as undefined
        ) as number;

        stock.price = newPrice;
        stock.dailyHigh = Math.max(stock.dailyHigh, newPrice);
        stock.dailyLow = Math.min(stock.dailyLow, newPrice);
    }
}

/**
 * Execute a trade action
 */
function executeTrade(
    trade: TradeAction,
    stocks: Stock[],
    portfolio: Map<string, PortfolioItem>,
    shortPositions: Map<string, ShortPosition>,
    cash: number
): { success: boolean; newCash: number; realized?: number; error?: string } {

    const stock = stocks.find(s => s.id === trade.stockId);
    if (!stock) {
        return { success: false, newCash: cash, error: `Stock not found: ${trade.stockId}` };
    }

    if (trade.quantity <= 0) {
        return { success: false, newCash: cash, error: 'Invalid quantity' };
    }

    const price = stock.price;
    const totalValue = price * trade.quantity;
    const commission = totalValue * COMMISSION_RATE;

    switch (trade.type) {
        case 'BUY': {
            const totalCost = totalValue + commission;

            if (cash < totalCost) {
                return { success: false, newCash: cash, error: 'Insufficient funds for BUY' };
            }

            const existing = portfolio.get(trade.stockId);
            if (existing) {
                // Average up/down
                const totalQuantity = existing.quantity + trade.quantity;
                const totalCostBasis = existing.totalCost + totalValue;
                existing.quantity = totalQuantity;
                existing.totalCost = totalCostBasis;
                existing.averagePrice = totalCostBasis / totalQuantity;
            } else {
                portfolio.set(trade.stockId, {
                    stockId: trade.stockId,
                    quantity: trade.quantity,
                    averagePrice: price,
                    totalCost: totalValue
                });
            }

            return { success: true, newCash: cash - totalCost };
        }

        case 'SELL': {
            const existing = portfolio.get(trade.stockId);
            if (!existing || existing.quantity < trade.quantity) {
                return { success: false, newCash: cash, error: 'Insufficient shares for SELL' };
            }

            const tax = totalValue * TAX_RATE;
            const netProceeds = totalValue - commission - tax;

            // Calculate realized P/L
            const costBasis = existing.averagePrice * trade.quantity;
            const realized = netProceeds - costBasis;

            existing.quantity -= trade.quantity;
            existing.totalCost -= costBasis;

            if (existing.quantity === 0) {
                portfolio.delete(trade.stockId);
            }

            return { success: true, newCash: cash + netProceeds, realized };
        }

        case 'SHORT': {
            // Short selling: borrow shares and sell
            const netProceeds = totalValue - commission;

            const existing = shortPositions.get(trade.stockId);
            if (existing) {
                const totalQuantity = existing.quantity + trade.quantity;
                const totalValue = existing.entryPrice * existing.quantity + price * trade.quantity;
                existing.quantity = totalQuantity;
                existing.entryPrice = totalValue / totalQuantity;
            } else {
                shortPositions.set(trade.stockId, {
                    stockId: trade.stockId,
                    quantity: trade.quantity,
                    entryPrice: price
                });
            }

            return { success: true, newCash: cash + netProceeds };
        }

        case 'COVER': {
            // Cover short position: buy back shares
            const existing = shortPositions.get(trade.stockId);
            if (!existing || existing.quantity < trade.quantity) {
                return { success: false, newCash: cash, error: 'No short position to cover' };
            }

            const coverCost = totalValue + commission;

            if (cash < coverCost) {
                return { success: false, newCash: cash, error: 'Insufficient funds to cover' };
            }

            // Calculate realized P/L (profit if current price < entry price)
            const shortProceeds = existing.entryPrice * trade.quantity;
            const realized = shortProceeds - totalValue - commission;

            existing.quantity -= trade.quantity;

            if (existing.quantity === 0) {
                shortPositions.delete(trade.stockId);
            }

            return { success: true, newCash: cash - coverCost, realized };
        }

        default:
            return { success: false, newCash: cash, error: `Unknown trade type: ${trade.type}` };
    }
}

/**
 * Calculate total portfolio value
 */
function calculatePortfolioValue(
    stocks: Stock[],
    portfolio: Map<string, PortfolioItem>,
    shortPositions: Map<string, ShortPosition>,
    cash: number
): number {
    let totalValue = cash;

    // Long positions
    portfolio.forEach((item, stockId) => {
        const stock = stocks.find(s => s.id === stockId);
        if (stock) {
            totalValue += stock.price * item.quantity;
        }
    });

    // Short positions (liability)
    shortPositions.forEach((position, stockId) => {
        const stock = stocks.find(s => s.id === stockId);
        if (stock) {
            // Short position value = entry proceeds - current value
            const currentLiability = stock.price * position.quantity;
            const entryProceeds = position.entryPrice * position.quantity;
            totalValue += (entryProceeds - currentLiability);
        }
    });

    return totalValue;
}

// ============================================
// EXPORTS
// ============================================

export { calculatePortfolioValue, executeTrade, initializeStocks };
