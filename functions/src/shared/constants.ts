/**
 * constants.ts - Shared Constants (Server Stub)
 * 
 * This file contains stub constants for TypeScript compilation.
 * Will be replaced by copy-engine.js with actual client constants.
 * 
 * @module shared/constants
 * @version 3.0.0
 */

// Initial capital (default for seasons)
export const INITIAL_CAPITAL = 100000000; // 1억원

// Sector definitions
export const SECTORS: Record<string, { name: string; icon: string }> = {
    tech: { name: '기술', icon: '💻' },
    semiconductor: { name: '반도체', icon: '🔬' },
    bio: { name: '바이오', icon: '🧬' },
    finance: { name: '금융', icon: '🏦' },
    auto: { name: '자동차', icon: '🚗' },
    chemical: { name: '화학', icon: '⚗️' },
    steel: { name: '철강', icon: '🏗️' },
    energy: { name: '에너지', icon: '⚡' },
    construction: { name: '건설', icon: '🏢' },
    retail: { name: '유통', icon: '🛒' },
    entertainment: { name: '엔터', icon: '🎬' },
    telecom: { name: '통신', icon: '📡' },
    defense: { name: '방산', icon: '🛡️' },
    shipping: { name: '해운', icon: '🚢' },
    airline: { name: '항공', icon: '✈️' }
};

// Initial stocks data (stub - will be replaced by copy-engine)
export const INITIAL_STOCKS = [
    { id: 'samsung', name: '삼성전자', price: 72000, basePrice: 72000, type: 'stock', sector: 'tech', fundamentals: { pe: 12, marketCap: 430, debtRatio: 35, yield: 2.5 } },
    { id: 'sk', name: 'SK하이닉스', price: 145000, basePrice: 145000, type: 'stock', sector: 'semiconductor', fundamentals: { pe: 8, marketCap: 100, debtRatio: 45, yield: 1.2 } },
    { id: 'lg', name: 'LG에너지솔루션', price: 380000, basePrice: 380000, type: 'stock', sector: 'tech', fundamentals: { pe: 45, marketCap: 89, debtRatio: 60, yield: 0 } },
    { id: 'hyundai', name: '현대차', price: 195000, basePrice: 195000, type: 'stock', sector: 'auto', fundamentals: { pe: 6, marketCap: 45, debtRatio: 80, yield: 3.0 } },
    { id: 'kia', name: '기아', price: 95000, basePrice: 95000, type: 'stock', sector: 'auto', fundamentals: { pe: 5, marketCap: 38, debtRatio: 75, yield: 4.0 } },
    { id: 'naver', name: '네이버', price: 180000, basePrice: 180000, type: 'stock', sector: 'tech', fundamentals: { pe: 25, marketCap: 29, debtRatio: 25, yield: 0.5 } },
    { id: 'kakao', name: '카카오', price: 42000, basePrice: 42000, type: 'stock', sector: 'tech', fundamentals: { pe: 35, marketCap: 18, debtRatio: 40, yield: 0.3 } },
    { id: 'celltrion', name: '셀트리온', price: 175000, basePrice: 175000, type: 'stock', sector: 'bio', fundamentals: { pe: 30, marketCap: 24, debtRatio: 20, yield: 0.5 } },
    { id: 'samsung_bio', name: '삼성바이오로직스', price: 800000, basePrice: 800000, type: 'stock', sector: 'bio', fundamentals: { pe: 60, marketCap: 58, debtRatio: 15, yield: 0 } },
    { id: 'posco', name: 'POSCO홀딩스', price: 350000, basePrice: 350000, type: 'stock', sector: 'steel', fundamentals: { pe: 8, marketCap: 30, debtRatio: 55, yield: 3.5 } },
    { id: 'kb', name: 'KB금융', price: 58000, basePrice: 58000, type: 'stock', sector: 'finance', fundamentals: { pe: 5, marketCap: 24, debtRatio: 90, yield: 5.0 } },
    { id: 'shinhan', name: '신한지주', price: 42000, basePrice: 42000, type: 'stock', sector: 'finance', fundamentals: { pe: 5, marketCap: 21, debtRatio: 88, yield: 4.8 } },
    { id: 'hanhwa', name: '한화에어로스페이스', price: 180000, basePrice: 180000, type: 'stock', sector: 'defense', fundamentals: { pe: 20, marketCap: 9, debtRatio: 50, yield: 0.8 } },
    { id: 'korean_air', name: '대한항공', price: 22000, basePrice: 22000, type: 'stock', sector: 'airline', fundamentals: { pe: 10, marketCap: 8, debtRatio: 150, yield: 1.0 } },
    { id: 'hybe', name: '하이브', price: 210000, basePrice: 210000, type: 'stock', sector: 'entertainment', fundamentals: { pe: 40, marketCap: 9, debtRatio: 30, yield: 0 } }
];

// Macro configuration (for market state)
export const MACRO_CONFIG = {
    interestRate: { base: 3.5, min: 0.5, max: 10, volatility: 0.25 },
    inflation: { base: 2.5, min: -1, max: 15, volatility: 0.5 },
    gdpGrowth: { base: 2.5, min: -5, max: 10, volatility: 0.3 }
};
