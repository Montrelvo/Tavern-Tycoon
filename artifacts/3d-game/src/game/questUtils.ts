import type { Adventurer, QuestType } from './types';

export function getAdventurerBonus(adv: Adventurer, questType: QuestType): number {
  if (adv.prestigeClass) {
    if (adv.prestigeClass === 'knight') return (questType === 'beast' || questType === 'combat') ? 5 : 0;
    if (adv.prestigeClass === 'archmage') return (questType === 'arcane' || questType === 'stealth') ? 5 : 0;
    if (adv.prestigeClass === 'shadowblade') return (questType === 'stealth' || questType === 'beast') ? 5 : 0;
    if (adv.prestigeClass === 'warden') return 3;
  }
  if (adv.class === 'warrior' && questType === 'beast') return 3;
  if (adv.class === 'mage' && questType === 'arcane') return 3;
  if (adv.class === 'rogue' && questType === 'stealth') return 3;
  if (adv.class === 'healer') return 2;
  return 0;
}

export function calculateEffectivePower(adventurers: Adventurer[], questType: QuestType): number {
  return adventurers.reduce((sum, adv) => sum + adv.power + getAdventurerBonus(adv, questType), 0);
}
