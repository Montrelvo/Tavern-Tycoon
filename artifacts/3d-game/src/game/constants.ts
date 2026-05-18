import type { AdventurerClass, PrestigeClass, QuestType } from './types';

export const ADVENTURER_NAMES = [
  'Aldric', 'Brynn', 'Caelum', 'Dara', 'Eryn',
  'Fynn', 'Gale', 'Hadwin', 'Isla', 'Jorgen',
  'Kira', 'Lorn', 'Mira', 'Nael', 'Oswin',
  'Petra', 'Quinn', 'Rion', 'Sylva', 'Torben',
];

export const ADVENTURER_CLASSES: AdventurerClass[] = ['warrior', 'mage', 'rogue', 'healer'];

export const CLASS_COLORS: Record<AdventurerClass, string> = {
  warrior: '#e74c3c',
  mage: '#3498db',
  rogue: '#2ecc71',
  healer: '#f0f0f0',
};

export const CLASS_LABELS: Record<AdventurerClass, string> = {
  warrior: 'Warrior',
  mage: 'Mage',
  rogue: 'Rogue',
  healer: 'Healer',
};

export const CLASS_PASSIVE_LABELS: Record<AdventurerClass, string> = {
  warrior: '+3 power on Beast quests',
  mage: '+3 power on Arcane quests',
  rogue: '+3 power on Stealth quests',
  healer: '+2 power on all quests',
};

export const CLASS_BONUS_QUEST_TYPE: Record<AdventurerClass, QuestType | 'all'> = {
  warrior: 'beast',
  mage: 'arcane',
  rogue: 'stealth',
  healer: 'all',
};

export const QUEST_TYPE_LABELS: Record<QuestType, string> = {
  beast: 'Beast',
  arcane: 'Arcane',
  stealth: 'Stealth',
  combat: 'Combat',
};

export const QUEST_TYPE_COLORS: Record<QuestType, string> = {
  beast: '#e67e22',
  arcane: '#9b59b6',
  stealth: '#27ae60',
  combat: '#c0392b',
};

export const XP_THRESHOLDS = [0, 15, 35, 60, 90];
export const MAX_LEVEL = 5;
export const ELITE_LEVEL = 4;
export const POWER_PER_LEVEL = 2;

export const QUEST_POOL = [
  { name: 'Clear the Spider Caves', description: 'Giant spiders have taken over the old mines east of town.', reward: 80, powerRequired: 8, duration: 25, questType: 'beast' as QuestType },
  { name: 'Escort the Merchant', description: 'A wealthy merchant needs protection on the northern road.', reward: 50, powerRequired: 5, duration: 15, questType: 'stealth' as QuestType },
  { name: 'Slay the River Troll', description: 'A massive troll blocks the bridge to Millhaven.', reward: 100, powerRequired: 12, duration: 30, questType: 'beast' as QuestType },
  { name: 'Recover the Lost Relic', description: 'An ancient relic was stolen by bandits in the Ashwood.', reward: 120, powerRequired: 15, duration: 35, questType: 'arcane' as QuestType },
  { name: 'Hunt the Dire Wolf Pack', description: 'Wolves have been terrorizing farming villages to the south.', reward: 70, powerRequired: 9, duration: 20, questType: 'beast' as QuestType },
  { name: 'Explore the Haunted Keep', description: 'Restless spirits haunt the old castle north of town.', reward: 90, powerRequired: 11, duration: 25, questType: 'arcane' as QuestType },
  { name: 'Retrieve Stolen Cargo', description: 'River pirates stole Guild shipments at the docks.', reward: 60, powerRequired: 6, duration: 18, questType: 'stealth' as QuestType },
  { name: 'Defeat the Goblin Warlord', description: 'Goblins led by a cunning warlord raid supply wagons.', reward: 110, powerRequired: 13, duration: 30, questType: 'combat' as QuestType },
  { name: 'Purge the Undead Crypt', description: 'Necromancers have raised an army in the old burial grounds.', reward: 130, powerRequired: 16, duration: 40, questType: 'arcane' as QuestType },
  { name: 'Rescue the Hostages', description: 'Cultists have taken hostages in the mountains.', reward: 95, powerRequired: 10, duration: 22, questType: 'stealth' as QuestType },
];

export const MAX_PARTY_SIZE = 8;
export const DISPATCH_COST = 10;
export const ROSTER_BASE = 10;
export const ROSTER_UPGRADE_SIZE = 5;
export const ROSTER_UPGRADE_COST = 100;

export const CLASS_STAT_COLORS: Record<string, string> = {
  hp: '#e74c3c',
  attack: '#e67e22',
  defense: '#3498db',
};

export const WANDER_INTERVAL_MIN = 8000;
export const WANDER_INTERVAL_MAX = 15000;
export const HP_RECOVERY_INTERVAL = 10000;

export const SPAWN_INTERVAL_MIN = 12000;
export const SPAWN_INTERVAL_MAX = 22000;
export const ADVENTURER_LEAVE_TIME = 45000;

export const ENTRANCE_POS: [number, number, number] = [0, 0.5, 6.5];

export const WANDERING_POSITIONS: [number, number, number][] = [
  [2, 0.5, 2], [-1, 0.5, 1], [1, 0.5, -1], [3, 0.5, -2],
  [-2, 0.5, 3], [0.5, 0.5, 0], [2, 0.5, -3], [-1, 0.5, -2],
  [1, 0.5, 3], [3, 0.5, 1],
];

export const WAITING_POSITIONS: [number, number, number][] = [
  [-5, 0.5, -3], [-5, 0.5, -1], [-5, 0.5, 1], [-5, 0.5, 3],
  [-6, 0.5, -2], [-6, 0.5, 0], [-6, 0.5, 2], [-4, 0.5, 0],
];

export const TAVERN_PRESTIGE_THRESHOLDS = [10, 25, 50];
export const TAVERN_PRESTIGE_NAMES = ['Renowned', 'Celebrated', 'Legendary'];
export const PRESTIGE_ADVENTURER_COST = 50;

export const PRESTIGE_CLASS_LABELS: Record<PrestigeClass, string> = {
  knight: 'Knight',
  archmage: 'Archmage',
  shadowblade: 'Shadowblade',
  warden: 'Warden',
};

export const PRESTIGE_CLASS_COLORS: Record<PrestigeClass, string> = {
  knight: '#f1c40f',
  archmage: '#8e44ad',
  shadowblade: '#1abc9c',
  warden: '#bdc3c7',
};

export const PRESTIGE_CLASS_PASSIVE_LABELS: Record<PrestigeClass, string> = {
  knight: '+5 power on Beast & Combat quests',
  archmage: '+5 power on Arcane & Stealth quests',
  shadowblade: '+5 power on Stealth & Beast quests',
  warden: '+3 power on all quest types',
};

export const PRESTIGE_CLASS_FOR: Record<AdventurerClass, PrestigeClass> = {
  warrior: 'knight',
  mage: 'archmage',
  rogue: 'shadowblade',
  healer: 'warden',
};

export type BaseStat = 'str' | 'dex' | 'con' | 'int' | 'wis';

export const STAT_LABELS: Record<BaseStat, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS',
};

export const STAT_FULL_LABELS: Record<BaseStat, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom',
};

export const STAT_COLORS: Record<BaseStat, string> = {
  str: '#e74c3c', dex: '#2ecc71', con: '#e67e22', int: '#3498db', wis: '#9b59b6',
};

export const BASE_STATS_BY_CLASS: Record<AdventurerClass, Record<BaseStat, number>> = {
  warrior: { str: 12, dex: 8,  con: 10, int: 5,  wis: 5  },
  mage:    { str:  4, dex: 7,  con:  5, int: 14, wis: 10 },
  rogue:   { str:  8, dex: 14, con:  7, int:  6, wis: 5  },
  healer:  { str:  5, dex: 6,  con:  9, int:  8, wis: 12 },
};

export const STAT_GROWTH_BY_CLASS: Record<AdventurerClass, Record<BaseStat, number>> = {
  warrior: { str: 2, dex: 1, con: 2, int: 0, wis: 0 },
  mage:    { str: 0, dex: 1, con: 0, int: 3, wis: 1 },
  rogue:   { str: 1, dex: 3, con: 1, int: 1, wis: 0 },
  healer:  { str: 0, dex: 0, con: 1, int: 1, wis: 3 },
};

export const STAT_DESCRIPTIONS: Record<BaseStat, string> = {
  str: 'Raw physical power. Governs melee damage and carrying capacity.',
  dex: 'Speed and precision. Affects evasion and ranged attacks.',
  con: 'Endurance and vitality. Higher constitution means more HP.',
  int: 'Magical aptitude. Amplifies spell power and arcane knowledge.',
  wis: 'Perception and spirit. Enhances healing and resistance to curses.',
};

export interface GearRecipe {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: { herbs: number; ore: number };
  effects: Array<{ stat: 'attack' | 'defense' | 'maxHp'; amount: number }>;
}

export const GEAR_RECIPES: GearRecipe[] = [
  {
    id: 'sharpening_stone',
    name: 'Sharpening Stone',
    icon: '🪨',
    description: 'Honed from raw ore, this whetstone brings every blade to a razor edge.',
    cost: { herbs: 0, ore: 2 },
    effects: [{ stat: 'attack', amount: 2 }],
  },
  {
    id: 'herbal_salve',
    name: 'Herbal Salve',
    icon: '🌿',
    description: 'A soothing balm brewed from field herbs that bolsters the constitution of all in your service.',
    cost: { herbs: 2, ore: 0 },
    effects: [{ stat: 'maxHp', amount: 20 }],
  },
  {
    id: 'iron_plates',
    name: 'Iron Plates',
    icon: '🛡',
    description: 'Hammered ore plates riveted to armour for meaningful additional protection.',
    cost: { herbs: 0, ore: 3 },
    effects: [{ stat: 'defense', amount: 2 }],
  },
  {
    id: 'fortifying_tonic',
    name: 'Fortifying Tonic',
    icon: '⚗️',
    description: 'A potent herbal draught that hardens sinew and floods veins with vigour.',
    cost: { herbs: 3, ore: 0 },
    effects: [{ stat: 'maxHp', amount: 35 }],
  },
  {
    id: 'war_kit',
    name: 'War Kit',
    icon: '⚔️',
    description: 'Ore-tipped weapons and herbal combat rations prepared for every fighter in the party.',
    cost: { herbs: 2, ore: 2 },
    effects: [{ stat: 'attack', amount: 2 }, { stat: 'maxHp', amount: 15 }],
  },
  {
    id: 'bulwark_set',
    name: 'Bulwark Set',
    icon: '🪖',
    description: 'Reinforced pauldrons and medicinal poultices that make adventurers a wall of steel and herb.',
    cost: { herbs: 2, ore: 3 },
    effects: [{ stat: 'defense', amount: 3 }, { stat: 'maxHp', amount: 20 }],
  },
];
