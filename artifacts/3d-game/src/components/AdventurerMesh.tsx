import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Adventurer } from '../game/types';
import { CLASS_COLORS } from '../game/constants';

interface AdventurerMeshProps {
  adventurer: Adventurer;
  isSelected: boolean;
  onClick: () => void;
  onArrived: (position: [number, number, number]) => void;
}

const MOVE_SPEED = 3.5;
const BOB_SPEED = 2.5;
const BOB_AMOUNT = 0.08;

export function AdventurerMesh({ adventurer, isSelected, onClick, onArrived }: AdventurerMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const arrivedRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  const color = CLASS_COLORS[adventurer.class];
  const target = adventurer.targetPosition;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const pos = groupRef.current.position;
    const tx = target[0];
    const tz = target[2];
    const dx = tx - pos.x;
    const dz = tz - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.05) {
      arrivedRef.current = false;
      const speed = Math.min(MOVE_SPEED * delta, dist);
      pos.x += (dx / dist) * speed;
      pos.z += (dz / dist) * speed;
      // Face direction of movement
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    } else {
      pos.x = tx;
      pos.z = tz;
      if (!arrivedRef.current) {
        arrivedRef.current = true;
        onArrived([tx, target[1], tz]);
      }
    }

    // Bob up and down
    timeRef.current += delta * BOB_SPEED;
    pos.y = 0.5 + Math.sin(timeRef.current) * BOB_AMOUNT;
  });

  return (
    <group
      ref={groupRef}
      position={adventurer.position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Body */}
      <mesh ref={bodyRef} castShadow>
        <boxGeometry args={[0.42, 0.9, 0.42]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected || hovered ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
          roughness={0.6}
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Selection ring */}
      {(isSelected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.44, 0]}>
          <ringGeometry args={[0.4, 0.55, 16]} />
          <meshStandardMaterial color={isSelected ? '#ffffff' : '#aaaaaa'} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Class indicator (tiny colored gem on head) */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
