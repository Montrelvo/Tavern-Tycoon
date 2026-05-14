import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, Component, type ReactNode, useEffect, useRef, useState } from 'react';
import { TavernScene } from './components/TavernScene';
import { HUD } from './components/HUD';
import { ManagementScene } from './components/ManagementScene';
import { useGameState } from './game/useGameState';
import { useTavernAmbience } from './game/useTavernAmbience';
import './index.css';

class WebGLErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#0d0700',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'serif', color: '#e8d5a0', textAlign: 'center', padding: 40,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F3FA;</div>
          <h2 style={{ color: '#ffd700', margin: '0 0 12px' }}>WebGL Required</h2>
          <p style={{ color: '#aaa', maxWidth: 400 }}>
            This game requires WebGL, which doesn't appear to be supported in your current environment.
            Please try opening this in a modern web browser.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0d0700',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'serif', color: '#e8d5a0',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F3FA;</div>
      <div style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>The Wanderer's Rest</div>
      <div style={{ fontSize: 14, color: '#888' }}>Lighting the hearth...</div>
    </div>
  );
}

type ActiveScene = 'tavern' | 'management';

function SceneNav({ activeScene, onSetScene }: {
  activeScene: ActiveScene;
  onSetScene: (s: ActiveScene) => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      background: 'rgba(8,4,1,0.97)',
      borderBottom: '1px solid #3d2410',
      zIndex: 300,
      fontFamily: 'serif',
    }}>
      <span style={{
        position: 'absolute', left: 14,
        color: '#4a3a28', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
        pointerEvents: 'none',
      }}>
        The Wanderer's Rest
      </span>
      {(['tavern', 'management'] as ActiveScene[]).map(scene => {
        const active = activeScene === scene;
        const label = scene === 'tavern' ? '⚔ Tavern' : '🏗 Manage';
        return (
          <button
            key={scene}
            onClick={() => onSetScene(scene)}
            style={{
              background: active
                ? 'linear-gradient(180deg, #8a5422 0%, #5c3315 100%)'
                : 'rgba(30,15,5,0.8)',
              border: active ? '1px solid #a0631e' : '1px solid #3d2410',
              borderRadius: 6,
              color: active ? '#e8d5a0' : '#7a6a5a',
              fontFamily: 'serif',
              fontWeight: active ? 'bold' : 'normal',
              fontSize: 13,
              padding: '4px 18px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: 0.3,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [activeScene, setActiveScene] = useState<ActiveScene>('tavern');

  const {
    state,
    recruitAdventurer,
    selectAdventurer,
    toggleQuestBoard,
    dispatchQuest,
    refreshQuests,
    markAdventurerArrived,
    newGame,
    hireUpgrade,
    sellMaterials,
  } = useGameState();

  const { startAmbience, playSound } = useTavernAmbience();
  const ambienceStarted = useRef(false);

  const handleFirstInteraction = () => {
    if (!ambienceStarted.current) {
      ambienceStarted.current = true;
      startAmbience();
    }
  };

  const prevLogRef = useRef<string[]>([]);
  useEffect(() => {
    const prev = prevLogRef.current;
    const curr = state.gameLog;
    if (curr !== prev && curr.length > 0 && prev.length > 0) {
      const newest = curr[0];
      if (newest.includes('succeeded')) playSound('questComplete');
      else if (newest.includes('failed')) playSound('questFail');
    }
    prevLogRef.current = curr;
  }, [state.gameLog, playSound]);

  const rosterCount = state.adventurers.filter(
    a => a.status === 'recruited' || a.status === 'on-quest'
  ).length;

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: '#0d0700', overflow: 'hidden' }}
      onClick={handleFirstInteraction}
    >
      <SceneNav activeScene={activeScene} onSetScene={setActiveScene} />

      {/* Tavern 3D scene — always mounted to preserve WebGL state, hidden when management is active */}
      <div style={{ display: activeScene === 'tavern' ? 'block' : 'none' }}>
        <WebGLErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Canvas
              shadows
              camera={{ position: [0, 14, 12], fov: 45, near: 0.1, far: 100 }}
              style={{ width: '100vw', height: '100vh' }}
              gl={{ antialias: true }}
              onClick={() => {
                if (state.selectedAdventurerId) selectAdventurer(null);
              }}
            >
              <OrbitControls
                target={[0, 0, 0]}
                maxPolarAngle={Math.PI / 2.4}
                minPolarAngle={Math.PI / 6}
                minDistance={8}
                maxDistance={22}
                enablePan={false}
                makeDefault
              />
              <TavernScene
                adventurers={state.adventurers}
                selectedAdventurerId={state.selectedAdventurerId}
                onSelectAdventurer={selectAdventurer}
                onAdventurerArrived={markAdventurerArrived}
                upgrades={state.upgrades}
              />
            </Canvas>
          </Suspense>
        </WebGLErrorBoundary>

        <HUD
          gold={state.gold}
          adventurers={state.adventurers}
          quests={state.quests}
          gameLog={state.gameLog}
          gamePhase={state.gamePhase}
          selectedAdventurerId={state.selectedAdventurerId}
          showQuestBoard={state.showQuestBoard}
          upgrades={state.upgrades}
          onRecruit={recruitAdventurer}
          onSelectAdventurer={selectAdventurer}
          onToggleQuestBoard={toggleQuestBoard}
          onDispatchQuest={dispatchQuest}
          onRefreshQuests={refreshQuests}
          onPlaySound={playSound}
          onNewGame={newGame}
        />
      </div>

      {/* Management scene */}
      {activeScene === 'management' && (
        <ManagementScene
          gold={state.gold}
          upgrades={state.upgrades}
          materials={state.materials}
          rosterCount={rosterCount}
          onHireUpgrade={hireUpgrade}
          onSellMaterials={sellMaterials}
        />
      )}
    </div>
  );
}
