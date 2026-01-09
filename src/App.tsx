import { useState } from 'react';
import MapVisualizer from './components/MapVisualizer';
import ControlPanel from './components/ControlPanel';
import StatisticsBoard from './components/StatisticsBoard';
import { plants as initialPlants, type Plant } from './data/plants';
import './dashboard.css';

function App() {
  const [plants, setPlants] = useState<Plant[]>(initialPlants);
  const [gridLoad, setGridLoad] = useState<number>(50); // %

  const handleTogglePlant = (id: string) => {
    setPlants(currentPlants =>
      currentPlants.map(p => {
        if (p.id === id) {
          // Toggle logic: If Active -> Suspended, If Suspended -> Active
          // For other statuses (Construction/Review), allow forcing to Active for simulation fun?
          // Let's stick to simple Active <-> Suspended for simulation.
          const newStatus = p.status === 'Active' ? 'Suspended' : 'Active';
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  const handleSetAllActive = () => {
    setPlants(currentPlants =>
      currentPlants.map(p => ({ ...p, status: 'Active' }))
    );
  };

  const handleReset = () => {
    setPlants(initialPlants);
    setGridLoad(50);
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <StatisticsBoard plants={plants} gridLoad={gridLoad} />
        <ControlPanel
          plants={plants}
          onTogglePlant={handleTogglePlant}
          gridLoad={gridLoad}
          onSetAllActive={handleSetAllActive}
          onReset={handleReset}
        />
      </div>

      <div className="main-view">
        <MapVisualizer plants={plants} gridLoad={gridLoad} onTogglePlant={handleTogglePlant} />
      </div>
    </div>
  );
}

export default App;
