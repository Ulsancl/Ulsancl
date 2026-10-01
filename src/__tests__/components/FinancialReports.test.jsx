import React from 'react'
import { render, screen, within } from '@testing-library/react'
import TradeHistory from '../../components/TradeHistory'
import StatisticsPanel from '../../components/Statistics'

const row = label => screen.getByText(label, { exact: true }).closest('.stat-row')
const summary = label => screen.getByText(label, { exact: true, selector: '.summary-label' }).closest('.summary-card')
const freeze = value => {
    Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child) })
    return Object.freeze(value)
}

describe('financial report meaning', () => {
    test('short/cover records show precise prices, collateral cash flow, realized P/L and forced reason', () => {
        const trades = freeze([
            { id: 'short', type: 'short', stockId: 207, quantity: 1000, price: 0.00003, total: 0.045, timestamp: 1000 },
            { id: 'cover', type: 'cover', stockId: 207, quantity: 1000, price: 0.00002, total: 0.055, profit: 0.01, marginReturned: 0.045, timestamp: 2000, reason: 'short-liquidation' },
            { id: 'sell', type: 'sell', stockId: 1, quantity: 1, price: 100, total: 100, profit: -5, borrowedRepayment: 50, timestamp: 3000, reason: 'credit-liquidation' }
        ])
        const before = JSON.stringify(trades)
        const { container } = render(<TradeHistory trades={trades} stocks={[{ id: 207, name: 'Small asset', type: 'crypto' }, { id: 1, name: 'Stock' }]} onClose={() => {}} />)
        const open = container.querySelector('[data-trade-type="short"]')
        const close = container.querySelector('[data-trade-type="cover"]')
        expect(within(open).getByText('공매도', { exact: true })).toBeInTheDocument()
        expect(open).toHaveTextContent('1,000개 × 0.00003원')
        expect(open).toHaveTextContent('예치 증거금0.045원')
        expect(close).toHaveTextContent('공매도 청산')
        expect(close).toHaveTextContent('공매도 강제청산')
        expect(close).toHaveTextContent('청산 현금 증감+0.055원')
        expect(close).toHaveTextContent('실현 손익+0.01원')
        expect(close).toHaveTextContent('반환 증거금 0.045원')
        expect(close).not.toHaveTextContent('undefined')
        expect(close).not.toHaveTextContent('%')
        expect(container.querySelector('[data-trade-type="sell"]')).toHaveTextContent('차입금 50원 상환 · 현금 증감 +50원')
        expect(Number(screen.getByTestId('history-realized-profit').dataset.value)).toBeCloseTo(-4.99, 12)
        expect(JSON.stringify(trades)).toBe(before)
    })

    test('covers contribute to settled results and break-even closes break both streaks', () => {
        const trades = freeze([-20, -30, 0, -10, 5, 0, 6, 7].map((profit, i) => ({ type: i % 2 ? 'cover' : 'sell', profit })))
        const assets = freeze([{ value: 100 }, { value: 110 }, { value: 99 }])
        render(<StatisticsPanel tradeHistory={trades} assetHistory={assets} totalAssets={100000000} onClose={() => {}} />)
        expect(summary('승률')).toHaveTextContent('37.5%')
        expect(summary('총이익 / 총손실')).toHaveTextContent('0.30')
        expect(row('수익 / 손실 / 본전')).toHaveTextContent('3 / 3 / 2')
        expect(row('최대 연패')).toHaveTextContent('2연패')
        expect(row('최대 연승')).toHaveTextContent('2연승')
        expect(row('공매도 / 공매도 청산')).toHaveTextContent('0 / 4')
        expect(row('평균 수익')).toHaveTextContent('6원')
        expect(row('평균 손실')).toHaveTextContent('-20원')
        expect(row('기록 수익률 평균')).toHaveTextContent('0.000%')
        expect(row('기록 수익률 변동성')).toHaveTextContent('10.000%')
        expect(summary('기록 구간 최대낙폭')).toHaveTextContent('10.0%')
        expect(screen.queryByText(/샤프/)).not.toBeInTheDocument()
    })

    test('zero and negative prior assets do not become invalid or bridged percentage returns', () => {
        render(<StatisticsPanel tradeHistory={[{ type: 'cover', profit: 0 }]} assetHistory={[100, 0, 50, -10, 20].map(value => ({ value }))} totalAssets={0} onClose={() => {}} />)
        expect(summary('총 수익률')).toHaveTextContent('-100.00%')
        expect(row('유효 수익률 구간')).toHaveTextContent('2 / 4')
        expect(row('기록 수익률 평균')).toHaveTextContent('-110.000%')
        expect(row('기록 수익률 변동성')).toHaveTextContent('10.000%')
        expect(summary('기록 구간 최대낙폭')).toHaveTextContent('110.0%')
        expect(row('최대 연패')).toHaveTextContent('0연패')
        expect(document.body).not.toHaveTextContent('NaN')
        expect(document.body).not.toHaveTextContent('Infinity')
    })

    test('missing results or asset observations show unavailable statistics rather than invented values', () => {
        render(<StatisticsPanel tradeHistory={[{ type: 'buy' }, { type: 'sell' }]} assetHistory={[]} totalAssets={100000000} onClose={() => {}} />)
        expect(summary('승률')).toHaveTextContent('—')
        expect(summary('총이익 / 총손실')).toHaveTextContent('—')
        expect(summary('기록 구간 최대낙폭')).toHaveTextContent('—')
        expect(row('청산 손익 기록')).toHaveTextContent('0 / 1')
        expect(row('기록 수익률 평균')).toHaveTextContent('—')
        expect(row('기록 수익률 변동성')).toHaveTextContent('—')
        expect(row('최대 연패')).toHaveTextContent('0연패')
        expect(screen.queryByText(/보유 시간|보유시간/)).not.toBeInTheDocument()
    })
})
