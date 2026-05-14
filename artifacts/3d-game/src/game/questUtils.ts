import type { Adventurer, QuestType } from './types';

export function getAdventurerBonus(adv: Adventurer, questType: QuestType): number {
  if (adv.class === 'warrior' && questType === 'beast') return 3;
  if (adv.class === 'mage' && questType === 'arcane') return 3;
  if (adv.class === 'rogue' && questType === 'stealth') return 3;
  if (adv.class === 'healer') return 2;
  return 0;
}

export function calculateEffectivePower(adventurers: Adventurer[], questType: QuestType): number {
  return adventurers.reduce((sum, adv) => sum + adv.power + getAdventurerBonus(adv, questType), 0);
}
