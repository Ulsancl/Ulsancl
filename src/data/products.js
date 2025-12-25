/**
 * 금융 상품 데이터
 * constants.js에서 분리하여 유지보수성 향상
 */

// ETF 상품
export const ETF_PRODUCTS = [
    { id: 201, name: 'KODEX 200', code: 'KODEX200', price: 35000, basePrice: 35000, color: '#FF6B6B', type: 'etf', underlying: ['tech', 'finance', 'energy'], volatility: 1.2 },
    { id: 202, name: 'TIGER 반도체', code: 'TGSEMI', price: 18500, basePrice: 18500, color: '#4ECDC4', type: 'etf', underlying: ['semiconductor', 'tech'], volatility: 2.0 },
    { id: 203, name: 'KODEX 레버리지', code: 'KODEXLV', price: 22000, basePrice: 22000, color: '#FFE66D', type: 'etf', leverage: 2, underlying: ['tech', 'finance'], volatility: 2.5 },
    { id: 204, name: 'KODEX 인버스', code: 'KODEXIV', price: 4500, basePrice: 4500, color: '#95E1D3', type: 'etf', inverse: true, underlying: ['tech', 'finance'], volatility: 2.0 },
    { id: 205, name: 'TIGER 2차전지', code: 'TGBATT', price: 95000, basePrice: 95000, color: '#F38181', type: 'etf', underlying: ['energy'], volatility: 2.2 },
    { id: 206, name: 'KODEX 바이오', code: 'KODEXBI', price: 125000, basePrice: 125000, color: '#AA96DA', type: 'etf', underlying: ['bio'], volatility: 2.0 },
    { id: 207, name: 'TIGER 미국나스닥100', code: 'TGNAS', price: 85000, basePrice: 85000, color: '#FCBAD3', type: 'etf', underlying: ['tech'], volatility: 1.8 },
    { id: 208, name: 'KODEX 골드선물', code: 'KODEXGD', price: 14500, basePrice: 14500, color: '#FFD700', type: 'etf', underlying: ['commodity'], volatility: 1.5 },
]

// 암호화폐 상품
export const CRYPTO_PRODUCTS = [
    { id: 301, name: '비트코인', code: 'BTC', price: 52000000, basePrice: 52000000, color: '#F7931A', type: 'crypto', volatility: 4.0 },
    { id: 302, name: '이더리움', code: 'ETH', price: 3200000, basePrice: 3200000, color: '#627EEA', type: 'crypto', volatility: 5.0 },
    { id: 303, name: '리플', code: 'XRP', price: 850, basePrice: 850, color: '#23292F', type: 'crypto', volatility: 6.0 },
    { id: 304, name: '솔라나', code: 'SOL', price: 145000, basePrice: 145000, color: '#00FFA3', type: 'crypto', volatility: 7.0 },
    { id: 305, name: '도지코인', code: 'DOGE', price: 120, basePrice: 120, color: '#C2A633', type: 'crypto', volatility: 8.0 },
    { id: 306, name: '에이다', code: 'ADA', price: 650, basePrice: 650, color: '#0033AD', type: 'crypto', volatility: 6.5 },
]

// 채권 상품
export const BOND_PRODUCTS = [
    { id: 401, name: '국고채 3년', code: 'KTB3Y', price: 100500, basePrice: 100500, color: '#1A237E', type: 'bond', yield: 3.5, maturity: 3, volatility: 0.3 },
    { id: 402, name: '국고채 10년', code: 'KTB10Y', price: 98200, basePrice: 98200, color: '#283593', type: 'bond', yield: 4.2, maturity: 10, volatility: 0.5 },
    { id: 403, name: '통안채 2년', code: 'MSB2Y', price: 99800, basePrice: 99800, color: '#303F9F', type: 'bond', yield: 3.8, maturity: 2, volatility: 0.25 },
    { id: 404, name: '회사채 AA-', code: 'CORPAA', price: 97500, basePrice: 97500, color: '#3949AB', type: 'bond', yield: 5.5, maturity: 5, volatility: 0.8 },
]

// 원자재 상품
export const COMMODITY_PRODUCTS = [
    { id: 411, name: '금', code: 'GOLD', price: 78000, basePrice: 78000, color: '#FFD700', type: 'commodity', unit: 'g', volatility: 2.0 },
    { id: 412, name: '은', code: 'SILVER', price: 950, basePrice: 950, color: '#C0C0C0', type: 'commodity', unit: 'g', volatility: 3.0 },
    { id: 413, name: 'WTI 원유', code: 'WTI', price: 95000, basePrice: 95000, color: '#4A4A4A', type: 'commodity', unit: 'barrel', volatility: 4.0 },
    { id: 414, name: '천연가스', code: 'NATGAS', price: 3500, basePrice: 3500, color: '#87CEEB', type: 'commodity', unit: 'mmBtu', volatility: 5.0 },
    { id: 415, name: '구리', code: 'COPPER', price: 12000, basePrice: 12000, color: '#B87333', type: 'commodity', unit: 'kg', volatility: 3.0 },
    { id: 416, name: '옥수수', code: 'CORN', price: 8500, basePrice: 8500, color: '#F4D03F', type: 'commodity', unit: 'bushel', volatility: 3.5 },
    { id: 417, name: '대두', code: 'SOYBEAN', price: 15000, basePrice: 15000, color: '#8D6E63', type: 'commodity', unit: 'bushel', volatility: 3.5 },
    { id: 418, name: '커피', code: 'COFFEE', price: 2500, basePrice: 2500, color: '#6D4C41', type: 'commodity', unit: 'lb', volatility: 4.0 },
    { id: 419, name: '설탕', code: 'SUGAR', price: 350, basePrice: 350, color: '#FFFFFF', type: 'commodity', unit: 'lb', volatility: 3.5 },
    { id: 420, name: '목화', code: 'COTTON', price: 1200, basePrice: 1200, color: '#ECEFF1', type: 'commodity', unit: 'lb', volatility: 3.5 },
]
