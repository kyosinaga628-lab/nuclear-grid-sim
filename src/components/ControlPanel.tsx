import React, { useState } from 'react';
import { type Plant, getPlantActiveCount, getPlantActiveCapacity, getPlantCapacity } from '../data/plants';

interface ControlPanelProps {
    plants: Plant[];
    onTogglePlant: (plantId: string) => void;
    onToggleReactor: (plantId: string, reactorId: string) => void;
    gridLoad: number;
    onSetGridLoad: (load: number) => void;
    onSetAllActive: () => void;
    onReset: () => void;
    highlightLoadControl?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    plants, onTogglePlant, onToggleReactor, gridLoad, onSetGridLoad, onSetAllActive, onReset, highlightLoadControl
}) => {
    const [expandedPlant, setExpandedPlant] = useState<string | null>(null);

    const toggleExpand = (plantId: string) => {
        setExpandedPlant(current => current === plantId ? null : plantId);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return '#4ade80';
            case 'Suspended': return '#f87171';
            case 'Under Review': return '#facc15';
            case 'Construction': return '#94a3b8';
            default: return '#666';
        }
    };

    return (
        <div className="panel control-panel">
            <h2>Control Center</h2>

            <div className={`control-section ${highlightLoadControl ? 'tutorial-highlight' : ''}`}>
                <h3>Grid Load (Demand)</h3>
                <div className="slider-container">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={gridLoad}
                        onChange={(e) => onSetGridLoad(Number(e.target.value))}
                        style={{
                            width: '100%',
                            accentColor: gridLoad > 100 ? '#f87171' : gridLoad > 80 ? '#facc15' : '#3b82f6',
                            cursor: 'pointer'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        color: '#888',
                        marginTop: '4px'
                    }}>
                        <span>Low</span>
                        <span style={{
                            color: gridLoad > 100 ? '#f87171' : gridLoad > 80 ? '#facc15' : '#3b82f6',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}>
                            {gridLoad}%
                        </span>
                        <span>High</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textAlign: 'center' }}>
                        {gridLoad > 100 ? '⚠️ 需要過多' : gridLoad > 80 ? '⚡ 高負荷' : '✅ 安定供給'}
                    </div>
                </div>
            </div>

            <div className="control-section">
                <h3>Global Controls</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                        onClick={onSetAllActive}
                        style={{ flex: 1, padding: '8px', background: 'rgba(248, 113, 113, 0.2)', border: '1px solid #f87171', color: '#f87171', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        MAX POWER
                    </button>
                    <button
                        onClick={onReset}
                        style={{ flex: 1, padding: '8px', background: 'rgba(148, 163, 184, 0.2)', border: '1px solid #94a3b8', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        RESET
                    </button>
                </div>

                <h3>Plant Operation</h3>
                <div className="plant-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {plants.map(plant => {
                        const activeCount = getPlantActiveCount(plant);
                        const totalCount = plant.reactors.length;
                        const activeCapacity = getPlantActiveCapacity(plant);
                        const totalCapacity = getPlantCapacity(plant);
                        const isExpanded = expandedPlant === plant.id;
                        const hasActiveReactor = activeCount > 0;

                        return (
                            <div key={plant.id} className="plant-item" style={{ marginBottom: '8px' }}>
                                {/* Plant Header */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px',
                                        background: hasActiveReactor ? 'rgba(74, 222, 128, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        border: `1px solid ${hasActiveReactor ? 'rgba(74, 222, 128, 0.3)' : 'rgba(100, 100, 100, 0.3)'}`,
                                    }}
                                    onClick={() => toggleExpand(plant.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#fff' }}>{isExpanded ? '▼' : '▶'}</span>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{plant.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                {activeCount}/{totalCount}基稼働 | {activeCapacity.toLocaleString()}/{totalCapacity.toLocaleString()} MW
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onTogglePlant(plant.id); }}
                                        style={{
                                            padding: '4px 10px',
                                            background: hasActiveReactor ? 'rgba(248, 113, 113, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                            border: `1px solid ${hasActiveReactor ? '#f87171' : '#4ade80'}`,
                                            color: hasActiveReactor ? '#f87171' : '#4ade80',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {hasActiveReactor ? '全停止' : '全起動'}
                                    </button>
                                </div>

                                {/* Reactor List (Expanded) */}
                                {isExpanded && (
                                    <div style={{ marginTop: '4px', marginLeft: '16px' }}>
                                        {plant.reactors.map(reactor => (
                                            <div
                                                key={reactor.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '6px 8px',
                                                    borderLeft: `3px solid ${getStatusColor(reactor.status)}`,
                                                    marginBottom: '4px',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '0 4px 4px 0',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                                                        {reactor.unitNumber}号機
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                                                        {reactor.capacity.toLocaleString()} MW
                                                    </span>
                                                </div>
                                                {reactor.status === 'Construction' ? (
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>建設中</span>
                                                ) : (
                                                    <button
                                                        onClick={() => onToggleReactor(plant.id, reactor.id)}
                                                        style={{
                                                            padding: '2px 8px',
                                                            background: reactor.status === 'Active' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                                                            border: `1px solid ${reactor.status === 'Active' ? '#4ade80' : '#f87171'}`,
                                                            color: reactor.status === 'Active' ? '#4ade80' : '#f87171',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {reactor.status === 'Active' ? 'ON' : 'OFF'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
