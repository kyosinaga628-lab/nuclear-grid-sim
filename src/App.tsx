import { useState } from 'react';
import MapVisualizer from './components/MapVisualizer';
import ControlPanel from './components/ControlPanel';
import StatisticsBoard from './components/StatisticsBoard';
import HelpModal from './components/HelpModal';
import { plants as initialPlants, type Plant } from './data/plants';
import './dashboard.css';

function App() {
  const [plants, setPlants] = useState<Plant[]>(initialPlants);
  const [gridLoad, setGridLoad] = useState<number>(50); // %
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const handleTogglePlant = (id: string) => {
    setPlants(currentPlants =>
      currentPlants.map(p => {
        if (p.id === id) {
          // Toggle logic: If Active -> Suspended, If Suspended -> Active
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
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <button
        className="help-button"
        onClick={() => setIsHelpOpen(true)}
        title="使い方ガイド"
      >
        ?
      </button>

      <div className="sidebar">
        <StatisticsBoard plants={plants} gridLoad={gridLoad} />
        <ControlPanel
          plants={plants}
          onTogglePlant={handleTogglePlant}
          gridLoad={gridLoad}
          onSetGridLoad={setGridLoad}
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
