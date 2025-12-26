/**
 * Additional tradeable products
 */

export const ETF_PRODUCTS = [
    // 국내 지수
    { id: 101, name: 'KODEX 200', code: 'K200', price: 35000, basePrice: 35000, color: '#2196F3', type: 'etf', category: 'index', description: 'KOSPI 200 추종' },
    { id: 102, name: 'KODEX 레버리지', code: 'K2X', price: 18000, basePrice: 18000, color: '#FF5722', type: 'etf', category: 'leverage', multiplier: 2, description: 'KOSPI 200 2배', baseStockId: 101 },
    { id: 103, name: 'KODEX 인버스', code: 'KINV', price: 5500, basePrice: 5500, color: '#9C27B0', type: 'etf', category: 'inverse', multiplier: -1, description: 'KOSPI 역방향', baseStockId: 101 },
    { id: 104, name: 'KODEX 코스닥150', code: 'KDAQ', price: 12500, basePrice: 12500, color: '#E91E63', type: 'etf', category: 'index', description: '코스닥 150' },
    { id: 105, name: 'KODEX 코스닥 레버리지', code: 'KDAQ2X', price: 8500, basePrice: 8500, color: '#FF1744', type: 'etf', category: 'leverage', multiplier: 2, description: '코스닥 2배', baseStockId: 104 },
    // 섹터 ETF
    { id: 106, name: 'KODEX 2차전지', code: 'KBAT', price: 12000, basePrice: 12000, color: '#4CAF50', type: 'etf', category: 'sector', sector: 'energy', description: '2차전지 섹터' },
    { id: 107, name: 'TIGER 반도체', code: 'TSEM', price: 28000, basePrice: 28000, color: '#00BCD4', type: 'etf', category: 'sector', sector: 'tech', description: '반도체 섹터' },
    { id: 108, name: 'KODEX 바이오', code: 'KBIO', price: 42000, basePrice: 42000, color: '#EC407A', type: 'etf', category: 'sector', sector: 'bio', description: '바이오 섹터' },
    { id: 109, name: 'TIGER 금융', code: 'TFIN', price: 15000, basePrice: 15000, color: '#8D6E63', type: 'etf', category: 'sector', sector: 'finance', description: '금융 섹터' },
    // 해외 지수
    { id: 110, name: 'TIGER 미국S&P500', code: 'TSPX', price: 15000, basePrice: 15000, color: '#1565C0', type: 'etf', category: 'index', description: 'S&P 500' },
    { id: 111, name: 'TIGER 나스닥100', code: 'TNDQ', price: 85000, basePrice: 85000, color: '#0277BD', type: 'etf', category: 'index', description: '나스닥 100' },
    { id: 112, name: 'TIGER 차이나CSI300', code: 'TCSI', price: 9500, basePrice: 9500, color: '#D32F2F', type: 'etf', category: 'index', description: '중국 CSI 300' },
    { id: 113, name: 'KODEX 일본NIKKEI225', code: 'KNIK', price: 12000, basePrice: 12000, color: '#C62828', type: 'etf', category: 'index', description: '닛케이 225' },
    { id: 114, name: 'TIGER 유로STOXX50', code: 'TEURO', price: 11000, basePrice: 11000, color: '#1565C0', type: 'etf', category: 'index', description: '유로 STOXX' },
    // 원자재/테마
    { id: 115, name: 'KODEX 골드선물', code: 'KGLD', price: 14000, basePrice: 14000, color: '#FFD700', type: 'etf', category: 'commodity', description: '금 선물' },
    { id: 116, name: 'KODEX WTI원유선물', code: 'KWTI', price: 8500, basePrice: 8500, color: '#424242', type: 'etf', category: 'commodity', description: 'WTI 원유' },
    { id: 117, name: 'TIGER AI코리아', code: 'TAIK', price: 22000, basePrice: 22000, color: '#7C4DFF', type: 'etf', category: 'theme', description: 'AI 테마' },
    { id: 118, name: 'KODEX K-방산', code: 'KDEF', price: 18000, basePrice: 18000, color: '#455A64', type: 'etf', category: 'theme', description: '방산 테마' },
    { id: 119, name: 'TIGER 미국테크TOP10', code: 'TTECH', price: 25000, basePrice: 25000, color: '#00ACC1', type: 'etf', category: 'theme', description: '빅테크 TOP10' },
    { id: 120, name: 'KODEX 배당성장', code: 'KDIV', price: 11500, basePrice: 11500, color: '#43A047', type: 'etf', category: 'dividend', description: '배당 성장' },
]

// 암호화폐 (30개) - 변동성 대폭 증가

export const CRYPTO_PRODUCTS = [
    // 메이저 코인
    { id: 201, name: '비트코인', code: 'BTC', price: 58000000, basePrice: 58000000, color: '#F7931A', type: 'crypto', volatility: 8 },
    { id: 202, name: '이더리움', code: 'ETH', price: 3200000, basePrice: 3200000, color: '#627EEA', type: 'crypto', volatility: 10 },
    { id: 203, name: '리플', code: 'XRP', price: 850, basePrice: 850, color: '#00AAE4', type: 'crypto', volatility: 12 },
    { id: 204, name: '솔라나', code: 'SOL', price: 145000, basePrice: 145000, color: '#00FFA3', type: 'crypto', volatility: 15 },
    { id: 205, name: '에이다', code: 'ADA', price: 650, basePrice: 650, color: '#0033AD', type: 'crypto', volatility: 12 },
    // 밈/알트코인
    { id: 206, name: '도지코인', code: 'DOGE', price: 120, basePrice: 120, color: '#C3A634', type: 'crypto', volatility: 25 },
    { id: 207, name: '시바이누', code: 'SHIB', price: 0.015, basePrice: 0.015, color: '#FFA000', type: 'crypto', volatility: 30 },
    { id: 208, name: '페페', code: 'PEPE', price: 0.0001, basePrice: 0.0001, color: '#4CAF50', type: 'crypto', volatility: 35 },
    { id: 209, name: '플로키', code: 'FLOKI', price: 0.0002, basePrice: 0.0002, color: '#FFD700', type: 'crypto', volatility: 30 },
    { id: 210, name: '본크', code: 'BONK', price: 0.00003, basePrice: 0.00003, color: '#FF5722', type: 'crypto', volatility: 35 },
    // DeFi 코인
    { id: 211, name: '유니스왑', code: 'UNI', price: 8500, basePrice: 8500, color: '#FF007A', type: 'crypto', volatility: 15 },
    { id: 212, name: '에이브', code: 'AAVE', price: 120000, basePrice: 120000, color: '#2EBAC6', type: 'crypto', volatility: 14 },
    { id: 213, name: '체인링크', code: 'LINK', price: 18000, basePrice: 18000, color: '#2A5ADA', type: 'crypto', volatility: 13 },
    { id: 214, name: '메이커', code: 'MKR', price: 1800000, basePrice: 1800000, color: '#1AAB9B', type: 'crypto', volatility: 12 },
    { id: 215, name: '컴파운드', code: 'COMP', price: 65000, basePrice: 65000, color: '#00D395', type: 'crypto', volatility: 14 },
    // 레이어1/2
    { id: 216, name: '폴리곤', code: 'MATIC', price: 950, basePrice: 950, color: '#8247E5', type: 'crypto', volatility: 15 },
    { id: 217, name: '아발란체', code: 'AVAX', price: 42000, basePrice: 42000, color: '#E84142', type: 'crypto', volatility: 16 },
    { id: 218, name: '니어프로토콜', code: 'NEAR', price: 5500, basePrice: 5500, color: '#00C08B', type: 'crypto', volatility: 18 },
    { id: 219, name: '아비트럼', code: 'ARB', price: 1200, basePrice: 1200, color: '#12AAFF', type: 'crypto', volatility: 18 },
    { id: 220, name: '옵티미즘', code: 'OP', price: 2800, basePrice: 2800, color: '#FF0420', type: 'crypto', volatility: 18 },
    // AI/게임 코인
    { id: 221, name: '렌더', code: 'RNDR', price: 8500, basePrice: 8500, color: '#C32AFF', type: 'crypto', volatility: 20 },
    { id: 222, name: '더샌드박스', code: 'SAND', price: 550, basePrice: 550, color: '#00ADEF', type: 'crypto', volatility: 20 },
    { id: 223, name: '엑시인피니티', code: 'AXS', price: 9500, basePrice: 9500, color: '#0055D5', type: 'crypto', volatility: 22 },
    { id: 224, name: '갈라', code: 'GALA', price: 35, basePrice: 35, color: '#000000', type: 'crypto', volatility: 25 },
    { id: 225, name: '월드코인', code: 'WLD', price: 3500, basePrice: 3500, color: '#000000', type: 'crypto', volatility: 22 },
    // 기타 알트
    { id: 226, name: '스텔라루멘', code: 'XLM', price: 150, basePrice: 150, color: '#08B5E5', type: 'crypto', volatility: 14 },
    { id: 227, name: '코스모스', code: 'ATOM', price: 12000, basePrice: 12000, color: '#2E3148', type: 'crypto', volatility: 15 },
    { id: 228, name: '알고랜드', code: 'ALGO', price: 180, basePrice: 180, color: '#000000', type: 'crypto', volatility: 16 },
    { id: 229, name: '인터넷컴퓨터', code: 'ICP', price: 15000, basePrice: 15000, color: '#3B00B9', type: 'crypto', volatility: 18 },
    { id: 230, name: '앱토스', code: 'APT', price: 12000, basePrice: 12000, color: '#2DD8A7', type: 'crypto', volatility: 20 },
]

// 채권 (18개)

export const BOND_PRODUCTS = [
    // 한국 국채
    { id: 301, name: '국고채 3년', code: 'KTB3', price: 100000, basePrice: 100000, color: '#607D8B', type: 'bond', yield: 3.5, volatility: 0.2 },
    { id: 302, name: '국고채 5년', code: 'KTB5', price: 100000, basePrice: 100000, color: '#546E7A', type: 'bond', yield: 3.8, volatility: 0.3 },
    { id: 303, name: '국고채 10년', code: 'KTB10', price: 100000, basePrice: 100000, color: '#455A64', type: 'bond', yield: 4.2, volatility: 0.5 },
    { id: 304, name: '국고채 30년', code: 'KTB30', price: 100000, basePrice: 100000, color: '#37474F', type: 'bond', yield: 4.5, volatility: 0.7 },
    { id: 305, name: '통안채 1년', code: 'MSB1', price: 100000, basePrice: 100000, color: '#78909C', type: 'bond', yield: 3.0, volatility: 0.1 },
    { id: 306, name: '통안채 2년', code: 'MSB2', price: 100000, basePrice: 100000, color: '#90A4AE', type: 'bond', yield: 3.2, volatility: 0.2 },
    // 회사채
    { id: 307, name: '회사채 AAA', code: 'CORPAAA', price: 100000, basePrice: 100000, color: '#1E88E5', type: 'bond', yield: 4.5, volatility: 0.4 },
    { id: 308, name: '회사채 AA', code: 'CORPAA', price: 100000, basePrice: 100000, color: '#1976D2', type: 'bond', yield: 5.5, volatility: 0.6 },
    { id: 309, name: '회사채 A', code: 'CORPA', price: 100000, basePrice: 100000, color: '#1565C0', type: 'bond', yield: 6.5, volatility: 0.8 },
    { id: 310, name: '회사채 BBB', code: 'CORPBBB', price: 100000, basePrice: 100000, color: '#0D47A1', type: 'bond', yield: 8.0, volatility: 1.2 },
    // 미국 국채
    { id: 311, name: '미국 국채 2년', code: 'UST2', price: 135000, basePrice: 135000, color: '#C62828', type: 'bond', yield: 4.8, volatility: 0.2 },
    { id: 312, name: '미국 국채 10년', code: 'UST10', price: 135000, basePrice: 135000, color: '#B71C1C', type: 'bond', yield: 4.5, volatility: 0.4 },
    { id: 313, name: '미국 국채 30년', code: 'UST30', price: 130000, basePrice: 130000, color: '#D32F2F', type: 'bond', yield: 4.8, volatility: 0.6 },
    // 글로벌 채권
    { id: 314, name: '일본 국채 10년', code: 'JGB10', price: 1200, basePrice: 1200, color: '#EF5350', type: 'bond', yield: 0.8, volatility: 0.3 },
    { id: 315, name: '독일 분트 10년', code: 'BUND10', price: 150000, basePrice: 150000, color: '#FFD600', type: 'bond', yield: 2.5, volatility: 0.4 },
    { id: 316, name: '영국 길트 10년', code: 'GILT10', price: 170000, basePrice: 170000, color: '#00695C', type: 'bond', yield: 4.2, volatility: 0.5 },
    { id: 317, name: '이머징마켓 채권', code: 'EMB', price: 95000, basePrice: 95000, color: '#FF6F00', type: 'bond', yield: 7.5, volatility: 1.0 },
    { id: 318, name: '하이일드 채권', code: 'HYG', price: 85000, basePrice: 85000, color: '#E65100', type: 'bond', yield: 9.0, volatility: 1.5 },
]

// 원자재 (20개)

export const COMMODITY_PRODUCTS = [
    // 귀금속
    { id: 401, name: '금', code: 'GOLD', price: 85000, basePrice: 85000, color: '#FFD700', type: 'commodity', unit: 'g', volatility: 1.5 },
    { id: 402, name: '은', code: 'SLVR', price: 1050, basePrice: 1050, color: '#C0C0C0', type: 'commodity', unit: 'g', volatility: 2.5 },
    { id: 403, name: '백금', code: 'PLAT', price: 42000, basePrice: 42000, color: '#E5E4E2', type: 'commodity', unit: 'g', volatility: 2.0 },
    { id: 404, name: '팔라듐', code: 'PALL', price: 38000, basePrice: 38000, color: '#A9A9A9', type: 'commodity', unit: 'g', volatility: 3.0 },
    // 에너지
    { id: 405, name: 'WTI 원유', code: 'WTI', price: 95000, basePrice: 95000, color: '#333333', type: 'commodity', unit: '배럴', volatility: 4.0 },
    { id: 406, name: '브렌트유', code: 'BRENT', price: 98000, basePrice: 98000, color: '#424242', type: 'commodity', unit: '배럴', volatility: 4.0 },
    { id: 407, name: '천연가스', code: 'NG', price: 3500, basePrice: 3500, color: '#26A69A', type: 'commodity', unit: 'MMBtu', volatility: 6.0 },
    { id: 408, name: 'RBOB 가솔린', code: 'RB', price: 3200, basePrice: 3200, color: '#FF7043', type: 'commodity', unit: '갤런', volatility: 5.0 },
    { id: 409, name: '난방유', code: 'HO', price: 3400, basePrice: 3400, color: '#5D4037', type: 'commodity', unit: '갤런', volatility: 5.0 },
    // 산업금속
    { id: 410, name: '구리', code: 'COPPER', price: 12000, basePrice: 12000, color: '#D4652F', type: 'commodity', unit: 'kg', volatility: 2.5 },
    { id: 411, name: '알루미늄', code: 'ALUM', price: 3500, basePrice: 3500, color: '#B0BEC5', type: 'commodity', unit: 'kg', volatility: 2.5 },
    { id: 412, name: '아연', code: 'ZINC', price: 4000, basePrice: 4000, color: '#78909C', type: 'commodity', unit: 'kg', volatility: 3.0 },
    { id: 413, name: '니켈', code: 'NICKEL', price: 25000, basePrice: 25000, color: '#546E7A', type: 'commodity', unit: 'kg', volatility: 4.0 },
    { id: 414, name: '리튬', code: 'LITH', price: 85000, basePrice: 85000, color: '#9CCC65', type: 'commodity', unit: 'kg', volatility: 5.0 },
    // 농산물
    { id: 415, name: '소맥', code: 'WHEAT', price: 8500, basePrice: 8500, color: '#F5DEB3', type: 'commodity', unit: 'bushel', volatility: 4.0 },
    { id: 416, name: '옥수수', code: 'CORN', price: 6200, basePrice: 6200, color: '#FFD54F', type: 'commodity', unit: 'bushel', volatility: 3.5 },
    { id: 417, name: '대두', code: 'SOYBEAN', price: 15000, basePrice: 15000, color: '#8D6E63', type: 'commodity', unit: 'bushel', volatility: 3.5 },
    { id: 418, name: '커피', code: 'COFFEE', price: 2500, basePrice: 2500, color: '#6D4C41', type: 'commodity', unit: 'lb', volatility: 4.0 },
    { id: 419, name: '설탕', code: 'SUGAR', price: 350, basePrice: 350, color: '#FFFFFF', type: 'commodity', unit: 'lb', volatility: 3.5 },
    { id: 420, name: '목화', code: 'COTTON', price: 1200, basePrice: 1200, color: '#ECEFF1', type: 'commodity', unit: 'lb', volatility: 3.5 },
]

// 공매도 설정
