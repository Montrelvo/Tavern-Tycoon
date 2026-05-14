import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
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

const STAR_DATA = Array.from({ length: 28 }, (_, i) => ({
  x: (Math.sin(i * 2.371) * 6.5),
  y: (Math.cos(i * 1.733) * 2.8 + 1.5),
  size: 0.022 + (i % 5) * 0.008,
}));

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
      {/* Back wall */}
      <mesh position={[0, 1.5, -7]} castShadow receiveShadow>
        <boxGeometry args={[14, 3, 0.4]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      {/* Front wall — left panel (x=-7 to x=-1.1, leaving a ~2.2-unit doorway) */}
      <mesh position={[-4.05, 1.5, 7]} castShadow receiveShadow>
        <boxGeometry args={[5.9, 3, 0.4]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      {/* Front wall — right panel (x=1.1 to x=7) */}
      <mesh position={[4.05, 1.5, 7]} castShadow receiveShadow>
        <boxGeometry args={[5.9, 3, 0.4]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      {/* Doorway lintel (bridges the gap above the entrance) */}
      <mesh position={[0, 2.65, 7]} castShadow>
        <boxGeometry args={[2.2, 0.7, 0.4]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.9} />
      </mesh>
      {/* Left side wall */}
      <mesh position={[-7, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3, 14]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
      </mesh>
      {/* Right side wall */}
      <mesh position={[7, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3, 14]} />
        <meshStandardMaterial color="#3d2410" roughness={0.95} />
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

function AnimatedCandles() {
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    lightRefs.current.forEach((light, i) => {
      if (!light) return;
      const phase = i * 1.37;
      const pulse =
        1.2 +
        Math.sin(t * 4.1 + phase) * 0.25 +
        Math.sin(t * 11.3 + phase * 2) * 0.1 +
        Math.sin(t * 7.7 + phase * 0.7) * 0.08;
      light.intensity = Math.max(0.4, pulse);
    });
  });

  return (
    <group>
      {CANDLE_POSITIONS.map((pos, i) => (
        <group key={i} position={pos}>
          <pointLight
            ref={(el) => { lightRefs.current[i] = el; }}
            intensity={1.2}
            distance={5}
            color="#ff9944"
            castShadow={i === 0}
          />
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

function AnimatedFireplace() {
  const lightRef = useRef<THREE.PointLight>(null);
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);
  const ember1Ref = useRef<THREE.Mesh>(null);
  const ember2Ref = useRef<THREE.Mesh>(null);
  const ember3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (lightRef.current) {
      const flicker =
        3.2 +
        Math.sin(t * 7.3) * 0.9 +
        Math.sin(t * 13.7) * 0.5 +
        Math.sin(t * 3.1) * 0.7 +
        Math.sin(t * 19.1) * 0.2;
      lightRef.current.intensity = Math.max(1.2, flicker);
    }

    if (flame1Ref.current) {
      flame1Ref.current.scale.x = 1 + Math.sin(t * 8.1) * 0.14;
      flame1Ref.current.scale.y = 1 + Math.sin(t * 6.3) * 0.18;
      (flame1Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        2 + Math.sin(t * 9.7) * 0.6;
    }

    if (flame2Ref.current) {
      flame2Ref.current.scale.x = 1 + Math.sin(t * 9.3 + 1.0) * 0.12;
      flame2Ref.current.scale.y = 1 + Math.sin(t * 7.1 + 0.5) * 0.15;
      flame2Ref.current.position.z = Math.sin(t * 4.9) * 0.07;
    }

    const embers = [ember1Ref, ember2Ref, ember3Ref];
    embers.forEach((ref, i) => {
      if (!ref.current) return;
      const phase = i * 2.1;
      const cycle = ((t * 0.7 + phase) % 2.4) / 2.4;
      ref.current.position.y = -0.3 + cycle * 0.7;
      ref.current.position.x = 0.15 + Math.sin(t * 3.1 + phase) * 0.1;
      ref.current.position.z = Math.cos(t * 2.7 + phase) * 0.15;
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = cycle < 0.6 ? cycle / 0.6 : 1 - (cycle - 0.6) / 0.4;
    });
  });

  return (
    <group position={[-6.6, 0.8, 0]}>
      <mesh>
        <boxGeometry args={[0.2, 1.4, 2.0]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.95} />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0.4, 0.1, 0]}
        intensity={3}
        distance={9}
        color="#ff6200"
        castShadow
        shadow-mapSize={[512, 512]}
      />

      <mesh ref={flame1Ref} position={[0.15, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.65, 1.3]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff2200"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={flame2Ref} position={[0.15, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 0.75]} />
        <meshStandardMaterial
          color="#ffbb00"
          emissive="#ffdd00"
          emissiveIntensity={3}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0.15, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.9]} />
        <meshStandardMaterial
          color="#cc2200"
          emissive="#991100"
          emissiveIntensity={1.5}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {[ember1Ref, ember2Ref, ember3Ref].map((ref, i) => (
        <mesh key={i} ref={ref} position={[0.15, -0.3 + i * 0.05, i * 0.08 - 0.08]}>
          <sphereGeometry args={[0.022, 4, 4]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff5500"
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

const NIGHT_COLOR = new THREE.Color(0x050818);
const DAWN_COLOR = new THREE.Color(0xff6b20);
const DAY_COLOR = new THREE.Color(0x3a7fc1);
const DUSK_COLOR = new THREE.Color(0xe05520);

function DayNightSky() {
  const skyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const sunRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const starGroupRef = useRef<THREE.Group>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const tmpColor = new THREE.Color();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cycle = (Math.sin(t * 0.045) + 1) / 2;

    if (skyMatRef.current) {
      if (cycle < 0.25) {
        tmpColor.copy(NIGHT_COLOR).lerp(DAWN_COLOR, cycle / 0.25);
      } else if (cycle < 0.45) {
        tmpColor.copy(DAWN_COLOR).lerp(DAY_COLOR, (cycle - 0.25) / 0.2);
      } else if (cycle < 0.75) {
        tmpColor.copy(DAY_COLOR).lerp(DUSK_COLOR, (cycle - 0.45) / 0.3);
      } else {
        tmpColor.copy(DUSK_COLOR).lerp(NIGHT_COLOR, (cycle - 0.75) / 0.25);
      }
      skyMatRef.current.color.copy(tmpColor);
    }

    if (sunRef.current) {
      const sunOpacity = Math.max(0, Math.sin(cycle * Math.PI));
      (sunRef.current.material as THREE.MeshBasicMaterial).opacity = sunOpacity * 0.95;
      sunRef.current.position.y = 1.2 + Math.sin(cycle * Math.PI) * 1.8;
      sunRef.current.position.x = Math.cos(cycle * Math.PI) * 3.5;
    }

    if (moonRef.current) {
      const moonOpacity = Math.max(0, Math.cos(cycle * Math.PI) * 0.9 + 0.1);
      (moonRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, moonOpacity);
      moonRef.current.position.y = 1.2 + Math.sin((cycle + 0.5) * Math.PI) * 1.8;
      moonRef.current.position.x = Math.cos((cycle + 0.5) * Math.PI) * 3.5;
    }

    if (starGroupRef.current) {
      const starOpacity = Math.max(0, 1 - cycle * 3.5);
      starGroupRef.current.children.forEach((star) => {
        ((star as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = starOpacity;
      });
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.12 + 0.33 * cycle;
      tmpColor.copy(new THREE.Color(0x1a1040)).lerp(new THREE.Color(0xffd080), cycle);
      ambientRef.current.color.copy(tmpColor);
    }

    if (dirLightRef.current) {
      dirLightRef.current.intensity = 0.15 + 0.85 * cycle;
      const dirNight = new THREE.Color(0x304070);
      const dirDay = new THREE.Color(0xffd080);
      dirLightRef.current.color.copy(dirNight).lerp(dirDay, cycle);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.35} color="#8B6914" />
      <directionalLight
        ref={dirLightRef}
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

      {/* Sky backdrop — low enough to be visible through the doorway opening */}
      <group position={[0, 2.5, 8.5]}>
        <mesh>
          <planeGeometry args={[16, 8]} />
          <meshBasicMaterial ref={skyMatRef} color="#050818" side={THREE.DoubleSide} />
        </mesh>

        <mesh ref={sunRef} position={[0, 1.2, 0.05]}>
          <circleGeometry args={[0.55, 20]} />
          <meshBasicMaterial color="#fffacc" transparent opacity={0} />
        </mesh>

        <mesh ref={moonRef} position={[0, 1.2, 0.05]}>
          <circleGeometry args={[0.32, 16]} />
          <meshBasicMaterial color="#ddeeff" transparent opacity={1} />
        </mesh>

        <group ref={starGroupRef}>
          {STAR_DATA.map((s, i) => (
            <mesh key={i} position={[s.x, s.y, 0.04]}>
              <circleGeometry args={[s.size, 4]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      </group>
    </>
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
      <DayNightSky />
      <TavernFloor />
      <TavernWalls />
      <BarCounter />
      <Tables />
      <WaitingArea />
      <QuestBoardMesh />
      <AnimatedCandles />
      <AnimatedFireplace />
      {adventurers.filter(adv => adv.status !== 'on-quest').map((adv) => (
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
