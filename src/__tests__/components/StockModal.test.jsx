import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StockModal from '../../components/StockModal'

const baseStock = {
    id: 1,
    name: 'Test Corp',
    code: 'TEST',
    sector: 'Tech',
    price: 10000,
    volatility: 2,
    color: '#123456',
    fundamentals: {}
}

const renderModal = (overrides = {}) => {
    const onOpenOrder = overrides.onOpenOrder || jest.fn()
    const props = {
        stock: baseStock,
        currentPrice: baseStock.price,
        onClose: jest.fn(),
        onOpenOrder,
        portfolio: {},
        shortPositions: {},
        canShortSell: true,
        observations: Array.from({ length: 720 }, (_, sequence) => ({ sequence, timeMs: 100000 + sequence * 1000, gameDay: 1 + Math.floor(sequence / 60), gameMinute: 540, price: 10000 + sequence })),
        ...overrides
    }
    const utils = render(<StockModal {...props} />)
    return { ...utils, onOpenOrder }
}

describe('StockModal', () => {
    test('reads the stored dividend yield and keeps explicit zero distinct from missing data', () => {
        const { container } = renderModal({ stock: { ...baseStock, fundamentals: { yield: 2.1, profit: 0, pe: 0 } } })
        const value = label => [...container.querySelectorAll('.fund-item')].find(item => item.querySelector('.fund-label').textContent === label).querySelector('.fund-value').textContent
        expect(value('배당률')).toBe('2.1%')
        expect(value('이익 설정값')).toBe('0')
        expect(value('PER')).toBe('0배')
        expect(value('매출 설정값')).toBe('—')
    })
    let originalGetBoundingClientRect

    beforeAll(() => {
        originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 800,
                height: 400,
                top: 0,
                left: 0,
                right: 800,
                bottom: 400,
                x: 0,
                y: 0,
                toJSON: () => {}
            })
        })
    })

    afterAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
            configurable: true,
            value: originalGetBoundingClientRect
        })
    })

    test('allows short orders from the modal when shorting is unlocked', async () => {
        const { onOpenOrder } = renderModal({ canShortSell: true })
        const shortButton = await screen.findByRole('button', { name: '공매도' })
        fireEvent.click(shortButton)
        expect(onOpenOrder).toHaveBeenCalledWith(expect.objectContaining({ id: baseStock.id }), 'short')
        expect(onOpenOrder).toHaveBeenCalledTimes(1)
    })

    test('renders only observed candles for anchored game-day groupings', async () => {
        const { container } = renderModal()
        await waitFor(() => {
            expect(container.querySelector('.chart-area svg')).not.toBeNull()
        })

        fireEvent.click(screen.getByRole('button', { name: '게임일' }))
        for (const size of [1, 3, 5]) {
            fireEvent.click(screen.getByRole('button', { name: `${size}일` }))
            await waitFor(() => {
                const svg = container.querySelector('.chart-area svg')
                expect(svg).not.toBeNull()
                expect(svg.querySelectorAll('g[data-open]')).toHaveLength(Math.ceil(12 / size))
            })
        }
    })
    test('empty observation history stays empty instead of fabricating prior prices', () => {
        const { container } = renderModal({ observations: [] })
        expect(screen.getByRole('status')).toHaveTextContent('관찰 기록이 아직 없습니다')
        expect(container.querySelector('.chart-area svg')).toBeNull()
    })
    test('Escape releases pinned chart selection, then closes the modal once', async () => {
        const onClose=jest.fn(),{container}=renderModal({onClose})
        const svg=container.querySelector('.chart-area svg')
        fireEvent.keyDown(svg,{key:'Home'})
        fireEvent.keyDown(svg,{key:'Escape'})
        expect(onClose).not.toHaveBeenCalled()
        fireEvent.keyDown(svg,{key:'Escape'})
        expect(onClose).toHaveBeenCalledTimes(1)
    })
})
