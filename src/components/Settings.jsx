// 설정 패널 컴포넌트
import { THEMES } from '../constants'
import './Settings.css'

export default function SettingsPanel({ settings, onUpdateSettings, onClose }) {
    const { theme = 'dark', soundEnabled = true, volume = 0.5, playerName = '' } = settings || {}

    const handleThemeChange = (themeId) => {
        onUpdateSettings({ ...settings, theme: themeId })
        applyTheme(themeId)
    }

    const applyTheme = (themeId) => {
        const theme = THEMES[themeId]
        if (!theme) return

        const root = document.documentElement
        Object.entries(theme.colors).forEach(([key, value]) => {
            const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
            root.style.setProperty(cssVar, value)
        })

        // 라이트 모드일 때 추가 스타일
        if (themeId === 'light') {
            root.style.setProperty('--color-bg-primary', '#f5f5f7')
            root.style.setProperty('--color-bg-secondary', '#ffffff')
            root.style.setProperty('--color-bg-card', '#ffffff')
            root.style.setProperty('--color-text-primary', '#1a1a1a')
            root.style.setProperty('--color-text-secondary', '#666666')
            root.style.setProperty('--color-border', '#e5e5e5')
        } else if (themeId === 'dark') {
            root.style.setProperty('--color-bg-primary', '#0a0a0f')
            root.style.setProperty('--color-bg-secondary', '#12121a')
            root.style.setProperty('--color-bg-card', 'rgba(26, 26, 35, 0.8)')
            root.style.setProperty('--color-text-primary', '#ffffff')
            root.style.setProperty('--color-text-secondary', '#a0a0b0')
            root.style.setProperty('--color-border', 'rgba(255, 255, 255, 0.1)')
        } else if (themeId === 'neon') {
            root.style.setProperty('--color-bg-primary', '#0d0221')
            root.style.setProperty('--color-bg-secondary', '#150734')
            root.style.setProperty('--color-bg-card', '#1a0a3e')
            root.style.setProperty('--color-text-primary', '#ffffff')
            root.style.setProperty('--color-text-secondary', '#00ffff')
            root.style.setProperty('--color-border', 'rgba(255, 0, 255, 0.3)')
            root.style.setProperty('--color-accent', '#ff00ff')
        }
    }

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ 설정</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    {/* 플레이어 이름 */}
                    <div className="setting-group">
                        <label className="setting-label">플레이어 이름</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => onUpdateSettings({ ...settings, playerName: e.target.value })}
                            placeholder="이름을 입력하세요"
                            className="setting-input"
                            maxLength={20}
                        />
                    </div>

                    {/* 테마 */}
                    <div className="setting-group">
                        <label className="setting-label">테마</label>
                        <div className="theme-options">
                            {Object.values(THEMES).map(t => (
                                <button
                                    key={t.id}
                                    className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                                    onClick={() => handleThemeChange(t.id)}
                                    style={{
                                        background: t.colors.bgCard,
                                        borderColor: theme === t.id ? t.colors.accent : 'transparent',
                                        color: t.colors.textPrimary
                                    }}
                                >
                                    <span className="theme-preview">
                                        <span style={{ background: t.colors.accent }}></span>
                                        <span style={{ background: t.colors.bgSecondary }}></span>
                                    </span>
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 사운드 */}
                    <div className="setting-group">
                        <div className="setting-row">
                            <label className="setting-label">사운드 효과</label>
                            <button
                                className={`toggle-btn ${soundEnabled ? 'on' : 'off'}`}
                                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !soundEnabled })}
                            >
                                {soundEnabled ? '🔊 ON' : '🔇 OFF'}
                            </button>
                        </div>
                    </div>

                    {/* 볼륨 */}
                    {soundEnabled && (
                        <div className="setting-group">
                            <label className="setting-label">볼륨 ({Math.round(volume * 100)}%)</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })}
                                className="volume-slider"
                            />
                        </div>
                    )}

                    {/* 게임 리셋 */}
                    <div className="setting-group danger-zone">
                        <label className="setting-label">위험 구역</label>
                        <button
                            className="reset-btn"
                            onClick={() => {
                                if (window.confirm('정말로 게임을 초기화하시겠습니까? 모든 데이터가 삭제됩니다.')) {
                                    localStorage.clear()
                                    window.location.reload()
                                }
                            }}
                        >
                            🗑️ 게임 초기화
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
