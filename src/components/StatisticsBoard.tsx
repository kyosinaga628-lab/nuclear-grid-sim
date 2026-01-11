import React, { useMemo } from 'react';
import { type Plant, getPlantActiveCapacity } from '../data/plants';

interface StatisticsBoardProps {
    plants: Plant[];
    gridLoad: number; // 0-100, affects demand simulation
    highlight?: boolean;
}

const TOTAL_DEMAND_BASE = 40000; // MW base demand assumption

// Helper to get total active capacity across all plants
const getTotalActiveCapacity = (plants: Plant[]): number =>
    plants.reduce((sum, p) => sum + getPlantActiveCapacity(p), 0);

const StatisticsBoard: React.FC<StatisticsBoardProps> = ({ plants, gridLoad, highlight }) => {

    // State for accumulated values (Real-time simulation)
    const [accumulated, setAccumulated] = React.useState({ co2: 0, cost: 0 });

    // Update accumulation every second
    React.useEffect(() => {
        const timer = setInterval(() => {
            // Calculate active capacity for this tick
            const activeCapacity = getTotalActiveCapacity(plants);

            // Assumptions:
            // CO2: 0.5 kg/kWh (Gas/Coal mix replacement)
            // Cost: 10 JPY/kWh (Fuel cost difference)
            // Calculation: MW * 1000 (kW) * Coeff * (1s / 3600s)

            const co2PerSec = activeCapacity * 1000 * 0.5 / 3600;
            const costPerSec = activeCapacity * 1000 * 10 / 3600;

            setAccumulated(prev => ({
                co2: prev.co2 + co2PerSec,
                cost: prev.cost + costPerSec
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, [plants]);

    const stats = useMemo(() => {
        const activeCapacity = getTotalActiveCapacity(plants);

        const currentDemand = TOTAL_DEMAND_BASE * (0.5 + (gridLoad / 100)); // Demand varies 0.5x to 1.5x based on load
        const sufficiency = (activeCapacity / currentDemand) * 100;

        // CO2 Calculation: 0.5 tons per MWh (approx for Gas/Coal mix)
        // Savings per hour
        const co2SavingsPerHour = activeCapacity * 0.5;

        return {
            activeCapacity,
            currentDemand,
            sufficiency,
            co2SavingsPerHour
        };
    }, [plants, gridLoad]);

    return (
        <div className={`panel stats-board ${highlight ? 'tutorial-highlight' : ''}`}>
            <h2>Grid Statistics</h2>

            <div className="stat-card">
                <div className="stat-label">Total Nuclear Generation</div>
                <div className="stat-value highlight">{stats.activeCapacity.toLocaleString()} <span className="unit">MW</span></div>
            </div>

            <div className="stat-card">
                <div className="stat-label">Est. Demand (Simulated)</div>
                <div className="stat-value">{Math.round(stats.currentDemand).toLocaleString()} <span className="unit">MW</span></div>
            </div>

            <div className="stat-card">
                <div className="stat-label">Sufficiency Rate</div>
                <div className="stat-value" style={{ color: stats.sufficiency > 100 ? '#4ade80' : stats.sufficiency > 80 ? '#facc15' : '#f87171' }}>
                    {stats.sufficiency.toFixed(1)} <span className="unit">%</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(stats.sufficiency, 100)}%`, background: stats.sufficiency > 80 ? '#4ade80' : '#f87171' }}></div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-label">CO2 Avoided (vs Thermal)</div>
                <div className="stat-value text-blue">{Math.round(stats.co2SavingsPerHour).toLocaleString()} <span className="unit">t-CO2/h</span></div>
                <div className="stat-desc">Equivalent to {(stats.co2SavingsPerHour / 0.14).toLocaleString()} cars off road</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '3px solid #f87171' }}>
                <div className="stat-label">Real-time Savings (Session)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa' }}>CO2:</span>
                        <span style={{ fontFamily: 'monospace' }}>{Math.floor(accumulated.co2).toLocaleString()} kg</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa' }}>Cost:</span>
                        <span style={{ fontFamily: 'monospace' }}>¥{Math.floor(accumulated.cost).toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-desc">Accumulated since page load</div>
            </div>

        </div>
    );
};

export default StatisticsBoard;
