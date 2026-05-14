import type { AdventurerClass } from './types';

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
  healer: '#f1c40f',
};

export const CLASS_LABELS: Record<AdventurerClass, string> = {
  warrior: 'Warrior',
  mage: 'Mage',
  rogue: 'Rogue',
  healer: 'Healer',
};

export const QUEST_POOL = [
  { name: 'Clear the Spider Caves', description: 'Giant spiders have taken over the old mines east of town.', reward: 80, powerRequired: 8, duration: 25 },
  { name: 'Escort the Merchant', description: 'A wealthy merchant needs protection on the northern road.', reward: 50, powerRequired: 5, duration: 15 },
  { name: 'Slay the River Troll', description: 'A massive troll blocks the bridge to Millhaven.', reward: 100, powerRequired: 12, duration: 30 },
  { name: 'Recover the Lost Relic', description: 'An ancient relic was stolen by bandits in the Ashwood.', reward: 120, powerRequired: 15, duration: 35 },
  { name: 'Hunt the Dire Wolf Pack', description: 'Wolves have been terrorizing farming villages to the south.', reward: 70, powerRequired: 9, duration: 20 },
  { name: 'Explore the Haunted Keep', description: 'Restless spirits haunt the old castle north of town.', reward: 90, powerRequired: 11, duration: 25 },
  { name: 'Retrieve Stolen Cargo', description: 'River pirates stole Guild shipments at the docks.', reward: 60, powerRequired: 6, duration: 18 },
  { name: 'Defeat the Goblin Warlord', description: 'Goblins led by a cunning warlord raid supply wagons.', reward: 110, powerRequired: 13, duration: 30 },
  { name: 'Purge the Undead Crypt', description: 'Necromancers have raised an army in the old burial grounds.', reward: 130, powerRequired: 16, duration: 40 },
  { name: 'Rescue the Hostages', description: 'Cultists have taken hostages in the mountains.', reward: 95, powerRequired: 10, duration: 22 },
];

export const WIN_GOLD = 500;
export const MAX_PARTY_SIZE = 8;
export const DISPATCH_COST = 10;

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
