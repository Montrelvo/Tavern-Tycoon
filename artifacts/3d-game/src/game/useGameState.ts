import { useReducer, useEffect, useCallback } from 'react';
import type { GameState, GameAction, Adventurer, Quest } from './types';
import {
  ADVENTURER_NAMES, ADVENTURER_CLASSES, CLASS_LABELS,
  QUEST_POOL, WIN_GOLD, MAX_PARTY_SIZE, DISPATCH_COST,
  ENTRANCE_POS, WANDERING_POSITIONS, WAITING_POSITIONS,
  SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX, ADVENTURER_LEAVE_TIME,
  XP_THRESHOLDS, MAX_LEVEL, POWER_PER_LEVEL,
} from './constants';
import { calculateEffectivePower } from './questUtils';

const SAVE_KEY = 'tavern_save_v1';

let adventurerCounter = 0;
let questCounter = 0;
const usedNames = new Set<string>();

function pickName(): string {
  const unused = ADVENTURER_NAMES.filter(n => !usedNames.has(n));
  const pool = unused.length > 0 ? unused : ADVENTURER_NAMES;
  const name = pool[Math.floor(Math.random() * pool.length)];
  usedNames.add(name);
  return name;
}

function generateAdventurer(occupiedPositions: [number, number, number][]): Adventurer {
  const cls = ADVENTURER_CLASSES[Math.floor(Math.random() * ADVENTURER_CLASSES.length)];
  const available = WANDERING_POSITIONS.filter(
    wp => !occupiedPositions.some(op => op[0] === wp[0] && op[2] === wp[2])
  );
  const targetPos = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : WANDERING_POSITIONS[Math.floor(Math.random() * WANDERING_POSITIONS.length)];

  return {
    id: `adv-${++adventurerCounter}`,
    name: pickName(),
    class: cls,
    power: Math.floor(Math.random() * 8) + 3,
    xp: 0,
    level: 1,
    status: 'entering',
    position: [...ENTRANCE_POS] as [number, number, number],
    targetPosition: targetPos,
    enteredAt: Date.now(),
  };
}

function generateQuests(): Quest[] {
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(q => ({
    ...q,
    id: `quest-${++questCounter}`,
    status: 'available' as const,
    assignedAdventurerIds: [],
  }));
}

function getLevelForXp(xp: number): number {
  let level = 1;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, MAX_LEVEL);
}


function buildFreshState(): GameState {
  return {
    gold: 30,
    adventurers: [],
    quests: generateQuests(),
    gameLog: ['Your tavern is open. Adventurers will arrive soon...'],
    gamePhase: 'playing',
    selectedAdventurerId: null,
    showQuestBoard: false,
  };
}

function syncCountersFromState(state: GameState) {
  for (const adv of state.adventurers) {
    const num = parseInt(adv.id.replace('adv-', ''), 10);
    if (!isNaN(num) && num > adventurerCounter) adventurerCounter = num;
    usedNames.add(adv.name);
  }
  for (const quest of state.quests) {
    const num = parseInt(quest.id.replace('quest-', ''), 10);
    if (!isNaN(num) && num > questCounter) questCounter = num;
  }
}

function loadFromStorage(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return buildFreshState();
    const parsed = JSON.parse(raw) as GameState;
    const persistedAdventurers = parsed.adventurers.filter(
      a => a.status === 'recruited' || a.status === 'on-quest'
    );
    const restored: GameState = {
      ...parsed,
      adventurers: persistedAdventurers,
      selectedAdventurerId: null,
      showQuestBoard: false,
    };
    syncCountersFromState(restored);
    return restored;
  } catch {
    return buildFreshState();
  }
}

function saveToStorage(state: GameState) {
  try {
    const toSave: GameState = {
      ...state,
      adventurers: state.adventurers.filter(
        a => a.status === 'recruited' || a.status === 'on-quest'
      ),
      selectedAdventurerId: null,
      showQuestBoard: false,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore storage errors
  }
}

function addLog(log: string[], message: string): string[] {
  return [message, ...log].slice(0, 20);
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SPAWN_ADVENTURER': {
      if (state.gamePhase !== 'playing') return state;
      return {
        ...state,
        adventurers: [...state.adventurers, action.adventurer],
        gameLog: addLog(state.gameLog,
          `${action.adventurer.name} the ${CLASS_LABELS[action.adventurer.class]} enters your tavern.`)
      };
    }

    case 'ADVENTURER_ARRIVED': {
      return {
        ...state,
        adventurers: state.adventurers.map(a =>
          a.id === action.id
            ? {
                ...a,
                status: a.status === 'entering' ? 'idle' : a.status,
                position: action.position,
                targetPosition: action.position,
              }
            : a
        )
      };
    }

    case 'RECRUIT_ADVENTURER': {
      const adv = state.adventurers.find(a => a.id === action.id);
      if (!adv) return state;
      const recruited = state.adventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
      if (recruited.length >= MAX_PARTY_SIZE) {
        return { ...state, gameLog: addLog(state.gameLog, 'Your roster is full! (max 8 adventurers)') };
      }
      return {
        ...state,
        adventurers: state.adventurers.map(a =>
          a.id === action.id
            ? { ...a, status: 'recruited', targetPosition: action.targetPos }
            : a
        ),
        selectedAdventurerId: null,
        gameLog: addLog(state.gameLog, `${adv.name} joins your roster!`),
      };
    }

    case 'SELECT_ADVENTURER': {
      return { ...state, selectedAdventurerId: action.id };
    }

    case 'TOGGLE_QUEST_BOARD': {
      return { ...state, showQuestBoard: !state.showQuestBoard, selectedAdventurerId: null };
    }

    case 'DISPATCH_QUEST': {
      const quest = state.quests.find(q => q.id === action.questId);
      if (!quest || state.gold < DISPATCH_COST) return state;
      const assignedAdventurers = state.adventurers.filter(a => action.adventurerIds.includes(a.id));
      const effectivePower = calculateEffectivePower(assignedAdventurers, quest.questType);
      const success = effectivePower >= quest.powerRequired;
      return {
        ...state,
        gold: state.gold - DISPATCH_COST,
        quests: state.quests.map(q =>
          q.id === action.questId
            ? { ...q, status: 'active', assignedAdventurerIds: action.adventurerIds, completesAt: Date.now() + quest.duration * 1000 }
            : q
        ),
        adventurers: state.adventurers.map(a =>
          action.adventurerIds.includes(a.id)
            ? { ...a, status: 'on-quest', targetPosition: ENTRANCE_POS }
            : a
        ),
        showQuestBoard: false,
        gameLog: addLog(state.gameLog,
          `Party dispatched on "${quest.name}"! ${success ? 'They look confident.' : 'They seem underpowered...'}`
        ),
      };
    }

    case 'QUEST_RESOLVED': {
      const quest = state.quests.find(q => q.id === action.questId);
      if (!quest) return state;
      const newGold = action.success ? state.gold + quest.reward : state.gold;

      let newAdventurers = state.adventurers;
      let logMsg: string;

      if (action.success) {
        const xpGain = Math.ceil(quest.powerRequired * 1.2);
        newAdventurers = state.adventurers.map(adv => {
          if (!quest.assignedAdventurerIds.includes(adv.id)) return adv;
          const newXp = adv.xp + xpGain;
          const newLevel = getLevelForXp(newXp);
          const leveledUp = newLevel > adv.level;
          const powerIncrease = leveledUp ? (newLevel - adv.level) * POWER_PER_LEVEL : 0;
          return {
            ...adv,
            xp: newXp,
            level: newLevel,
            power: adv.power + powerIncrease,
          };
        });

        const levelUps = newAdventurers
          .filter(a => quest.assignedAdventurerIds.includes(a.id))
          .filter((a, i) => {
            const before = state.adventurers.find(b => b.id === a.id);
            return before && a.level > before.level;
          });

        logMsg = `Quest "${quest.name}" succeeded! Earned ${quest.reward} gold!`;
        if (levelUps.length > 0) {
          logMsg += ` ${levelUps.map(a => `${a.name} reached level ${a.level}!`).join(' ')}`;
        }
      } else {
        newAdventurers = state.adventurers.filter(a => !quest.assignedAdventurerIds.includes(a.id));
        const lostCount = quest.assignedAdventurerIds.length;
        logMsg = `Quest "${quest.name}" failed! ${lostCount} adventurer${lostCount !== 1 ? 's' : ''} lost.`;
      }

      const remainingRoster = newAdventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
      let newPhase = newGold >= WIN_GOLD ? 'won' : state.gamePhase;
      if (newPhase === 'playing' && !action.success && remainingRoster.length === 0) {
        newPhase = 'lost';
      }

      return {
        ...state,
        gold: newGold,
        adventurers: newAdventurers,
        quests: state.quests.map(q =>
          q.id === action.questId ? { ...q, status: action.success ? 'completed' : 'failed' } : q
        ),
        gamePhase: newPhase,
        gameLog: addLog(state.gameLog, logMsg),
      };
    }

    case 'ADVENTURERS_RETURNED': {
      return {
        ...state,
        adventurers: state.adventurers.map(a => {
          const idx = action.adventurerIds.indexOf(a.id);
          if (idx === -1) return a;
          return { ...a, status: 'recruited', targetPosition: action.targetPositions[idx] };
        }),
      };
    }

    case 'REMOVE_ADVENTURER': {
      const adv = state.adventurers.find(a => a.id === action.id);
      const newAdventurers = state.adventurers.filter(a => a.id !== action.id);
      return {
        ...state,
        adventurers: newAdventurers,
        gameLog: adv && adv.status === 'idle'
          ? addLog(state.gameLog, `${adv.name} left without being recruited.`)
          : state.gameLog,
        gamePhase: state.gamePhase,
      };
    }

    case 'REFRESH_QUESTS': {
      const activeQuests = state.quests.filter(q => q.status === 'active');
      const newQuests = generateQuests().filter(nq =>
        !activeQuests.some(aq => aq.name === nq.name)
      ).slice(0, 3 - activeQuests.length);
      return {
        ...state,
        quests: [...activeQuests, ...newQuests],
        gameLog: addLog(state.gameLog, 'New quests are posted on the board!'),
      };
    }

    case 'NEW_GAME': {
      return action.freshState;
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Spawn adventurers
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    const spawnOne = () => {
      const occupiedPositions = state.adventurers
        .filter(a => a.status === 'idle' || a.status === 'entering')
        .map(a => a.targetPosition);
      const adv = generateAdventurer(occupiedPositions);
      dispatch({ type: 'SPAWN_ADVENTURER', adventurer: adv });
    };
    const delay = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
    const timer = setTimeout(spawnOne, delay);
    return () => clearTimeout(timer);
  }, [state.adventurers.length, state.gamePhase]);

  // Check quest completions
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    const activeQuests = state.quests.filter(q => q.status === 'active' && q.completesAt);
    if (activeQuests.length === 0) return;
    const soonest = Math.min(...activeQuests.map(q => q.completesAt!));
    const delay = Math.max(0, soonest - Date.now());
    const timer = setTimeout(() => {
      const now = Date.now();
      activeQuests.forEach(quest => {
        if (!quest.completesAt || quest.completesAt > now) return;
        const assignedAdventurers = state.adventurers.filter(a => quest.assignedAdventurerIds.includes(a.id));
        const effectivePower = calculateEffectivePower(assignedAdventurers, quest.questType);
        const success = effectivePower >= quest.powerRequired;
        dispatch({ type: 'QUEST_RESOLVED', questId: quest.id, success });
        if (success) {
          const returnPositions: [number, number, number][] = quest.assignedAdventurerIds.map(
            (_, i) => WAITING_POSITIONS[i % WAITING_POSITIONS.length]
          );
          dispatch({
            type: 'ADVENTURERS_RETURNED',
            adventurerIds: quest.assignedAdventurerIds,
            targetPositions: returnPositions,
          });
        }
      });
    }, delay + 100);
    return () => clearTimeout(timer);
  }, [state.quests, state.adventurers, state.gamePhase]);

  // Remove idle adventurers who overstay
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    const idlers = state.adventurers.filter(a => a.status === 'idle');
    if (idlers.length === 0) return;
    const oldest = idlers.reduce((min, a) => Math.min(min, a.enteredAt), Infinity);
    const delay = Math.max(0, oldest + ADVENTURER_LEAVE_TIME - Date.now());
    const timer = setTimeout(() => {
      const now = Date.now();
      state.adventurers
        .filter(a => a.status === 'idle' && now - a.enteredAt >= ADVENTURER_LEAVE_TIME)
        .forEach(a => dispatch({ type: 'REMOVE_ADVENTURER', id: a.id }));
    }, delay + 100);
    return () => clearTimeout(timer);
  }, [state.adventurers, state.gamePhase]);

  const recruitAdventurer = useCallback((id: string) => {
    const idx = state.adventurers.filter(a => a.status === 'recruited').length;
    const targetPos = WAITING_POSITIONS[idx % WAITING_POSITIONS.length];
    dispatch({ type: 'RECRUIT_ADVENTURER', id, targetPos });
  }, [state.adventurers]);

  const selectAdventurer = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ADVENTURER', id });
  }, []);

  const toggleQuestBoard = useCallback(() => {
    dispatch({ type: 'TOGGLE_QUEST_BOARD' });
  }, []);

  const dispatchQuest = useCallback((questId: string, adventurerIds: string[]) => {
    dispatch({ type: 'DISPATCH_QUEST', questId, adventurerIds });
  }, []);

  const refreshQuests = useCallback(() => {
    dispatch({ type: 'REFRESH_QUESTS' });
  }, []);

  const markAdventurerArrived = useCallback((id: string, position: [number, number, number]) => {
    dispatch({ type: 'ADVENTURER_ARRIVED', id, position });
  }, []);

  const removeAdventurer = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ADVENTURER', id });
  }, []);

  const newGame = useCallback(() => {
    adventurerCounter = 0;
    questCounter = 0;
    usedNames.clear();
    localStorage.removeItem(SAVE_KEY);
    const freshState = buildFreshState();
    dispatch({ type: 'NEW_GAME', freshState });
  }, []);

  return {
    state,
    recruitAdventurer,
    selectAdventurer,
    toggleQuestBoard,
    dispatchQuest,
    refreshQuests,
    markAdventurerArrived,
    removeAdventurer,
    newGame,
  };
}
