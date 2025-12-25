import React, { useState, useEffect } from 'react'
import './Tutorial.css'

const TUTORIAL_STEPS = [
    {
        target: 'center',
        title: '🎮 트레이딩 게임에 오신 것을 환영합니다!',
        content: '1억원의 초기 자본금으로 시작합니다. 주식, 코인, ETF 등 다양한 금융 상품을 거래하며 최고의 수익을 올려보세요!',
    },
    {
        target: 'center',
        title: '📊 실시간 가격 변동',
        content: '모든 가격은 실시간으로 변동합니다. 종목 카드를 클릭하면 상세 차트와 호가창을 확인할 수 있습니다.',
    },
    {
        target: 'center',
        title: '💰 매수와 매도',
        content: '수량을 설정하고 매수/매도 버튼을 눌러 거래하세요. 레벨업하면 공매도와 지정가 주문도 사용할 수 있습니다!',
    },
    {
        target: 'center',
        title: '📰 뉴스를 주목하세요',
        content: '뉴스는 주가에 큰 영향을 줍니다. 호재와 악재를 빠르게 파악하고 투자 결정을 내리세요!',
    },
    {
        target: 'center',
        title: '🚀 준비되셨나요?',
        content: '미션을 완료하고 업적을 달성하며 레벨을 올려보세요. 행운을 빕니다!',
    }
]

export default function Tutorial({ active, onClose }) {
    const [stepIndex, setStepIndex] = useState(0)
    const [rect, setRect] = useState(null)

    useEffect(() => {
        if (!active) return

        const step = TUTORIAL_STEPS[stepIndex]
        if (step.target === 'center') {
            setRect(null)
            return
        }

        // 요소 찾기 시도 (약간의 지연 후)
        const findElement = () => {
            const element = document.querySelector(step.target)
            if (element) {
                const r = element.getBoundingClientRect()
                // 요소가 화면에 보이는지 확인
                if (r.width > 0 && r.height > 0) {
                    setRect({
                        top: r.top,
                        left: r.left,
                        width: r.width,
                        height: r.height,
                        bottom: r.bottom,
                        right: r.right
                    })
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    return true
                }
            }
            return false
        }

        // 첫 시도
        if (!findElement()) {
            // 요소를 찾지 못하면 중앙에 표시
            setRect(null)
        }
    }, [stepIndex, active])

    if (!active) return null

    const step = TUTORIAL_STEPS[stepIndex]

    const handleNext = () => {
        if (stepIndex < TUTORIAL_STEPS.length - 1) {
            setStepIndex(stepIndex + 1)
        } else {
            onClose()
        }
    }

    return (
        <div className="tutorial-overlay">
            {rect && (
                <div
                    className="tutorial-highlight"
                    style={{
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8
                    }}
                />
            )}

            <div className={`tutorial-card ${!rect ? 'center' : ''}`} style={getCardStyle(rect, step.position)}>
                <div className="tutorial-step-indicator">Step {stepIndex + 1} / {TUTORIAL_STEPS.length}</div>
                <h3>{step.title}</h3>
                <p>{step.content}</p>
                <div className="tutorial-actions">
                    <button className="btn-skip" onClick={onClose}>Skip</button>
                    <button className="btn-next" onClick={handleNext}>
                        {stepIndex === TUTORIAL_STEPS.length - 1 ? 'Start Game' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function getCardStyle(rect, position) {
    if (!rect) return {} // Centered by CSS class

    const margin = 20
    let style = {}

    // Simple positioning logic
    if (position === 'bottom') {
        style = {
            top: rect.bottom + margin,
            left: rect.left + (rect.width / 2) - 150 // Center horizontally relative to target (assuming card width ~300)
        }
    } else {
        style = {
            bottom: (window.innerHeight - rect.top) + margin,
            left: rect.left + (rect.width / 2) - 150
        }
    }

    // Boundary checks (simple)
    if (style.left < 20) style.left = 20
    if (style.left > window.innerWidth - 320) style.left = window.innerWidth - 320

    return style
}
