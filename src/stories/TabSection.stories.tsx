/**
 * TabSection 및 ViewSection 컴포넌트 스토리
 */
import type { Meta, StoryObj } from 'storybook/react'
import TabSection from '../components/TabSection'
import ViewSection from '../components/ViewSection'
import '../App.css'

// TabSection 스토리
const tabMeta: Meta<typeof TabSection> = {
    title: 'Components/TabSection',
    component: TabSection,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
            values: [{ name: 'dark', value: '#0d0d14' }]
        }
    },
    tags: ['autodocs'],
    argTypes: {
        activeTab: {
            control: 'select',
            options: ['stocks', 'etf', 'crypto', 'bond', 'commodity']
        }
    }
}

export default tabMeta
type TabStory = StoryObj<typeof tabMeta>

export const StocksTab: TabStory = {
    args: {
        activeTab: 'stocks',
        onTabChange: (tab) => console.log('탭 변경:', tab)
    }
}

export const CryptoTab: TabStory = {
    args: {
        activeTab: 'crypto',
        onTabChange: (tab) => console.log('탭 변경:', tab)
    }
}

export const ETFTab: TabStory = {
    args: {
        activeTab: 'etf',
        onTabChange: (tab) => console.log('탭 변경:', tab)
    }
}

export const BondTab: TabStory = {
    args: {
        activeTab: 'bond',
        onTabChange: (tab) => console.log('탭 변경:', tab)
    }
}

export const CommodityTab: TabStory = {
    args: {
        activeTab: 'commodity',
        onTabChange: (tab) => console.log('탭 변경:', tab)
    }
}
