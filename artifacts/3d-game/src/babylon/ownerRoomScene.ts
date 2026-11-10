import {
  Scene,
  TransformNode,
  PointLight,
  HemisphericLight,
  Vector3,
  Color3,
  Mesh,
} from '@babylonjs/core';
import { box, cylinder, sphere, plane, ground, disc, makeMaterial } from './helpers';
import type { BuiltScene } from './tavernScene';

const ROOM_LEG_OFFSETS: [number, number][] = [[-0.18, -0.32], [-0.18, 0.32], [0.18, -0.32], [0.18, 0.32]];

export function buildOwnerRoomScene(scene: Scene): BuiltScene {
  const root = new TransformNode('ownerRoot', scene);
  const shadowCasters: Mesh[] = [];
  const disposables: { dispose: () => void }[] = [];

  const mat = (name: string, color: string, opts?: Parameters<typeof makeMaterial>[3]) => {
    const m = makeMaterial(scene, `own_${name}`, color, opts);
    disposables.push(m);
    return m;
  };

  const darkWoodMat = mat('darkwood', '#2e1a08', { roughness: 0.95 });
  const wood2Mat = mat('wood2', '#5c3315', { roughness: 0.8 });
  const woodMat = mat('wood', '#7a4a1e', { roughness: 0.65 });
  const goldMat = mat('gold', '#c8a84b', { roughness: 0.4, metalness: 0.5 });

  // --- Floor & floorboards ---
  ground(scene, 'roomFloor', 10, 10, [0, 0, 0], mat('floor', '#4a2e12', { roughness: 0.92 }), root).receiveShadows = true;
  const boardMat = mat('board', '#2e1a08', { roughness: 0.95 });
  for (let i = 0; i < 9; i++) {
    ground(scene, `board${i}`, 10, 0.06, [0, 0.001, -4 + i * 1.0], boardMat, root);
  }

  // --- Walls & ceiling ---
  box(scene, 'roomBack', [10, 3.6, 0.3], [0, 1.8, -5], darkWoodMat, root);
  box(scene, 'roomLeft', [0.3, 3.6, 10], [-5, 1.8, 0], darkWoodMat, root);
  box(scene, 'roomRight', [0.3, 3.6, 10], [5, 1.8, 0], darkWoodMat, root);
  box(scene, 'roomCeil', [10, 0.2, 10], [0, 3.6, 0], mat('ceil', '#1e1008', { roughness: 0.98 }), root);
  const beamMat = mat('beam', '#1a0c04', { roughness: 0.9 });
  [-2, 0, 2].forEach((x, i) => box(scene, `beam${i}`, [0.18, 0.18, 10], [x, 3.48, 0], beamMat, root));
  box(scene, 'panel1', [9.8, 0.08, 0.04], [0, 1.1, -4.84], wood2Mat, root);
  box(scene, 'panel2', [9.8, 0.06, 0.04], [0, 0.5, -4.84], wood2Mat, root);

  // --- Floor rug ---
  ground(scene, 'orugBorder', 5.0, 4.3, [0.5, 0.002, -2.8], mat('orugBorder', '#3a1010', { roughness: 0.95 }), root).receiveShadows = true;
  ground(scene, 'orugMain', 4.5, 3.8, [0.5, 0.003, -2.8], mat('orugMain', '#5a1a1a', { roughness: 0.95 }), root).receiveShadows = true;
  ground(scene, 'orugDiamond', 1.8, 1.8, [0.5, 0.004, -2.8], mat('orugDiamond', '#7a2a2a', { roughness: 0.95 }), root, Math.PI / 4).receiveShadows = true;

  // --- Owner desk ---
  const desk = new TransformNode('desk', scene);
  desk.parent = root;
  desk.position.set(0.5, 0, -3.2);
  shadowCasters.push(box(scene, 'deskTop', [2.2, 0.1, 1.1], [0, 0.82, 0], woodMat, desk));
  shadowCasters.push(box(scene, 'deskBody', [2.2, 0.82, 1.0], [0, 0.4, 0], wood2Mat, desk));
  [-0.5, 0.5].forEach((x, i) =>
    cylinder(scene, `drawerPull${i}`, { dTop: 0.05, dBottom: 0.05, h: 0.04, tess: 6 }, [x, 0.38, 0.52], goldMat, desk, [Math.PI / 2, 0, 0]),
  );
  // Ledger
  const ledger = new TransformNode('ledger', scene);
  ledger.parent = desk;
  ledger.position.set(-0.2, 0.88, -0.1);
  ledger.rotation.y = 0.15;
  box(scene, 'ledgerCover', [0.55, 0.03, 0.7], [0, 0, 0], mat('ledgerCover', '#3a2010', { roughness: 0.9 }), ledger);
  const pageMat = mat('page', '#e8dfc8', { roughness: 0.95 });
  box(scene, 'ledgerPageL', [0.27, 0.01, 0.64], [-0.14, 0.025, 0], pageMat, ledger);
  box(scene, 'ledgerPageR', [0.27, 0.01, 0.64], [0.14, 0.025, 0], pageMat, ledger);
  const lineMat = mat('line', '#8a7a60', { roughness: 0.95 });
  [-0.22, -0.12, -0.02, 0.08, 0.18].forEach((z, i) => {
    box(scene, `lineL${i}`, [0.22, 0.003, 0.012], [-0.14, 0.032, z], lineMat, ledger);
    box(scene, `lineR${i}`, [0.22, 0.003, 0.012], [0.14, 0.032, z], lineMat, ledger);
  });
  // Ink well
  cylinder(scene, 'inkwell', { dTop: 0.11, dBottom: 0.13, h: 0.1, tess: 8 }, [0.7, 0.87, -0.25], mat('inkwell', '#1a1a2e', { roughness: 0.3, metalness: 0.2 }), desk);
  cylinder(scene, 'inkwellTop', { dTop: 0.06, dBottom: 0.11, h: 0.02, tess: 8 }, [0.7, 0.925, -0.25], mat('ink', '#0d0d1a', { roughness: 0.2 }), desk);
  // Quill
  box(scene, 'quill', [0.015, 0.28, 0.015], [0.55, 0.91, -0.1], mat('quill', '#f5f0e0', { roughness: 0.8 }), desk, [0, 0.3, -0.2]);
  box(scene, 'quillTip', [0.055, 0.14, 0.008], [0.53, 0.99, -0.08], mat('quillTip', '#e8e0c8', { roughness: 0.75 }), desk, [0, 0.3, -0.28]);
  // Rolled map
  cylinder(scene, 'map', { dTop: 0.08, dBottom: 0.08, h: 0.38, tess: 8 }, [0.8, 0.895, 0.1], mat('map', '#c8b47a', { roughness: 0.9 }), desk, [0, 0.5, Math.PI / 2]);

  // --- Bookshelf ---
  const BOOK_DATA = [
    { w: 0.06, h: 0.28, color: '#8B0000' }, { w: 0.09, h: 0.24, color: '#4a2e60' },
    { w: 0.07, h: 0.30, color: '#1a4a20' }, { w: 0.05, h: 0.22, color: '#7a5a10' },
    { w: 0.08, h: 0.27, color: '#6b2020' }, { w: 0.06, h: 0.25, color: '#2a3a6a' },
    { w: 0.10, h: 0.29, color: '#4a2010' }, { w: 0.07, h: 0.23, color: '#1a4050' },
    { w: 0.06, h: 0.26, color: '#5a3010' }, { w: 0.08, h: 0.31, color: '#3a1a50' },
    { w: 0.09, h: 0.24, color: '#1a3a20' }, { w: 0.05, h: 0.28, color: '#6a4a10' },
    { w: 0.07, h: 0.26, color: '#8B2020' }, { w: 0.06, h: 0.22, color: '#3a2a70' },
    { w: 0.09, h: 0.30, color: '#2a4a18' },
  ];
  const SHELF_Y = [0.3, 0.72, 1.14, 1.56, 1.98];
  const shelf = new TransformNode('bookshelf', scene);
  shelf.parent = root;
  shelf.position.set(-4.7, 0, -2.0);
  box(scene, 'shelfFrame', [0.22, 2.5, 1.8], [0, 1.2, 0], mat('shelfFrame', '#3a2010', { roughness: 0.9 }), shelf);
  SHELF_Y.forEach((y, i) => box(scene, `shelfBoard${i}`, [0.22, 0.04, 1.75], [0.04, y, 0], wood2Mat, shelf));
  SHELF_Y.slice(0, 4).forEach((shelfY, si) => {
    const booksOnShelf = BOOK_DATA.slice(si * 3, si * 3 + 4);
    let xOffset = -0.7;
    booksOnShelf.forEach((book, bi) => {
      const xPos = xOffset + book.w / 2;
      xOffset += book.w + 0.012;
      const tilt = bi % 3 === 2 ? 0.18 : 0;
      box(scene, `book${si}_${bi}`, [0.08, book.h, book.w], [0.07, shelfY + 0.04 + book.h / 2, xPos], mat(`book${si}_${bi}`, book.color, { roughness: 0.85 }), shelf, [0, 0, tilt]);
    });
  });
  cylinder(scene, 'shelfTrophy', { dTop: 0.08, dBottom: 0.1, h: 0.12, tess: 6 }, [0.07, 2.08, 0.55], mat('shelfTrophy', '#8B6914', { roughness: 0.5, metalness: 0.3 }), shelf);
  sphere(scene, 'shelfOrb', 0.12, [0.07, 2.08, -0.55], mat('shelfOrb', '#4a2a60', { roughness: 0.6 }), shelf, 8);

  // --- Owner chair ---
  const chair = new TransformNode('ownerChair', scene);
  chair.parent = root;
  chair.position.set(0.5, 0, -1.8);
  chair.rotation.y = Math.PI;
  const chairFrameMat = mat('chairFrame', '#5a2e10', { roughness: 0.8 });
  const cushionMat = mat('cushion', '#8B4513', { roughness: 0.75 });
  const chairDarkMat = mat('chairDark', '#4a2010', { roughness: 0.85 });
  shadowCasters.push(box(scene, 'chairSeat', [0.54, 0.07, 0.54], [0, 0.48, 0], chairFrameMat, chair));
  box(scene, 'chairSeatCushion', [0.48, 0.06, 0.48], [0, 0.54, 0], cushionMat, chair);
  shadowCasters.push(box(scene, 'chairBack', [0.54, 0.9, 0.07], [0, 0.92, -0.24], chairFrameMat, chair));
  box(scene, 'chairBackCushion', [0.46, 0.78, 0.05], [0, 0.92, -0.2], cushionMat, chair);
  box(scene, 'chairRail', [0.56, 0.1, 0.1], [0, 1.38, -0.24], chairDarkMat, chair);
  [-0.28, 0.28].forEach((x, i) => {
    box(scene, `chairArm${i}`, [0.07, 0.5, 0.38], [x, 0.75, -0.08], chairDarkMat, chair);
    box(scene, `chairArmTop${i}`, [0.08, 0.05, 0.4], [x, 0.99, -0.08], mat(`chairArmTop${i}`, '#6a3a18', { roughness: 0.7 }), chair);
  });
  ROOM_LEG_OFFSETS.forEach(([lx, lz], i) =>
    cylinder(scene, `chairLeg${i}`, { dTop: 0.06, dBottom: 0.06, h: 0.45, tess: 5 }, [lx, 0.2, lz], mat(`chairLeg${i}`, '#3a1a08', { roughness: 0.9 }), chair),
  );

  // --- Wall fireplace ---
  const fp = new TransformNode('roomFireplace', scene);
  fp.parent = root;
  fp.position.set(3.8, 0, -4.7);
  box(scene, 'rfpSurround', [1.6, 2.0, 0.35], [0, 1.0, 0], mat('rfpSurround', '#2a1a08', { roughness: 0.95 }), fp);
  box(scene, 'rfpFirebox', [0.9, 0.8, 0.3], [0, 0.55, 0.1], mat('rfpFirebox', '#0d0704', { roughness: 0.98 }), fp);
  box(scene, 'rfpMantel', [1.8, 0.1, 0.45], [0, 2.06, 0.1], wood2Mat, fp);
  [-0.65, 0.65].forEach((x, i) => box(scene, `rfpSupport${i}`, [0.12, 1.0, 0.36], [x, 1.55, 0.1], mat(`rfpSupport${i}`, '#3a1f08', { roughness: 0.9 }), fp));

  const rflame1Mat = mat('rflame1', '#ff4400', { emissive: '#ff2200', emissiveIntensity: 2, alpha: 0.88, backFaceCulling: false });
  const rflame2Mat = mat('rflame2', '#ffbb00', { emissive: '#ffdd00', emissiveIntensity: 3, alpha: 0.72, backFaceCulling: false });
  const rfpFlame1 = plane(scene, 'rfpFlame1', 0.55, 0.9, [0, 0.42, 0.16], rflame1Mat, fp, [-Math.PI / 2, 0, 0]);
  const rfpFlame2 = plane(scene, 'rfpFlame2', 0.3, 0.5, [0, 0.52, 0.16], rflame2Mat, fp, [-Math.PI / 2, 0, 0]);

  const rfpLight = new PointLight('rfpLight', new Vector3(0, 0.6, 0.5), scene);
  rfpLight.parent = fp;
  rfpLight.diffuse = Color3.FromHexString('#ff6200');
  rfpLight.intensity = 2.5;
  rfpLight.range = 8;

  // Mantel decorations
  cylinder(scene, 'mantelCup1', { dTop: 0.08, dBottom: 0.12, h: 0.14, tess: 8 }, [-0.5, 2.14, 0.22], goldMat, fp);
  cylinder(scene, 'mantelCup2', { dTop: 0.14, dBottom: 0.08, h: 0.06, tess: 8 }, [-0.5, 2.22, 0.22], goldMat, fp);
  const waxMat = mat('wax', '#f5e6c8', {});
  const flameEmissiveMat = mat('flameEm', '#ffaa00', { emissive: '#ff6600', emissiveIntensity: 2 });
  cylinder(scene, 'mantelCandle', { dTop: 0.06, dBottom: 0.06, h: 0.18, tess: 6 }, [0.5, 2.14, 0.22], waxMat, fp);
  sphere(scene, 'mantelFlame', 0.06, [0.5, 2.24, 0.22], flameEmissiveMat, fp, 6);
  const mantelLight = new PointLight('mantelLight', new Vector3(0.5, 2.3, 0.4), scene);
  mantelLight.parent = fp;
  mantelLight.diffuse = Color3.FromHexString('#ff9944');
  mantelLight.intensity = 0.6;
  mantelLight.range = 2.5;
  // Logs
  [-0.15, 0.15].forEach((x, i) =>
    cylinder(scene, `log${i}`, { dTop: 0.11, dBottom: 0.11, h: 0.7, tess: 7 }, [x, 0.1, 0.12], mat(`log${i}`, '#2a1408', { roughness: 0.95 }), fp, [0, i * 0.4, Math.PI / 2]),
  );

  // --- Desk candle ---
  const deskCandle = new TransformNode('deskCandle', scene);
  deskCandle.parent = root;
  deskCandle.position.set(1.3, 0.88, -3.2);
  cylinder(scene, 'dcPlate', { dTop: 0.14, dBottom: 0.14, h: 0.02, tess: 8 }, [0, 0.01, 0], goldMat, deskCandle);
  cylinder(scene, 'dcWax', { dTop: 0.06, dBottom: 0.07, h: 0.18, tess: 6 }, [0, 0.1, 0], mat('dcWax', '#f0e8d0', {}), deskCandle);
  const dcFlame = sphere(scene, 'dcFlame', 0.05, [0, 0.22, 0], mat('dcFlame', '#ffaa00', { emissive: '#ff6600', emissiveIntensity: 2.5 }), deskCandle, 6);
  const dcLight = new PointLight('dcLight', new Vector3(0, 0.35, 0), scene);
  dcLight.parent = deskCandle;
  dcLight.diffuse = Color3.FromHexString('#ff9944');
  dcLight.intensity = 1.0;
  dcLight.range = 4.5;

  // --- Wall sconce ---
  const sconce = new TransformNode('sconce', scene);
  sconce.parent = root;
  sconce.position.set(-4.72, 2.1, -3.2);
  box(scene, 'scBacking', [0.25, 0.3, 0.08], [0, 0, 0], mat('scBacking', '#3a2010', { roughness: 0.9 }), sconce, [0, Math.PI / 2, 0]);
  box(scene, 'scArm', [0.22, 0.04, 0.04], [0.12, -0.05, 0], goldMat, sconce, [0, 0, -0.3]);
  cylinder(scene, 'scCup', { dTop: 0.1, dBottom: 0.08, h: 0.08, tess: 8 }, [0.22, -0.08, 0], goldMat, sconce);
  cylinder(scene, 'scCandle', { dTop: 0.056, dBottom: 0.06, h: 0.12, tess: 6 }, [0.22, -0.02, 0], mat('scWax', '#f0e8d0', {}), sconce);
  const scFlame = sphere(scene, 'scFlame', 0.044, [0.22, 0.06, 0], mat('scFlame', '#ffaa00', { emissive: '#ff6600', emissiveIntensity: 2.2 }), sconce, 6);
  const scLight = new PointLight('scLight', new Vector3(0.4, 0.1, 0), scene);
  scLight.parent = sconce;
  scLight.diffuse = Color3.FromHexString('#ff9944');
  scLight.intensity = 0.9;
  scLight.range = 4;

  // --- Side table ---
  const sideTable = new TransformNode('sideTable', scene);
  sideTable.parent = root;
  sideTable.position.set(-3.2, 0, -3.8);
  shadowCasters.push(box(scene, 'stTop', [0.7, 0.06, 0.5], [0, 0.62, 0], mat('stTop', '#6b4020', { roughness: 0.72 }), sideTable));
  cylinder(scene, 'stPedestal', { dTop: 0.12, dBottom: 0.16, h: 0.62, tess: 8 }, [0, 0.3, 0], mat('stPedestal', '#4a2a10', { roughness: 0.85 }), sideTable);
  cylinder(scene, 'stBase', { dTop: 0.36, dBottom: 0.36, h: 0.04, tess: 8 }, [0, 0.0, 0], mat('stBase', '#3a1f08', { roughness: 0.9 }), sideTable);
  const lantern = new TransformNode('lantern', scene);
  lantern.parent = sideTable;
  lantern.position.set(0, 0.68, 0);
  box(scene, 'lanternBody', [0.12, 0.18, 0.12], [0, 0, 0], mat('lanternBody', '#2a1a08', { roughness: 0.85, alpha: 0.6 }), lantern);
  box(scene, 'lanternCap', [0.13, 0.04, 0.13], [0, 0.1, 0], goldMat, lantern);
  sphere(scene, 'lanternGlow', 0.08, [0, 0, 0], mat('lanternGlow', '#ffaa00', { emissive: '#ff8800', emissiveIntensity: 2 }), lantern, 6);
  const lanternLight = new PointLight('lanternLight', new Vector3(0, 0.1, 0), scene);
  lanternLight.parent = lantern;
  lanternLight.diffuse = Color3.FromHexString('#ffaa44');
  lanternLight.intensity = 0.7;
  lanternLight.range = 3.0;

  // --- Window ---
  const win = new TransformNode('window', scene);
  win.parent = root;
  win.position.set(-4.72, 1.8, 0.5);
  box(scene, 'winFrame', [1.2, 1.4, 0.12], [0, 0, 0], mat('winFrame', '#2a1408', { roughness: 0.9 }), win, [0, Math.PI / 2, 0]);
  box(scene, 'winGlass', [1.0, 1.2, 0.02], [0.07, 0, 0], mat('winGlass', '#060c1a', { roughness: 0.1, metalness: 0.1, alpha: 0.85 }), win, [0, Math.PI / 2, 0]);
  box(scene, 'winBarH', [1.0, 0.05, 0.06], [0.07, 0, 0], mat('winBar', '#2a1408', { roughness: 0.9 }), win, [0, Math.PI / 2, 0]);
  box(scene, 'winBarV', [0.05, 1.2, 0.06], [0.07, 0, 0], mat('winBar2', '#2a1408', { roughness: 0.9 }), win, [0, Math.PI / 2, 0]);
  disc(scene, 'winMoon', 0.09, [0.12, 0.3, -0.22], mat('winMoon', '#ddeeff', { unlit: true }), win, 12);

  // --- Ambient lighting ---
  const hemi = new HemisphericLight('roomAmbient', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.18;
  hemi.diffuse = Color3.FromHexString('#3a2010');
  hemi.groundColor = Color3.FromHexString('#3a2010');
  const ceilLight = new PointLight('roomCeil', new Vector3(0, 3.2, 0), scene);
  ceilLight.parent = root;
  ceilLight.diffuse = Color3.FromHexString('#7a4a20');
  ceilLight.intensity = 0.3;
  ceilLight.range = 10;

  const update = (t: number) => {
    const flicker = 2.5 + Math.sin(t * 6.8) * 0.7 + Math.sin(t * 12.3) * 0.4 + Math.sin(t * 3.5) * 0.5;
    rfpLight.intensity = Math.max(1.0, flicker);
    rfpFlame1.scaling.x = 1 + Math.sin(t * 7.5) * 0.14;
    rfpFlame1.scaling.z = 1 + Math.sin(t * 5.9) * 0.2;
    rflame1Mat.emissiveColor = Color3.FromHexString('#ff2200').scale(2 + Math.sin(t * 9.1) * 0.6);
    rfpFlame2.scaling.x = 1 + Math.sin(t * 8.7 + 1) * 0.12;
    rfpFlame2.scaling.z = 1 + Math.sin(t * 6.5 + 0.5) * 0.16;

    const dcPulse = 1.0 + Math.sin(t * 5.2) * 0.22 + Math.sin(t * 10.7) * 0.09 + Math.sin(t * 8.1) * 0.07;
    dcLight.intensity = Math.max(0.4, dcPulse);
    dcFlame.scaling.x = 1 + Math.sin(t * 7.3) * 0.15;
    dcFlame.scaling.y = 1 + Math.sin(t * 5.8) * 0.18;

    const scPulse = 0.9 + Math.sin(t * 4.7 + 1.2) * 0.2 + Math.sin(t * 9.3 + 0.6) * 0.08;
    scLight.intensity = Math.max(0.3, scPulse);
    scFlame.scaling.x = 1 + Math.sin(t * 8.1 + 0.5) * 0.14;
    scFlame.scaling.y = 1 + Math.sin(t * 6.4 + 1.1) * 0.17;
  };

  const dispose = () => {
    hemi.dispose();
    ceilLight.dispose();
    rfpLight.dispose();
    mantelLight.dispose();
    dcLight.dispose();
    scLight.dispose();
    lanternLight.dispose();
    disposables.forEach((d) => d.dispose());
    root.dispose();
  };

  return {
    root,
    lights: [hemi, ceilLight, rfpLight, mantelLight, dcLight, scLight, lanternLight],
    update,
    setUpgrades: () => {},
    shadowCasters,
    dispose,
  };
}
