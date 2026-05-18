import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Adventurer } from '../game/types';
import { AdventurerBody } from './AdventurerBody';

interface AdventurerMeshProps {
  adventurer: Adventurer;
  isSelected: boolean;
  onClick: () => void;
  onArrived: (position: [number, number, number]) => void;
}

const MOVE_SPEED = 3.5;
const BOB_SPEED = 2.5;
const BOB_AMOUNT = 0.08;
const ARRIVED_EPSILON = 0.05;

export function AdventurerMesh({ adventurer, isSelected, onClick, onArrived }: AdventurerMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const arrivedRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const timeRef = useRef(Math.random() * Math.PI * 2);
  const [isMoving, setIsMoving] = useState(false);

  const target = adventurer.targetPosition;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const pos = groupRef.current.position;
    const tx = target[0];
    const tz = target[2];
    const dx = tx - pos.x;
    const dz = tz - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > ARRIVED_EPSILON) {
      arrivedRef.current = false;
      if (!isMoving) setIsMoving(true);
      const speed = Math.min(MOVE_SPEED * delta, dist);
      pos.x += (dx / dist) * speed;
      pos.z += (dz / dist) * speed;
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    } else {
      pos.x = tx;
      pos.z = tz;
      if (isMoving) setIsMoving(false);
      if (!arrivedRef.current) {
        arrivedRef.current = true;
        onArrived([tx, target[1], tz]);
      }
    }

    timeRef.current += delta * BOB_SPEED;
    pos.y = 0.5 + Math.sin(timeRef.current) * BOB_AMOUNT;
  });

  return (
    <group
      ref={groupRef}
      position={adventurer.position}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <AdventurerBody
        adventurer={adventurer}
        isSelected={isSelected}
        isHovered={hovered}
        animationState={isMoving ? 'walking' : 'idle'}
      />
      {(isSelected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.44, 0]}>
          <ringGeometry args={[0.4, 0.55, 16]} />
          <meshStandardMaterial color={isSelected ? '#ffffff' : '#aaaaaa'} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}
