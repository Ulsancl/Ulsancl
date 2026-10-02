import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SeasonEnd from '../../components/SeasonEnd'

jest.mock('../../firebase/config', () => ({
    isFirebaseConfigured: false,
    getCurrentSeason: jest.fn(), ensureAuth: jest.fn(), submitGameScore: jest.fn(), reportClientError: jest.fn()
}))
const firebase = jest.requireMock('../../firebase/config')

const detail = label => screen.getByText(label, { exact: true }).closest('.detail-item')
const propsFor = () => ({
    year: 2020, totalAssets: 100000000.01, initialCapital: 100000000,
    totalProfit: 0.01, totalTrades: 4, winStreak: 0, maxWinStreak: 0,
    tradeHistory: [
        { type: 'short', total: 0.045 }, { type: 'cover', profit: 0.02 },
        { type: 'sell', profit: -0.01 }, { type: 'cover', profit: 0 }
    ],
    unlockedAchievements: {}, assetHistory: [{ value: 100 }, { value: 110 }, { value: 99 }],
    tradeLogApi: { tradeLogs: [], buildPayload: jest.fn(), setSeasonId: jest.fn() },
    onStartNewSeason: jest.fn(), onClose: jest.fn()
})

describe('season financial report and online boundary', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        firebase.isFirebaseConfigured = false
    })

    test('covers and break-even results count, precise realized P/L is distinct from net assets, and offline submission stays disabled', () => {
        const props = propsFor()
        const before = JSON.stringify(props.tradeHistory)
        render(<SeasonEnd {...props} />)
        expect(screen.getByText('순자산', { exact: true })).toBeInTheDocument()
        expect(screen.getByText('실현 손익 누계').closest('.stat-box')).toHaveTextContent('+0.01원')
        expect(detail('승률')).toHaveTextContent('33.3%')
        expect(detail('수익 거래')).toHaveTextContent('1회')
        expect(detail('손실 거래')).toHaveTextContent('1회')
        expect(detail('총이익 / 총손실')).toHaveTextContent('2.00')
        expect(detail('최대 수익')).toHaveTextContent('+0.02원')
        expect(detail('최대 손실')).toHaveTextContent('-0.01원')
        expect(detail('기록 구간 최대낙폭')).toHaveTextContent('10.0%')
        expect(screen.getByRole('button', { name: '점수 제출하기' })).toBeDisabled()
        expect(screen.getByText('온라인 순위 서비스가 연결되지 않았습니다.')).toBeInTheDocument()
        expect(screen.getByText(/로컬 순자산과 온라인 순위는 별도로 계산/)).toBeInTheDocument()
        expect(firebase.getCurrentSeason).not.toHaveBeenCalled()
        expect(firebase.ensureAuth).not.toHaveBeenCalled()
        expect(JSON.stringify(props.tradeHistory)).toBe(before)
    })

    test('unobserved statistics stay unavailable and a loss-only report cannot label a loss as maximum profit', () => {
        const props = propsFor()
        const { rerender } = render(<SeasonEnd {...props} tradeHistory={[{ type: 'cover' }]} assetHistory={[]} />)
        expect(detail('승률')).toHaveTextContent('—')
        expect(detail('총이익 / 총손실')).toHaveTextContent('—')
        expect(detail('기록 구간 최대낙폭')).toHaveTextContent('—')
        expect(screen.queryByText('최대 수익')).not.toBeInTheDocument()
        expect(screen.queryByText('최대 손실')).not.toBeInTheDocument()
        rerender(<SeasonEnd {...props} tradeHistory={[{ type: 'cover', profit: -3 }]} assetHistory={[{ value: 100 }, { value: NaN }, { value: 90 }]} />)
        expect(detail('승률')).toHaveTextContent('0.0%')
        expect(screen.queryByText('최대 수익')).not.toBeInTheDocument()
        expect(detail('최대 손실')).toHaveTextContent('-3원')
        expect(detail('기록 구간 최대낙폭')).toHaveTextContent('10.0%')
    })

    test('a configured service receives the original replay payload and rerendered API containers do not refetch the season', async () => {
        firebase.isFirebaseConfigured = true
        firebase.getCurrentSeason.mockResolvedValue({ id: 'season-fixture' })
        firebase.ensureAuth.mockResolvedValue({ uid: 'fixture' })
        firebase.submitGameScore.mockResolvedValue({ data: { success: true, rank: 2, score: 123, isNewHighScore: false } })
        const props = propsFor()
        const payload = Object.freeze({ seasonId: 'season-fixture', trades: Object.freeze([]), seed: 17 })
        props.tradeLogApi.buildPayload.mockReturnValue(payload)
        const { rerender } = render(<SeasonEnd {...props} />)
        await waitFor(() => expect(screen.getByRole('button', { name: '점수 제출하기' })).toBeEnabled())
        rerender(<SeasonEnd {...props} totalAssets={99999999} tradeLogApi={{ ...props.tradeLogApi, tradeLogs: [] }} />)
        expect(firebase.getCurrentSeason).toHaveBeenCalledTimes(1)
        fireEvent.click(screen.getByRole('button', { name: '점수 제출하기' }))
        await waitFor(() => expect(screen.getByText('점수가 등록되었습니다.')).toBeInTheDocument())
        expect(props.tradeLogApi.buildPayload).toHaveBeenCalledWith({ seasonId: 'season-fixture' })
        expect(firebase.submitGameScore).toHaveBeenCalledTimes(1)
        expect(firebase.submitGameScore).toHaveBeenCalledWith(payload)
        expect(firebase.reportClientError).not.toHaveBeenCalled()
    })
})
