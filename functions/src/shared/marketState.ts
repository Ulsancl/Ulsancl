/**
 * marketState.ts - Market State (Server Stub)
 * 
 * This file will be replaced by copy-engine.js with the actual client logic.
 * Kept as a stub for TypeScript compilation before copying.
 */

import { RNG } from './rng';
import { SECTORS, MACRO_CONFIG } from './constants';

export const SECONDS_PER_DAY = 300;
export const GAME_START_YEAR = 2020;
export const DAYS_PER_YEAR = 365;
export const MINUTES_PER_TICK = 10;
export const MARKET_OPEN_HOUR = 9;
export const MARKET_CLOSE_HOUR = 16;

export const SEASONS: Record<string, any> = {
    spring: { months: [3, 4, 5], name: '봄', icon: '🌸' },
    summer: { months: [6, 7, 8], name: '여름', icon: '☀️' },
    autumn: { months: [9, 10, 11], name: '가을', icon: '🍂' },
    winter: { months: [12, 1, 2], name: '겨울', icon: '❄️' }
};

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

export const updateMarketState = (
    prevState: MarketState,
    activeGlobalEvent: any = null,
    rng: RNG | null = null
): MarketState => {
    const random = rng ? () => rng.nextFloat() : Math.random;

    const macro = prevState.macro || {
        interestRate: MACRO_CONFIG.interestRate.base,
        inflation: MACRO_CONFIG.inflation.base,
        gdpGrowth: MACRO_CONFIG.gdpGrowth.base
    };

    if (random() < 0.001) {
        macro.interestRate += (random() - 0.5) * MACRO_CONFIG.interestRate.volatility;
        macro.interestRate = Math.max(MACRO_CONFIG.interestRate.min, Math.min(MACRO_CONFIG.interestRate.max, macro.interestRate));
    }
    if (random() < 0.001) {
        macro.inflation += (random() - 0.5) * MACRO_CONFIG.inflation.volatility;
        macro.inflation = Math.max(MACRO_CONFIG.inflation.min, Math.min(MACRO_CONFIG.inflation.max, macro.inflation));
    }
    if (random() < 0.001) {
        macro.gdpGrowth += (random() - 0.5) * MACRO_CONFIG.gdpGrowth.volatility;
        macro.gdpGrowth = Math.max(MACRO_CONFIG.gdpGrowth.min, Math.min(MACRO_CONFIG.gdpGrowth.max, macro.gdpGrowth));
    }

    let macroTrendBoost = 0;
    macroTrendBoost += (MACRO_CONFIG.interestRate.base - macro.interestRate) * 0.02;
    macroTrendBoost += (macro.gdpGrowth - MACRO_CONFIG.gdpGrowth.base) * 0.03;
    macroTrendBoost -= (macro.inflation - MACRO_CONFIG.inflation.base) * 0.01;

    let newTrend = prevState.trend * 0.98 + (random() - 0.5) * 0.05 + macroTrendBoost * 0.01;
    newTrend = Math.max(-0.5, Math.min(0.5, newTrend));

    let newVolatility = prevState.volatility * 0.95 + 1 * 0.05 + (random() - 0.5) * 0.1;

    if (activeGlobalEvent?.volatilityBoost) {
        newVolatility *= activeGlobalEvent.volatilityBoost;
    }

    if (macro.inflation > 4.0) {
        newVolatility *= 1.2;
    }

    newVolatility = Math.max(0.5, Math.min(2.5, newVolatility));

    const sectorTrends = { ...prevState.sectorTrends };
    Object.keys(SECTORS).forEach(sector => {
        let current = sectorTrends[sector] || 0;
        let sensitivity = 0;
        if (sector === 'tech' || sector === 'bio') {
            sensitivity -= (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.05;
        } else if (sector === 'finance') {
            sensitivity += (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.04;
        } else if (sector === 'energy' || sector === 'steel') {
            sensitivity += (macro.inflation - MACRO_CONFIG.inflation.base) * 0.03;
        }

        current = current * 0.95 + (random() - 0.5) * 0.1 + sensitivity * 0.05;
        sectorTrends[sector] = Math.max(-0.5, Math.min(0.5, current));
    });

    return { trend: newTrend, volatility: newVolatility, sectorTrends, macro };
};

export const isMarketHours = (hour: number, minute = 0): boolean => {
    const currentHour = hour + minute / 60;
    return currentHour >= MARKET_OPEN_HOUR && currentHour < MARKET_CLOSE_HOUR;
};
