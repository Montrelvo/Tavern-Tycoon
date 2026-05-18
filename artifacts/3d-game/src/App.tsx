import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, Component, type ReactNode, useEffect, useRef, useState } from 'react';
import { TavernScene } from './components/TavernScene';
import { HUD } from './components/HUD';
import { ManagementScene } from './components/ManagementScene';
import { OwnerRoomScene } from './components/OwnerRoomScene';
import { RecruitsScene } from './components/RecruitsScene';
import { useGameState } from './game/useGameState';
import { useTavernAmbience } from './game/useTavernAmbience';
import * as THREE from 'three';
import './index.css';

type OrbitControlsRef = {
  target: THREE.Vector3;
  update: () => void;
};

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

type ActiveScene = 'tavern' | 'management' | 'recruits';

const SCENE_LABELS: Record<ActiveScene, string> = {
  tavern: '⚔ Tavern',
  management: '🏗 Manage',
  recruits: '🧙 Recruits',
};

/** Adjusts the camera position when switching between tavern and owner's room */
function SceneCameraController({
  activeScene,
  orbitRef,
}: {
  activeScene: ActiveScene;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orbitRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const perspCamera = camera as THREE.PerspectiveCamera;

  useEffect(() => {
    if (activeScene === 'tavern') {
      camera.position.set(0, 14, 12);
      perspCamera.fov = 45;
      perspCamera.updateProjectionMatrix();
      const ctrl = orbitRef.current;
      if (ctrl) {
        ctrl.target.set(0, 0, 0);
        ctrl.update();
      }
    } else if (activeScene === 'management') {
      camera.position.set(-1.5, 2.8, 4.5);
      camera.lookAt(0.5, 1.0, -2.0);
      perspCamera.fov = 50;
      perspCamera.updateProjectionMatrix();
    }
  }, [activeScene, camera, perspCamera, orbitRef]);

  return null;
}

function SceneNav({ activeScene, onSetScene, upgradePointAlert }: {
  activeScene: ActiveScene;
  onSetScene: (s: ActiveScene) => void;
  upgradePointAlert: boolean;
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
      {(['tavern', 'management', 'recruits'] as ActiveScene[]).map(scene => {
        const active = activeScene === scene;
        const hasAlert = scene === 'recruits' && upgradePointAlert && !active;
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
              position: 'relative',
            }}
          >
            {SCENE_LABELS[scene]}
            {hasAlert && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                width: 8, height: 8, borderRadius: '50%',
                background: '#f1c40f', border: '1px solid #1a0d00',
                boxShadow: '0 0 4px #f1c40f',
              }} />
            )}
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
    rejectQuest,
    rejectBounty,
    markAdventurerArrived,
    newGame,
    hireUpgrade,
    sellMaterials,
    spendUpgradePoint,
    prestigeAdventurer,
    acceptBounty,
    abandonBounty,
    craftGear,
  } = useGameState();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitRef = useRef<any>(null);
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

  const recruited = state.adventurers.filter(
    a => a.status === 'recruited' || a.status === 'on-quest'
  );
  const rosterCount = recruited.length;
  const upgradePointAlert = recruited.some(a => (a.upgradePoints ?? 0) > 0);

  const showCanvas = activeScene === 'tavern' || activeScene === 'management';

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: '#0d0700', overflow: 'hidden' }}
      onClick={handleFirstInteraction}
    >
      <SceneNav
        activeScene={activeScene}
        onSetScene={setActiveScene}
        upgradePointAlert={upgradePointAlert}
      />

      {/*
        Single shared Canvas for both Tavern and Owner's Room scenes.
        Kept always mounted (display:block/none) when on a 3D scene so the
        WebGL context is never torn down between tavern ↔ management transitions.
        Both 3D scenes live inside this one Canvas, toggled via Three.js `visible`.
      */}
      <div style={{ display: showCanvas ? 'block' : 'none' }}>
        <WebGLErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Canvas
              shadows
              camera={{ position: [0, 14, 12], fov: 45, near: 0.1, far: 100 }}
              style={{ width: '100vw', height: '100vh' }}
              gl={{ antialias: true }}
              onClick={() => {
                if (activeScene === 'tavern' && state.selectedAdventurerId) {
                  selectAdventurer(null);
                }
              }}
            >
              <SceneCameraController activeScene={activeScene} orbitRef={orbitRef} />

              <OrbitControls
                ref={orbitRef}
                target={[0, 0, 0]}
                maxPolarAngle={Math.PI / 2.4}
                minPolarAngle={Math.PI / 6}
                minDistance={8}
                maxDistance={22}
                enablePan={false}
                enabled={activeScene === 'tavern'}
                makeDefault
              />

              {/* Tavern scene — always mounted, visible only when active */}
              <group visible={activeScene === 'tavern'}>
                <TavernScene
                  adventurers={state.adventurers}
                  selectedAdventurerId={state.selectedAdventurerId}
                  onSelectAdventurer={selectAdventurer}
                  onAdventurerArrived={markAdventurerArrived}
                  upgrades={state.upgrades}
                />
              </group>

              {/* Owner's Room scene — always mounted, visible only when management is active */}
              <group visible={activeScene === 'management'}>
                <OwnerRoomScene />
              </group>
            </Canvas>
          </Suspense>
        </WebGLErrorBoundary>

        {/* Tavern HUD overlay */}
        {activeScene === 'tavern' && (
          <HUD
            gold={state.gold}
            adventurers={state.adventurers}
            quests={state.quests}
            bounties={state.bounties ?? []}
            gameLog={state.gameLog}
            gamePhase={state.gamePhase}
            selectedAdventurerId={state.selectedAdventurerId}
            showQuestBoard={state.showQuestBoard}
            upgrades={state.upgrades}
            questsCompleted={state.questsCompleted}
            tavernPrestige={state.tavernPrestige}
            lastDropNotification={state.lastDropNotification ?? null}
            onRecruit={recruitAdventurer}
            onSelectAdventurer={selectAdventurer}
            onToggleQuestBoard={toggleQuestBoard}
            onDispatchQuest={dispatchQuest}
            onRejectQuest={rejectQuest}
            onAcceptBounty={acceptBounty}
            onAbandonBounty={abandonBounty}
            onRejectBounty={rejectBounty}
            onPlaySound={playSound}
            onNewGame={newGame}
          />
        )}

        {/* Management UI overlaid as HUD on top of the Owner's Room 3D scene */}
        {activeScene === 'management' && (
          <ManagementScene
            gold={state.gold}
            upgrades={state.upgrades}
            materials={state.materials}
            rosterCount={rosterCount}
            tavernPrestige={state.tavernPrestige}
            onHireUpgrade={hireUpgrade}
            onSellMaterials={sellMaterials}
            onCraftGear={craftGear}
            recruitedCount={recruited.length}
            recruitedAdventurers={recruited}
          />
        )}
      </div>

      {/* Recruits scene — pure 2D, no canvas needed */}
      {activeScene === 'recruits' && (
        <RecruitsScene
          adventurers={state.adventurers}
          gold={state.gold}
          onSpendUpgradePoint={spendUpgradePoint}
          onPrestigeAdventurer={prestigeAdventurer}
        />
      )}
    </div>
  );
}
