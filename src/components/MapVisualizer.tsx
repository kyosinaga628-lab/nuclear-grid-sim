import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { type Plant } from '../data/plants';
import { gridLines, consumptionHubs } from '../data/grid';

// Helper to set color based on status
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Active': return '#4ade80'; // Green
        case 'Under Review': return '#facc15'; // Yellow
        case 'Construction': return '#3b82f6'; // Blue
        case 'Suspended': return '#f87171'; // Red
        case 'Decommissioning': return '#94a3b8'; // Gray
        default: return '#fff';
    }
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Active': return 'status-active';
        case 'Under Review': return 'status-warning';
        case 'Construction': return 'status-neutral';
        case 'Suspended': return 'status-danger';
        default: return 'status-neutral';
    }
};

const MapController = () => {
    return null;
}

const MapVisualizer: React.FC<{ plants: Plant[], gridLoad: number, onTogglePlant: (id: string) => void }> = ({ plants, gridLoad, onTogglePlant }) => {
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

    // Animation speed and load effects
    const flowSpeed = Math.max(0.2, 2.0 - (gridLoad / 50));
    const isHighLoad = gridLoad > 80;

    // Simulation Logic: Solve Grid Flow
    const gridState = useMemo(() => {
        // 1. Calculate Regional Balance (Generation - Demand)
        const regionalBalance: Record<string, { gen: number, demand: number, balance: number }> = {};

        // Initialize regions
        ['hokkaido', 'tohoku', 'tokyo', 'chubu', 'hokuriku', 'kansai', 'chugoku', 'shikoku', 'kyushu'].forEach(r => {
            regionalBalance[r] = { gen: 0, demand: 0, balance: 0 };
        });

        // Sum Generation per Region
        plants.forEach(p => {
            if (p.status === 'Active' && regionalBalance[p.regionId]) {
                regionalBalance[p.regionId].gen += p.capacity;
            }
        });

        // Sum Demand per Region (Adjusted by gridLoad)
        consumptionHubs.forEach(h => {
            const currentDemand = h.baseDemand * (0.5 + (gridLoad / 100));
            if (regionalBalance[h.regionId]) {
                regionalBalance[h.regionId].demand += currentDemand;
            }
        });

        // Calculate Initial Balance
        Object.keys(regionalBalance).forEach(r => {
            regionalBalance[r].balance = regionalBalance[r].gen - regionalBalance[r].demand;
        });

        // 2. Interconnection Flow Simulation (Iterative Push)
        // Deficit regions try to pull from Surplus regions via specific paths
        const flows: Record<string, number> = {}; // interconnectionId -> MW flow
        const interconnections = [
            { id: 'kitahon', from: 'hokkaido', to: 'tohoku', cap: 900 },
            { id: 'tohoku-tokyo', from: 'tohoku', to: 'tokyo', cap: 5000 },
            { id: 'fc-tokyo-chubu', from: 'tokyo', to: 'chubu', cap: 2100 }, // Bi-directional handling
            { id: 'fc-chubu-tokyo', from: 'chubu', to: 'tokyo', cap: 2100 },
            { id: 'chubu-kansai', from: 'chubu', to: 'kansai', cap: 2000 },
            { id: 'chubu-hokuriku', from: 'chubu', to: 'hokuriku', cap: 1000 },
            { id: 'hokuriku-kansai', from: 'hokuriku', to: 'kansai', cap: 1500 },
            { id: 'kansai-chugoku', from: 'kansai', to: 'chugoku', cap: 3000 },
            { id: 'kansai-shikoku', from: 'kansai', to: 'shikoku', cap: 1400 },
            { id: 'chugoku-kyushu', from: 'chugoku', to: 'kyushu', cap: 2500 } // And reverse
        ];

        // Simple Heuristic: Sweep multiple times to allow multi-hop propagation (e.g. Hokkaido -> Tohoku -> Tokyo)
        for (let i = 0; i < 4; i++) {
            // Logic: If From has Surplus AND To has Deficit, move power.
            interconnections.forEach(conn => {
                const fromBal = regionalBalance[conn.from].balance;
                const toBal = regionalBalance[conn.to].balance;

                if (fromBal > 0 && toBal < 0) {
                    // Send power
                    const amount = Math.min(fromBal, -toBal, conn.cap);
                    flows[conn.id] = (flows[conn.id] || 0) + amount;
                    regionalBalance[conn.from].balance -= amount;
                    regionalBalance[conn.to].balance += amount;
                }
            });

            // Reverse direction check
            const reversePairs = [
                { id: 'chugoku-kyushu', A: 'kyushu', B: 'chugoku', cap: 2500 },
                { id: 'kansai-chugoku', A: 'chugoku', B: 'kansai', cap: 3000 },
                { id: 'fc-tokyo-chubu', A: 'chubu', B: 'tokyo', cap: 2100 },
                // Add potential reverse flows for North-South as well if needed (e.g. Tohoku -> Hokkaido unlikely but possible)
            ];

            reversePairs.forEach(pair => {
                const fromBal = regionalBalance[pair.A].balance;
                const toBal = regionalBalance[pair.B].balance;

                if (fromBal > 0 && toBal < 0) {
                    const amount = Math.min(fromBal, -toBal, pair.cap);
                    // Negative flow ID signifies reverse direction for visualization
                    flows[pair.id] = (flows[pair.id] || 0) - amount;
                    regionalBalance[pair.A].balance -= amount;
                    regionalBalance[pair.B].balance += amount;
                }
            });
        }

        // 3. Final Sufficiency Calculation for Hubs
        const hubStatus = consumptionHubs.map(hub => {
            const rb = regionalBalance[hub.regionId];
            // Sufficiency = (Gen + Imports - Exports) / Demand
            // Which is essentially (Demand + FinalBalance) / Demand
            // = 1 + (FinalBalance / Demand) ??
            // If Balance is negative (Deficit), Sufficiency < 100%. If Positive, > 100%.

            // Base demand used for denom
            const currentDemand = hub.baseDemand * (0.5 + (gridLoad / 100));

            // Prevent division by zero
            let sufficiency = currentDemand > 0 ? (currentDemand + rb.balance) / currentDemand : 1.0;
            if (sufficiency < 0) sufficiency = 0; // Should not happen unless totally broken

            return { ...hub, sufficiency };
        });

        return { hubStatus, flows };

    }, [plants, gridLoad]);

    // Update selected plant reference when plants prop updates (so status change reflects in UI immediately)
    // We strictly find the current plant object from the fresh props
    const currentSelectedPlant = selectedPlant ? plants.find(p => p.id === selectedPlant.id) || selectedPlant : null;

    return (
        <div className="map-container">
            <MapContainer
                center={[36.0, 138.0]}
                zoom={5}
                style={{ width: '100%', height: '100%', background: 'transparent' }} // Let CSS control background
                zoomControl={false}
            >
                <MapController />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    opacity={0.9} // Slight transparency to let the lighter background bleed through if needed, or just keep it solid
                />

                {/* Grid Lines */}
                {gridLines.map((line) => {
                    // Determine if this line connects to an active plant
                    const connectedActive = plants.some(p =>
                        p.status === 'Active' && line.path.some(pt => Math.abs(pt[0] - p.lat) < 0.1 && Math.abs(pt[1] - p.lng) < 0.1)
                    );

                    // Check if it's an active interconnection
                    const rawFlow = line.interconnectionId ? gridState.flows[line.interconnectionId] : 0;
                    const flowAmount = Math.abs(rawFlow || 0);
                    const isInterconnectionActive = flowAmount > 10;

                    // Direction: rawFlow > 0 is Forward, < 0 is Reverse
                    const isReverse = (rawFlow || 0) < 0;

                    const isActive = connectedActive || isInterconnectionActive;

                    // Determine class: flow forward or reverse
                    let animClass = 'line-flow';
                    if (isInterconnectionActive && isReverse) animClass = 'line-flow-reverse';

                    return (
                        <Polyline
                            key={line.id}
                            positions={line.path}
                            pathOptions={{
                                color: isInterconnectionActive ? '#e879f9' : (isHighLoad ? '#fca5a5' : (line.voltage === 'HVDC' ? '#f472b6' : '#60a5fa')),
                                weight: (line.voltage === '500kV' ? 4 : 2) * (isActive ? 1.5 : 1.0),
                                opacity: isActive ? 1.0 : 0.6,
                                className: `${animClass} ${isHighLoad || isInterconnectionActive ? 'high-load' : ''}`
                            }}
                        />
                    );
                })}

                {/* Inject dynamic style for animation speed */}
                <style>{`
                    .line-flow {
                        animation-duration: ${flowSpeed}s !important;
                    }
                        stroke-dasharray: 10 20 !important;
                        animation: flow ${flowSpeed}s linear infinite !important;
                        stroke-linecap: round;
                        filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.6));
                        will-change: stroke-dashoffset;
                    }
                    .line-flow-reverse {
                        stroke-dasharray: 10 20 !important;
                        animation: flow-reverse ${flowSpeed}s linear infinite !important;
                        stroke-linecap: round;
                        filter: drop-shadow(0 0 3px rgba(217, 70, 239, 0.6));
                        will-change: stroke-dashoffset;
                    }
                    
                    .line-flow.high-load, .line-flow-reverse.high-load {
                        animation-duration: ${flowSpeed / 2}s !important;
                        stroke: #f87171 !important;
                        filter: drop-shadow(0 0 4px rgba(248, 113, 113, 0.8));
                    }

                    .hub-marker.insufficient {
                        animation: pulse-red 1.5s infinite alternate;
                    }
                    @keyframes pulse-red {
                        from { stroke-width: 3px; stroke-opacity: 1; }
                        to { stroke-width: 5px; stroke-opacity: 0.6; }
                    }
                    .hub-label-tooltip {
                        background-color: rgba(0,0,0,0.7) !important;
                        border: none !important;
                        color: #fff !important;
                        font-weight: bold;
                        padding: 4px 8px;
                        border-radius: 4px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        font-family: monospace;
                    }
                    .hub-label-tooltip .leaflet-tooltip-tip {
                        border-top-color: rgba(0,0,0,0.7) !important;
                    }
                `}</style>

                {/* Plants */}
                {plants.map((plant) => (
                    <CircleMarker
                        key={plant.id}
                        center={[plant.lat, plant.lng]}
                        pathOptions={{
                            color: getStatusColor(plant.status),
                            fillColor: getStatusColor(plant.status),
                            fillOpacity: 0.8,
                            weight: 2,
                            className: plant.status === 'Active' ? 'marker-active' : ''
                        }}
                        radius={Math.sqrt(plant.capacity) / 2}
                        eventHandlers={{
                            click: () => {
                                setSelectedPlant(plant);
                                onTogglePlant(plant.id);
                            },
                            mouseover: (e) => e.target.openPopup(),
                            mouseout: (e) => e.target.closePopup(),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                            <span style={{ fontWeight: 'bold' }}>{plant.name}</span>
                        </Tooltip>
                    </CircleMarker>
                ))}

                {/* Consumption Hubs */}
                {gridState.hubStatus.map((hub) => (
                    <CircleMarker
                        key={hub.id}
                        center={[hub.lat, hub.lng]}
                        pathOptions={{
                            color: hub.sufficiency >= 1.0 ? '#4ade80' : hub.sufficiency > 0.6 ? '#facc15' : '#f87171',
                            fillColor: 'transparent',
                            weight: 3,
                            className: hub.sufficiency < 0.6 ? 'hub-marker insufficient' : 'hub-marker sufficient'
                        }}
                        radius={10 + (hub.baseDemand / 2000)}
                    >
                        <Tooltip direction="center" permanent className="hub-label-tooltip" opacity={0.8}>
                            <div style={{ textAlign: 'center', fontSize: '10px' }}>
                                <div style={{ marginBottom: '2px' }}>{hub.name}</div>
                                <div style={{ fontSize: '0.9em', color: '#ccc' }}>
                                    S: {Math.round(hub.baseDemand * hub.sufficiency).toLocaleString()} MW
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#888' }}>
                                    D: {hub.baseDemand.toLocaleString()} MW
                                </div>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}

            </MapContainer>

            {/* Info Overlay */}
            <div className="overlay-ui">
                <h1>Japan Nuclear Grid <span style={{ fontSize: '0.6em', background: '#3b82f6', padding: '2px 6px', borderRadius: '4px', color: 'white', verticalAlign: 'middle' }}>V2.3</span></h1>
                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '16px' }}>
                    Live visualization of nuclear power capacity and transmission topology.
                </div>

                {currentSelectedPlant ? (
                    <div className="plant-card">
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{currentSelectedPlant.name}</h2>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className={`status-badge ${getStatusClass(currentSelectedPlant.status)}`}>
                                {currentSelectedPlant.status}
                            </div>
                            <button
                                onClick={() => onTogglePlant(currentSelectedPlant.id)}
                                style={{
                                    background: currentSelectedPlant.status === 'Active' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                    color: currentSelectedPlant.status === 'Active' ? '#f87171' : '#4ade80',
                                    border: currentSelectedPlant.status === 'Active' ? '1px solid #f87171' : '1px solid #4ade80',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {currentSelectedPlant.status === 'Active' ? 'STOP' : 'START'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.8rem' }}>Operator</div>
                                <div>{currentSelectedPlant.operator}</div>
                            </div>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.8rem' }}>Capacity</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{currentSelectedPlant.capacity} MW</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="plant-card" style={{ opacity: 0.6, fontStyle: 'italic' }}>
                        Click a power plant node to view details.
                    </div>
                )}
            </div>

            {/* Legend Overlay */}
            <div className="legend-ui">
                <h3>Legend</h3>

                <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>Grid Status</div>
                    <div className="legend-item">
                        <div className="legend-line" style={{ background: '#3b82f6', boxShadow: '0 0 4px #3b82f6' }}></div>
                        <span>Normal Load</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-line" style={{ background: '#f87171', boxShadow: '0 0 4px #f87171' }}></div>
                        <span>High Stress (&gt;80%)</span>
                    </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>City Power</div>
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ background: '#4ade80' }}></div>
                        <span>Sufficient</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ background: '#f87171' }}></div>
                        <span>Insufficient</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic', color: '#888' }}>
                        S: Supply (Received)<br />
                        D: Demand (Base Load)
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MapVisualizer;
