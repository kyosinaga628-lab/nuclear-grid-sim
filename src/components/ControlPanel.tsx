import React from 'react';
import { type Plant } from '../data/plants';

interface ControlPanelProps {
    plants: Plant[];
    onTogglePlant: (id: string) => void;
    gridLoad: number;
    onSetAllActive: () => void;
    onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ plants, onTogglePlant, gridLoad, onSetAllActive, onReset }) => {
    return (
        <div className="panel control-panel">
            <h2>Control Center</h2>

            <div className="control-section">
                <h3>Grid Load</h3>
                <div className="slider-container">
                    <div style={{
                        width: '100%',
                        height: '6px',
                        background: '#333',
                        borderRadius: '3px',
                        position: 'relative',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: `${gridLoad}%`,
                            height: '100%',
                            background: gridLoad > 80 ? '#f87171' : '#3b82f6',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease, background 0.3s ease'
                        }} />
                    </div>
                    <div className="slider-value" style={{ textAlign: 'right', fontSize: '0.9rem', color: gridLoad > 80 ? '#f87171' : '#aaa' }}>
                        {gridLoad}% (Simulated)
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
