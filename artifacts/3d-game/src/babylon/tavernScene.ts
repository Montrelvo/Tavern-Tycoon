import {
  Scene,
  TransformNode,
  PointLight,
  DirectionalLight,
  HemisphericLight,
  Vector3,
  Color3,
  Mesh,
} from '@babylonjs/core';
import type { Upgrades } from '../game/types';
import { box, cylinder, sphere, plane, ground, disc, makeMaterial } from './helpers';

const TABLE_DATA: [number, number, number][] = [
  [2, 0.45, 1],
  [2, 0.45, -1.5],
  [-1, 0.45, -0.5],
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
  x: Math.sin(i * 2.371) * 6.5,
  y: Math.cos(i * 1.733) * 2.8 + 1.5,
  size: 0.022 + (i % 5) * 0.008,
}));

const NIGHT_COLOR = Color3.FromHexString('#050818');
const DAWN_COLOR = Color3.FromHexString('#ff6b20');
const DAY_COLOR = Color3.FromHexString('#3a7fc1');
const DUSK_COLOR = Color3.FromHexString('#e05520');
const AMB_NIGHT = Color3.FromHexString('#1a1040');
const AMB_DAY = Color3.FromHexString('#ffd080');
const DIR_NIGHT = Color3.FromHexString('#304070');
const DIR_DAY = Color3.FromHexString('#ffd080');

function lerpColor(a: Color3, b: Color3, t: number, out: Color3): Color3 {
  out.r = a.r + (b.r - a.r) * t;
  out.g = a.g + (b.g - a.g) * t;
  out.b = a.b + (b.b - a.b) * t;
  return out;
}

export interface BuiltScene {
  root: TransformNode;
  lights: { setEnabled: (v: boolean) => void }[];
  update: (elapsed: number) => void;
  setUpgrades: (u: Upgrades) => void;
  shadowCasters: Mesh[];
  dispose: () => void;
}

export function buildTavernScene(scene: Scene): BuiltScene {
  const root = new TransformNode('tavernRoot', scene);
  const shadowCasters: Mesh[] = [];
  const disposables: { dispose: () => void }[] = [];

  const mat = (name: string, color: string, opts?: Parameters<typeof makeMaterial>[3]) => {
    const m = makeMaterial(scene, `tav_${name}`, color, opts);
    disposables.push(m);
    return m;
  };

  // Shared materials
  const wallMat = mat('wall', '#3d2410', { roughness: 0.95 });
  const darkWoodMat = mat('darkwood', '#2a1a08', { roughness: 0.9 });
  const woodMat = mat('wood', '#7a4a1e', { roughness: 0.7 });
  const wood2Mat = mat('wood2', '#5c3315', { roughness: 0.85 });
  const wood3Mat = mat('wood3', '#6b4020', { roughness: 0.85 });
  const wood4Mat = mat('wood4', '#4a2a10', { roughness: 0.9 });
  const barrelRimMat = mat('barrelrim', '#3a1f08', { roughness: 0.85 });

  // --- Floor ---
  const floor = ground(scene, 'tavFloor', 14, 14, [0, 0, 0], mat('floor', '#5c3d1e', { roughness: 0.9 }), root);
  floor.receiveShadows = true;

  // --- Walls ---
  box(scene, 'wallBack', [14, 3, 0.4], [0, 1.5, -7], wallMat, root);
  box(scene, 'wallFrontL', [5.9, 3, 0.4], [-4.05, 1.5, 7], wallMat, root);
  box(scene, 'wallFrontR', [5.9, 3, 0.4], [4.05, 1.5, 7], wallMat, root);
  box(scene, 'wallLintel', [2.2, 0.7, 0.4], [0, 2.65, 7], mat('lintel', '#2a1a08', { roughness: 0.9 }), root);
  box(scene, 'wallLeft', [0.4, 3, 14], [-7, 1.5, 0], wallMat, root);
  box(scene, 'wallRight', [0.4, 3, 14], [7, 1.5, 0], wallMat, root);

  // --- Bar counter ---
  shadowCasters.push(box(scene, 'barTop', [7, 0.18, 1.2], [2, 0.85, -5.5], woodMat, root));
  shadowCasters.push(box(scene, 'barBody', [7, 0.9, 1.0], [2, 0.42, -5.5], wood2Mat, root));
  cylinder(scene, 'barStool', { dTop: 0.7, dBottom: 0.7, h: 1.0, tess: 8 }, [5.5, 0.5, -4.8], wood3Mat, root);
  cylinder(scene, 'barStoolTop', { dTop: 0.74, dBottom: 0.74, h: 0.06, tess: 8 }, [5.5, 1.0, -4.8], wood4Mat, root);
  BOTTLE_OFFSETS.forEach((x, i) => {
    cylinder(
      scene, `bottle${i}`, { dTop: 0.12, dBottom: 0.12, h: 0.4, tess: 6 },
      [x, 1.25, -6.5], mat(`bottle${i}`, BOTTLE_COLORS[i], { roughness: 0.3, metalness: 0.1 }), root,
    );
  });

  // --- Tables & chairs ---
  TABLE_DATA.forEach((t, i) => {
    shadowCasters.push(cylinder(scene, `tableTop${i}`, { dTop: 1.2, dBottom: 1.2, h: 0.08, tess: 8 }, [t[0], 0.75, t[2]], woodMat, root));
    cylinder(scene, `tableLeg${i}`, { dTop: 0.14, dBottom: 0.14, h: 0.76, tess: 6 }, [t[0], 0.37, t[2]], wood2Mat, root);
    CHAIR_OFFSETS.forEach(([ox, oz], j) => {
      const chair = new TransformNode(`chair${i}_${j}`, scene);
      chair.parent = root;
      chair.position.set(t[0] + ox, 0, t[2] + oz);
      chair.rotation.y = Math.atan2(ox, oz);
      shadowCasters.push(box(scene, `chairSeat${i}_${j}`, [0.38, 0.06, 0.38], [0, 0.3, 0], wood3Mat, chair));
      shadowCasters.push(box(scene, `chairBack${i}_${j}`, [0.38, 0.52, 0.06], [0, 0.55, -0.16], wood3Mat, chair));
      LEG_OFFSETS.forEach(([lx, lz], k) => {
        cylinder(scene, `chairLeg${i}_${j}_${k}`, { dTop: 0.05, dBottom: 0.05, h: 0.28, tess: 4 }, [lx, 0.13, lz], wood4Mat, chair);
      });
    });
  });

  // --- Waiting area ---
  ground(scene, 'waitFloor', 3.5, 10, [-5.5, 0.01, 0], mat('waitFloor', '#4a2e14', { roughness: 0.95 }), root);
  box(scene, 'waitSign', [1.2, 0.4, 0.05], [-6.5, 2.2, -5.5], woodMat, root, [0, Math.PI / 2, 0]);

  // --- Quest board ---
  const qb = new TransformNode('questBoard', scene);
  qb.parent = root;
  qb.position.set(5.5, 1.6, -6.8);
  box(scene, 'qbBack', [2.2, 1.6, 0.08], [0, 0, 0], wood2Mat, qb);
  const parchMat = mat('parchment', '#e8d5a0', { roughness: 0.95 });
  [-0.5, 0.5].forEach((x) =>
    [-0.3, 0.3].forEach((y, j) => {
      box(scene, `qbNote${x}_${j}`, [0.55, 0.35, 0.01], [x, y, 0.05], parchMat, qb);
    }),
  );

  // --- Barrel stack ---
  const barrels = new TransformNode('barrels', scene);
  barrels.parent = root;
  barrels.position.set(-0.5, 0, -6.2);
  const barrelBody = (name: string, color: string, pos: [number, number, number]) => {
    shadowCasters.push(cylinder(scene, name, { dTop: 0.56, dBottom: 0.56, h: 0.6, tess: 10 }, pos, mat(name, color, { roughness: 0.9 }), barrels));
    cylinder(scene, `${name}_r1`, { dTop: 0.58, dBottom: 0.58, h: 0.06, tess: 10 }, [pos[0], pos[1] + 0.3, pos[2]], barrelRimMat, barrels);
    cylinder(scene, `${name}_r2`, { dTop: 0.58, dBottom: 0.58, h: 0.06, tess: 10 }, [pos[0], pos[1] - 0.3, pos[2]], barrelRimMat, barrels);
  };
  barrelBody('barrelBL', '#5c3315', [-0.38, 0.3, 0]);
  barrelBody('barrelBR', '#6b4020', [0.38, 0.3, 0]);
  barrelBody('barrelTop', '#7a4a1e', [0, 0.88, 0]);

  // --- Wall shield (back wall, facing into room +z) ---
  const shield = new TransformNode('shield', scene);
  shield.parent = root;
  shield.position.set(0, 2.2, -6.8);
  const goldMat = mat('gold', '#c8a84b', { roughness: 0.5, metalness: 0.45 });
  cylinder(scene, 'shieldDisc', { dTop: 1.1, dBottom: 1.1, h: 0.06, tess: 16 }, [0, 0, 0], mat('shieldRed', '#8B0000', { roughness: 0.7, metalness: 0.1 }), shield, [Math.PI / 2, 0, 0]);
  box(scene, 'shieldH', [0.7, 0.1, 0.05], [0, 0, 0.06], goldMat, shield);
  box(scene, 'shieldV', [0.1, 0.7, 0.05], [0, 0, 0.06], goldMat, shield);

  // --- Floor rug ---
  ground(scene, 'rugBorder', 6.1, 5.1, [1.2, 0.004, -0.25], mat('rugBorder', '#4a1a1a', { roughness: 0.95 }), root).receiveShadows = true;
  ground(scene, 'rugMain', 5.5, 4.5, [1.2, 0.005, -0.25], mat('rugMain', '#6b2a2a', { roughness: 0.95 }), root).receiveShadows = true;
  ground(scene, 'rugDiamond', 2.2, 2.2, [1.2, 0.006, -0.25], mat('rugDiamond', '#8b3a3a', { roughness: 0.95 }), root, Math.PI / 4).receiveShadows = true;

  // ===== Lighting & Day/Night sky =====
  const hemi = new HemisphericLight('tavAmbient', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.35;
  hemi.diffuse = Color3.FromHexString('#8B6914');
  hemi.groundColor = Color3.FromHexString('#8B6914');

  const dir = new DirectionalLight('tavDir', new Vector3(-0.5, -1, -0.5), scene);
  dir.position = new Vector3(5, 10, 5);
  dir.intensity = 0.8;
  dir.diffuse = DIR_DAY.clone();

  // Sky backdrop seen through the doorway
  const skyGroup = new TransformNode('sky', scene);
  skyGroup.parent = root;
  skyGroup.position.set(0, 2.5, 8.5);
  const skyMat = mat('sky', '#050818', { unlit: true, backFaceCulling: false });
  plane(scene, 'skyPlane', 16, 8, [0, 0, 0], skyMat, skyGroup);
  const sunMat = mat('sun', '#fffacc', { unlit: true, backFaceCulling: false });
  sunMat.alpha = 0.01;
  const sun = disc(scene, 'sun', 0.55, [0, 1.2, 0.05], sunMat, skyGroup, 20);
  const moonMat = mat('moon', '#ddeeff', { unlit: true, backFaceCulling: false });
  const moon = disc(scene, 'moon', 0.32, [0, 1.2, 0.05], moonMat, skyGroup, 16);
  const starMat = mat('star', '#ffffff', { unlit: true, backFaceCulling: false });
  starMat.alpha = 0.7;
  const starGroup = new TransformNode('stars', scene);
  starGroup.parent = skyGroup;
  STAR_DATA.forEach((s, i) => {
    disc(scene, `star${i}`, s.size, [s.x, s.y, 0.04], starMat, starGroup, 4);
  });

  // ===== Candles =====
  const candleLights: PointLight[] = [];
  const flameEmissiveMat = mat('candleFlame', '#ffaa00', { emissive: '#ff6600', emissiveIntensity: 2 });
  const waxMat = mat('wax', '#f5e6c8', {});
  CANDLE_POSITIONS.forEach((pos, i) => {
    const g = new TransformNode(`candle${i}`, scene);
    g.parent = root;
    g.position.set(pos[0], pos[1], pos[2]);
    const light = new PointLight(`candleLight${i}`, new Vector3(0, 0, 0), scene);
    light.parent = g;
    light.diffuse = Color3.FromHexString('#ff9944');
    light.intensity = 1.2;
    light.range = 5;
    candleLights.push(light);
    cylinder(scene, `candleWax${i}`, { dTop: 0.08, dBottom: 0.08, h: 0.25, tess: 6 }, [0, 0, 0], waxMat, g);
    sphere(scene, `candleFlame${i}`, 0.08, [0, 0.14, 0], flameEmissiveMat, g, 6);
  });

  // ===== Fireplace =====
  const fp = new TransformNode('fireplace', scene);
  fp.parent = root;
  fp.position.set(-6.6, 0.8, 0);
  box(scene, 'fpStone', [0.2, 1.4, 2.0], [0, 0, 0], darkWoodMat, fp);
  const fpLight = new PointLight('fpLight', new Vector3(0.4, 0.1, 0), scene);
  fpLight.parent = fp;
  fpLight.diffuse = Color3.FromHexString('#ff6200');
  fpLight.intensity = 3;
  fpLight.range = 9;

  const flame1Mat = mat('fpFlame1', '#ff4400', { emissive: '#ff2200', emissiveIntensity: 2, alpha: 0.9, backFaceCulling: false });
  const flame2Mat = mat('fpFlame2', '#ffbb00', { emissive: '#ffdd00', emissiveIntensity: 3, alpha: 0.75, backFaceCulling: false });
  const flame3Mat = mat('fpFlame3', '#cc2200', { emissive: '#991100', emissiveIntensity: 1.5, alpha: 0.55, backFaceCulling: false });
  const fpFlame1 = plane(scene, 'fpFlame1', 0.65, 1.3, [0.15, -0.38, 0], flame1Mat, fp, [-Math.PI / 2, 0, 0]);
  const fpFlame2 = plane(scene, 'fpFlame2', 0.35, 0.75, [0.15, -0.28, 0], flame2Mat, fp, [-Math.PI / 2, 0, 0]);
  plane(scene, 'fpFlame3', 0.55, 0.9, [0.15, -0.5, 0], flame3Mat, fp, [-Math.PI / 2, 0, 0]);

  const emberMat = mat('ember', '#ff8800', { emissive: '#ff5500', emissiveIntensity: 3, alpha: 0.9 });
  const embers: Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    embers.push(sphere(scene, `ember${i}`, 0.044, [0.15, -0.3 + i * 0.05, i * 0.08 - 0.08], emberMat, fp, 4));
  }

  // ===== Staff NPCs (cook + bard) =====
  const cookGroup = new TransformNode('cook', scene);
  cookGroup.parent = root;
  cookGroup.position.set(1.5, 0, -5.8);
  const skinMat = mat('skin', '#e8c8a0', { roughness: 0.85 });
  const whiteMat = mat('white', '#f0f0f0', { roughness: 0.8 });
  box(scene, 'cookBody', [0.32, 0.5, 0.22], [0, 0.75, 0], whiteMat, cookGroup);
  box(scene, 'cookHead', [0.24, 0.24, 0.24], [0, 1.15, 0], skinMat, cookGroup);
  cylinder(scene, 'cookHat1', { dTop: 0.24, dBottom: 0.24, h: 0.2, tess: 8 }, [0, 1.33, 0], mat('cookHat', '#ffffff', { roughness: 0.9 }), cookGroup);
  cylinder(scene, 'cookHat2', { dTop: 0.18, dBottom: 0.24, h: 0.06, tess: 8 }, [0, 1.44, 0], mat('cookHat2', '#ffffff', { roughness: 0.9 }), cookGroup);
  box(scene, 'cookApron', [0.22, 0.38, 0.02], [0, 0.68, 0.12], mat('apron', '#e8e8e8', { roughness: 0.8 }), cookGroup);
  box(scene, 'cookLegL', [0.12, 0.5, 0.18], [-0.08, 0.25, 0], mat('cookLegs', '#555555', { roughness: 0.9 }), cookGroup);
  box(scene, 'cookLegR', [0.12, 0.5, 0.18], [0.08, 0.25, 0], mat('cookLegs2', '#555555', { roughness: 0.9 }), cookGroup);
  const cookBadge = box(scene, 'cookBadge', [0.1, 0.08, 0.02], [0, 0.9, 0.12], mat('cookBadge', '#ffd700', { emissive: '#ffd700', emissiveIntensity: 0.6 }), cookGroup);
  const cookArm = new TransformNode('cookArm', scene);
  cookArm.parent = cookGroup;
  cookArm.position.set(0.2, 0.97, 0.06);
  box(scene, 'cookArmUpper', [0.08, 0.22, 0.08], [0, -0.1, 0], skinMat, cookArm);
  box(scene, 'cookArmLower', [0.07, 0.15, 0.07], [0.03, -0.26, 0.06], skinMat, cookArm);

  const bardGroup = new TransformNode('bard', scene);
  bardGroup.parent = root;
  bardGroup.position.set(-5.2, 0, -5.2);
  box(scene, 'bardBody', [0.3, 0.5, 0.22], [0, 0.75, 0], mat('bardBody', '#6b21a8', { roughness: 0.75 }), bardGroup);
  box(scene, 'bardHead', [0.24, 0.24, 0.24], [0, 1.15, 0], skinMat, bardGroup);
  cylinder(scene, 'bardHatBrim', { dTop: 0.4, dBottom: 0.4, h: 0.04, tess: 8 }, [0, 1.29, 0], mat('bardHat', '#4a1472', { roughness: 0.8 }), bardGroup);
  cylinder(scene, 'bardHatTop', { dTop: 0.2, dBottom: 0.28, h: 0.28, tess: 8 }, [0, 1.42, 0], mat('bardHat2', '#4a1472', { roughness: 0.8 }), bardGroup);
  box(scene, 'bardFeather', [0.04, 0.24, 0.02], [0.1, 1.52, 0], mat('feather', '#f59e0b', { roughness: 0.6 }), bardGroup, [0, 0, -0.4]);
  box(scene, 'bardLute', [0.08, 0.22, 0.06], [0.22, 0.7, 0.1], mat('lute', '#8B4513', { roughness: 0.8 }), bardGroup, [0.3, 0, 0.5]);
  box(scene, 'bardLuteNeck', [0.04, 0.18, 0.04], [0.32, 0.88, 0.1], mat('luteNeck', '#6b3410', { roughness: 0.85 }), bardGroup, [0.3, 0, 0.5]);
  box(scene, 'bardLegL', [0.12, 0.5, 0.18], [-0.08, 0.25, 0], mat('bardLegs', '#3b0764', { roughness: 0.9 }), bardGroup);
  box(scene, 'bardLegR', [0.12, 0.5, 0.18], [0.08, 0.25, 0], mat('bardLegs2', '#3b0764', { roughness: 0.9 }), bardGroup);
  const bardArm = new TransformNode('bardArm', scene);
  bardArm.parent = bardGroup;
  bardArm.position.set(0.19, 0.95, 0.08);
  box(scene, 'bardArmUpper', [0.08, 0.22, 0.08], [0, -0.1, 0], skinMat, bardArm);
  box(scene, 'bardArmLower', [0.07, 0.14, 0.07], [0.02, -0.25, 0.05], skinMat, bardArm);

  let upgrades: Upgrades | null = null;
  const setUpgrades = (u: Upgrades) => {
    upgrades = u;
    cookGroup.setEnabled(u.cook > 0);
    cookBadge.setEnabled(u.cook === 2);
    bardGroup.setEnabled(!!u.bard);
  };

  const tmp = new Color3();

  const update = (t: number) => {
    // Candle flicker
    candleLights.forEach((light, i) => {
      const phase = i * 1.37;
      const pulse =
        1.2 +
        Math.sin(t * 4.1 + phase) * 0.25 +
        Math.sin(t * 11.3 + phase * 2) * 0.1 +
        Math.sin(t * 7.7 + phase * 0.7) * 0.08;
      light.intensity = Math.max(0.4, pulse);
    });

    // Fireplace
    const flicker =
      3.2 + Math.sin(t * 7.3) * 0.9 + Math.sin(t * 13.7) * 0.5 + Math.sin(t * 3.1) * 0.7 + Math.sin(t * 19.1) * 0.2;
    fpLight.intensity = Math.max(1.2, flicker);
    fpFlame1.scaling.x = 1 + Math.sin(t * 8.1) * 0.14;
    fpFlame1.scaling.z = 1 + Math.sin(t * 6.3) * 0.18;
    flame1Mat.emissiveColor = Color3.FromHexString('#ff2200').scale(2 + Math.sin(t * 9.7) * 0.6);
    fpFlame2.scaling.x = 1 + Math.sin(t * 9.3 + 1.0) * 0.12;
    fpFlame2.scaling.z = 1 + Math.sin(t * 7.1 + 0.5) * 0.15;
    fpFlame2.position.y = -0.28 + Math.sin(t * 4.9) * 0.07;
    embers.forEach((ember, i) => {
      const phase = i * 2.1;
      const cycle = ((t * 0.7 + phase) % 2.4) / 2.4;
      ember.position.y = -0.3 + cycle * 0.7;
      ember.position.x = 0.15 + Math.sin(t * 3.1 + phase) * 0.1;
      ember.position.z = Math.cos(t * 2.7 + phase) * 0.15;
    });

    // Day/night cycle
    const cycle = (Math.sin(t * 0.045) + 1) / 2;
    if (cycle < 0.25) lerpColor(NIGHT_COLOR, DAWN_COLOR, cycle / 0.25, tmp);
    else if (cycle < 0.45) lerpColor(DAWN_COLOR, DAY_COLOR, (cycle - 0.25) / 0.2, tmp);
    else if (cycle < 0.75) lerpColor(DAY_COLOR, DUSK_COLOR, (cycle - 0.45) / 0.3, tmp);
    else lerpColor(DUSK_COLOR, NIGHT_COLOR, (cycle - 0.75) / 0.25, tmp);
    skyMat.emissiveColor.copyFrom(tmp);

    const sunOpacity = Math.max(0, Math.sin(cycle * Math.PI));
    sunMat.alpha = Math.max(0.01, sunOpacity * 0.95);
    sun.position.y = 1.2 + Math.sin(cycle * Math.PI) * 1.8;
    sun.position.x = Math.cos(cycle * Math.PI) * 3.5;

    const moonOpacity = Math.max(0, Math.cos(cycle * Math.PI) * 0.9 + 0.1);
    moonMat.alpha = Math.max(0.01, moonOpacity);
    moon.position.y = 1.2 + Math.sin((cycle + 0.5) * Math.PI) * 1.8;
    moon.position.x = Math.cos((cycle + 0.5) * Math.PI) * 3.5;

    starMat.alpha = Math.max(0, 1 - cycle * 3.5);

    hemi.intensity = 0.12 + 0.33 * cycle;
    lerpColor(AMB_NIGHT, AMB_DAY, cycle, tmp);
    hemi.diffuse.copyFrom(tmp);
    hemi.groundColor.copyFrom(tmp);

    dir.intensity = 0.15 + 0.85 * cycle;
    lerpColor(DIR_NIGHT, DIR_DAY, cycle, tmp);
    dir.diffuse.copyFrom(tmp);

    // Staff animations
    if (upgrades?.cook && upgrades.cook > 0) {
      cookGroup.position.y = Math.sin(t * 1.4) * 0.04;
      cookArm.rotation.x = Math.sin(t * 3.2) * 0.38;
      cookArm.rotation.z = Math.cos(t * 3.2) * 0.28 - 0.3;
    }
    if (upgrades?.bard) {
      bardGroup.position.y = Math.sin(t * 1.8 + 1.2) * 0.05;
      bardGroup.rotation.y = Math.sin(t * 0.9) * 0.15;
      bardArm.rotation.x = Math.sin(t * 6.5) * 0.45 - 0.2;
    }
  };

  const dispose = () => {
    hemi.dispose();
    dir.dispose();
    candleLights.forEach((l) => l.dispose());
    fpLight.dispose();
    disposables.forEach((d) => d.dispose());
    root.dispose();
  };

  return {
    root,
    lights: [hemi, dir, fpLight, ...candleLights],
    update,
    setUpgrades,
    shadowCasters,
    dispose,
  };
}
