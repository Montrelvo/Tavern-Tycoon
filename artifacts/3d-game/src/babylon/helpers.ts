import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';

/** Materials may be lit by many candle/fire point lights at once. */
const MAX_LIGHTS = 12;

export function hexToColor3(hex: string): Color3 {
  return Color3.FromHexString(hex);
}

export interface MatOptions {
  /** 0 = mirror-smooth, 1 = fully matte. Default 0.8. */
  roughness?: number;
  /** 0 = dielectric, 1 = metal. Default 0. */
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  alpha?: number;
  /** Unlit (basic) material — emissive carries the colour. */
  unlit?: boolean;
  backFaceCulling?: boolean;
}

/**
 * Builds a StandardMaterial tuned to roughly match the look of the R3F
 * `meshStandardMaterial` used elsewhere in the game. Specular is derived from
 * roughness/metalness so matte wood reads matte and metal trim reads shiny.
 */
export function makeMaterial(
  scene: Scene,
  name: string,
  color: string,
  opts: MatOptions = {},
): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = hexToColor3(color);

  const rough = opts.roughness ?? 0.8;
  const metal = opts.metalness ?? 0;
  const specBase = Math.max(0, (1 - rough) * 0.55 + metal * 0.35);

  if (metal > 0.3) {
    m.specularColor = hexToColor3(color).scale(specBase + 0.15);
  } else {
    m.specularColor = new Color3(specBase, specBase, specBase);
  }
  m.specularPower = 12 + (1 - rough) * 90;

  if (opts.emissive) {
    m.emissiveColor = hexToColor3(opts.emissive).scale(opts.emissiveIntensity ?? 1);
  }
  if (opts.alpha !== undefined && opts.alpha < 1) {
    m.alpha = opts.alpha;
  }
  if (opts.unlit) {
    m.disableLighting = true;
    m.diffuseColor = new Color3(0, 0, 0);
    if (!opts.emissive) {
      m.emissiveColor = hexToColor3(color).scale(opts.emissiveIntensity ?? 1);
    }
  }
  if (opts.backFaceCulling === false) m.backFaceCulling = false;

  m.maxSimultaneousLights = MAX_LIGHTS;
  return m;
}

type Vec3 = [number, number, number];

export function box(
  scene: Scene,
  name: string,
  size: Vec3,
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
  rot?: Vec3,
): Mesh {
  const m = MeshBuilder.CreateBox(
    name,
    { width: size[0], height: size[1], depth: size[2] },
    scene,
  );
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

export function cylinder(
  scene: Scene,
  name: string,
  dims: { dTop: number; dBottom: number; h: number; tess?: number },
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
  rot?: Vec3,
): Mesh {
  const m = MeshBuilder.CreateCylinder(
    name,
    {
      diameterTop: dims.dTop,
      diameterBottom: dims.dBottom,
      height: dims.h,
      tessellation: dims.tess ?? 12,
    },
    scene,
  );
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

export function sphere(
  scene: Scene,
  name: string,
  diameter: number,
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
  segments = 8,
): Mesh {
  const m = MeshBuilder.CreateSphere(name, { diameter, segments }, scene);
  m.position.set(pos[0], pos[1], pos[2]);
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

export function plane(
  scene: Scene,
  name: string,
  w: number,
  h: number,
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
  rot?: Vec3,
): Mesh {
  const m = MeshBuilder.CreatePlane(name, { width: w, height: h }, scene);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

/** A flat ground tile in the XZ plane (normal +Y), like an R3F floor plane. */
export function ground(
  scene: Scene,
  name: string,
  w: number,
  h: number,
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
  rotY = 0,
): Mesh {
  const m = MeshBuilder.CreateGround(name, { width: w, height: h }, scene);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rotY) m.rotation.y = rotY;
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

export function disc(
  scene: Scene,
  name: string,
  radius: number,
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
  tessellation = 24,
): Mesh {
  const m = MeshBuilder.CreateDisc(name, { radius, tessellation }, scene);
  m.position.set(pos[0], pos[1], pos[2]);
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

export function torus(
  scene: Scene,
  name: string,
  diameter: number,
  thickness: number,
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
  rot?: Vec3,
  tessellation = 20,
): Mesh {
  const m = MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation }, scene);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

export function ring(
  scene: Scene,
  name: string,
  innerRadius: number,
  outerRadius: number,
  pos: Vec3,
  mat: StandardMaterial,
  parent?: TransformNode,
): Mesh {
  // A thin flat torus approximates the R3F selection ring on the floor.
  const mid = (innerRadius + outerRadius) / 2;
  const thickness = outerRadius - innerRadius;
  const m = MeshBuilder.CreateTorus(
    name,
    { diameter: mid * 2, thickness, tessellation: 24 },
    scene,
  );
  m.position.set(pos[0], pos[1], pos[2]);
  m.scaling.y = 0.05;
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}

export { Vector3 };
