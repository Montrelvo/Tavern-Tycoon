export type AdventurerClass = 'warrior' | 'mage' | 'rogue' | 'healer';
export type AdventurerStatus = 'entering' | 'idle' | 'recruited' | 'on-quest';

export interface Adventurer {
  id: string;
  name: string;
  class: AdventurerClass;
  power: number;
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
  status: 'available' | 'active' | 'completed' | 'failed';
  assignedAdventurerIds: string[];
  completesAt?: number;
}

export interface GameState {
  gold: number;
  adventurers: Adventurer[];
  quests: Quest[];
  gameLog: string[];
  gamePhase: 'playing' | 'won' | 'lost';
  selectedAdventurerId: string | null;
  showQuestBoard: boolean;
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
  | { type: 'TICK' };
