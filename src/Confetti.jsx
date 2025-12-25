// 컨페티 애니메이션 컴포넌트
import { useEffect, useState } from 'react'
import './Confetti.css'

export default function Confetti({ trigger, duration = 3000 }) {
    const [particles, setParticles] = useState([])
    const [active, setActive] = useState(false)

    useEffect(() => {
        if (trigger) {
            // 파티클 생성
            const newParticles = []
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']

            for (let i = 0; i < 100; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: -10,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: Math.random() * 8 + 4,
                    speedX: (Math.random() - 0.5) * 4,
                    speedY: Math.random() * 3 + 2,
                    rotation: Math.random() * 360,
                    rotationSpeed: (Math.random() - 0.5) * 20,
                    shape: Math.random() > 0.5 ? 'square' : 'circle',
                })
            }

            setParticles(newParticles)
            setActive(true)

            setTimeout(() => {
                setActive(false)
                setParticles([])
            }, duration)
        }
    }, [trigger, duration])

    if (!active) return null

    return (
        <div className="confetti-container">
            {particles.map(p => (
                <div
                    key={p.id}
                    className={`confetti-particle ${p.shape}`}
                    style={{
                        '--x': `${p.x}%`,
                        '--speedX': p.speedX,
                        '--speedY': p.speedY,
                        '--rotation': `${p.rotation}deg`,
                        '--rotationSpeed': p.rotationSpeed,
                        '--size': `${p.size}px`,
                        '--color': p.color,
                        '--delay': `${Math.random() * 0.5}s`,
                    }}
                />
            ))}
        </div>
    )
}

// 숫자 롤링 애니메이션
export function AnimatedNumber({ value, duration = 500, format = 'number' }) {
    const [displayValue, setDisplayValue] = useState(value)

    useEffect(() => {
        const startValue = displayValue
        const endValue = value
        const startTime = Date.now()

        const animate = () => {
            const now = Date.now()
            const progress = Math.min(1, (now - startTime) / duration)
            const eased = easeOutExpo(progress)

            const currentValue = startValue + (endValue - startValue) * eased
            setDisplayValue(currentValue)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [value, duration])

    const formatValue = (val) => {
        if (format === 'percent') {
            return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`
        }
        if (format === 'compact') {
            if (Math.abs(val) >= 100000000) return `${(val / 100000000).toFixed(1)}억`
            if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(0)}만`
            return Math.round(val).toLocaleString()
        }
        return Math.round(val).toLocaleString()
    }

    return <span className="animated-number">{formatValue(displayValue)}</span>
}

function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

// 가격 플래시 효과
export function PriceFlash({ price, previousPrice }) {
    const isUp = price > previousPrice
    const isDown = price < previousPrice
    const [flash, setFlash] = useState('')

    useEffect(() => {
        if (isUp) setFlash('flash-up')
        else if (isDown) setFlash('flash-down')
        else setFlash('')

        const timer = setTimeout(() => setFlash(''), 500)
        return () => clearTimeout(timer)
    }, [price])

    return (
        <span className={`price-flash ${flash}`}>
            {price.toLocaleString()}원
        </span>
    )
}
