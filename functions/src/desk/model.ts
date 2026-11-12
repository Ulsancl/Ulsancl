/** Shared, dependency-free simulation contract. Imported by the web app and Functions. */
export const DESK_VERSION = 2
export const TICKS_PER_DAY = 390
export const MAX_TICK = 390 * 252 * 5
export const MAX_ORDERS = 32
export const MAX_FILLS = 250
export type AssetClass =
  'stock' | 'etf' | 'bond' | 'commodity' | 'crypto' | 'fx' | 'future' | 'option'
export interface Instrument {
  id: string
  symbol: string
  name: string
  kind: AssetClass
  base: number
  volatility: number
  beta: number
  drift: number
  dividend: number
  spreadBps: number
  feeBps: number
  liquidity: number
  multiplier: number
  unit: string
  color: string
  description: string
  underlying?: string
  expiry?: number
  strike?: number
  right?: 'call' | 'put'
}
const spot = (
  id: string,
  symbol: string,
  name: string,
  kind: AssetClass,
  base: number,
  volatility: number,
  beta: number,
  dividend: number,
  color: string,
  description: string,
  unit = '주'
): Instrument => ({
  id,
  symbol,
  name,
  kind,
  base,
  volatility,
  beta,
  dividend,
  color,
  description,
  unit,
  drift: kind === 'bond' ? 0.025 : 0.075,
  spreadBps: kind === 'crypto' ? 12 : kind === 'stock' ? 5 : 3,
  feeBps: kind === 'crypto' ? 5 : 2,
  liquidity: kind === 'stock' ? 3500000000 : 10000000000,
  multiplier: 1,
})
export const SPOTS: Instrument[] = [
  spot(
    'nova',
    'NOVA',
    '노바 반도체',
    'stock',
    72000,
    0.38,
    0.78,
    0.012,
    '#8c9cff',
    '반도체 수요와 성장 기대에 민감한 기술 기업.'
  ),
  spot(
    'han',
    'HAN',
    '한울 모빌리티',
    'stock',
    185000,
    0.29,
    0.62,
    0.025,
    '#b6dc79',
    '수출 경기와 원자재 비용의 영향을 받는 제조 기업.'
  ),
  spot(
    'vital',
    'VTL',
    '바이탈 헬스',
    'stock',
    48000,
    0.31,
    0.25,
    0.015,
    '#e49eb8',
    '경기 민감도가 비교적 낮은 헬스케어 기업.'
  ),
  spot(
    'index',
    'K200',
    '코어 200 ETF',
    'etf',
    35000,
    0.22,
    0.95,
    0.02,
    '#91c9fa',
    '주식시장 전체에 분산 투자하는 지수형 상품.'
  ),
  spot(
    'bond',
    'GOV10',
    '국채 10년 ETF',
    'bond',
    100000,
    0.09,
    -0.28,
    0.035,
    '#d7c992',
    '금리와 채권 가격이 반대로 움직이는 장기 국채 포트폴리오.'
  ),
  spot(
    'gold',
    'GOLD',
    '금 현물',
    'commodity',
    125000,
    0.19,
    -0.18,
    0,
    '#e6c875',
    '위험 회피 수요와 실질금리에 반응하는 금 1g 단위.',
    'g'
  ),
  spot(
    'coin',
    'BTC',
    '비트코인 모형',
    'crypto',
    90000,
    0.74,
    0.55,
    0,
    '#eba06d',
    '0.001 BTC를 1단위로 거래하는 고변동성 가상 시세.',
    '0.001 BTC'
  ),
  spot(
    'usd',
    'USD',
    '미 달러',
    'fx',
    1350000,
    0.1,
    -0.3,
    0,
    '#8bd0b6',
    '1,000 USD를 1단위로 거래하는 원화 표시 환율 상품.',
    '1,000 USD'
  ),
]
export interface Scenario {
  id: string
  title: string
  subtitle: string
  horizon: number
  capital: number
  target: number
  drawdownLimit: number
  tags: string[]
  shocks: { day: number; title: string; detail: string; impact: number }[]
}
export const SCENARIOS: Scenario[] = [
  {
    id: 'foundation',
    title: '첫 번째 포트폴리오',
    subtitle: '체결 비용을 이해하고 세 가지 자산에 분산하세요.',
    horizon: 5 * TICKS_PER_DAY,
    capital: 10000000,
    target: 0,
    drawdownLimit: 0.15,
    tags: ['입문', '현물·ETF', '5거래일'],
    shocks: [
      {
        day: 2,
        title: '물가 지표 발표',
        detail: '예상보다 낮은 물가에 위험자산 선호가 회복됩니다.',
        impact: 0.018,
      },
    ],
  },
  {
    id: 'compound',
    title: '시간을 내 편으로',
    subtitle: '배당과 재투자로 3년간의 자산 변화를 관찰하세요.',
    horizon: 756 * TICKS_PER_DAY,
    capital: 10000000,
    target: 0.2,
    drawdownLimit: 0.22,
    tags: ['장기 투자', '배당·채권', '3년'],
    shocks: [
      {
        day: 20,
        title: '완만한 금리 인하',
        detail: '채권과 성장자산의 할인율 부담이 줄어듭니다.',
        impact: 0.025,
      },
      {
        day: 65,
        title: '실적 눈높이 조정',
        detail: '기업 이익 전망 하향이 시장에 반영됩니다.',
        impact: -0.04,
      },
    ],
  },
  {
    id: 'intraday',
    title: '오프닝 벨',
    subtitle: '스프레드와 수수료를 이기는 단기 매매를 연습하세요.',
    horizon: TICKS_PER_DAY,
    capital: 10000000,
    target: 0.002,
    drawdownLimit: 0.05,
    tags: ['단기·스캘핑', '지정가·스톱', '1거래일'],
    shocks: [],
  },
  {
    id: 'hedge',
    title: '폭풍 속의 헤지',
    subtitle: '선물·옵션으로 하락 위험을 줄이고 증거금을 관리하세요.',
    horizon: 20 * TICKS_PER_DAY,
    capital: 10000000,
    target: 0,
    drawdownLimit: 0.12,
    tags: ['선물·옵션', '롱숏·헤지', '20거래일'],
    shocks: [
      {
        day: 5,
        title: '예상 밖의 긴축 신호',
        detail: '주식과 위험자산이 조정받고 안전자산 수요가 증가합니다.',
        impact: -0.09,
      },
      { day: 12, title: '유동성 지원 발표', detail: '시장 불안이 일부 진정됩니다.', impact: 0.035 },
    ],
  },
  {
    id: 'rebalance',
    title: '균형을 다시 잡다',
    subtitle: '60거래일 동안 성장 자산과 방어 자산의 비중을 조절하세요.',
    horizon: 60 * TICKS_PER_DAY,
    capital: 10000000,
    target: 0.03,
    drawdownLimit: 0.12,
    tags: ['중기 투자', '분산·리밸런싱', '60거래일'],
    shocks: [
      {
        day: 15,
        title: '성장 전망 하향',
        detail: '위험자산 선호가 줄며 포트폴리오 비중을 재점검할 시점입니다.',
        impact: -0.05,
      },
      {
        day: 40,
        title: '소비 회복 신호',
        detail: '경기 회복 기대가 주식시장에 반영됩니다.',
        impact: 0.035,
      },
    ],
  },
  {
    id: 'sandbox',
    title: '자유 투자 연구실',
    subtitle: '모든 자산과 전략을 같은 회계 규칙으로 실험하세요.',
    horizon: 252 * TICKS_PER_DAY,
    capital: 10000000,
    target: 0.1,
    drawdownLimit: 0.3,
    tags: ['모든 자산', '자유 전략', '252거래일'],
    shocks: [],
  },
]
export function scenarioById(id: string): Scenario {
  const value = SCENARIOS.find((s) => s.id === id)
  if (!value) throw new Error('지원하지 않는 캠페인입니다.')
  return value
}
export function instruments(): Instrument[] {
  const result = SPOTS.map((a) => ({ ...a }))
  for (const id of ['index', 'gold', 'coin']) {
    const base = SPOTS.find((a) => a.id === id)!
    result.push({
      ...base,
      id: id + '-future',
      symbol: base.symbol + ' F',
      name: base.name + ' 선물',
      kind: 'future',
      underlying: id,
      expiry: 252 * TICKS_PER_DAY,
      multiplier: id === 'index' ? 10 : 1,
      unit: '계약',
      feeBps: 1,
      spreadBps: 3,
      dividend: 0,
      description:
        '현금 정산 선물 · 개시 증거금 20% · 유지 증거금 12%. 공정가격은 현물과 잔존 만기의 보유 비용을 반영합니다.',
    })
  }
  for (const expiryDays of [20, 60, 252])
    for (const strike of [30000, 35000, 40000])
      for (const right of ['call', 'put'] as const) {
        const base = SPOTS.find((a) => a.id === 'index')!
        result.push({
          ...base,
          id: 'index-' + right + '-' + strike + '-' + expiryDays,
          symbol: 'K200 ' + (right === 'call' ? 'C' : 'P') + strike / 1000 + '·' + expiryDays,
          name:
            '코어 200 ' + (right === 'call' ? '콜' : '풋') + ' ' + strike.toLocaleString('en-US'),
          kind: 'option',
          underlying: 'index',
          strike,
          right,
          expiry: expiryDays * TICKS_PER_DAY,
          multiplier: 10,
          unit: '계약',
          feeBps: 5,
          spreadBps: 30,
          dividend: 0,
          description:
            expiryDays +
            '거래일 만기 · 유럽형 현금 정산 · 계약 승수 10. 매도 시 추가 증거금이 필요합니다.',
        })
      }
  return result
}
export const INSTRUMENTS = instruments()
export function instrument(id: string): Instrument {
  const value = INSTRUMENTS.find((a) => a.id === id)
  if (!value) throw new Error('상품을 찾을 수 없습니다.')
  return value
}
export type Side = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop'
export interface OrderInput {
  instrumentId: string
  side: Side
  quantity: number
  type: OrderType
  price?: number
  reduceOnly?: boolean
}
export interface PendingOrder extends OrderInput {
  id: string
  createdTick: number
  expiresTick: number
  remaining: number
  triggered?: boolean
}
export interface Position {
  instrumentId: string
  quantity: number
  average: number
  openedTick: number
}
export interface Fill {
  id: string
  tick: number
  instrumentId: string
  side: Side
  quantity: number
  price: number
  fee: number
  realized: number
  reason: string
}
export interface EquityPoint {
  tick: number
  equity: number
  benchmark: number
}
export interface Account {
  version: number
  scenario: string
  startedTick: number
  tick: number
  endTick: number
  initialCapital: number
  cash: number
  positions: Position[]
  orders: PendingOrder[]
  fills: Fill[]
  equityHistory: EquityPoint[]
  peakEquity: number
  maxDrawdown: number
  fees: number
  dividends: number
  financing: number
  realized: number
  trades: number
  closedTrades: number
  winningTrades: number
  liquidationCount: number
  status: 'active' | 'completed' | 'insolvent'
  sequence: number
  assetClassesTraded: AssetClass[]
  longestHold: number
  hedged: boolean
}
export interface Market {
  seed: string
  scenario: string
  tick: number
}
export const money = (n: number): number => Math.round(n)
export function finiteInteger(value: unknown, min: number, max: number, message: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(message)
  return value
}
export function validOrder(input: unknown): OrderInput {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('주문 형식이 올바르지 않습니다.')
  const v = input as Record<string, unknown>
  instrument(String(v.instrumentId))
  if (
    !['buy', 'sell'].includes(String(v.side)) ||
    !['market', 'limit', 'stop'].includes(String(v.type))
  )
    throw new Error('주문 방향 또는 유형이 올바르지 않습니다.')
  const quantity = finiteInteger(
    v.quantity,
    1,
    1000000,
    '수량은 1부터 1,000,000까지의 정수여야 합니다.'
  )
  const type = v.type as OrderType
  const price =
    type === 'market'
      ? undefined
      : finiteInteger(v.price, 1, 10000000000, '주문 가격이 올바르지 않습니다.')
  return {
    instrumentId: String(v.instrumentId),
    side: v.side as Side,
    quantity,
    type,
    ...(price === undefined ? {} : { price }),
    reduceOnly: v.reduceOnly === true,
  }
}

// ISO 3166-1 country/territory codes; profiles remain self-declared.
export const COUNTRY_CODES =
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' '
  )
