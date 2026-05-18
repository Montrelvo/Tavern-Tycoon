# Adventurer Models (.glb)

Drop `.glb` files into this folder to give specific adventurer classes
or prestige classes custom 3D models with animations. If no model is
registered for a class, the game falls back to the procedural box-man
mesh that's always been there — so this is purely additive.

## How it works

1. Place your `.glb` file in `public/models/`, for example
   `public/models/warrior.glb`. The file is served from the artifact's
   base URL at runtime (Vite serves the `public/` folder as the web
   root for this artifact).
2. Open `src/models/adventurerModels.ts` and add an entry to the
   `ADVENTURER_MODELS` registry, keyed by the adventurer class
   (`warrior`, `mage`, `rogue`, `healer`) or by prestige class
   (`knight`, `archmage`, `shadowblade`, `warden`). Prestige takes
   priority when both are registered.
3. Reload. The mesh is automatically used everywhere an adventurer is
   rendered — the tavern scene and the roster sheet's character
   viewport — including selection / hover highlight and idle vs.
   walking animation states.

## Example registration

```ts
// src/models/adventurerModels.ts
export const ADVENTURER_MODELS: Partial<Record<AdventurerModelKey, AdventurerModelConfig>> = {
  warrior: {
    url: 'models/warrior.glb',
    scale: 0.5,
    yOffset: -0.5,        // raise/lower so feet sit on the ground plane
    rotationOffsetY: 0,   // radians, if the model faces the wrong way
    idleAnimation: 'Idle',
    walkAnimation: 'Walk',
    tintAllMeshes: true,  // recolor every mesh's base color to class color
    // Or, to recolor only specific materials:
    // tintMaterials: ['Body', 'Cape'],
  },
};
```

## Config fields

- `url` — path relative to the artifact base URL. Use a leading-slash-
  free path like `models/warrior.glb`; the loader resolves it relative
  to the artifact base.
- `scale` — number or `[x, y, z]`. Defaults to `1`.
- `yOffset` — vertical translation applied before render. Use a
  negative value if your model's pivot is at the head/chest rather
  than the feet.
- `rotationOffsetY` — radians of rotation around Y, applied before
  the movement-facing rotation, in case your model's forward axis
  doesn't match the engine's (`+Z`).
- `idleAnimation` / `walkAnimation` — name of the animation clip in
  the `.glb` to play in the corresponding state. If omitted, the
  first available clip is used.
- `tintAllMeshes` — set to `true` to recolor every mesh in the model
  with the class / prestige color. Useful for monochrome / symbolic
  models.
- `tintMaterials` — alternative to `tintAllMeshes`: a list of
  material names that should be recolored. Other materials keep
  their authored color.

## Animation states

The engine currently drives two states:

- `idle` — the adventurer is standing still (resting in the tavern,
  selected in the roster sheet, etc.).
- `walking` — the adventurer is moving toward a `targetPosition`.

Add `idleAnimation` and `walkAnimation` clip names to take advantage
of this; if either is missing, the other is used as a fallback.

## Notes

- Models are loaded via `@react-three/drei`'s `useGLTF`, cached for
  the lifetime of the page, and preloaded at startup so the first
  appearance of a configured class doesn't pop in.
- Each instance gets a deep-cloned scene (via three's
  `SkeletonUtils.clone`) so skeletons and material tinting do not
  bleed between adventurers.
- During load, the procedural fallback renders so adventurers never
  appear as empty space.
