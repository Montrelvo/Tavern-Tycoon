import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Adventurer } from '../game/types';
import { AdventurerBody, getAdventurerColor } from './AdventurerBody';

function IdleAdventurer({ adventurer }: { adventurer: Adventurer }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    groupRef.current.rotation.y = timeRef.current * 0.6;
    groupRef.current.position.y = Math.sin(timeRef.current * 2.2) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <AdventurerBody adventurer={adventurer} animationState="idle" />
    </group>
  );
}

export function AdventurerModelView({ adventurer, size = 160 }: { adventurer: Adventurer; size?: number }) {
  const color = getAdventurerColor(adventurer);

  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: 10,
      background: `radial-gradient(circle at 50% 35%, ${color}1a 0%, #110805 70%, #080300 100%)`,
      border: `1px solid ${color}55`,
      boxShadow: `inset 0 0 20px ${color}22, 0 0 12px ${color}22`,
      overflow: 'hidden',
    }}>
      <Canvas
        camera={{ position: [0, 0.4, 2.2], fov: 35 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 4, 2.5]} intensity={1.1} />
        <directionalLight position={[-2, 1.5, -1.5]} intensity={0.35} color={color} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <circleGeometry args={[0.7, 32]} />
          <meshStandardMaterial color={color} transparent opacity={0.18} />
        </mesh>
        <IdleAdventurer adventurer={adventurer} />
      </Canvas>
    </div>
  );
}
