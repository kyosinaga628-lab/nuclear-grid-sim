import { useState } from 'react';
import MapVisualizer from './components/MapVisualizer';
import ControlPanel from './components/ControlPanel';
import StatisticsBoard from './components/StatisticsBoard';
import HelpModal from './components/HelpModal';
import TutorialGuide from './components/TutorialGuide';
import { plants as initialPlants, type Plant, type ReactorStatus } from './data/plants';
import './dashboard.css';

function App() {
  const [plants, setPlants] = useState<Plant[]>(initialPlants);
  const [gridLoad, setGridLoad] = useState<number>(50); // %
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [hasRunTutorial, setHasRunTutorial] = useState<boolean>(false);

  const startTutorial = () => {
    setTutorialStep(1);
    setIsHelpOpen(false);
    setHasRunTutorial(true);
    setPlants(initialPlants);
    setGridLoad(50);
  };

  // Toggle individual reactor
  const handleToggleReactor = (plantId: string, reactorId: string) => {
    setPlants(currentPlants =>
      currentPlants.map(p => {
        if (p.id === plantId) {
          return {
            ...p,
            reactors: p.reactors.map(r => {
              if (r.id === reactorId) {
                const newStatus: ReactorStatus = r.status === 'Active' ? 'Suspended' : 'Active';
                return { ...r, status: newStatus };
              }
              return r;
            }),
          };
        }
        return p;
      })
    );

    if (tutorialStep === 1 || tutorialStep === 2) {
      setTutorialStep(prev => prev + 1);
    }
  };

  // Toggle all reactors in a plant
  const handleTogglePlant = (plantId: string) => {
    setPlants(currentPlants =>
      currentPlants.map(p => {
        if (p.id === plantId) {
          // If any reactor is active, suspend all. Otherwise, activate all operable ones.
          const hasActive = p.reactors.some(r => r.status === 'Active');
          const newStatus: ReactorStatus = hasActive ? 'Suspended' : 'Active';
          return {
            ...p,
            reactors: p.reactors.map(r => {
              // Only toggle reactors that are not under construction
              if (r.status !== 'Construction') {
                return { ...r, status: newStatus };
              }
              return r;
            }),
          };
        }
        return p;
      })
    );

    if (tutorialStep === 1 || tutorialStep === 2) {
      setTutorialStep(prev => prev + 1);
    }
  };

  const handleSetGridLoad = (val: number) => {
    setGridLoad(val);
    if (tutorialStep === 3 && val !== 50) setTutorialStep(4);
  };

  const handleSetAllActive = () => {
    setPlants(currentPlants =>
      currentPlants.map(p => ({
        ...p,
        reactors: p.reactors.map(r =>
          r.status !== 'Construction' ? { ...r, status: 'Active' as ReactorStatus } : r
        ),
      }))
    );
  };

  const handleReset = () => {
    setPlants(initialPlants);
    setGridLoad(50);
  };

  // Tutorial Content Logic
  let tutorialContent = null;
  if (tutorialStep > 0) {
    switch (tutorialStep) {
      case 1:
        tutorialContent = (
          <TutorialGuide
            step={0} totalSteps={5}
            title="1. 発電所を選択"
            description="地図上の円形の発電所マーカーをクリックしてください。詳細情報が表示されます。"
            onSkip={() => setTutorialStep(0)}
            onNext={() => { }}
            nextLabel=""
          />
        );
        break;
      case 2:
        tutorialContent = (
          <TutorialGuide
            step={1} totalSteps={5}
            title="2. 稼働状況を切替"
            description="もう一度クリックするか、詳細パネルのSTARTボタンを押して稼働状況を切り替えてみましょう。"
            onSkip={() => setTutorialStep(0)}
            onNext={() => setTutorialStep(3)}
            nextLabel="次へ"
          />
        );
        break;
      case 3:
        tutorialContent = (
          <TutorialGuide
            step={2} totalSteps={5}
            title="3. 電力需要を調整"
            description="左側のパネルにある「Grid Load」スライダーを動かして、電力需要を変化させてみましょう。"
            onSkip={() => setTutorialStep(0)}
            onNext={() => setTutorialStep(4)}
            nextLabel="次へ"
          />
        );
        break;
      case 4:
        tutorialContent = (
          <TutorialGuide
            step={3} totalSteps={5}
            title="4. リアルタイム統計"
            description="Grid Statisticsパネルで、CO2削減量や経済効果のリアルタイム計算を確認できます。"
            onSkip={() => setTutorialStep(0)}
            onNext={() => setTutorialStep(5)}
            nextLabel="次へ"
          />
        );
        break;
      case 5:
        tutorialContent = (
          <TutorialGuide
            step={4} totalSteps={5}
            title="完了！"
            description="基本操作は以上です。自由にシミュレーションを行って、電力融通の変化などを観察してください。"
            onSkip={() => setTutorialStep(0)}
            onNext={() => setTutorialStep(0)}
            nextLabel="終了"
          />
        );
        break;
    }
  }

  return (
    <div className="dashboard-layout">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {tutorialContent}

      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '8px', zIndex: 2000 }}>
        <div style={{ position: 'relative' }}>
          {tutorialStep === 0 && !isHelpOpen && !hasRunTutorial && (
            <div className="tutorial-bubble">チュートリアル</div>
          )}
          <button
            className={`help-button ${tutorialStep === 0 && !isHelpOpen && !hasRunTutorial ? 'help-button-attention' : ''}`}
            style={{ position: 'static' }}
            onClick={startTutorial}
            title="チュートリアルを開始"
          >
            🎓
          </button>
        </div>
        <button
          className="help-button"
          style={{ position: 'static' }}
          onClick={() => setIsHelpOpen(true)}
          title="使い方ガイド"
        >
          ?
        </button>
      </div>

      <div className="sidebar">
        <StatisticsBoard plants={plants} gridLoad={gridLoad} highlight={tutorialStep === 4} />
        <ControlPanel
          plants={plants}
          onTogglePlant={handleTogglePlant}
          onToggleReactor={handleToggleReactor}
          gridLoad={gridLoad}
          onSetGridLoad={handleSetGridLoad}
          onSetAllActive={handleSetAllActive}
          onReset={handleReset}
          highlightLoadControl={tutorialStep === 3}
        />
      </div>

      <div className="main-view">
        <MapVisualizer
          plants={plants}
          gridLoad={gridLoad}
          onTogglePlant={handleTogglePlant}
          highlightPlants={tutorialStep === 1}
        />
      </div>
    </div>
  );
}

export default App;
