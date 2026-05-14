import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, GameAction, Adventurer, Quest } from './types';
import type { AdventurerClass } from './types';
import {
  ADVENTURER_NAMES, ADVENTURER_CLASSES, CLASS_LABELS,
  QUEST_POOL, WIN_GOLD, MAX_PARTY_SIZE, DISPATCH_COST,
  ENTRANCE_POS, WANDERING_POSITIONS, WAITING_POSITIONS,
  SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX, ADVENTURER_LEAVE_TIME,
  XP_THRESHOLDS, MAX_LEVEL, POWER_PER_LEVEL,
  WANDER_INTERVAL_MIN, WANDER_INTERVAL_MAX, HP_RECOVERY_INTERVAL,
  ROSTER_CAPS,
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

interface ClassStats {
  baseHp: number;
  hpPerLevel: number;
  baseAttack: number;
  attackPerLevel: number;
  baseDefense: number;
  defensePerLevel: number;
}

const CLASS_STAT_BASES: Record<AdventurerClass, ClassStats> = {
  warrior:  { baseHp: 80, hpPerLevel: 15, baseAttack: 12, attackPerLevel: 2, baseDefense: 4,  defensePerLevel: 1 },
  mage:     { baseHp: 45, hpPerLevel: 8,  baseAttack: 20, attackPerLevel: 4, baseDefense: 3,  defensePerLevel: 1 },
  rogue:    { baseHp: 60, hpPerLevel: 10, baseAttack: 14, attackPerLevel: 3, baseDefense: 6,  defensePerLevel: 1 },
  healer:   { baseHp: 75, hpPerLevel: 12, baseAttack: 8,  attackPerLevel: 1, baseDefense: 10, defensePerLevel: 2 },
};

function getClassStats(cls: AdventurerClass, level: number) {
  const s = CLASS_STAT_BASES[cls];
  return {
    maxHp:   s.baseHp   + (level - 1) * s.hpPerLevel,
    attack:  s.baseAttack  + (level - 1) * s.attackPerLevel,
    defense: s.baseDefense + (level - 1) * s.defensePerLevel,
  };
}

function pickRandomWaypoint(exclude?: [number, number, number][]): [number, number, number] {
  const pool = exclude && exclude.length > 0
    ? WANDERING_POSITIONS.filter(wp => !exclude.some(e => e[0] === wp[0] && e[2] === wp[2]))
    : WANDERING_POSITIONS;
  const src = pool.length > 0 ? pool : WANDERING_POSITIONS;
  return src[Math.floor(Math.random() * src.length)];
}

function generateAdventurer(occupiedPositions: [number, number, number][]): Adventurer {
  const cls = ADVENTURER_CLASSES[Math.floor(Math.random() * ADVENTURER_CLASSES.length)];
  const targetPos = pickRandomWaypoint(occupiedPositions);
  const level = 1;
  const { maxHp, attack, defense } = getClassStats(cls, level);

  return {
    id: `adv-${++adventurerCounter}`,
    name: pickName(),
    class: cls,
    power: Math.floor(Math.random() * 8) + 3,
    xp: 0,
    level,
    hp: maxHp,
    maxHp,
    attack,
    defense,
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


const DEFAULT_UPGRADES = { cook: 0 as const, bard: false, rosterSlots: 1 as const };

function getRosterMax(upgrades: { rosterSlots?: 1 | 2 | 3 }): number {
  return ROSTER_CAPS[(upgrades.rosterSlots ?? 1) - 1];
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
    upgrades: { ...DEFAULT_UPGRADES },
  };
}

function ensureAdventurerStats(adv: Adventurer): Adventurer {
  if (adv.hp !== undefined && adv.maxHp !== undefined && adv.attack !== undefined && adv.defense !== undefined) {
    return adv;
  }
  const { maxHp, attack, defense } = getClassStats(adv.class, adv.level);
  return {
    ...adv,
    hp: adv.hp ?? maxHp,
    maxHp: adv.maxHp ?? maxHp,
    attack: adv.attack ?? attack,
    defense: adv.defense ?? defense,
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
    const persistedAdventurers = parsed.adventurers
      .filter(a => a.status === 'recruited' || a.status === 'on-quest')
      .map(ensureAdventurerStats);
    const mergedUpgrades = {
      ...DEFAULT_UPGRADES,
      ...(parsed.upgrades ?? {}),
      rosterSlots: (parsed.upgrades?.rosterSlots ?? 1) as 1 | 2 | 3,
    };
    const restored: GameState = {
      ...parsed,
      adventurers: persistedAdventurers,
      selectedAdventurerId: null,
      showQuestBoard: false,
      upgrades: mergedUpgrades,
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
      const rosterMax = getRosterMax(state.upgrades);
      if (recruited.length >= rosterMax) {
        return { ...state, gameLog: addLog(state.gameLog, `Your roster is full! (max ${rosterMax} adventurers)`) };
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

      const successMultiplier = 0.3;
      const failMultiplier = 0.65;
      const damagePerAdv = action.success
        ? Math.max(1, Math.floor(quest.powerRequired * successMultiplier))
        : Math.max(2, Math.floor(quest.powerRequired * failMultiplier));

      let newAdventurers = state.adventurers;
      let newGold = action.success ? state.gold + quest.reward : state.gold;
      const deathLog: string[] = [];
      let logMsg: string;

      if (action.success) {
        const baseXp = Math.ceil(quest.powerRequired * 1.2);
        const xpGain = state.upgrades.bard ? Math.ceil(baseXp * 1.25) : baseXp;
        newAdventurers = state.adventurers.map(adv => {
          if (!quest.assignedAdventurerIds.includes(adv.id)) return adv;
          const newHp = Math.max(0, adv.hp - damagePerAdv);
          const newXp = adv.xp + xpGain;
          const newLevel = getLevelForXp(newXp);
          const leveledUp = newLevel > adv.level;
          const powerIncrease = leveledUp ? (newLevel - adv.level) * POWER_PER_LEVEL : 0;
          if (leveledUp) {
            const { maxHp: newMaxHp, attack: newAttack, defense: newDefense } = getClassStats(adv.class, newLevel);
            return {
              ...adv,
              xp: newXp,
              level: newLevel,
              power: adv.power + powerIncrease,
              hp: Math.min(newHp + 10, newMaxHp),
              maxHp: newMaxHp,
              attack: newAttack,
              defense: newDefense,
            };
          }
          return { ...adv, xp: newXp, level: newLevel, power: adv.power + powerIncrease, hp: newHp };
        });

        const died = newAdventurers.filter(a =>
          quest.assignedAdventurerIds.includes(a.id) && a.hp <= 0
        );
        died.forEach(a => deathLog.push(`${a.name} succumbed to wounds after the quest!`));
        newAdventurers = newAdventurers.filter(a => a.hp > 0);

        const levelUps = newAdventurers
          .filter(a => quest.assignedAdventurerIds.includes(a.id))
          .filter(a => {
            const before = state.adventurers.find(b => b.id === a.id);
            return before && a.level > before.level;
          });

        logMsg = `Quest "${quest.name}" succeeded! Earned ${quest.reward} gold!`;
        if (levelUps.length > 0) {
          logMsg += ` ${levelUps.map(a => `${a.name} reached level ${a.level}!`).join(' ')}`;
        }
      } else {
        newAdventurers = state.adventurers.map(adv => {
          if (!quest.assignedAdventurerIds.includes(adv.id)) return adv;
          const newHp = Math.max(0, adv.hp - damagePerAdv);
          return { ...adv, hp: newHp };
        });

        const died = newAdventurers.filter(a =>
          quest.assignedAdventurerIds.includes(a.id) && a.hp <= 0
        );
        died.forEach(a => deathLog.push(`${a.name} was lost on the quest!`));
        newAdventurers = newAdventurers.filter(a => a.hp > 0);

        const lostCount = died.length;
        const survivorCount = quest.assignedAdventurerIds.length - lostCount;
        logMsg = `Quest "${quest.name}" failed!`;
        if (lostCount > 0) logMsg += ` ${lostCount} adventurer${lostCount !== 1 ? 's' : ''} lost.`;
        if (survivorCount > 0) logMsg += ` ${survivorCount} survived, badly wounded.`;
      }

      let finalLog = addLog(state.gameLog, logMsg);
      deathLog.forEach(msg => { finalLog = addLog(finalLog, msg); });

      const remainingRoster = newAdventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
      let newPhase: GameState['gamePhase'] = newGold >= WIN_GOLD ? 'won' : state.gamePhase;
      if (newPhase === 'playing' && remainingRoster.length === 0) {
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
        gameLog: finalLog,
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

    case 'WANDER_TICK': {
      if (state.gamePhase !== 'playing') return state;
      const updateMap = new Map(action.updates.map(u => [u.id, u.target]));
      return {
        ...state,
        adventurers: state.adventurers.map(a => {
          const newTarget = updateMap.get(a.id);
          if (!newTarget) return a;
          return { ...a, targetPosition: newTarget };
        }),
      };
    }

    case 'RECOVER_HP': {
      if (state.gamePhase !== 'playing') return state;
      const hpPerTick = state.upgrades.cook === 2 ? 6 : state.upgrades.cook === 1 ? 3 : 1;
      return {
        ...state,
        adventurers: state.adventurers.map(a => {
          if (a.status !== 'idle' && a.status !== 'recruited') return a;
          if (a.hp >= a.maxHp) return a;
          return { ...a, hp: Math.min(a.maxHp, a.hp + hpPerTick) };
        }),
      };
    }

    case 'HIRE_UPGRADE': {
      if (state.gamePhase !== 'playing') return state;
      const { upgrade } = action;
      if (upgrade === 'cook') {
        if (state.upgrades.cook >= 1 || state.gold < 80) return state;
        return {
          ...state,
          gold: state.gold - 80,
          upgrades: { ...state.upgrades, cook: 1 },
          gameLog: addLog(state.gameLog, 'A cook joins your tavern!'),
        };
      }
      if (upgrade === 'cook_plus') {
        if (state.upgrades.cook !== 1 || state.gold < 160) return state;
        return {
          ...state,
          gold: state.gold - 160,
          upgrades: { ...state.upgrades, cook: 2 },
          gameLog: addLog(state.gameLog, 'Your cook has mastered the kitchen! (Cook+)'),
        };
      }
      if (upgrade === 'bard') {
        if (state.upgrades.bard || state.gold < 60) return state;
        return {
          ...state,
          gold: state.gold - 60,
          upgrades: { ...state.upgrades, bard: true },
          gameLog: addLog(state.gameLog, 'A bard joins your tavern, filling it with music!'),
        };
      }
      if (upgrade === 'roster_2') {
        if ((state.upgrades.rosterSlots ?? 1) >= 2 || state.gold < 100) return state;
        return {
          ...state,
          gold: state.gold - 100,
          upgrades: { ...state.upgrades, rosterSlots: 2 },
          gameLog: addLog(state.gameLog, 'Roster expanded! You can now recruit up to 8 adventurers.'),
        };
      }
      if (upgrade === 'roster_3') {
        if ((state.upgrades.rosterSlots ?? 1) >= 3 || state.gold < 200) return state;
        return {
          ...state,
          gold: state.gold - 200,
          upgrades: { ...state.upgrades, rosterSlots: 3 },
          gameLog: addLog(state.gameLog, 'Full company assembled! You can now recruit up to 12 adventurers.'),
        };
      }
      return state;
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Spawn adventurers
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    const spawnOne = () => {
      const occupiedPositions = stateRef.current.adventurers
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
      const currentState = stateRef.current;
      activeQuests.forEach(quest => {
        if (!quest.completesAt || quest.completesAt > now) return;
        const assignedAdventurers = currentState.adventurers.filter(a => quest.assignedAdventurerIds.includes(a.id));
        const effectivePower = calculateEffectivePower(assignedAdventurers, quest.questType);
        const success = effectivePower >= quest.powerRequired;
        dispatch({ type: 'QUEST_RESOLVED', questId: quest.id, success });
        // Always return surviving adventurers (dead ones are already removed by QUEST_RESOLVED)
        const returnPositions: [number, number, number][] = quest.assignedAdventurerIds.map(
          (_, i) => WAITING_POSITIONS[i % WAITING_POSITIONS.length]
        );
        dispatch({
          type: 'ADVENTURERS_RETURNED',
          adventurerIds: quest.assignedAdventurerIds,
          targetPositions: returnPositions,
        });
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
      stateRef.current.adventurers
        .filter(a => a.status === 'idle' && now - a.enteredAt >= ADVENTURER_LEAVE_TIME)
        .forEach(a => dispatch({ type: 'REMOVE_ADVENTURER', id: a.id }));
    }, delay + 100);
    return () => clearTimeout(timer);
  }, [state.adventurers, state.gamePhase]);

  // Wandering behavior — continuously reassign waypoints to idle/recruited adventurers
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = stateRef.current;
      if (current.gamePhase !== 'playing') return;
      const wanderers = current.adventurers.filter(
        a => a.status === 'idle' || a.status === 'recruited'
      );
      if (wanderers.length > 0) {
        const updates = wanderers.map(a => ({
          id: a.id,
          target: pickRandomWaypoint([a.targetPosition]),
        }));
        dispatch({ type: 'WANDER_TICK', updates });
      }
      const delay = WANDER_INTERVAL_MIN + Math.random() * (WANDER_INTERVAL_MAX - WANDER_INTERVAL_MIN);
      timer = setTimeout(tick, delay);
    };

    const initialDelay = WANDER_INTERVAL_MIN + Math.random() * (WANDER_INTERVAL_MAX - WANDER_INTERVAL_MIN);
    timer = setTimeout(tick, initialDelay);
    return () => clearTimeout(timer);
  }, [state.gamePhase]);

  // HP recovery — 1 HP every 10 seconds for in-tavern adventurers
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    const timer = setInterval(() => {
      dispatch({ type: 'RECOVER_HP' });
    }, HP_RECOVERY_INTERVAL);
    return () => clearInterval(timer);
  }, [state.gamePhase]);

  const recruitAdventurer = useCallback((id: string) => {
    const idx = stateRef.current.adventurers.filter(a => a.status === 'recruited').length;
    const targetPos = WAITING_POSITIONS[idx % WAITING_POSITIONS.length];
    dispatch({ type: 'RECRUIT_ADVENTURER', id, targetPos });
  }, []);

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

  const hireUpgrade = useCallback((upgrade: 'cook' | 'cook_plus' | 'bard' | 'roster_2' | 'roster_3') => {
    dispatch({ type: 'HIRE_UPGRADE', upgrade });
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
    hireUpgrade,
  };
}
