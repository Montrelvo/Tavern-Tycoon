export type AdventurerClass = 'warrior' | 'mage' | 'rogue' | 'healer';
export type PrestigeClass = 'knight' | 'archmage' | 'shadowblade' | 'warden';
export type AdventurerStatus = 'entering' | 'idle' | 'recruited' | 'on-quest';
export type QuestType = 'beast' | 'arcane' | 'stealth' | 'combat';

export type BaseStat = 'str' | 'dex' | 'con' | 'int' | 'wis';

export interface Adventurer {
  id: string;
  name: string;
  class: AdventurerClass;
  prestigeClass: PrestigeClass | null;
  power: number;
  xp: number;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  upgradePoints: number;
  status: AdventurerStatus;
  position: [number, number, number];
  targetPosition: [number, number, number];
  enteredAt: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  reward: number;
  powerRequired: number;
  duration: number;
  questType: QuestType;
  status: 'available' | 'active' | 'completed' | 'failed';
  assignedAdventurerIds: string[];
  completesAt?: number;
}

export interface Upgrades {
  cook: 0 | 1 | 2;
  bard: boolean;
  rosterSlots: 1 | 2 | 3;
  rooms: 0 | 1 | 2;
  basement: boolean;
  trainingGrounds: boolean;
  enchanter: boolean;
  guildHall: boolean;
}

export interface Materials {
  herbs: number;
  ore: number;
  relics: number;
}

export interface GameState {
  gold: number;
  adventurers: Adventurer[];
  quests: Quest[];
  gameLog: string[];
  gamePhase: 'playing' | 'lost';
  selectedAdventurerId: string | null;
  showQuestBoard: boolean;
  upgrades: Upgrades;
  materials: Materials;
  questsCompleted: number;
  tavernPrestige: 0 | 1 | 2 | 3;
}

export type GameAction =
  | { type: 'SPAWN_ADVENTURER'; adventurer: Adventurer }
  | { type: 'ADVENTURER_ARRIVED'; id: string; position: [number, number, number] }
  | { type: 'RECRUIT_ADVENTURER'; id: string; targetPos: [number, number, number] }
  | { type: 'SELECT_ADVENTURER'; id: string | null }
  | { type: 'DISPATCH_QUEST'; questId: string; adventurerIds: string[] }
  | { type: 'QUEST_RESOLVED'; questId: string; success: boolean }
  | { type: 'ADVENTURERS_RETURNED'; adventurerIds: string[]; targetPositions: [number, number, number][] }
  | { type: 'REMOVE_ADVENTURER'; id: string }
  | { type: 'TOGGLE_QUEST_BOARD' }
  | { type: 'REFRESH_QUESTS' }
  | { type: 'NEW_GAME'; freshState: GameState }
  | { type: 'WANDER_TICK'; updates: { id: string; target: [number, number, number] }[] }
  | { type: 'RECOVER_HP' }
  | { type: 'HIRE_UPGRADE'; upgrade: 'cook' | 'cook_plus' | 'bard' | 'roster_2' | 'roster_3' | 'rooms' | 'rooms_expansion' | 'basement' | 'training_grounds' | 'enchanter' | 'guild_hall' }
  | { type: 'SELL_MATERIALS' }
  | { type: 'ROOM_INCOME' }
  | { type: 'SPEND_UPGRADE_POINT'; adventurerId: string; stat: 'hp' | 'attack' | 'defense' }
  | { type: 'PRESTIGE_ADVENTURER'; id: string };
