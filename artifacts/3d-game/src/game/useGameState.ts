import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, GameAction, Adventurer, Quest, Materials, BountyQuest, DropNotification } from './types';
import type { AdventurerClass, QuestType } from './types';
import {
  ADVENTURER_NAMES, ADVENTURER_CLASSES, CLASS_LABELS,
  QUEST_POOL, MAX_PARTY_SIZE,
  ENTRANCE_POS, WANDERING_POSITIONS, WAITING_POSITIONS,
  SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX, ADVENTURER_LEAVE_TIME,
  XP_THRESHOLDS, MAX_LEVEL, POWER_PER_LEVEL,
  WANDER_INTERVAL_MIN, WANDER_INTERVAL_MAX, HP_RECOVERY_INTERVAL,
  ROSTER_BASE, ROSTER_UPGRADE_SIZE, ROSTER_UPGRADE_COST,
  TAVERN_PRESTIGE_THRESHOLDS, TAVERN_PRESTIGE_NAMES,
  PRESTIGE_ADVENTURER_COST, PRESTIGE_CLASS_FOR, PRESTIGE_CLASS_LABELS,
  BASE_STATS_BY_CLASS, STAT_GROWTH_BY_CLASS,
} from './constants';
import { calculateEffectivePower } from './questUtils';

const SAVE_KEY = 'tavern_save_v1';

let adventurerCounter = 0;
let questCounter = 0;
let bountyCounter = 0;
let dropNotificationCounter = 0;
const usedNames = new Set<string>();

interface BountyDefinition {
  name: string;
  description: string;
  targetMonsterType: QuestType;
  requiredKills: number;
  reward: number;
  materialReward?: { type: keyof Materials; amount: number };
}

const BOUNTY_POOL: BountyDefinition[] = [
  { name: 'Beast Slayer',         description: 'Beasts ravage the countryside. Adventurers who hunt them earn a bounty.',       targetMonsterType: 'beast',   requiredKills: 3, reward: 75,  materialReward: { type: 'pelts',  amount: 2 } },
  { name: 'Dire Wolf Culling',    description: 'The wolf packs have grown bold. The pelts alone are worth the effort.',          targetMonsterType: 'beast',   requiredKills: 2, reward: 30,  materialReward: { type: 'pelts',  amount: 3 } },
  { name: 'Monster Hunter',       description: 'Bring proof of five beast kills to the Hunters\' Lodge.',                        targetMonsterType: 'beast',   requiredKills: 5, reward: 120 },
  { name: 'Arcane Purge',         description: 'Magical disturbances haunt the region. Strange venom drips from slain horrors.', targetMonsterType: 'arcane',  requiredKills: 3, reward: 90,  materialReward: { type: 'venom',  amount: 2 } },
  { name: 'Relic Seeker',         description: 'The mages\' council pays in rare relics for arcane quest completions.',          targetMonsterType: 'arcane',  requiredKills: 2, reward: 30,  materialReward: { type: 'relics', amount: 3 } },
  { name: 'Void Hunter',          description: 'Stamp out five arcane threats for a generous reward.',                           targetMonsterType: 'arcane',  requiredKills: 5, reward: 140 },
  { name: 'Shadow Operative',     description: 'The Thieves\' Guild rewards discretion — and the venom of their quarry.',        targetMonsterType: 'stealth', requiredKills: 3, reward: 80,  materialReward: { type: 'venom',  amount: 2 } },
  { name: 'Silent Blade Contract',description: 'Complete two stealth missions for the Guild\'s bounty prize.',                   targetMonsterType: 'stealth', requiredKills: 2, reward: 55 },
  { name: 'Ghost Protocol',       description: 'Five stealth completions earn you the Guild\'s highest honours — and trophies.', targetMonsterType: 'stealth', requiredKills: 5, reward: 130, materialReward: { type: 'pelts',  amount: 4 } },
  { name: 'Battlefield Veteran',  description: 'Survive three combat engagements. Bones are the soldier\'s grim currency.',     targetMonsterType: 'combat',  requiredKills: 3, reward: 85,  materialReward: { type: 'bones',  amount: 2 } },
  { name: 'War Hero',             description: 'Two victories in direct combat — keep the bones as proof of your deeds.',       targetMonsterType: 'combat',  requiredKills: 2, reward: 35,  materialReward: { type: 'bones',  amount: 3 } },
  { name: 'Iron Warlord',         description: 'Five combat victories — only the strongest earn this bounty.',                  targetMonsterType: 'combat',  requiredKills: 5, reward: 150 },
];

function generateBounties(): BountyQuest[] {
  const shuffled = [...BOUNTY_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(b => ({
    id: `bounty-${++bountyCounter}`,
    name: b.name,
    description: b.description,
    targetMonsterType: b.targetMonsterType,
    requiredKills: b.requiredKills,
    currentKills: 0,
    reward: b.reward,
    ...(b.materialReward ? { materialReward: b.materialReward } : {}),
    status: 'available' as const,
  }));
}

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
  const base = BASE_STATS_BY_CLASS[cls];
  const growth = STAT_GROWTH_BY_CLASS[cls];
  return {
    maxHp:   s.baseHp   + (level - 1) * s.hpPerLevel,
    attack:  s.baseAttack  + (level - 1) * s.attackPerLevel,
    defense: s.baseDefense + (level - 1) * s.defensePerLevel,
    str: base.str + (level - 1) * growth.str,
    dex: base.dex + (level - 1) * growth.dex,
    con: base.con + (level - 1) * growth.con,
    int: base.int + (level - 1) * growth.int,
    wis: base.wis + (level - 1) * growth.wis,
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
  const { maxHp, attack, defense, str, dex, con, int: intStat, wis } = getClassStats(cls, level);

  return {
    id: `adv-${++adventurerCounter}`,
    name: pickName(),
    class: cls,
    prestigeClass: null,
    power: Math.floor(Math.random() * 8) + 3,
    xp: 0,
    level,
    hp: maxHp,
    maxHp,
    attack,
    defense,
    str,
    dex,
    con,
    int: intStat,
    wis,
    upgradePoints: 0,
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


const DEFAULT_UPGRADES = {
  cook: 0 as const,
  bard: false,
  rosterSlots: 0,
  rooms: 0 as const,
  basement: false,
  trainingGrounds: false,
  enchanter: false,
  guildHall: false,
};
const DEFAULT_MATERIALS: Materials = { herbs: 0, ore: 0, relics: 0, bones: 0, pelts: 0, venom: 0 };
const MATERIAL_SELL_RATES: Record<keyof Materials, number> = { herbs: 3, ore: 6, relics: 12, bones: 8, pelts: 8, venom: 8 };
const MATERIAL_LABELS: Record<keyof Materials, string> = { herbs: 'Herb', ore: 'Ore', relics: 'Relic', bones: 'Bone', pelts: 'Pelt', venom: 'Venom' };

const MONSTER_PART_DROPS: Record<QuestType, Array<keyof Materials>> = {
  beast:   ['pelts', 'pelts', 'bones', 'pelts', 'bones'],
  combat:  ['bones', 'bones', 'pelts', 'venom', 'bones'],
  arcane:  ['venom', 'venom', 'bones', 'venom', 'relics'],
  stealth: ['pelts', 'venom', 'venom', 'bones', 'pelts'],
};

const CLASS_PART_DROPS: Record<AdventurerClass, Array<keyof Materials>> = {
  warrior:  ['bones', 'bones', 'pelts', 'ore'],
  mage:     ['venom', 'venom', 'relics', 'venom'],
  rogue:    ['pelts', 'pelts', 'venom', 'pelts'],
  healer:   ['herbs', 'herbs', 'bones', 'relics'],
};
const ROOM_INCOME_INTERVAL = 10_000;

function getRosterMax(upgrades: { rosterSlots?: number }): number {
  return ROSTER_BASE + (upgrades.rosterSlots ?? 0) * ROSTER_UPGRADE_SIZE;
}

function buildFreshState(): GameState {
  return {
    gold: 30,
    adventurers: [],
    quests: generateQuests(),
    bounties: generateBounties(),
    gameLog: ['Your tavern is open. Adventurers will arrive soon...'],
    gamePhase: 'playing',
    selectedAdventurerId: null,
    showQuestBoard: false,
    upgrades: { ...DEFAULT_UPGRADES },
    materials: { ...DEFAULT_MATERIALS },
    questsCompleted: 0,
    tavernPrestige: 0,
    lastDropNotification: null,
  };
}

function ensureAdventurerStats(adv: Adventurer): Adventurer {
  const classStats = getClassStats(adv.class, adv.level);
  // Cast to allow reading fields that may be absent in pre-update saves
  const raw = adv as unknown as Record<string, unknown>;
  return {
    ...adv,
    hp: adv.hp ?? classStats.maxHp,
    maxHp: adv.maxHp ?? classStats.maxHp,
    attack: adv.attack ?? classStats.attack,
    defense: adv.defense ?? classStats.defense,
    str: (raw.str as number | undefined) ?? classStats.str,
    dex: (raw.dex as number | undefined) ?? classStats.dex,
    con: (raw.con as number | undefined) ?? classStats.con,
    int: (raw.int as number | undefined) ?? classStats.int,
    wis: (raw.wis as number | undefined) ?? classStats.wis,
    upgradePoints: adv.upgradePoints ?? 0,
    prestigeClass: adv.prestigeClass ?? null,
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
  for (const bounty of (state.bounties ?? [])) {
    const num = parseInt(bounty.id.replace('bounty-', ''), 10);
    if (!isNaN(num) && num > bountyCounter) bountyCounter = num;
  }
}

function loadFromStorage(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return buildFreshState();
    const parsed = JSON.parse(raw) as Omit<GameState, 'gamePhase'> & { gamePhase: string };
    const persistedAdventurers = parsed.adventurers
      .filter(a => a.status === 'recruited' || a.status === 'on-quest')
      .map(ensureAdventurerStats);
    const mergedUpgrades = {
      ...DEFAULT_UPGRADES,
      ...(parsed.upgrades ?? {}),
      rosterSlots: Math.max(0, (parsed.upgrades?.rosterSlots ?? 1) - 1),
      rooms: (parsed.upgrades?.rooms ?? 0) as 0 | 1 | 2,
      basement: parsed.upgrades?.basement ?? false,
      trainingGrounds: parsed.upgrades?.trainingGrounds ?? false,
      enchanter: parsed.upgrades?.enchanter ?? false,
      guildHall: parsed.upgrades?.guildHall ?? false,
    };
    const mergedMaterials: Materials = {
      ...DEFAULT_MATERIALS,
      ...(parsed.materials ?? {}),
    };
    const rawParsed = parsed as typeof parsed & { bounties?: BountyQuest[] };
    const persistedBounties: BountyQuest[] = (rawParsed.bounties ?? []).filter(
      b => b.status === 'active' || b.status === 'available'
    );
    const mergedBounties = persistedBounties.length > 0 ? persistedBounties : generateBounties();
    const restored: GameState = {
      ...parsed,
      adventurers: persistedAdventurers,
      bounties: mergedBounties,
      selectedAdventurerId: null,
      showQuestBoard: false,
      upgrades: mergedUpgrades,
      materials: mergedMaterials,
      questsCompleted: parsed.questsCompleted ?? 0,
      tavernPrestige: (parsed.tavernPrestige ?? 0) as 0 | 1 | 2 | 3,
      lastDropNotification: null,
      gamePhase: (parsed.gamePhase === 'won' || parsed.gamePhase !== 'lost' ? 'playing' : 'lost') as GameState['gamePhase'],
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
      if (!quest) return state;
      const assignedAdventurers = state.adventurers.filter(a => action.adventurerIds.includes(a.id));
      const effectivePower = calculateEffectivePower(assignedAdventurers, quest.questType);
      const success = effectivePower >= quest.powerRequired;
      return {
        ...state,

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

      if (action.success) {
        const baseXp = Math.ceil(quest.powerRequired * 1.2);
        let xpGain = baseXp;
        if (state.upgrades.bard) xpGain = Math.ceil(xpGain * 1.25);
        if (state.upgrades.trainingGrounds) xpGain = Math.ceil(xpGain * 1.5);

        let newAdventurers = state.adventurers.map(adv => {
          if (!quest.assignedAdventurerIds.includes(adv.id)) return adv;
          const newHp = Math.max(0, adv.hp - damagePerAdv);
          const newXp = adv.xp + xpGain;
          const newLevel = getLevelForXp(newXp);
          const leveledUp = newLevel > adv.level;
          const powerIncrease = leveledUp ? (newLevel - adv.level) * POWER_PER_LEVEL : 0;
          if (leveledUp) {
            const oldClassStats = getClassStats(adv.class, adv.level);
            const newClassStats = getClassStats(adv.class, newLevel);
            const newMaxHp = adv.maxHp + (newClassStats.maxHp - oldClassStats.maxHp);
            const newAttack = adv.attack + (newClassStats.attack - oldClassStats.attack);
            const newDefense = adv.defense + (newClassStats.defense - oldClassStats.defense);
            const levelsGained = newLevel - adv.level;
            const pointsGranted = levelsGained * 2;
            return {
              ...adv,
              xp: newXp, level: newLevel, power: adv.power + powerIncrease,
              hp: Math.min(newHp + 10, newMaxHp), maxHp: newMaxHp,
              attack: newAttack, defense: newDefense,
              str: adv.str + (newClassStats.str - oldClassStats.str),
              dex: adv.dex + (newClassStats.dex - oldClassStats.dex),
              con: adv.con + (newClassStats.con - oldClassStats.con),
              int: adv.int + (newClassStats.int - oldClassStats.int),
              wis: adv.wis + (newClassStats.wis - oldClassStats.wis),
              upgradePoints: (adv.upgradePoints ?? 0) + pointsGranted,
            };
          }
          return { ...adv, xp: newXp, level: newLevel, power: adv.power + powerIncrease, hp: newHp };
        });

        const died = newAdventurers.filter(a => quest.assignedAdventurerIds.includes(a.id) && a.hp <= 0);
        const deathLog = died.map(a => `${a.name} succumbed to wounds after the quest!`);
        newAdventurers = newAdventurers.filter(a => a.hp > 0);

        const levelUps = newAdventurers
          .filter(a => quest.assignedAdventurerIds.includes(a.id))
          .filter(a => { const before = state.adventurers.find(b => b.id === a.id); return before && a.level > before.level; });

        let logMsg = `Quest "${quest.name}" succeeded! Earned ${quest.reward} gold!`;
        if (levelUps.length > 0) {
          logMsg += ` ${levelUps.map(a => {
            const before = state.adventurers.find(b => b.id === a.id);
            const levelsGained = before ? a.level - before.level : 1;
            const pts = levelsGained * 2;
            return `${a.name} reached level ${a.level}! (${pts} upgrade point${pts !== 1 ? 's' : ''} available)`;
          }).join(' ')}`;
        }

        const newMaterials = { ...state.materials };
        let finalLog = addLog(state.gameLog, logMsg);
        deathLog.forEach(msg => { finalLog = addLog(finalLog, msg); });
        let dropNotification: DropNotification | null = null;
        if (state.upgrades.basement && Math.random() < 0.4) {
          const dropCount = Math.floor(Math.random() * 2) + 1;
          const materialKeys: Array<keyof Materials> = [];
          const craftingPool: Array<keyof Materials> = ['herbs', 'ore', 'relics'];
          const questTypePool = MONSTER_PART_DROPS[quest.questType];
          const assignedAdventurers = state.adventurers.filter(a => quest.assignedAdventurerIds.includes(a.id));
          const classPool: Array<keyof Materials> = assignedAdventurers.flatMap(a => CLASS_PART_DROPS[a.class]);
          const monsterPool = [...questTypePool, ...classPool];
          for (let i = 0; i < dropCount; i++) {
            const useMonsterPart = Math.random() < 0.6;
            const pool = useMonsterPart ? monsterPool : craftingPool;
            const mat = pool[Math.floor(Math.random() * pool.length)];
            newMaterials[mat] += 1;
            materialKeys.push(mat);
          }
          const keyCounts: Partial<Record<keyof Materials, number>> = {};
          materialKeys.forEach(k => { keyCounts[k] = (keyCounts[k] ?? 0) + 1; });
          const dropDesc = Object.entries(keyCounts).map(([m, n]) => `${n} ${MATERIAL_LABELS[m as keyof Materials]}${(n as number) > 1 ? 's' : ''}`).join(', ');
          finalLog = addLog(finalLog, `Party returned with ${dropDesc}!`);
          dropNotification = {
            id: ++dropNotificationCounter,
            questName: quest.name,
            drops: Object.entries(keyCounts).map(([m, qty]) => ({ material: m as keyof Materials, qty: qty as number })),
          };
        }

        const newGold = state.gold + quest.reward;
        const newQuestsCompleted = state.questsCompleted + 1;

        const killTokenType = quest.questType;
        const hadMatchingActiveBounty = (state.bounties ?? []).some(
          b => b.status === 'active' && b.targetMonsterType === killTokenType
        );

        let newBounties = state.bounties ?? [];
        let bountyGoldBonus = 0;
        const bountyMaterialBonus: Partial<Record<keyof Materials, number>> = {};
        newBounties = newBounties.map(bounty => {
          if (bounty.status !== 'active') return bounty;
          if (bounty.targetMonsterType !== quest.questType) return bounty;
          const newKills = bounty.currentKills + 1;
          if (newKills >= bounty.requiredKills) {
            bountyGoldBonus += bounty.reward;
            let completionMsg = `Bounty "${bounty.name}" completed! Earned ${bounty.reward}g`;
            if (bounty.materialReward) {
              const { type, amount } = bounty.materialReward;
              if (state.upgrades.basement) {
                bountyMaterialBonus[type] = (bountyMaterialBonus[type] ?? 0) + amount;
                completionMsg += ` + ${amount} ${MATERIAL_LABELS[type]}`;
              } else {
                const goldValue = amount * MATERIAL_SELL_RATES[type];
                bountyGoldBonus += goldValue;
                completionMsg += ` + ${goldValue}g (materials sold, no basement)`;
              }
            }
            finalLog = addLog(finalLog, completionMsg + '!');
            return { ...bounty, currentKills: newKills, status: 'completed' as const };
          }
          return { ...bounty, currentKills: newKills };
        });
        for (const [mat, qty] of Object.entries(bountyMaterialBonus) as Array<[keyof Materials, number]>) {
          newMaterials[mat] += qty;
        }

        if (!hadMatchingActiveBounty) {
          const partMap: Record<string, keyof Materials> = { beast: 'pelts', combat: 'bones', arcane: 'venom', stealth: 'pelts' };
          const part = partMap[killTokenType] ?? 'bones';
          if (state.upgrades.basement) {
            newMaterials[part] += 1;
            finalLog = addLog(finalLog, `Kill token stored as ${MATERIAL_LABELS[part]} in the basement.`);
          } else {
            finalLog = addLog(finalLog, `Kill token (${MATERIAL_LABELS[part]}) lost — excavate the basement to store it.`);
          }
        }

        let newPrestige: 0 | 1 | 2 | 3 = state.tavernPrestige;
        for (let i = TAVERN_PRESTIGE_THRESHOLDS.length - 1; i >= 0; i--) {
          if (newQuestsCompleted >= TAVERN_PRESTIGE_THRESHOLDS[i]) {
            newPrestige = (i + 1) as 0 | 1 | 2 | 3;
            break;
          }
        }
        if (newPrestige > state.tavernPrestige) {
          finalLog = addLog(finalLog, `🏛 Your tavern earns the title "${TAVERN_PRESTIGE_NAMES[newPrestige - 1]}"! New upgrades unlocked in the Manage tab.`);
        }

        const remainingRoster = newAdventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
        const newPhase: GameState['gamePhase'] = remainingRoster.length === 0 ? 'lost' : state.gamePhase;

        return {
          ...state,
          gold: newGold + bountyGoldBonus,
          adventurers: newAdventurers,
          materials: newMaterials,
          quests: state.quests.map(q => q.id === action.questId ? { ...q, status: 'completed' } : q),
          bounties: newBounties,
          gamePhase: newPhase,
          gameLog: finalLog,
          questsCompleted: newQuestsCompleted,
          tavernPrestige: newPrestige,
          lastDropNotification: dropNotification ?? state.lastDropNotification,
        };
      } else {
        let newAdventurers = state.adventurers.map(adv => {
          if (!quest.assignedAdventurerIds.includes(adv.id)) return adv;
          return { ...adv, hp: Math.max(0, adv.hp - damagePerAdv) };
        });

        const died = newAdventurers.filter(a => quest.assignedAdventurerIds.includes(a.id) && a.hp <= 0);
        const deathLog = died.map(a => `${a.name} was lost on the quest!`);
        newAdventurers = newAdventurers.filter(a => a.hp > 0);

        const lostCount = died.length;
        const survivorCount = quest.assignedAdventurerIds.length - lostCount;
        let logMsg = `Quest "${quest.name}" failed!`;
        if (lostCount > 0) logMsg += ` ${lostCount} adventurer${lostCount !== 1 ? 's' : ''} lost.`;
        if (survivorCount > 0) logMsg += ` ${survivorCount} survived, badly wounded.`;

        let finalLog = addLog(state.gameLog, logMsg);
        deathLog.forEach(msg => { finalLog = addLog(finalLog, msg); });

        const remainingRoster = newAdventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
        const newPhase: GameState['gamePhase'] = remainingRoster.length === 0 ? 'lost' : state.gamePhase;

        return {
          ...state,
          adventurers: newAdventurers,
          quests: state.quests.map(q => q.id === action.questId ? { ...q, status: 'failed' } : q),
          gamePhase: newPhase,
          gameLog: finalLog,
        };
      }
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
      if (upgrade === 'roster_expand') {
        if (state.gold < ROSTER_UPGRADE_COST) return state;
        const newSlots = (state.upgrades.rosterSlots ?? 0) + 1;
        const newMax = ROSTER_BASE + newSlots * ROSTER_UPGRADE_SIZE;
        return {
          ...state,
          gold: state.gold - ROSTER_UPGRADE_COST,
          upgrades: { ...state.upgrades, rosterSlots: newSlots },
          gameLog: addLog(state.gameLog, `Roster expanded! You can now recruit up to ${newMax} adventurers.`),
        };
      }
      if (upgrade === 'rooms') {
        if ((state.upgrades.rooms ?? 0) >= 1 || state.gold < 150) return state;
        return {
          ...state,
          gold: state.gold - 150,
          upgrades: { ...state.upgrades, rooms: 1 },
          gameLog: addLog(state.gameLog, 'Upper Rooms constructed! 3 inn rooms now earn passive gold.'),
        };
      }
      if (upgrade === 'rooms_expansion') {
        if ((state.upgrades.rooms ?? 0) !== 1 || state.gold < 250) return state;
        return {
          ...state,
          gold: state.gold - 250,
          upgrades: { ...state.upgrades, rooms: 2 },
          gameLog: addLog(state.gameLog, 'Inn expanded to 6 rooms! Passive income doubled.'),
        };
      }
      if (upgrade === 'basement') {
        if (state.upgrades.basement || state.gold < 100) return state;
        return {
          ...state,
          gold: state.gold - 100,
          upgrades: { ...state.upgrades, basement: true },
          gameLog: addLog(state.gameLog, 'Basement excavated! Quests now yield crafting materials.'),
        };
      }
      if (upgrade === 'training_grounds') {
        if (state.upgrades.trainingGrounds || state.gold < 50 || state.tavernPrestige < 1) return state;
        return {
          ...state,
          gold: state.gold - 50,
          upgrades: { ...state.upgrades, trainingGrounds: true },
          gameLog: addLog(state.gameLog, 'Training Grounds established! Quest XP gains increased by 50%.'),
        };
      }
      if (upgrade === 'enchanter') {
        if (state.upgrades.enchanter || state.gold < 150 || state.tavernPrestige < 2) return state;
        return {
          ...state,
          gold: state.gold - 150,
          upgrades: { ...state.upgrades, enchanter: true },
          gameLog: addLog(state.gameLog, "Enchanter's Study opened! Materials now sell for double value."),
        };
      }
      if (upgrade === 'guild_hall') {
        if (state.upgrades.guildHall || state.gold < 300 || state.tavernPrestige < 3) return state;
        return {
          ...state,
          gold: state.gold - 300,
          upgrades: { ...state.upgrades, guildHall: true },
          gameLog: addLog(state.gameLog, 'Guild Hall established! Quest dispatch cost is halved.'),
        };
      }
      return state;
    }

    case 'ROOM_INCOME': {
      if (state.gamePhase !== 'playing') return state;
      const rooms = state.upgrades.rooms ?? 0;
      if (rooms === 0) return state;
      const income = rooms;
      return {
        ...state,
        gold: state.gold + income,
        gameLog: addLog(state.gameLog, `Inn rooms earned +${income} gold (passive income).`),
      };
    }

    case 'SELL_MATERIALS': {
      if (state.gamePhase !== 'playing') return state;
      const { herbs, ore, relics, bones, pelts, venom } = state.materials;
      const sellRates = state.upgrades.enchanter
        ? { herbs: 6, ore: 12, relics: 24, bones: 16, pelts: 16, venom: 16 }
        : MATERIAL_SELL_RATES;
      const total =
        herbs * sellRates.herbs + ore * sellRates.ore + relics * sellRates.relics +
        bones * sellRates.bones + pelts * sellRates.pelts + venom * sellRates.venom;
      if (total === 0) return state;
      const parts: string[] = [];
      if (herbs > 0) parts.push(`${herbs} Herb${herbs > 1 ? 's' : ''}`);
      if (ore > 0) parts.push(`${ore} Ore`);
      if (relics > 0) parts.push(`${relics} Relic${relics > 1 ? 's' : ''}`);
      if (bones > 0) parts.push(`${bones} Bone${bones > 1 ? 's' : ''}`);
      if (pelts > 0) parts.push(`${pelts} Pelt${pelts > 1 ? 's' : ''}`);
      if (venom > 0) parts.push(`${venom} Venom`);
      return {
        ...state,
        gold: state.gold + total,
        materials: { herbs: 0, ore: 0, relics: 0, bones: 0, pelts: 0, venom: 0 },
        gameLog: addLog(state.gameLog, `Sold ${parts.join(', ')} for ${total} gold!`),
      };
    }

    case 'SPEND_UPGRADE_POINT': {
      if (state.gamePhase !== 'playing') return state;
      const adv = state.adventurers.find(a => a.id === action.adventurerId);
      if (!adv || (adv.upgradePoints ?? 0) <= 0) return state;
      const statLabel = action.stat === 'hp' ? 'HP' : action.stat === 'attack' ? 'Attack' : 'Defense';
      return {
        ...state,
        adventurers: state.adventurers.map(a => {
          if (a.id !== action.adventurerId) return a;
          const pts = (a.upgradePoints ?? 0) - 1;
          if (action.stat === 'hp') {
            return { ...a, upgradePoints: pts, maxHp: a.maxHp + 5, hp: Math.min(a.hp + 5, a.maxHp + 5) };
          }
          if (action.stat === 'attack') {
            return { ...a, upgradePoints: pts, attack: a.attack + 1 };
          }
          return { ...a, upgradePoints: pts, defense: a.defense + 1 };
        }),
        gameLog: addLog(state.gameLog, `${adv.name} improved their ${statLabel}!`),
      };
    }

    case 'PRESTIGE_ADVENTURER': {
      if (state.gamePhase !== 'playing') return state;
      const adv = state.adventurers.find(a => a.id === action.id);
      if (!adv || adv.level < MAX_LEVEL || adv.prestigeClass !== null || state.gold < PRESTIGE_ADVENTURER_COST) return state;
      const prestigeClass = PRESTIGE_CLASS_FOR[adv.class];
      return {
        ...state,
        gold: state.gold - PRESTIGE_ADVENTURER_COST,
        adventurers: state.adventurers.map(a =>
          a.id === action.id ? { ...a, prestigeClass } : a
        ),
        gameLog: addLog(state.gameLog, `${adv.name} has ascended — now a legendary ${PRESTIGE_CLASS_LABELS[prestigeClass]}!`),
      };
    }

    case 'ACCEPT_BOUNTY': {
      if (state.gamePhase !== 'playing') return state;
      const bounties = state.bounties ?? [];
      const bounty = bounties.find(b => b.id === action.bountyId);
      if (!bounty || bounty.status !== 'available') return state;
      const activeBountyCount = bounties.filter(b => b.status === 'active').length;
      if (activeBountyCount >= 2) return state;
      return {
        ...state,
        bounties: bounties.map(b =>
          b.id === action.bountyId ? { ...b, status: 'active' as const } : b
        ),
        gameLog: addLog(state.gameLog, `Bounty accepted: "${bounty.name}"! Complete ${bounty.requiredKills} ${bounty.targetMonsterType} quests.`),
      };
    }

    case 'ABANDON_BOUNTY': {
      if (state.gamePhase !== 'playing') return state;
      const bounties = state.bounties ?? [];
      const bounty = bounties.find(b => b.id === action.bountyId);
      if (!bounty || bounty.status !== 'active') return state;
      return {
        ...state,
        bounties: bounties.filter(b => b.id !== action.bountyId),
        gameLog: addLog(state.gameLog, `Bounty "${bounty.name}" abandoned. The slot is now free.`),
      };
    }

    case 'REFRESH_BOUNTIES': {
      if (state.gamePhase !== 'playing') return state;
      const bounties = state.bounties ?? [];
      const activeBounties = bounties.filter(b => b.status === 'active');
      const newBounties = generateBounties().filter(nb =>
        !activeBounties.some(ab => ab.name === nb.name)
      ).slice(0, 3 - activeBounties.length);
      return {
        ...state,
        bounties: [...activeBounties, ...newBounties],
        gameLog: addLog(state.gameLog, 'New bounties posted on the board!'),
      };
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

  // Wandering behavior
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

  // HP recovery
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    const timer = setInterval(() => {
      dispatch({ type: 'RECOVER_HP' });
    }, HP_RECOVERY_INTERVAL);
    return () => clearInterval(timer);
  }, [state.gamePhase]);

  // Room income
  useEffect(() => {
    if (state.gamePhase !== 'playing' || (state.upgrades.rooms ?? 0) === 0) return;
    const timer = setInterval(() => {
      dispatch({ type: 'ROOM_INCOME' });
    }, ROOM_INCOME_INTERVAL);
    return () => clearInterval(timer);
  }, [state.gamePhase, state.upgrades.rooms]);

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
    bountyCounter = 0;
    usedNames.clear();
    localStorage.removeItem(SAVE_KEY);
    const freshState = buildFreshState();
    dispatch({ type: 'NEW_GAME', freshState });
  }, []);

  const hireUpgrade = useCallback((upgrade: 'cook' | 'cook_plus' | 'bard' | 'roster_expand' | 'rooms' | 'rooms_expansion' | 'basement' | 'training_grounds' | 'enchanter' | 'guild_hall') => {
    dispatch({ type: 'HIRE_UPGRADE', upgrade });
  }, []);

  const sellMaterials = useCallback(() => {
    dispatch({ type: 'SELL_MATERIALS' });
  }, []);

  const spendUpgradePoint = useCallback((adventurerId: string, stat: 'hp' | 'attack' | 'defense') => {
    dispatch({ type: 'SPEND_UPGRADE_POINT', adventurerId, stat });
  }, []);

  const prestigeAdventurer = useCallback((id: string) => {
    dispatch({ type: 'PRESTIGE_ADVENTURER', id });
  }, []);

  const acceptBounty = useCallback((bountyId: string) => {
    dispatch({ type: 'ACCEPT_BOUNTY', bountyId });
  }, []);

  const abandonBounty = useCallback((bountyId: string) => {
    dispatch({ type: 'ABANDON_BOUNTY', bountyId });
  }, []);

  const refreshBounties = useCallback(() => {
    dispatch({ type: 'REFRESH_BOUNTIES' });
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
    sellMaterials,
    spendUpgradePoint,
    prestigeAdventurer,
    acceptBounty,
    abandonBounty,
    refreshBounties,
  };
}
