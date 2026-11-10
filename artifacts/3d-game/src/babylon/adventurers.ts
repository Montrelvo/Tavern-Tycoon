import {
  Scene,
  TransformNode,
  Mesh,
  StandardMaterial,
  Color3,
  Vector3,
} from '@babylonjs/core';
import type { Adventurer } from '../game/types';
import { CLASS_COLORS, PRESTIGE_CLASS_COLORS } from '../game/constants';
import { box, ring } from './helpers';

const MOVE_SPEED = 3.5;
const BOB_SPEED = 2.5;
const BOB_AMOUNT = 0.08;
const ARRIVED_EPSILON = 0.05;

function colorFor(adv: Adventurer): string {
  return adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : CLASS_COLORS[adv.class];
}

interface AdvEntry {
  root: TransformNode;
  bodyMat: StandardMaterial;
  selectRing: Mesh;
  hoverRing: Mesh;
  pickMeshes: Mesh[];
  target: [number, number, number];
  arrived: boolean;
  isMoving: boolean;
  bobTime: number;
  color: Color3;
  selected: boolean;
  hovered: boolean;
}

export interface AdventurerManager {
  sync: (adventurers: Adventurer[], selectedId: string | null) => void;
  setHovered: (id: string | null) => void;
  update: (dt: number) => void;
  pick: (mesh: Mesh | null) => string | null;
  setEnabled: (v: boolean) => void;
  dispose: () => void;
}

export function createAdventurerManager(
  scene: Scene,
  parent: TransformNode,
  addShadowCaster: (m: Mesh) => void,
  onArrived: (id: string, pos: [number, number, number]) => void,
): AdventurerManager {
  const entries = new Map<string, AdvEntry>();
  const meshToId = new Map<Mesh, string>();
  const groupRoot = new TransformNode('adventurers', scene);
  groupRoot.parent = parent;

  let hoveredId: string | null = null;

  function buildEntry(adv: Adventurer): AdvEntry {
    const root = new TransformNode(`adv_${adv.id}`, scene);
    root.parent = groupRoot;
    root.position.set(adv.position[0], adv.position[1], adv.position[2]);

    const color = colorFor(adv);
    const bodyMat = new StandardMaterial(`advMat_${adv.id}`, scene);
    bodyMat.diffuseColor = Color3.FromHexString(color);
    bodyMat.specularColor = new Color3(0.25, 0.25, 0.25);
    bodyMat.maxSimultaneousLights = 12;

    const headMat = new StandardMaterial(`advHead_${adv.id}`, scene);
    headMat.diffuseColor = Color3.FromHexString(color);
    headMat.specularColor = new Color3(0.3, 0.3, 0.3);
    headMat.maxSimultaneousLights = 12;

    const gemMat = new StandardMaterial(`advGem_${adv.id}`, scene);
    gemMat.diffuseColor = new Color3(1, 1, 1);
    gemMat.emissiveColor = Color3.FromHexString(color);
    gemMat.maxSimultaneousLights = 12;

    const bodyMesh = box(scene, `advBody_${adv.id}`, [0.42, 0.9, 0.42], [0, 0, 0], bodyMat, root);
    const headMesh = box(scene, `advHeadM_${adv.id}`, [0.32, 0.32, 0.32], [0, 0.65, 0], headMat, root);
    box(scene, `advGemM_${adv.id}`, [0.1, 0.1, 0.1], [0, 0.85, 0], gemMat, root);

    addShadowCaster(bodyMesh);
    addShadowCaster(headMesh);

    const selRingMat = new StandardMaterial(`advSelRing_${adv.id}`, scene);
    selRingMat.diffuseColor = new Color3(1, 1, 1);
    selRingMat.emissiveColor = new Color3(0.6, 0.6, 0.6);
    selRingMat.alpha = 0.7;
    selRingMat.maxSimultaneousLights = 12;
    const selectRing = ring(scene, `advSelectRing_${adv.id}`, 0.4, 0.55, [0, -0.44, 0], selRingMat, root);
    selectRing.setEnabled(false);

    const hovRingMat = new StandardMaterial(`advHovRing_${adv.id}`, scene);
    hovRingMat.diffuseColor = new Color3(0.67, 0.67, 0.67);
    hovRingMat.emissiveColor = new Color3(0.35, 0.35, 0.35);
    hovRingMat.alpha = 0.7;
    hovRingMat.maxSimultaneousLights = 12;
    const hoverRing = ring(scene, `advHoverRing_${adv.id}`, 0.4, 0.55, [0, -0.44, 0], hovRingMat, root);
    hoverRing.setEnabled(false);

    const pickMeshes = [bodyMesh, headMesh];
    pickMeshes.forEach((m) => meshToId.set(m, adv.id));

    return {
      root,
      bodyMat,
      selectRing,
      hoverRing,
      pickMeshes,
      target: adv.targetPosition,
      arrived: false,
      isMoving: false,
      bobTime: Math.random() * Math.PI * 2,
      color: Color3.FromHexString(color),
      selected: false,
      hovered: false,
    };
  }

  function applyEmissive(entry: AdvEntry) {
    const active = entry.selected || entry.hovered;
    const intensity = entry.selected ? 0.5 : entry.hovered ? 0.3 : 0;
    entry.bodyMat.emissiveColor = active ? entry.color.scale(intensity) : new Color3(0, 0, 0);
  }

  function sync(adventurers: Adventurer[], selectedId: string | null) {
    const visible = adventurers.filter((a) => a.status !== 'on-quest');
    const seen = new Set<string>();

    for (const adv of visible) {
      seen.add(adv.id);
      let entry = entries.get(adv.id);
      if (!entry) {
        entry = buildEntry(adv);
        entries.set(adv.id, entry);
      }
      entry.target = adv.targetPosition;
      const sel = selectedId === adv.id;
      if (sel !== entry.selected) {
        entry.selected = sel;
        entry.selectRing.setEnabled(sel);
        applyEmissive(entry);
      }
    }

    // Remove adventurers that left or went on quest
    for (const [id, entry] of entries) {
      if (!seen.has(id)) {
        entry.pickMeshes.forEach((m) => meshToId.delete(m));
        entry.root.dispose(false, true);
        entries.delete(id);
        if (hoveredId === id) hoveredId = null;
      }
    }
  }

  function setHovered(id: string | null) {
    if (hoveredId === id) return;
    if (hoveredId) {
      const prev = entries.get(hoveredId);
      if (prev) {
        prev.hovered = false;
        prev.hoverRing.setEnabled(false);
        applyEmissive(prev);
      }
    }
    hoveredId = id;
    if (id) {
      const cur = entries.get(id);
      if (cur) {
        cur.hovered = true;
        cur.hoverRing.setEnabled(!cur.selected);
        applyEmissive(cur);
      }
    }
  }

  function update(dt: number) {
    for (const [id, entry] of entries) {
      const pos = entry.root.position;
      const tx = entry.target[0];
      const tz = entry.target[2];
      const dx = tx - pos.x;
      const dz = tz - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > ARRIVED_EPSILON) {
        entry.arrived = false;
        entry.isMoving = true;
        const speed = Math.min(MOVE_SPEED * dt, dist);
        pos.x += (dx / dist) * speed;
        pos.z += (dz / dist) * speed;
        entry.root.rotation.y = Math.atan2(dx, dz);
      } else {
        pos.x = tx;
        pos.z = tz;
        entry.isMoving = false;
        if (!entry.arrived) {
          entry.arrived = true;
          onArrived(id, [tx, entry.target[1], tz]);
        }
      }

      entry.bobTime += dt * BOB_SPEED;
      pos.y = 0.5 + Math.sin(entry.bobTime) * BOB_AMOUNT;
    }
  }

  function pick(mesh: Mesh | null): string | null {
    if (!mesh) return null;
    return meshToId.get(mesh) ?? null;
  }

  function setEnabled(v: boolean) {
    groupRoot.setEnabled(v);
  }

  function dispose() {
    for (const entry of entries.values()) {
      entry.root.dispose(false, true);
    }
    entries.clear();
    meshToId.clear();
    groupRoot.dispose();
  }

  return { sync, setHovered, update, pick, setEnabled, dispose };
}

export { Vector3 };
