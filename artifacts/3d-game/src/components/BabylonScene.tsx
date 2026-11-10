import { useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color4,
  ShadowGenerator,
  DirectionalLight,
  PointerEventTypes,
  type AbstractMesh,
  type Mesh,
} from '@babylonjs/core';
import type { Adventurer, Upgrades } from '../game/types';
import { buildTavernScene } from '../babylon/tavernScene';
import { buildOwnerRoomScene } from '../babylon/ownerRoomScene';
import { createAdventurerManager } from '../babylon/adventurers';

export type BabylonActiveScene = 'tavern' | 'management';

interface BabylonSceneProps {
  activeScene: BabylonActiveScene;
  adventurers: Adventurer[];
  selectedAdventurerId: string | null;
  upgrades: Upgrades;
  onSelectAdventurer: (id: string | null) => void;
  onAdventurerArrived: (id: string, pos: [number, number, number]) => void;
}

const DEG = Math.PI / 180;

/**
 * Experimental Babylon.js renderer. Ports the Tavern and Owner's Room scenes
 * (geometry, lighting, day/night cycle, animated NPCs and adventurers) so the
 * Babylon path renders the same content as the R3F WebGL/WebGPU renderers.
 *
 * Owns its own engine + scene lifecycle and tears everything down on unmount.
 * If engine initialization throws, the error is surfaced during render so the
 * surrounding error boundary can catch it.
 */
export function BabylonScene({
  activeScene,
  adventurers,
  selectedAdventurerId,
  upgrades,
  onSelectAdventurer,
  onAdventurerArrived,
}: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);

  // Latest props mirrored into refs so the imperative render loop / handlers
  // always read fresh values without re-initializing the engine.
  const propsRef = useRef<BabylonSceneProps>({
    activeScene,
    adventurers,
    selectedAdventurerId,
    upgrades,
    onSelectAdventurer,
    onAdventurerArrived,
  });
  propsRef.current = {
    activeScene,
    adventurers,
    selectedAdventurerId,
    upgrades,
    onSelectAdventurer,
    onAdventurerArrived,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: Engine | null = null;
    let disposed = false;
    let handleResize: (() => void) | null = null;

    try {
      engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        // Allow context creation under software rendering / low-end GPUs,
        // matching three.js behaviour (otherwise Babylon throws "WebGL not supported").
        failIfMajorPerformanceCaveat: false,
      });
      const scene = new Scene(engine);
      scene.useRightHandedSystem = true;
      scene.clearColor = new Color4(0.051, 0.027, 0, 1);

      const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 4, 18, Vector3.Zero(), scene);
      camera.lowerRadiusLimit = 8;
      camera.upperRadiusLimit = 22;
      camera.lowerBetaLimit = Math.PI / 6;
      camera.upperBetaLimit = Math.PI / 2.4;
      camera.wheelDeltaPercentage = 0.01;
      camera.panningSensibility = 0;

      const tavern = buildTavernScene(scene);
      const ownerRoom = buildOwnerRoomScene(scene);

      // Shadows from the tavern's primary directional light source.
      const tavernDir = tavern.lights.find((l) => l instanceof DirectionalLight) as DirectionalLight | undefined;
      let shadowGen: ShadowGenerator | null = null;
      if (tavernDir) {
        shadowGen = new ShadowGenerator(1024, tavernDir);
        shadowGen.usePoissonSampling = true;
        tavern.shadowCasters.forEach((m) => shadowGen!.addShadowCaster(m));
      }

      const advManager = createAdventurerManager(
        scene,
        tavern.root,
        (m) => shadowGen?.addShadowCaster(m),
        (id, pos) => propsRef.current.onAdventurerArrived(id, pos),
      );

      const setActiveScene = (s: BabylonActiveScene) => {
        const isTavern = s === 'tavern';
        tavern.root.setEnabled(isTavern);
        ownerRoom.root.setEnabled(!isTavern);
        tavern.lights.forEach((l) => l.setEnabled(isTavern));
        ownerRoom.lights.forEach((l) => l.setEnabled(!isTavern));
        advManager.setEnabled(isTavern);

        if (isTavern) {
          camera.setTarget(Vector3.Zero());
          camera.setPosition(new Vector3(0, 14, 12));
          camera.fov = 45 * DEG;
          camera.lowerRadiusLimit = 8;
          camera.upperRadiusLimit = 22;
          camera.lowerBetaLimit = Math.PI / 6;
          camera.upperBetaLimit = Math.PI / 2.4;
          camera.attachControl(canvas, true);
        } else {
          camera.detachControl();
          camera.fov = 50 * DEG;
          camera.setTarget(new Vector3(0.5, 1.0, -2.0));
          camera.setPosition(new Vector3(-1.5, 2.8, 4.5));
        }
      };

      let currentScene: BabylonActiveScene = propsRef.current.activeScene;
      let currentUpgrades = propsRef.current.upgrades;
      tavern.setUpgrades(currentUpgrades);
      setActiveScene(currentScene);

      // Pointer interaction: select adventurer / deselect on empty tavern click.
      const isAdventurerMesh = (m: AbstractMesh | null) =>
        !!m && advManager.pick(m as Mesh) !== null;

      scene.onPointerObservable.add((info) => {
        if (currentScene !== 'tavern') return;
        if (info.type === PointerEventTypes.POINTERMOVE) {
          const pick = scene.pick(scene.pointerX, scene.pointerY, (m) => isAdventurerMesh(m));
          const id = pick?.hit ? advManager.pick(pick.pickedMesh as Mesh) : null;
          advManager.setHovered(id);
          canvas.style.cursor = id ? 'pointer' : 'default';
        } else if (info.type === PointerEventTypes.POINTERTAP) {
          const picked = info.pickInfo?.pickedMesh as Mesh | undefined;
          const id = picked ? advManager.pick(picked) : null;
          if (id) {
            propsRef.current.onSelectAdventurer(id);
          } else if (propsRef.current.selectedAdventurerId) {
            propsRef.current.onSelectAdventurer(null);
          }
        }
      });

      const start = performance.now();
      let lastTime = start;

      engine.runRenderLoop(() => {
        if (disposed) return;
        const now = performance.now();
        const elapsed = (now - start) / 1000;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const p = propsRef.current;

        if (p.activeScene !== currentScene) {
          currentScene = p.activeScene;
          setActiveScene(currentScene);
        }
        if (p.upgrades !== currentUpgrades) {
          currentUpgrades = p.upgrades;
          tavern.setUpgrades(currentUpgrades);
        }

        advManager.sync(p.adventurers, p.selectedAdventurerId);

        if (currentScene === 'tavern') {
          tavern.update(elapsed);
          advManager.update(dt);
        } else {
          ownerRoom.update(elapsed);
        }

        scene.render();
      });

      apiRef.current = { scene, engine };

      handleResize = () => engine?.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        disposed = true;
        if (handleResize) window.removeEventListener('resize', handleResize);
        advManager.dispose();
        tavern.dispose();
        ownerRoom.dispose();
        scene.dispose();
        engine?.dispose();
      };
    } catch (err) {
      disposed = true;
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (engine) {
        try { engine.dispose(); } catch { /* ignore secondary disposal errors */ }
      }
      setInitError(err instanceof Error ? err : new Error(String(err)));
      return undefined;
    }
    // Engine is created once; live data flows through propsRef + render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initError) throw initError;

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        outline: 'none',
        touchAction: 'none',
      }}
    />
  );
}
