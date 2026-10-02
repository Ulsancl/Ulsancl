// 설정 패널 컴포넌트
import { useEffect, useState } from 'react'
import { THEMES } from '../constants'
import { createSaveExport, getSaveStatus, listSaveBackups, readSaveBackup, resetGame } from '../utils'
import './Settings.css'

export function downloadSaveText(raw, filename) {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function SettingsPanel({ settings, onUpdateSettings, onClose, getSaveSnapshot }) {
    const { theme = 'dark', soundEnabled = true, volume = 0.5, playerName = '' } = settings || {}
    const [storageStatus, setStorageStatus] = useState(getSaveStatus)
    const [backups, setBackups] = useState(listSaveBackups)
    const [saveMessage, setSaveMessage] = useState('')
    useEffect(() => {
        const timer = setInterval(() => {
            setStorageStatus(getSaveStatus())
            setBackups(listSaveBackups())
        }, 1000)
        return () => clearInterval(timer)
    }, [])
    const download = (getText, filename) => {
        try {
            downloadSaveText(getText(), filename)
            setSaveMessage('다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인하세요.')
        } catch {
            setSaveMessage('파일을 만들지 못했습니다. 현재 진행과 원문은 변경하지 않았습니다.')
        }
    }

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
            <div className="settings-panel" role="dialog" aria-modal="true" aria-label="설정" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ 설정</h2>
                    <button className="close-btn" aria-label="설정 닫기" onClick={onClose}>×</button>
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

                    <section className="setting-group save-management" aria-label="저장 데이터 관리">
                        <h3>저장 데이터</h3>
                        <p className={`save-state ${storageStatus.mode}`} data-testid="save-status" data-mode={storageStatus.mode}>
                            {storageStatus.mode === 'memory' ? '저장 중단 · 현재 진행은 이 탭에만 있습니다'
                                : storageStatus.mode === 'protected' ? `자동 저장 · 원문 ${storageStatus.backupCount}개 별도 보존`
                                    : '자동 저장 · 이 브라우저에 5초마다 저장'}
                        </p>
                        <p>현재 진행을 파일로 받아 별도로 보관할 수 있습니다. 차트 관측 기록은 탭을 새로 열면 다시 시작합니다.</p>
                        {storageStatus.mode === 'memory' && <p role="alert">저장 공간 또는 원문 보호 확인에 실패했습니다. 탭을 닫기 전에 현재 진행을 다운로드하세요.</p>}
                        <button className="save-download" disabled={!getSaveSnapshot} data-testid="export-current-save"
                            onClick={() => download(() => createSaveExport(getSaveSnapshot()), `stock-game-${Date.now()}.json`)}>현재 진행 다운로드</button>
                        {backups.length > 0 && <details className="save-backups">
                            <summary>보존된 원문 {backups.length}개</summary>
                            <p>이전 시즌·지원하지 않는 형식·손상된 저장 내용을 당시 원문 그대로 보관합니다. 이 화면에서는 원문을 게임에 덮어쓰지 않습니다.</p>
                            <ul>{backups.map(backup => <li key={backup.id}>
                                <span>{new Date(backup.createdAt).toLocaleString('ko-KR')}<small>저장 형식 {backup.version ?? '확인 불가'} · {backup.bytes.toLocaleString()} 바이트</small></span>
                                <button onClick={() => download(() => readSaveBackup(backup.id), `stock-game-original-${backup.id}.json`)}>원문 다운로드</button>
                            </li>)}</ul>
                        </details>}
                        <p role="status" className="save-message">{saveMessage}</p>
                    </section>

                    {/* 게임 리셋 */}
                    <div className="setting-group danger-zone">
                        <label className="setting-label">위험 구역</label>
                        <button
                            className="reset-btn"
                            onClick={() => {
                                if (window.confirm('현재 게임 진행을 초기화하시겠습니까? 보존된 원문과 브라우저의 다른 데이터는 유지됩니다. 필요한 진행은 먼저 다운로드하세요.')) {
                                    if (resetGame()) window.location.reload()
                                    else setSaveMessage('원문 보호 또는 저장소 확인에 실패하여 초기화를 중단했습니다.')
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
