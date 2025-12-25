/**
 * DashboardPanel 컴포넌트 스토리
 */
import type { Meta, StoryObj } from 'storybook/react'
import DashboardPanel from '../components/DashboardPanel'
import '../App.css'

const meta: Meta<typeof DashboardPanel> = {
    title: 'Components/DashboardPanel',
    component: DashboardPanel,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
            values: [{ name: 'dark', value: '#0d0d14' }]
        }
    },
    tags: ['autodocs'],
    argTypes: {
        totalAssets: { control: { type: 'number', min: 0, max: 10000000000 } },
        profitRate: { control: { type: 'number', min: -100, max: 1000 } },
        cash: { control: { type: 'number', min: 0, max: 10000000000 } },
        stockValue: { control: { type: 'number', min: 0, max: 10000000000 } }
    }
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 상태 (수익 중)
export const Default: Story = {
    args: {
        totalAssets: 150000000,
        profitRate: 50,
        cash: 50000000,
        stockValue: 100000000,
        canUseCredit: false,
        marginCallActive: false,
        creditUsed: 0,
        creditInterest: 0,
        maxCreditLimit: 0,
        availableCredit: 0,
        onBorrowCredit: (amount) => console.log('대출:', amount),
        onRepayCredit: (amount) => console.log('상환:', amount),
        onShowAssetChart: () => console.log('자산 차트 보기')
    }
}

// 손실 상태
export const Losing: Story = {
    args: {
        ...Default.args,
        totalAssets: 80000000,
        profitRate: -20,
        cash: 30000000,
        stockValue: 50000000
    }
}

// 큰 수익
export const BigProfit: Story = {
    args: {
        ...Default.args,
        totalAssets: 500000000,
        profitRate: 400,
        cash: 100000000,
        stockValue: 400000000
    }
}

// 신용 거래 활성화
export const WithCredit: Story = {
    args: {
        ...Default.args,
        canUseCredit: true,
        creditUsed: 20000000,
        creditInterest: 500000,
        maxCreditLimit: 50000000,
        availableCredit: 30000000
    }
}

// 마진콜 상태
export const MarginCall: Story = {
    args: {
        ...Default.args,
        canUseCredit: true,
        marginCallActive: true,
        creditUsed: 45000000,
        creditInterest: 2000000,
        maxCreditLimit: 50000000,
        availableCredit: 3000000,
        profitRate: -35
    }
}

// 초보자 (초기 자본)
export const Beginner: Story = {
    args: {
        ...Default.args,
        totalAssets: 100000000,
        profitRate: 0,
        cash: 100000000,
        stockValue: 0
    }
}
