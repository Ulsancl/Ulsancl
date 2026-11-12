import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
const App = ['/privacy', '/delete-account', '/support'].some(
  (path) => location.pathname === path || location.pathname === path + '/'
)
  ? lazy(() => import('./desk/Privacy'))
  : location.pathname === '/classic' || location.pathname.startsWith('/classic/')
    ? lazy(() => import('./ClassicRoot'))
    : lazy(() => import('./desk/DeskApp'))
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  navigator.serviceWorker.register('/sw.js').catch(() => {})
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense
      fallback={
        <p
          style={{
            padding: 32,
            color: '#bcc7d8',
            background: '#0d121b',
            minHeight: '100vh',
            margin: 0,
          }}
        >
          투자 데스크를 준비하고 있습니다…
        </p>
      }
    >
      <App />
    </Suspense>
  </StrictMode>
)
