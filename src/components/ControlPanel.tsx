import React from 'react';
import { type Plant } from '../data/plants';

interface ControlPanelProps {
    plants: Plant[];
    onTogglePlant: (id: string) => void;
    gridLoad: number;
    onSetGridLoad: (load: number) => void;
    onSetAllActive: () => void;
    onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ plants, onTogglePlant, gridLoad, onSetGridLoad, onSetAllActive, onReset }) => {
    return (
        <div className="panel control-panel">
            <h2>Control Center</h2>

            <div className="control-section">
                <h3>Grid Load (Demand)</h3>
                <div className="slider-container">
                    <input
                        type="range"
                        min="10"
                        max="150"
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
                        {gridLoad > 100 ? '⚠️ 需要過多（電力不足リスク）' : gridLoad > 80 ? '⚡ 高負荷状態' : '✅ 安定供給'}
                    </div>
                </div>
            </div>

            <div className="control-section">
                <h3>Global Controls</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                        onClick={onSetAllActive}
                        className="global-btn active-all"
                        style={{ flex: 1, padding: '8px', background: 'rgba(248, 113, 113, 0.2)', border: '1px solid #f87171', color: '#f87171', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        MAX POWER
                    </button>
                    <button
                        onClick={onReset}
                        className="global-btn reset"
                        style={{ flex: 1, padding: '8px', background: 'rgba(148, 163, 184, 0.2)', border: '1px solid #94a3b8', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        RESET
                    </button>
                </div>

                <h3>Plant Operation</h3>
                <div className="plant-list">
                    {plants.map(plant => (
                        <div key={plant.id} className="plant-toggle-row">
                            <span className="plant-name">{plant.name}</span>
                            <button
                                className={`toggle-btn ${plant.status === 'Active' ? 'on' : 'off'}`}
                                onClick={() => onTogglePlant(plant.id)}
                            >
                                {plant.status === 'Active' ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
