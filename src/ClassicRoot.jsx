import { useEffect } from 'react'
import App from './App'
import { AppProviders } from './context'
import './index.css'
export default function ClassicRoot() {
  useEffect(() => {
    document.title = '트레이딩 게임 · Classic'
  }, [])
  return (
    <AppProviders>
      <App />
    </AppProviders>
  )
}
