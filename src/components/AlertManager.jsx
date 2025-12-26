// 알림 관리 컴포넌트
import { useState } from 'react'
import { formatNumber } from '../utils'
import { ALERT_TYPES } from '../constants'
import './AlertManager.css'

export default function AlertManager({ alerts, stocks, onAddAlert, onRemoveAlert, onClose }) {
    const [selectedStock, setSelectedStock] = useState(stocks[0]?.id || null)
    const [alertType, setAlertType] = useState('price_above')
    const [targetValue, setTargetValue] = useState('')

    const handleAddAlert = () => {
        if (!selectedStock || !targetValue) return

        const stock = stocks.find(s => s.id === selectedStock)
        onAddAlert({
            id: Date.now(),
            stockId: selectedStock,
            stockName: stock?.name,
            type: alertType,
            targetValue: parseFloat(targetValue),
            createdAt: Date.now(),
            triggered: false
        })

        setTargetValue('')
    }

    return (
        <div className="alert-manager-overlay" onClick={onClose}>
            <div className="alert-manager-panel" onClick={e => e.stopPropagation()}>
                <div className="alert-manager-header">
                    <h2>🔔 알림 관리</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* 알림 추가 폼 */}
                <div className="add-alert-form">
                    <h4>새 알림 추가</h4>

                    <div className="form-row">
                        <label>종목</label>
                        <select
                            value={selectedStock}
                            onChange={(e) => setSelectedStock(parseInt(e.target.value))}
                            className="alert-select"
                        >
                            {stocks.map(stock => (
                                <option key={stock.id} value={stock.id}>
                                    {stock.name} ({formatNumber(stock.price)}원)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label>알림 조건</label>
                        <div className="alert-type-buttons">
                            {Object.values(ALERT_TYPES).slice(0, 4).map(type => (
                                <button
                                    key={type.id}
                                    className={`type-btn ${alertType === type.id ? 'active' : ''}`}
                                    onClick={() => setAlertType(type.id)}
                                >
                                    <span>{type.icon}</span>
                                    <span>{type.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <label>
                            {alertType.includes('price') ? '목표 가격' : '목표 수익률 (%)'}
                        </label>
                        <div className="value-input-group">
                            <input
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder={alertType.includes('price') ? '가격' : '비율'}
                                className="alert-input"
                            />
                            <span className="input-unit">
                                {alertType.includes('price') ? '원' : '%'}
                            </span>
                        </div>
                    </div>

                    <button className="add-alert-btn" onClick={handleAddAlert} disabled={!targetValue}>
                        + 알림 추가
                    </button>
                </div>

                {/* 활성 알림 목록 */}
                <div className="active-alerts">
                    <h4>활성 알림 ({alerts?.length || 0})</h4>

                    {(!alerts || alerts.length === 0) ? (
                        <p className="no-alerts">등록된 알림이 없습니다.</p>
                    ) : (
                        <div className="alerts-list">
                            {alerts.map(alert => {
                                const typeInfo = ALERT_TYPES[alert.type]
                                return (
                                    <div key={alert.id} className={`alert-item ${alert.triggered ? 'triggered' : ''}`}>
                                        <div className="alert-icon">{typeInfo?.icon}</div>
                                        <div className="alert-info">
                                            <span className="alert-stock">{alert.stockName}</span>
                                            <span className="alert-condition">
                                                {typeInfo?.name}: {alert.type.includes('price')
                                                    ? formatNumber(alert.targetValue) + '원'
                                                    : alert.targetValue + '%'
                                                }
                                            </span>
                                        </div>
                                        <button
                                            className="remove-alert-btn"
                                            onClick={() => onRemoveAlert(alert.id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
