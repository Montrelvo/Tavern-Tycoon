import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ROOM_LEG_OFFSETS: [number, number][] = [[-0.18, -0.32], [-0.18, 0.32], [0.18, -0.32], [0.18, 0.32]];

function RoomFloor() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#4a2e12" roughness={0.92} />
    </mesh>
  );
}

function RoomFloorboards() {
  return (
    <group>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -4 + i * 1.0]}>
          <planeGeometry args={[10, 0.06]} />
          <meshStandardMaterial color="#2e1a08" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function RoomWalls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.8, -5]} castShadow receiveShadow>
        <boxGeometry args={[10, 3.6, 0.3]} />
        <meshStandardMaterial color="#2e1a08" roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-5, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 3.6, 10]} />
        <meshStandardMaterial color="#2e1a08" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[5, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 3.6, 10]} />
        <meshStandardMaterial color="#2e1a08" roughness={0.95} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 3.6, 0]} receiveShadow>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="#1e1008" roughness={0.98} />
      </mesh>
      {/* Ceiling beams */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={i} position={[x, 3.48, 0]}>
          <boxGeometry args={[0.18, 0.18, 10]} />
          <meshStandardMaterial color="#1a0c04" roughness={0.9} />
        </mesh>
      ))}
      {/* Wall paneling — horizontal trim on back wall */}
      <mesh position={[0, 1.1, -4.84]}>
        <boxGeometry args={[9.8, 0.08, 0.04]} />
        <meshStandardMaterial color="#5c3315" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, -4.84]}>
        <boxGeometry args={[9.8, 0.06, 0.04]} />
        <meshStandardMaterial color="#5c3315" roughness={0.8} />
      </mesh>
    </group>
  );
}

function OwnerDesk() {
  return (
    <group position={[0.5, 0, -3.2]}>
      {/* Desk top */}
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.1, 1.1]} />
        <meshStandardMaterial color="#7a4a1e" roughness={0.65} />
      </mesh>
      {/* Desk body */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.82, 1.0]} />
        <meshStandardMaterial color="#5c3315" roughness={0.8} />
      </mesh>
      {/* Drawer pulls */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.38, 0.52]}>
          <cylinderGeometry args={[0.025, 0.025, 0.04, 6]} />
          <meshStandardMaterial color="#c8a84b" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}

      {/* Open ledger on desk */}
      <group position={[-0.2, 0.88, -0.1]} rotation={[0, 0.15, 0]}>
        {/* Book cover bottom */}
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.03, 0.7]} />
          <meshStandardMaterial color="#3a2010" roughness={0.9} />
        </mesh>
        {/* Left page */}
        <mesh position={[-0.14, 0.025, 0]}>
          <boxGeometry args={[0.27, 0.01, 0.64]} />
          <meshStandardMaterial color="#e8dfc8" roughness={0.95} />
        </mesh>
        {/* Right page */}
        <mesh position={[0.14, 0.025, 0]}>
          <boxGeometry args={[0.27, 0.01, 0.64]} />
          <meshStandardMaterial color="#e8dfc8" roughness={0.95} />
        </mesh>
        {/* Writing lines on pages */}
        {[-0.22, -0.12, -0.02, 0.08, 0.18].map((z, i) => (
          <mesh key={i} position={[-0.14, 0.032, z]}>
            <boxGeometry args={[0.22, 0.003, 0.012]} />
            <meshStandardMaterial color="#8a7a60" roughness={0.95} />
          </mesh>
        ))}
        {[-0.22, -0.12, -0.02, 0.08, 0.18].map((z, i) => (
          <mesh key={i} position={[0.14, 0.032, z]}>
            <boxGeometry args={[0.22, 0.003, 0.012]} />
            <meshStandardMaterial color="#8a7a60" roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Ink well */}
      <group position={[0.7, 0.87, -0.25]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.065, 0.1, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.03, 0.055, 0.02, 8]} />
          <meshStandardMaterial color="#0d0d1a" roughness={0.2} />
        </mesh>
      </group>

      {/* Quill */}
      <mesh position={[0.55, 0.91, -0.1]} rotation={[0, 0.3, -0.2]}>
        <boxGeometry args={[0.015, 0.28, 0.015]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.8} />
      </mesh>
      <mesh position={[0.53, 0.99, -0.08]} rotation={[0, 0.3, -0.28]}>
        <boxGeometry args={[0.055, 0.14, 0.008]} />
        <meshStandardMaterial color="#e8e0c8" roughness={0.75} />
      </mesh>

      {/* Small rolled map */}
      <mesh position={[0.8, 0.895, 0.1]} rotation={[0, 0.5, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.38, 8]} />
        <meshStandardMaterial color="#c8b47a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Bookshelf() {
  const BOOK_DATA = [
    { w: 0.06, h: 0.28, color: '#8B0000' },
    { w: 0.09, h: 0.24, color: '#4a2e60' },
    { w: 0.07, h: 0.30, color: '#1a4a20' },
    { w: 0.05, h: 0.22, color: '#7a5a10' },
    { w: 0.08, h: 0.27, color: '#6b2020' },
    { w: 0.06, h: 0.25, color: '#2a3a6a' },
    { w: 0.10, h: 0.29, color: '#4a2010' },
    { w: 0.07, h: 0.23, color: '#1a4050' },
    { w: 0.06, h: 0.26, color: '#5a3010' },
    { w: 0.08, h: 0.31, color: '#3a1a50' },
    { w: 0.09, h: 0.24, color: '#1a3a20' },
    { w: 0.05, h: 0.28, color: '#6a4a10' },
    { w: 0.07, h: 0.26, color: '#8B2020' },
    { w: 0.06, h: 0.22, color: '#3a2a70' },
    { w: 0.09, h: 0.30, color: '#2a4a18' },
  ];

  const SHELF_Y = [0.3, 0.72, 1.14, 1.56, 1.98];

  return (
    <group position={[-4.7, 0, -2.0]}>
      {/* Shelf frame */}
      <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.22, 2.5, 1.8]} />
        <meshStandardMaterial color="#3a2010" roughness={0.9} />
      </mesh>
      {/* Shelf boards */}
      {SHELF_Y.map((y, i) => (
        <mesh key={i} position={[0.04, y, 0]} castShadow>
          <boxGeometry args={[0.22, 0.04, 1.75]} />
          <meshStandardMaterial color="#5c3315" roughness={0.8} />
        </mesh>
      ))}

      {/* Books on shelves */}
      {SHELF_Y.slice(0, 4).map((shelfY, si) => {
        const booksOnShelf = BOOK_DATA.slice(si * 3, si * 3 + 4);
        let xOffset = -0.7;
        return booksOnShelf.map((book, bi) => {
          const xPos = xOffset + book.w / 2;
          xOffset += book.w + 0.012;
          const tilt = (bi % 3 === 2) ? 0.18 : 0;
          return (
            <mesh key={`${si}-${bi}`} position={[0.07, shelfY + 0.04 + book.h / 2, xPos]} rotation={[0, 0, tilt]} castShadow>
              <boxGeometry args={[0.08, book.h, book.w]} />
              <meshStandardMaterial color={book.color} roughness={0.85} />
            </mesh>
          );
        });
      })}

      {/* Small decorative items on top shelf */}
      <mesh position={[0.07, 2.08, 0.55]}>
        <cylinderGeometry args={[0.04, 0.05, 0.12, 6]} />
        <meshStandardMaterial color="#8B6914" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0.07, 2.08, -0.55]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#4a2a60" roughness={0.6} />
      </mesh>
    </group>
  );
}

function OwnerChair() {
  return (
    <group position={[0.5, 0, -1.8]} rotation={[0, Math.PI, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.54, 0.07, 0.54]} />
        <meshStandardMaterial color="#5a2e10" roughness={0.8} />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[0, 0.54, 0]}>
        <boxGeometry args={[0.48, 0.06, 0.48]} />
        <meshStandardMaterial color="#8B4513" roughness={0.75} />
      </mesh>
      {/* Chair back */}
      <mesh position={[0, 0.92, -0.24]} castShadow>
        <boxGeometry args={[0.54, 0.9, 0.07]} />
        <meshStandardMaterial color="#5a2e10" roughness={0.8} />
      </mesh>
      {/* Back cushion */}
      <mesh position={[0, 0.92, -0.2]}>
        <boxGeometry args={[0.46, 0.78, 0.05]} />
        <meshStandardMaterial color="#8B4513" roughness={0.75} />
      </mesh>
      {/* Back top rail */}
      <mesh position={[0, 1.38, -0.24]} castShadow>
        <boxGeometry args={[0.56, 0.1, 0.1]} />
        <meshStandardMaterial color="#4a2010" roughness={0.85} />
      </mesh>
      {/* Armrests */}
      {([-0.28, 0.28] as number[]).map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.75, -0.08]}>
            <boxGeometry args={[0.07, 0.5, 0.38]} />
            <meshStandardMaterial color="#4a2010" roughness={0.85} />
          </mesh>
          <mesh position={[x, 0.99, -0.08]}>
            <boxGeometry args={[0.08, 0.05, 0.4]} />
            <meshStandardMaterial color="#6a3a18" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Legs */}
      {ROOM_LEG_OFFSETS.map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.2, lz]}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 5]} />
          <meshStandardMaterial color="#3a1a08" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function WallFireplace() {
  const lightRef = useRef<THREE.PointLight>(null);
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      const flicker =
        2.5 +
        Math.sin(t * 6.8) * 0.7 +
        Math.sin(t * 12.3) * 0.4 +
        Math.sin(t * 3.5) * 0.5;
      lightRef.current.intensity = Math.max(1.0, flicker);
    }
    if (flame1Ref.current) {
      flame1Ref.current.scale.x = 1 + Math.sin(t * 7.5) * 0.14;
      flame1Ref.current.scale.y = 1 + Math.sin(t * 5.9) * 0.2;
      (flame1Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        2 + Math.sin(t * 9.1) * 0.6;
    }
    if (flame2Ref.current) {
      flame2Ref.current.scale.x = 1 + Math.sin(t * 8.7 + 1) * 0.12;
      flame2Ref.current.scale.y = 1 + Math.sin(t * 6.5 + 0.5) * 0.16;
    }
  });

  return (
    <group position={[3.8, 0, -4.7]}>
      {/* Fireplace surround */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.0, 0.35]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.95} />
      </mesh>
      {/* Firebox opening */}
      <mesh position={[0, 0.55, 0.1]}>
        <boxGeometry args={[0.9, 0.8, 0.3]} />
        <meshStandardMaterial color="#0d0704" roughness={0.98} />
      </mesh>
      {/* Mantelpiece */}
      <mesh position={[0, 2.06, 0.1]} castShadow>
        <boxGeometry args={[1.8, 0.1, 0.45]} />
        <meshStandardMaterial color="#5c3315" roughness={0.7} />
      </mesh>
      {/* Mantel supports */}
      {([-0.65, 0.65] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 1.55, 0.1]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.36]} />
          <meshStandardMaterial color="#3a1f08" roughness={0.9} />
        </mesh>
      ))}

      {/* Flame */}
      <mesh ref={flame1Ref} position={[0, 0.42, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.9]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff2200"
          emissiveIntensity={2}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={flame2Ref} position={[0, 0.52, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.5]} />
        <meshStandardMaterial
          color="#ffbb00"
          emissive="#ffdd00"
          emissiveIntensity={3}
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Firelight */}
      <pointLight
        ref={lightRef}
        position={[0, 0.6, 0.5]}
        intensity={2.5}
        distance={8}
        color="#ff6200"
        castShadow
        shadow-mapSize={[512, 512]}
      />

      {/* Mantel decorations */}
      {/* Small trophy cup */}
      <mesh position={[-0.5, 2.14, 0.22]}>
        <cylinderGeometry args={[0.04, 0.06, 0.14, 8]} />
        <meshStandardMaterial color="#c8a84b" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[-0.5, 2.22, 0.22]}>
        <cylinderGeometry args={[0.07, 0.04, 0.06, 8]} />
        <meshStandardMaterial color="#c8a84b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Candle on mantel */}
      <mesh position={[0.5, 2.14, 0.22]}>
        <cylinderGeometry args={[0.03, 0.03, 0.18, 6]} />
        <meshStandardMaterial color="#f5e6c8" />
      </mesh>
      <mesh position={[0.5, 2.24, 0.22]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0.5, 2.3, 0.4]} intensity={0.6} distance={2.5} color="#ff9944" />

      {/* Log on floor of firebox */}
      {([-0.15, 0.15] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0.12]} rotation={[0, i * 0.4, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.7, 7]} />
          <meshStandardMaterial color="#2a1408" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function DeskCandle() {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      const pulse =
        1.0 +
        Math.sin(t * 5.2) * 0.22 +
        Math.sin(t * 10.7) * 0.09 +
        Math.sin(t * 8.1) * 0.07;
      lightRef.current.intensity = Math.max(0.4, pulse);
    }
    if (flameRef.current) {
      flameRef.current.scale.x = 1 + Math.sin(t * 7.3) * 0.15;
      flameRef.current.scale.y = 1 + Math.sin(t * 5.8) * 0.18;
    }
  });

  return (
    <group position={[1.3, 0.88, -3.2]}>
      {/* Candle holder plate */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 8]} />
        <meshStandardMaterial color="#c8a84b" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Candle */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.18, 6]} />
        <meshStandardMaterial color="#f0e8d0" />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2.5} />
      </mesh>
      {/* Light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.35, 0]}
        intensity={1.0}
        distance={4.5}
        color="#ff9944"
      />
    </group>
  );
}

function FloorRug() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.003, -2.8]}>
        <planeGeometry args={[4.5, 3.8]} />
        <meshStandardMaterial color="#5a1a1a" roughness={0.95} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.002, -2.8]}>
        <planeGeometry args={[5.0, 4.3]} />
        <meshStandardMaterial color="#3a1010" roughness={0.95} />
      </mesh>
      {/* Diamond pattern */}
      <mesh receiveShadow rotation={[-Math.PI / 2, Math.PI / 4, 0]} position={[0.5, 0.004, -2.8]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#7a2a2a" roughness={0.95} />
      </mesh>
    </group>
  );
}

function WallSconce() {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      const pulse =
        0.9 +
        Math.sin(t * 4.7 + 1.2) * 0.2 +
        Math.sin(t * 9.3 + 0.6) * 0.08;
      lightRef.current.intensity = Math.max(0.3, pulse);
    }
    if (flameRef.current) {
      flameRef.current.scale.x = 1 + Math.sin(t * 8.1 + 0.5) * 0.14;
      flameRef.current.scale.y = 1 + Math.sin(t * 6.4 + 1.1) * 0.17;
    }
  });

  return (
    <group position={[-4.72, 2.1, -3.2]}>
      {/* Sconce backing */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.25, 0.3, 0.08]} />
        <meshStandardMaterial color="#3a2010" roughness={0.9} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.12, -0.05, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.22, 0.04, 0.04]} />
        <meshStandardMaterial color="#c8a84b" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Cup */}
      <mesh position={[0.22, -0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.04, 0.08, 8]} />
        <meshStandardMaterial color="#c8a84b" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Candle */}
      <mesh position={[0.22, -0.02, 0]}>
        <cylinderGeometry args={[0.028, 0.03, 0.12, 6]} />
        <meshStandardMaterial color="#f0e8d0" />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0.22, 0.06, 0]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2.2} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0.4, 0.1, 0]}
        intensity={0.9}
        distance={4}
        color="#ff9944"
      />
    </group>
  );
}

function SideTable() {
  return (
    <group position={[-3.2, 0, -3.8]}>
      {/* Table top */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.06, 0.5]} />
        <meshStandardMaterial color="#6b4020" roughness={0.72} />
      </mesh>
      {/* Single pedestal */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.62, 8]} />
        <meshStandardMaterial color="#4a2a10" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 8]} />
        <meshStandardMaterial color="#3a1f08" roughness={0.9} />
      </mesh>

      {/* Lantern on table */}
      <group position={[0, 0.68, 0]}>
        <mesh>
          <boxGeometry args={[0.12, 0.18, 0.12]} />
          <meshStandardMaterial color="#2a1a08" roughness={0.85} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.13, 0.04, 0.13]} />
          <meshStandardMaterial color="#c8a84b" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 0.1, 0]} intensity={0.7} distance={3.0} color="#ffaa44" />
      </group>
    </group>
  );
}

function WindowOnWall() {
  return (
    <group position={[-4.72, 1.8, 0.5]}>
      {/* Window frame */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.2, 1.4, 0.12]} />
        <meshStandardMaterial color="#2a1408" roughness={0.9} />
      </mesh>
      {/* Window glass — dark night sky */}
      <mesh position={[0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.0, 1.2, 0.02]} />
        <meshStandardMaterial color="#060c1a" roughness={0.1} metalness={0.1} transparent opacity={0.85} />
      </mesh>
      {/* Window cross bar horizontal */}
      <mesh position={[0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.0, 0.05, 0.06]} />
        <meshStandardMaterial color="#2a1408" roughness={0.9} />
      </mesh>
      {/* Window cross bar vertical */}
      <mesh position={[0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.05, 1.2, 0.06]} />
        <meshStandardMaterial color="#2a1408" roughness={0.9} />
      </mesh>
      {/* Moon / faint stars visible through window */}
      <mesh position={[0.12, 0.3, -0.22]}>
        <circleGeometry args={[0.09, 12]} />
        <meshBasicMaterial color="#ddeeff" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function AmbientLighting() {
  return (
    <>
      <ambientLight intensity={0.18} color="#3a2010" />
      <pointLight position={[0, 3.2, 0]} intensity={0.3} color="#7a4a20" distance={10} />
    </>
  );
}

export function OwnerRoomScene() {
  return (
    <group>
      <AmbientLighting />
      <RoomFloor />
      <RoomFloorboards />
      <RoomWalls />
      <FloorRug />
      <OwnerDesk />
      <DeskCandle />
      <OwnerChair />
      <Bookshelf />
      <WallFireplace />
      <WallSconce />
      <SideTable />
      <WindowOnWall />
    </group>
  );
}
