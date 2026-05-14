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
export const ROSTER_CAPS = [5, 8, 12];

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
