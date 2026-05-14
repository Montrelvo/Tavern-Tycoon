import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, Component, type ReactNode, useEffect, useRef } from 'react';
import { TavernScene } from './components/TavernScene';
import { HUD } from './components/HUD';
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

export default function App() {
  const {
    state,
    recruitAdventurer,
    selectAdventurer,
    toggleQuestBoard,
    dispatchQuest,
    refreshQuests,
    markAdventurerArrived,
    newGame,
  } = useGameState();

  const { startAmbience, playSound } = useTavernAmbience();
  const ambienceStarted = useRef(false);

  const handleFirstInteraction = () => {
    if (!ambienceStarted.current) {
      ambienceStarted.current = true;
      startAmbience();
    }
  };

  // Trigger sound on quest resolution by watching the log
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

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0d0700', overflow: 'hidden' }}
      onClick={handleFirstInteraction}
    >
      <WebGLErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          shadows
          camera={{
            position: [0, 14, 12],
            fov: 45,
            near: 0.1,
            far: 100,
          }}
          style={{ width: '100%', height: '100%' }}
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
        onRecruit={recruitAdventurer}
        onSelectAdventurer={selectAdventurer}
        onToggleQuestBoard={toggleQuestBoard}
        onDispatchQuest={dispatchQuest}
        onRefreshQuests={refreshQuests}
        onPlaySound={playSound}
        onNewGame={newGame}
      />

      {/* Title overlay */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'serif', pointerEvents: 'none', zIndex: 50,
        textAlign: 'center', padding: '6px 20px',
      }}>
        <div style={{ fontSize: 13, color: '#7a6a5a', letterSpacing: 2 }}>THE WANDERER'S REST</div>
      </div>
    </div>
  );
}
