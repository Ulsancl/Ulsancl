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
        ...overrides
    }
    const utils = render(<StockModal {...props} />)
    return { ...utils, onOpenOrder }
}

describe('StockModal', () => {
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
    })

    test('renders multiple candles for day/week/month timeframes', async () => {
        const { container } = renderModal()
        await waitFor(() => {
            expect(container.querySelector('.chart-area svg')).not.toBeNull()
        })

        const categoryButtons = container.querySelectorAll('.timeframe-categories .category-btn')
        const targetIndices = [2, 3, 4]

        for (const index of targetIndices) {
            fireEvent.click(categoryButtons[index])
            await waitFor(() => {
                const svg = container.querySelector('.chart-area svg')
                expect(svg).not.toBeNull()
                expect(svg.querySelectorAll('g').length).toBeGreaterThan(1)
            })
        }
    })
})
