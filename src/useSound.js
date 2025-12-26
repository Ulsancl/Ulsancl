// 사운드 효과 훅
import { useCallback, useRef } from 'react'
import { SOUNDS } from './constants'

export function useSound(enabled = true, volume = 0.5) {
    const audioRefs = useRef({})

    const preloadSounds = useCallback(() => {
        Object.entries(SOUNDS).forEach(([key, url]) => {
            if (!audioRefs.current[key]) {
                const audio = new Audio(url)
                audio.volume = volume
                audio.preload = 'auto'
                audioRefs.current[key] = audio
            }
        })
    }, [volume])

    const playSound = useCallback((soundKey) => {
        if (!enabled) return

        try {
            let audio = audioRefs.current[soundKey]

            if (!audio && SOUNDS[soundKey]) {
                audio = new Audio(SOUNDS[soundKey])
                audio.volume = volume
                audioRefs.current[soundKey] = audio
            }

            if (audio) {
                audio.currentTime = 0
                audio.volume = volume
                audio.play().catch(() => {
                    // 자동 재생 정책으로 실패할 수 있음 - 무시
                })
            }
        } catch {
            // 사운드 재생 실패 - 무시
        }
    }, [enabled, volume])

    const updateVolume = useCallback((newVolume) => {
        Object.values(audioRefs.current).forEach(audio => {
            audio.volume = newVolume
        })
    }, [])

    return { playSound, preloadSounds, updateVolume }
}

export default useSound
