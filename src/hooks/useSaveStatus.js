import { useEffect, useState } from 'react'
import { getSaveStatus } from '../utils'

export function useSaveStatus() {
    const [status, setStatus] = useState(getSaveStatus)
    useEffect(() => {
        const refresh = () => {
            const next = getSaveStatus()
            setStatus(previous => previous.mode === next.mode && previous.reason === next.reason
                && previous.backupCount === next.backupCount ? previous : next)
        }
        refresh()
        const interval = setInterval(refresh, 1000)
        return () => clearInterval(interval)
    }, [])
    return status
}
