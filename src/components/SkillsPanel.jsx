
import React from 'react'
import { SKILLS } from '../constants'
import './SkillsPanel.css'

export default function SkillsPanel({ unlockedSkills = {}, skillPoints = 0, onUpgradeSkill, onClose }) {

    const getSkillLevel = (id) => unlockedSkills[id] || 0

    return (
        <div className="skills-panel-overlay">
            <div className="skills-panel">
                <div className="skills-header">
                    <h2>투자자 특성 (Skills)</h2>
                    <div className="skill-points">
                        남은 포인트: <span>{skillPoints}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="skills-content">
                    {Object.entries(SKILLS).map(([tier, skills]) => (
                        <div key={tier} className="skill-tier-section">
                            <h3 className="tier-title">{tier.toUpperCase().replace('TIER', 'TIER ')}</h3>
                            <div className="skills-grid">
                                {skills.map(skill => {
                                    const currentLevel = getSkillLevel(skill.id)
                                    const isMaxed = currentLevel >= skill.maxLevel
                                    const canUpgrade = !isMaxed && skillPoints >= skill.cost

                                    return (
                                        <div key={skill.id} className={`skill-card ${isMaxed ? 'maxed' : ''} ${canUpgrade ? 'available' : ''}`}>
                                            <div className="skill-info">
                                                <h4>{skill.name} <span className="skill-level">Lv.{currentLevel}/{skill.maxLevel}</span></h4>
                                                <p>{skill.description}</p>
                                                <div className="skill-cost">비용: {skill.cost} SP</div>
                                            </div>
                                            <button
                                                className="upgrade-btn"
                                                disabled={!canUpgrade}
                                                onClick={() => onUpgradeSkill(skill)}
                                            >
                                                {isMaxed ? 'Mastered' : '업그레이드'}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
