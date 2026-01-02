/**
 * priceCalculator.ts - Price Calculator (Server Stub)
 * 
 * This file will be replaced by copy-engine.js with the actual client logic.
 * Kept as a stub for TypeScript compilation before copying.
 */

import { RNG } from './rng';
import { MACRO_CONFIG, SECTORS } from './constants';

// Volatility config
export const VOLATILITY_CONFIG: Record<string, any> = {
    stock: { base: 0.0015, maxDaily: 0.15, typical: 0.03, momentum: 0.4 },
    etf: { base: 0.001, maxDaily: 0.10, typical: 0.02, momentum: 0.3 },
    crypto: { base: 0.012, maxDaily: 0.50, typical: 0.15, momentum: 1.2 },
    bond: { base: 0.0002, maxDaily: 0.02, typical: 0.005, momentum: 0.15 },
    commodity: { base: 0.002, maxDaily: 0.10, typical: 0.03, momentum: 0.4 }
};

export const getTickSize = (price: number, type = 'stock'): number => {
    if (type === 'crypto') {
        if (price < 10) return 0.01;
        if (price < 100) return 0.1;
        if (price < 1000) return 1;
        if (price < 10000) return 5;
        if (price < 100000) return 10;
        return 50;
    }
    if (type === 'bond') return 10;
    if (price < 1000) return 1;
    if (price < 5000) return 5;
    if (price < 10000) return 10;
    if (price < 50000) return 50;
    if (price < 100000) return 100;
    if (price < 500000) return 500;
    return 1000;
};

export const roundToTickSize = (price: number, type = 'stock'): number => {
    const tickSize = getTickSize(price, type);
    return Math.round(price / tickSize) * tickSize;
};

export const getMinPrice = (type = 'stock'): number => {
    if (type === 'crypto') return 0.01;
    if (type === 'bond') return 90000;
    if (type === 'commodity') return 1;
    return 100;
};

export const normalizePrice = (price: number, type = 'stock'): number => {
    return Math.max(getMinPrice(type), roundToTickSize(price, type));
};

export const calculatePriceChange = (
    stock: any,
    marketState: any = {},
    _gameDay = 0,
    activeNewsEffects: any[] = [],
    activeGlobalEvent: any = null,
    rng: RNG | null = null
): number => {
    const { trend = 0, volatility = 1, sectorTrends = {} } = marketState;
    const type = stock.type || 'stock';
    const config = VOLATILITY_CONFIG[type] || VOLATILITY_CONFIG.stock;

    const random = rng ? () => rng.nextFloat() : Math.random;

    const randomFactor = (random() + random() + random() - 1.5) / 1.5;
    let baseChange = randomFactor * config.base;

    baseChange += trend * config.base * 0.5;

    const sectorTrend = sectorTrends[stock.sector] || 0;
    baseChange += sectorTrend * config.base * 0.8;

    let volMultiplier = volatility;
    if (stock.fundamentals) {
        if (stock.fundamentals.pe) {
            const peFactor = 1 + (stock.fundamentals.pe - 20) * 0.005;
            volMultiplier *= Math.max(0.8, Math.min(1.5, peFactor));
        }
        if (stock.fundamentals.marketCap) {
            const cap = stock.fundamentals.marketCap;
            if (cap > 50) volMultiplier *= 0.9;
            else if (cap > 20) volMultiplier *= 0.95;
            else if (cap < 5) volMultiplier *= 1.15;
        }
    }
    baseChange *= volMultiplier;

    if (stock.momentum) {
        baseChange += stock.momentum * config.momentum * config.base;
    }

    const dailyOpen = stock.dailyOpen || stock.basePrice;
    const dailyChange = ((stock.price * (1 + baseChange)) - dailyOpen) / dailyOpen;
    if (Math.abs(dailyChange) > config.maxDaily) baseChange = 0;

    let newPrice = stock.price * (1 + baseChange);
    const tickSize = getTickSize(stock.price, type);
    const roundedPrice = roundToTickSize(newPrice, type);

    if (roundedPrice === stock.price && baseChange !== 0) {
        const moveChance = type === 'crypto' ? 0.6 : (type === 'bond' ? 0.25 : 0.45);
        if (random() < moveChance) {
            newPrice = stock.price + (baseChange > 0 ? tickSize : -tickSize);
        } else {
            newPrice = stock.price;
        }
    } else {
        newPrice = roundedPrice;
    }

    return Math.max(getMinPrice(type), newPrice);
};

export const startNewTradingDay = (stocks: any[]): any[] => {
    return stocks.map(stock => ({
        ...stock,
        dailyOpen: stock.price,
        dailyHigh: stock.price,
        dailyLow: stock.price,
        prevClose: stock.dailyOpen || stock.basePrice,
        momentum: (stock.momentum || 0) * 0.5
    }));
};

export const updateDailyRange = (stocks: any[]): any[] => {
    return stocks.map(stock => ({
        ...stock,
        dailyHigh: Math.max(stock.dailyHigh || stock.price, stock.price),
        dailyLow: Math.min(stock.dailyLow || stock.price, stock.price)
    }));
};
