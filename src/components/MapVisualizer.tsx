import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { type Plant, getPlantActiveCapacity, getPlantCapacity, getPlantActiveCount } from '../data/plants';
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

// Derive a plant's overall status from its reactors
const getPlantStatus = (plant: Plant): string => {
    const activeCount = getPlantActiveCount(plant);
    if (activeCount > 0) return 'Active';
    const underReview = plant.reactors.some(r => r.status === 'Under Review');
    if (underReview) return 'Under Review';
    const construction = plant.reactors.every(r => r.status === 'Construction');
    if (construction) return 'Construction';
    return 'Suspended';
};

const MapController = () => {
    return null;
}

// Custom component for JS-driven animation (More robust than CSS)
const MovingPolyline: React.FC<{
    positions: [number, number][];
    isActive: boolean;
    isReverse: boolean;
    isHighLoad: boolean;
    voltage: string;
    flowSpeed: number;
    baseColor: string;
}> = ({ positions, isActive, isReverse, isHighLoad, voltage, flowSpeed, baseColor }) => {
    const lineRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (!isActive || !lineRef.current) return;

        let animationFrameId: number;
        let offset = 0;
        const totalCycle = 30; // 10px dash + 20px gap

        const animate = () => {
            const speedPxPerFrame = (30 / (flowSpeed * 60)) * 1.5;

            if (isReverse) {
                offset += speedPxPerFrame;
            } else {
                offset -= speedPxPerFrame;
            }

            // Keep offset bounded to avoid huge numbers
            if (Math.abs(offset) > totalCycle) offset = 0;

            // Access Leaflet's internal SVG path element (_path)
            const leafletLayer = lineRef.current;
            const el = leafletLayer?._path || leafletLayer?.getElement?.();

            if (el) {
                el.style.strokeDashoffset = `${offset}`;
                el.style.strokeDasharray = '10 20';
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        // Small delay to ensure the element is rendered
        const timeoutId = setTimeout(() => animate(), 50);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timeoutId);
        };
    }, [isActive, isReverse, flowSpeed]);

    return (
        <Polyline
            ref={lineRef}
            positions={positions}
            pathOptions={{
                color: baseColor,
                weight: (voltage === '500kV' ? 4 : 2) * (isActive ? 1.5 : 1.0),
                opacity: isActive ? 1.0 : 0.6,
                dashArray: isActive ? '10 20' : undefined,
                className: isHighLoad ? 'high-load-line' : ''
            }}
        />
    );
};

const MapVisualizer: React.FC<{ plants: Plant[], gridLoad: number, onTogglePlant: (id: string) => void, highlightPlants?: boolean }> = ({ plants, gridLoad, onTogglePlant, highlightPlants }) => {
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

    // Animation speed and load effects
    const flowSpeed = Math.max(0.2, 2.0 - (gridLoad / 50));
    const isHighLoad = gridLoad > 80;

    // Simulation Logic: Solve Grid Flow
    const gridState = useMemo(() => {
        // 1. Calculate Regional Balance (Generation - Demand)
        const regionalBalance: Record<string, { gen: number, otherGen: number, demand: number, balance: number, sufficiency: number }> = {};

        // Initialize regions
        ['hokkaido', 'tohoku', 'tokyo', 'chubu', 'hokuriku', 'kansai', 'chugoku', 'shikoku', 'kyushu'].forEach(r => {
            regionalBalance[r] = { gen: 0, otherGen: 0, demand: 0, balance: 0, sufficiency: 0 };
        });

        // Sum Nuclear Generation per Region (using reactor data)
        plants.forEach(p => {
            const activeCapacity = getPlantActiveCapacity(p);
            if (activeCapacity > 0 && regionalBalance[p.regionId]) {
                regionalBalance[p.regionId].gen += activeCapacity;
            }
        });

        // Sum Demand per Region & Estimate Non-Nuclear Supply
        consumptionHubs.forEach(h => {
            const currentDemand = h.baseDemand * (0.5 + (gridLoad / 100));
            if (regionalBalance[h.regionId]) {
                regionalBalance[h.regionId].demand += currentDemand;
                // Use region-specific non-nuclear ratio from 2024 actual data (Nikkei)
                // This reflects how much of the demand is covered by thermal, hydro, renewables etc.
                regionalBalance[h.regionId].otherGen += h.baseDemand * h.nonNuclearRatio;
            }
        });

        // Calculate Initial Balance & Sufficiency
        Object.keys(regionalBalance).forEach(r => {
            const rb = regionalBalance[r];
            rb.balance = (rb.gen + rb.otherGen) - rb.demand;
            rb.sufficiency = rb.demand > 0 ? (rb.gen + rb.otherGen) / rb.demand : 1.0;
        });

        // 2. Interconnection Flow Simulation (Relative Sufficiency Logic)
        // Power flows from Higher Sufficiency region to Lower Sufficiency region
        const flows: Record<string, number> = {}; // interconnectionId -> MW flow

        // Define all bidirectional potential paths
        // "id" is the forward direction ID in the SVG/Data
        const interconnections = [
            { id: 'kitahon', A: 'hokkaido', B: 'tohoku', cap: 900 }, // Forward: Hokkaido -> Tohoku
            { id: 'tohoku-tokyo', A: 'tohoku', B: 'tokyo', cap: 5000 },
            { id: 'fc-tokyo-chubu', A: 'tokyo', B: 'chubu', cap: 2100 }, // FC is physically bidirectional
            { id: 'chubu-kansai', A: 'chubu', B: 'kansai', cap: 2000 },
            { id: 'chubu-hokuriku', A: 'chubu', B: 'hokuriku', cap: 1000 },
            { id: 'hokuriku-kansai', A: 'hokuriku', B: 'kansai', cap: 1500 },
            { id: 'kansai-chugoku', A: 'kansai', B: 'chugoku', cap: 3000 },
            { id: 'kansai-shikoku', A: 'kansai', B: 'shikoku', cap: 1400 },
            { id: 'chugoku-kyushu', A: 'chugoku', B: 'kyushu', cap: 2500 }
        ];

        // Create a map for capacity lookup
        const capacityMap: Record<string, number> = {};
        interconnections.forEach(c => { capacityMap[c.id] = c.cap; });

        // Iterative Solver for Grid Flow
        for (let i = 0; i < 10; i++) {
            interconnections.forEach(conn => {
                const regionA = regionalBalance[conn.A];
                const regionB = regionalBalance[conn.B];

                // Calculate current sufficiency including current accumulated balance
                // (Gen + Other + CurrentBalance) / Demand
                // Note: regionalBalance.balance already tracks the net flow
                const currentSufficiencyA = regionA.demand > 0 ? (regionA.gen + regionA.otherGen + regionA.balance) / regionA.demand : 1.0;
                const currentSufficiencyB = regionB.demand > 0 ? (regionB.gen + regionB.otherGen + regionB.balance) / regionB.demand : 1.0;

                // Threshold to trigger flow (hysteresis) to avoid osciallation
                const threshold = 0.01; // 1% difference

                if (Math.abs(currentSufficiencyA - currentSufficiencyB) > threshold) {
                    // Determine direction: A->B or B->A
                    // Flow attempts to equalize sufficiency

                    // Simple P-controller logic: move a fraction of the difference
                    // but clamped by capacity.

                    // If A is richer than B
                    if (currentSufficiencyA > currentSufficiencyB) {
                        // Max possible flow to help B without hurting A too much?
                        // Just simple logic: try to move enough power to equalize, but capped by line capacity

                        // We need to calculate MW amount.
                        // Delta Sufficiency * Average Demand?
                        // Let's just move a fixed "flow impulse" proportional to the gap, 
                        // iterating will smooth it out.

                        // Heuristic transfer amount:
                        // (Diff Sufficiency) * (Min Demand of A or B) * 0.5 (damping)
                        let transfer = (currentSufficiencyA - currentSufficiencyB) * Math.min(regionA.demand, regionB.demand) * 0.2;

                        // Clamp by capacity
                        transfer = Math.min(transfer, conn.cap);

                        // If flow already exists, check capacity left
                        const currentFlow = flows[conn.id] || 0;
                        // currentFlow > 0 means A->B. < 0 means B->A.

                        // We want to ADD to current flow (or reduce reverse flow)
                        // New Total Flow cannot exceed Cap
                        let newFlow = currentFlow + transfer;
                        if (newFlow > conn.cap) newFlow = conn.cap;

                        const actualDelta = newFlow - currentFlow;

                        // Apply
                        flows[conn.id] = newFlow;
                        regionA.balance -= actualDelta;
                        regionB.balance += actualDelta;

                    } else {
                        // B is richer than A (Flow B -> A)
                        let transfer = (currentSufficiencyB - currentSufficiencyA) * Math.min(regionA.demand, regionB.demand) * 0.2;
                        transfer = Math.min(transfer, conn.cap);

                        const currentFlow = flows[conn.id] || 0;
                        // We want to subtract from currentFlow (making it more negative)
                        let newFlow = currentFlow - transfer;
                        if (newFlow < -conn.cap) newFlow = -conn.cap;

                        const actualDelta = newFlow - currentFlow; // This will be negative

                        flows[conn.id] = newFlow;
                        regionA.balance -= actualDelta; // -(-delta) = +delta (A gains)
                        regionB.balance += actualDelta; // +(-delta) = -delta (B loses)
                    }
                }
            });
        }

        // 3. Final Sufficiency Calculation for Hubs
        const hubStatus = consumptionHubs.map(hub => {
            const rb = regionalBalance[hub.regionId];

            // Current Demand for this hub
            const currentDemand = hub.baseDemand * (0.5 + (gridLoad / 100));

            // Nuclear Coverage = Nuclear Generation / Demand
            // This shows what percentage of demand is covered by nuclear power specifically
            const nuclearCoverage = currentDemand > 0 ? rb.gen / currentDemand : 0;

            // Total Sufficiency = (All Generation + Balance) / Demand
            // This is used for grid stress calculations
            let sufficiency = currentDemand > 0 ? (currentDemand + rb.balance) / currentDemand : 1.0;
            if (sufficiency < 0) sufficiency = 0;

            return { ...hub, sufficiency, nuclearCoverage, currentDemand };
        });

        return { hubStatus, flows, capacityMap };

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
                    // Determine if this line connects to a plant with active reactors
                    const connectedActive = plants.some(p =>
                        getPlantActiveCount(p) > 0 && line.path.some(pt => Math.abs(pt[0] - p.lat) < 0.5 && Math.abs(pt[1] - p.lng) < 0.5)
                    );

                    // Check if it's an active interconnection
                    const rawFlow = line.interconnectionId ? gridState.flows[line.interconnectionId] : 0;
                    const flowAmount = Math.abs(rawFlow || 0);
                    const isInterconnectionActive = flowAmount > 10;

                    // Direction: rawFlow > 0 is Forward, < 0 is Reverse
                    const isReverse = (rawFlow || 0) < 0;

                    const isActive = connectedActive || isInterconnectionActive;

                    // Determine line color based on flow state
                    let lineColor = line.voltage === 'HVDC' ? '#f472b6' : '#60a5fa'; // Default: pink for HVDC, blue for AC
                    if (isInterconnectionActive) {
                        lineColor = '#e879f9'; // Purple for active interconnection
                    } else if (isHighLoad) {
                        lineColor = '#fca5a5'; // Light red for high load
                    }

                    return (
                        <React.Fragment key={line.id}>
                            <MovingPolyline
                                positions={line.path}
                                isActive={isActive}
                                isReverse={isReverse}
                                isHighLoad={isHighLoad || isInterconnectionActive}
                                voltage={line.voltage}
                                flowSpeed={flowSpeed}
                                baseColor={lineColor}
                            />
                            {/* Show flow percentage for interconnection lines */}
                            {isInterconnectionActive && line.interconnectionId && (
                                <CircleMarker
                                    center={line.path[Math.floor(line.path.length / 2)]}
                                    radius={0}
                                    pathOptions={{ opacity: 0 }}
                                >
                                    <Tooltip permanent direction="center" className="flow-tooltip" opacity={0.9}>
                                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#e879f9', textAlign: 'center' }}>
                                            {isReverse ? '◀' : '▶'} {Math.round((flowAmount / (gridState.capacityMap[line.interconnectionId] || 1)) * 100)}%
                                        </div>
                                    </Tooltip>
                                </CircleMarker>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Inject dynamic style for hub animations */}
                <style>{`
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
                    .flow-tooltip {
                        background-color: rgba(0,0,0,0.8) !important;
                        border: 1px solid #e879f9 !important;
                        color: #e879f9 !important;
                        font-weight: bold;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: monospace;
                        font-size: 9px;
                    }
                    .flow-tooltip .leaflet-tooltip-tip {
                        display: none;
                    }
                    .high-load-line {
                        filter: drop-shadow(0 0 4px rgba(248, 113, 113, 0.8));
                    }
                `}</style>

                {/* Plants */}
                {plants.map((plant) => (
                    <CircleMarker
                        key={plant.id}
                        center={[plant.lat, plant.lng]}
                        pathOptions={{
                            color: getStatusColor(getPlantStatus(plant)),
                            fillColor: getStatusColor(getPlantStatus(plant)),
                            fillOpacity: 0.8,
                            weight: 2,
                            className: `station-marker ${getPlantActiveCount(plant) > 0 ? 'marker-active' : ''} ${highlightPlants && (!selectedPlant || plant.id !== selectedPlant.id) ? 'tutorial-highlight' : ''}`
                        }}
                        radius={Math.sqrt(getPlantCapacity(plant)) / 2}
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
                {gridState.hubStatus.map((hub) => {
                    // Nuclear coverage percentage (from calculated value, capped at 100% for display)
                    const nuclearPct = Math.min(hub.nuclearCoverage * 100, 100);
                    const coverageColor = nuclearPct >= 30 ? '#4ade80' : nuclearPct >= 10 ? '#facc15' : '#f87171';

                    return (
                        <CircleMarker
                            key={hub.id}
                            center={[hub.lat, hub.lng]}
                            pathOptions={{
                                color: coverageColor,
                                fillColor: 'transparent',
                                weight: 3,
                                className: nuclearPct < 10 ? 'hub-marker insufficient' : 'hub-marker sufficient'
                            }}
                            radius={10 + (hub.baseDemand / 5000)}
                        >
                            <Tooltip direction="center" permanent className="hub-label-tooltip" opacity={0.8}>
                                <div style={{ textAlign: 'center', fontSize: '10px' }}>
                                    <div style={{ marginBottom: '2px' }}>{hub.name}</div>
                                    <div style={{
                                        fontSize: '1.1em',
                                        fontWeight: 'bold',
                                        color: coverageColor
                                    }}>
                                        ⚛️ {nuclearPct.toFixed(0)}%
                                    </div>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

            </MapContainer>

            {/* Info Overlay */}
            {/* Info Overlay */}
            <div className="overlay-ui">
                <h1>Japan Nuclear Grid <span style={{ fontSize: '0.6em', background: '#3b82f6', padding: '2px 6px', borderRadius: '4px', color: 'white', verticalAlign: 'middle' }}>V3.1</span></h1>
                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '16px' }}>
                    Live visualization of nuclear power capacity and transmission topology.
                </div>

                {currentSelectedPlant ? (
                    <div className="plant-card">
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{currentSelectedPlant.name}</h2>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className={`status-badge ${getStatusClass(getPlantStatus(currentSelectedPlant))}`}>
                                {getPlantActiveCount(currentSelectedPlant)}/{currentSelectedPlant.reactors.length}基 稼働中
                            </div>
                            <button
                                onClick={() => onTogglePlant(currentSelectedPlant.id)}
                                style={{
                                    background: getPlantActiveCount(currentSelectedPlant) > 0 ? 'rgba(248, 113, 113, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                    color: getPlantActiveCount(currentSelectedPlant) > 0 ? '#f87171' : '#4ade80',
                                    border: getPlantActiveCount(currentSelectedPlant) > 0 ? '1px solid #f87171' : '1px solid #4ade80',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {getPlantActiveCount(currentSelectedPlant) > 0 ? '全停止' : '全起動'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.8rem' }}>Operator</div>
                                <div>{currentSelectedPlant.operator}</div>
                            </div>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.8rem' }}>Capacity</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{getPlantActiveCapacity(currentSelectedPlant).toLocaleString()} / {getPlantCapacity(currentSelectedPlant).toLocaleString()} MW</div>
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
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>Nuclear Coverage</div>
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ background: '#4ade80' }}></div>
                        <span>≥30% (High)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ background: '#facc15' }}></div>
                        <span>10-30% (Medium)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ background: '#f87171' }}></div>
                        <span>&lt;10% (Low)</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic', color: '#888' }}>
                        ⚛️ = % of demand covered by nuclear
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MapVisualizer;
