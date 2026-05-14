import type { Adventurer } from '../game/types';
import { AdventurerMesh } from './AdventurerMesh';

interface TavernSceneProps {
  adventurers: Adventurer[];
  selectedAdventurerId: string | null;
  onSelectAdventurer: (id: string | null) => void;
  onAdventurerArrived: (id: string, pos: [number, number, number]) => void;
}

const TABLE_DATA: { pos: [number, number, number] }[] = [
  { pos: [2, 0.45, 1] },
  { pos: [2, 0.45, -1.5] },
  { pos: [-1, 0.45, -0.5] },
];

const CHAIR_OFFSETS: [number, number][] = [[0.88, 0], [-0.88, 0], [0, 0.88], [0, -0.88]];

const CANDLE_POSITIONS: [number, number, number][] = [
  [-6.2, 1.2, -4], [-6.2, 1.2, 0], [-6.2, 1.2, 4],
  [6.2, 1.2, -4], [6.2, 1.2, 0], [6.2, 1.2, 4],
  [0, 1.2, -6.2],
];

const BOTTLE_OFFSETS = [-2, -1, 0, 1, 2, 3];
const BOTTLE_COLORS = ['#8B0000', '#006400', '#00008B', '#8B4513', '#4B0082', '#B8860B'];
const LEG_OFFSETS: [number, number][] = [[-0.14, -0.14], [-0.14, 0.14], [0.14, -0.14], [0.14, 0.14]];

function TavernFloor() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
    </mesh>
  );
}

function TavernWalls() {
  return (
    <group>
      <mesh position={[0, 1.5, -7]} castShadow receiveShadow>
        <boxGeometry args={[14, 3, 0.4]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      <mesh position={[-3.5, 1.5, 7]} castShadow receiveShadow>
        <boxGeometry args={[7, 3, 0.4]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      <mesh position={[3.5, 1.5, 7]} castShadow receiveShadow>
        <boxGeometry args={[7, 3, 0.4]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      <mesh position={[-7, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3, 14]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      <mesh position={[7, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3, 14]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.7, 7]} castShadow>
        <boxGeometry args={[2.2, 0.4, 0.4]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.9} />
      </mesh>
    </group>
  );
}

function BarCounter() {
  return (
    <group>
      <mesh position={[2, 0.85, -5.5]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.18, 1.2]} />
        <meshStandardMaterial color="#7a4a1e" roughness={0.7} />
      </mesh>
      <mesh position={[2, 0.42, -5.5]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.9, 1.0]} />
        <meshStandardMaterial color="#5c3315" roughness={0.85} />
      </mesh>
      <mesh position={[5.5, 0.5, -4.8]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 1.0, 8]} />
        <meshStandardMaterial color="#6b4020" roughness={0.9} />
      </mesh>
      <mesh position={[5.5, 1.0, -4.8]}>
        <cylinderGeometry args={[0.37, 0.37, 0.06, 8]} />
        <meshStandardMaterial color="#4a2a10" />
      </mesh>
      {BOTTLE_OFFSETS.map((x, i) => (
        <mesh key={i} position={[x, 1.25, -6.5]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 6]} />
          <meshStandardMaterial color={BOTTLE_COLORS[i]} roughness={0.3} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function Tables() {
  return (
    <group>
      {TABLE_DATA.map((t, i) => (
        <group key={i}>
          <mesh position={[t.pos[0], 0.75, t.pos[2]]} castShadow receiveShadow>
            <cylinderGeometry args={[0.6, 0.6, 0.08, 8]} />
            <meshStandardMaterial color="#7a4a1e" roughness={0.7} />
          </mesh>
          <mesh position={[t.pos[0], 0.37, t.pos[2]]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.76, 6]} />
            <meshStandardMaterial color="#5c3315" roughness={0.85} />
          </mesh>
          {CHAIR_OFFSETS.map(([ox, oz], j) => (
            <group key={j} position={[t.pos[0] + ox, 0, t.pos[2] + oz]} rotation={[0, Math.atan2(ox, oz), 0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.38, 0.06, 0.38]} />
                <meshStandardMaterial color="#6b4020" roughness={0.85} />
              </mesh>
              <mesh position={[0, 0.55, -0.16]} castShadow>
                <boxGeometry args={[0.38, 0.52, 0.06]} />
                <meshStandardMaterial color="#6b4020" roughness={0.85} />
              </mesh>
              {LEG_OFFSETS.map(([lx, lz], k) => (
                <mesh key={k} position={[lx, 0.13, lz]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.28, 4]} />
                  <meshStandardMaterial color="#4a2a10" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function WaitingArea() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-5.5, 0.01, 0]}>
        <planeGeometry args={[3.5, 10]} />
        <meshStandardMaterial color="#4a2e14" roughness={0.95} />
      </mesh>
      <mesh position={[-6.5, 2.2, -5.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.05]} />
        <meshStandardMaterial color="#7a4a1e" roughness={0.8} />
      </mesh>
    </group>
  );
}

function QuestBoardMesh() {
  return (
    <group position={[5.5, 1.6, -6.8]}>
      <mesh>
        <boxGeometry args={[2.2, 1.6, 0.08]} />
        <meshStandardMaterial color="#5c3315" roughness={0.9} />
      </mesh>
      {([-0.5, 0.5] as number[]).map((x) =>
        ([-0.3, 0.3] as number[]).map((y, j) => (
          <mesh key={`${x}-${j}`} position={[x, y, 0.05]}>
            <boxGeometry args={[0.55, 0.35, 0.01]} />
            <meshStandardMaterial color="#e8d5a0" roughness={0.95} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Candles() {
  return (
    <group>
      {CANDLE_POSITIONS.map((pos, i) => (
        <group key={i} position={pos}>
          <pointLight intensity={1.2} distance={5} color="#ff9944" castShadow={i === 0} />
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.25, 6]} />
            <meshStandardMaterial color="#f5e6c8" />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Fireplace() {
  return (
    <group position={[-6.6, 0.8, 0]}>
      <mesh>
        <boxGeometry args={[0.2, 1.4, 2.0]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.95} />
      </mesh>
      <pointLight position={[0.3, 0, 0]} intensity={3} distance={8} color="#ff6600" />
      <mesh position={[0.15, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 1.2]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export function TavernScene({
  adventurers,
  selectedAdventurerId,
  onSelectAdventurer,
  onAdventurerArrived,
}: TavernSceneProps) {
  return (
    <group onClick={(e) => { if (e.object === e.eventObject) onSelectAdventurer(null); }}>
      <ambientLight intensity={0.35} color="#8B6914" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        color="#ffd080"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <TavernFloor />
      <TavernWalls />
      <BarCounter />
      <Tables />
      <WaitingArea />
      <QuestBoardMesh />
      <Candles />
      <Fireplace />
      {adventurers.map((adv) => (
        <AdventurerMesh
          key={adv.id}
          adventurer={adv}
          isSelected={selectedAdventurerId === adv.id}
          onClick={() => onSelectAdventurer(adv.id)}
          onArrived={(pos) => onAdventurerArrived(adv.id, pos)}
        />
      ))}
    </group>
  );
}
