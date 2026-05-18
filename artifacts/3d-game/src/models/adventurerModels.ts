import type { AdventurerClass, PrestigeClass } from '../game/types';

export type AdventurerModelKey = AdventurerClass | PrestigeClass;

export interface AdventurerModelConfig {
  url: string;
  scale?: number | [number, number, number];
  yOffset?: number;
  rotationOffsetY?: number;
  idleAnimation?: string;
  walkAnimation?: string;
  tintMaterials?: string[];
  tintAllMeshes?: boolean;
}

export const ADVENTURER_MODELS: Partial<Record<AdventurerModelKey, AdventurerModelConfig>> = {
};

export function getAdventurerModelConfig(
  klass: AdventurerClass,
  prestige: PrestigeClass | null,
): AdventurerModelConfig | undefined {
  if (prestige && ADVENTURER_MODELS[prestige]) return ADVENTURER_MODELS[prestige];
  return ADVENTURER_MODELS[klass];
}

export function getAllAdventurerModelUrls(): string[] {
  const urls = new Set<string>();
  for (const cfg of Object.values(ADVENTURER_MODELS)) {
    if (cfg?.url) urls.add(cfg.url);
  }
  return Array.from(urls);
}
