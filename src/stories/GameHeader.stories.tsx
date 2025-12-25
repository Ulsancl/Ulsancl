/**
 * GameHeader 컴포넌트 스토리
 */
import type { Meta, StoryObj } from 'storybook/react'
import GameHeader from '../components/GameHeader'
import '../App.css'

const meta: Meta<typeof GameHeader> = {
    title: 'Components/GameHeader',
    component: GameHeader,
    parameters: {
        layout: 'fullscreen',
        backgrounds: {
            default: 'dark',
            values: [{ name: 'dark', value: '#0d0d14' }]
        }
    },
    tags: ['autodocs'],
    argTypes: {
        gameTime: { control: 'object' },
        totalXp: { control: { type: 'number', min: 0, max: 100000 } }
    }
}

export default meta
type Story = StoryObj<typeof meta>

const mockGameTime = {
    day: 42,
    hour: 14,
    minute: 30,
    displayDate: 'D+42',
    displayTime: '14:30',
    displaySeason: '🌸 2024년 3월',
    season: '봄',
    year: 2024,
    month: 3
}

// 기본 상태
export const Default: Story = {
    args: {
        gameTime: mockGameTime,
        totalXp: 5000,
        onShowSkills: () => console.log('스킬'),
        onShowMissions: () => console.log('미션'),
        onShowAchievements: () => console.log('업적'),
        onShowLeaderboard: () => console.log('순위'),
        onShowStatistics: () => console.log('통계'),
        onShowWatchlist: () => console.log('관심'),
        onShowAlertManager: () => console.log('알림'),
        onShowTradeHistory: () => console.log('거래'),
        onShowSettings: () => console.log('설정')
    }
}

// 초보자 (낮은 XP)
export const Beginner: Story = {
    args: {
        ...Default.args,
        totalXp: 100
    }
}

// 고수 (높은 XP)
export const Expert: Story = {
    args: {
        ...Default.args,
        totalXp: 50000
    }
}

// 시장 마감 시간
export const MarketClosed: Story = {
    args: {
        ...Default.args,
        gameTime: {
            ...mockGameTime,
            hour: 18,
            displayTime: '18:00'
        }
    }
}
