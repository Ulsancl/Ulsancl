import { useMemo, useState, useEffect, useRef } from 'react'
import { formatPercent } from '../utils'
import { INITIAL_CAPITAL } from '../constants'
import { assetPlotPoints, formatChartPrice } from '../utils/chart-observations'
import './AssetChart.css'

const timestampLabel = time => new Date(time).toLocaleString('ko-KR', { hour12:false })
export default function AssetChart({ assetHistory = [], onClose }) {
    const { points, domain } = useMemo(() => assetPlotPoints(assetHistory), [assetHistory])
    const [selectedTime,setSelectedTime] = useState(null)
    const dialog = useRef(null)
    useEffect(() => { const previous=document.activeElement; dialog.current?.querySelector('button')?.focus(); return()=>previous?.focus?.() },[])
    const last=points.at(-1), selected=points.find(p=>p.timestamp===selectedTime)||last
    const currentValue=last?.value ?? INITIAL_CAPITAL, profitRate=(currentValue-INITIAL_CAPITAL)/INITIAL_CAPITAL*100, isProfit=profitRate>=0
    const min=points.length?Math.min(...points.map(p=>p.value)):0,max=points.length?Math.max(...points.map(p=>p.value)):0
    const path=points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')
    const y=value=>20+(domain.max-value)/(domain.max-domain.min)*180
    const keyDown=event=>{
        if(event.key==='Escape'){event.stopPropagation();onClose();return}
        if(event.key==='Tab'){
            const nodes=[...dialog.current.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(node=>node.getClientRects().length),first=nodes[0],last=nodes.at(-1)
            if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
            else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
            return
        }
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!points.length)return
        event.preventDefault();event.stopPropagation()
        const i=points.indexOf(selected),next=event.key==='Home'?0:event.key==='End'?points.length-1:i+(event.key==='ArrowLeft'?-1:1)
        setSelectedTime(points[Math.max(0,Math.min(points.length-1,next))].timestamp)
    }
    return <div className="asset-chart-overlay" onClick={onClose}>
        <div className="asset-chart-panel" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="asset-chart-title" onClick={e=>e.stopPropagation()} onKeyDown={keyDown}>
            <div className="asset-chart-header"><h2 id="asset-chart-title">자산 기록</h2><button className="close-btn" aria-label="자산 차트 닫기" onClick={onClose}>×</button></div>
            {!points.length?<div className="no-data"><p>시각이 기록된 자산 표본이 아직 없습니다.</p><p className="sub">실행 중 약 10초마다 기록합니다.</p></div>:<>
                <div className="asset-summary">
                    <div className="summary-item"><span className="label">마지막 기록 자산</span><span className="value" data-testid="last-recorded-asset" data-value={currentValue}>{formatChartPrice(currentValue)}원</span></div>
                    <div className="summary-item"><span className="label">기록 최고</span><span className="value high">{formatChartPrice(max)}원</span></div>
                    <div className="summary-item"><span className="label">기록 최저</span><span className="value low">{formatChartPrice(min)}원</span></div>
                    <div className="summary-item"><span className="label">초기 자산 대비</span><span className={`value ${isProfit?'profit':'loss'}`} data-testid="recorded-asset-return">{formatPercent(profitRate)}</span></div>
                </div>
                <div className="asset-selected" data-testid="asset-selected" data-time={selected.timestamp} data-value={selected.value}>{timestampLabel(selected.timestamp)} · {formatChartPrice(selected.value)}원</div>
                <div className="chart-container"><svg viewBox="0 0 600 240" className="asset-svg" role="group" tabIndex="0" aria-label="기록 시각에 따른 자산. 방향키로 기록 선택" onPointerMove={event=>{
                    const rect=event.currentTarget.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*600
                    const nearest=points.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a);setSelectedTime(nearest.timestamp)
                }}>
                    {Array.from({length:5},(_,i)=>{const value=domain.min+(domain.max-domain.min)*i/4;return <g key={i}><line x1="85" x2="580" y1={y(value)} y2={y(value)} stroke="var(--color-border)" strokeDasharray="4"/><text x="78" y={y(value)+4} textAnchor="end" fill="var(--color-text-muted)" fontSize="10">{formatChartPrice(value,(domain.max-domain.min)/4)}</text></g>})}
                    {domain.min<=INITIAL_CAPITAL&&domain.max>=INITIAL_CAPITAL&&<line x1="85" x2="580" y1={y(INITIAL_CAPITAL)} y2={y(INITIAL_CAPITAL)} stroke="var(--color-accent)" strokeDasharray="6"/>}
                    <path d={path} fill="none" stroke={isProfit?'var(--color-profit)':'var(--color-loss)'} strokeWidth="2"/>
                    {points.map((p,i)=><circle key={`${p.timestamp}:${i}`} data-asset-time={p.timestamp} data-asset-value={p.value} cx={p.x} cy={p.y} r={p===selected?4:2} fill={p===selected?'var(--color-text-primary)':'var(--color-accent)'}/>)}
                    <line x1={selected.x} x2={selected.x} y1="20" y2="200" stroke="var(--color-text-muted)" strokeDasharray="3 3"/>
                    <text x="85" y="229" fill="var(--color-text-muted)" fontSize="10">{new Date(points[0].timestamp).toLocaleTimeString('ko-KR',{hour12:false})}</text>
                    <text x="580" y="229" textAnchor="end" fill="var(--color-text-muted)" fontSize="10">{new Date(last.timestamp).toLocaleTimeString('ko-KR',{hour12:false})}</text>
                </svg></div>
                <div className="chart-footer">{points.length}개 표본 · 마지막 기록 {timestampLabel(last.timestamp)}<br/>가로축은 실제 기록 시각입니다. 현재 계좌와 다음 기록 전까지 차이가 날 수 있습니다.</div>
            </>}
        </div>
    </div>
}
