import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Adventurer } from '../game/types';
import { CLASS_COLORS, PRESTIGE_CLASS_COLORS } from '../game/constants';
import {
  ADVENTURER_MODELS,
  getAdventurerModelConfig,
  getAllAdventurerModelUrls,
  type AdventurerModelConfig,
} from '../models/adventurerModels';

export type AdventurerAnimationState = 'idle' | 'walking';

interface AdventurerBodyProps {
  adventurer: Adventurer;
  isSelected?: boolean;
  isHovered?: boolean;
  animationState?: AdventurerAnimationState;
}

export function getAdventurerColor(adventurer: Adventurer): string {
  return adventurer.prestigeClass
    ? PRESTIGE_CLASS_COLORS[adventurer.prestigeClass]
    : CLASS_COLORS[adventurer.class];
}

function ProceduralBody({ color, isSelected, isHovered }: { color: string; isSelected: boolean; isHovered: boolean }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.9, 0.42]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected || isHovered ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function GltfBody({
  config, color, animationState, isSelected, isHovered,
}: {
  config: AdventurerModelConfig;
  color: string;
  animationState: AdventurerAnimationState;
  isSelected: boolean;
  isHovered: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(config.url);

  // Clone the scene per-instance so each adventurer has its own skeleton/material state.
  const scene = useMemo(() => cloneSkeleton(gltf.scene) as THREE.Object3D, [gltf.scene]);

  // Apply tinting + selection emissive to the cloned materials.
  useEffect(() => {
    const tintColor = new THREE.Color(color);
    const emissiveColor = new THREE.Color(isSelected || isHovered ? color : '#000000');
    const emissiveIntensity = isSelected ? 0.5 : isHovered ? 0.3 : 0;
    scene.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        const shouldTint =
          config.tintAllMeshes === true ||
          (config.tintMaterials?.includes((mat as THREE.Material).name) ?? false);
        const stdMat = mat as THREE.MeshStandardMaterial;
        if (shouldTint && stdMat.color) {
          stdMat.color.copy(tintColor);
        }
        if (stdMat.emissive) {
          stdMat.emissive.copy(emissiveColor);
          stdMat.emissiveIntensity = emissiveIntensity;
        }
        stdMat.needsUpdate = true;
      }
      mesh.castShadow = true;
    });
  }, [scene, color, isSelected, isHovered, config.tintAllMeshes, config.tintMaterials]);

  // Animation mixer wired to the cloned scene.
  const { actions, names } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    const desiredName =
      animationState === 'walking'
        ? (config.walkAnimation ?? config.idleAnimation ?? names[0])
        : (config.idleAnimation ?? names[0]);
    if (!desiredName) return;
    const action = actions[desiredName];
    if (!action) return;
    action.reset().fadeIn(0.2).play();
    return () => { action.fadeOut(0.2); };
  }, [actions, names, animationState, config.idleAnimation, config.walkAnimation]);

  const scaleProp = useMemo<[number, number, number]>(() => {
    const s = config.scale ?? 1;
    return typeof s === 'number' ? [s, s, s] : s;
  }, [config.scale]);

  return (
    <group
      ref={groupRef}
      position={[0, config.yOffset ?? 0, 0]}
      rotation={[0, config.rotationOffsetY ?? 0, 0]}
      scale={scaleProp}
    >
      <primitive object={scene} />
    </group>
  );
}

/**
 * Renders an adventurer's body — either a loaded .glb model (if one is
 * registered in `adventurerModels.ts` for the adventurer's class /
 * prestige class) or the default procedural box-man fallback.
 *
 * Intended to be placed inside an outer <group> that handles world
 * positioning, scaling for context (tavern vs roster), pointer events,
 * and ground effects (selection ring, etc.).
 */
export function AdventurerBody({
  adventurer, isSelected = false, isHovered = false, animationState = 'idle',
}: AdventurerBodyProps) {
  const color = getAdventurerColor(adventurer);
  const config = getAdventurerModelConfig(adventurer.class, adventurer.prestigeClass);

  if (!config) {
    return <ProceduralBody color={color} isSelected={isSelected} isHovered={isHovered} />;
  }

  return (
    <Suspense fallback={<ProceduralBody color={color} isSelected={isSelected} isHovered={isHovered} />}>
      <GltfBody
        config={config}
        color={color}
        animationState={animationState}
        isSelected={isSelected}
        isHovered={isHovered}
      />
    </Suspense>
  );
}

// Preload any registered .glb so the first render of a configured class is instant.
for (const url of getAllAdventurerModelUrls()) {
  useGLTF.preload(url);
}

// Re-export so callers can extend the registry from outside if needed.
export { ADVENTURER_MODELS };
