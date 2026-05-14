import React, { useEffect, useState } from 'react';
import type { Adventurer, Quest, Upgrades } from '../game/types';
import {
  CLASS_COLORS, CLASS_LABELS, CLASS_PASSIVE_LABELS,
  DISPATCH_COST, ELITE_LEVEL, MAX_LEVEL, XP_THRESHOLDS,
  QUEST_TYPE_LABELS, QUEST_TYPE_COLORS, CLASS_STAT_COLORS, ROSTER_CAPS,
  PRESTIGE_CLASS_LABELS, PRESTIGE_CLASS_COLORS, PRESTIGE_CLASS_PASSIVE_LABELS,
  PRESTIGE_CLASS_FOR, TAVERN_PRESTIGE_THRESHOLDS, TAVERN_PRESTIGE_NAMES,
  PRESTIGE_ADVENTURER_COST,
} from '../game/constants';
import { getAdventurerBonus } from '../game/questUtils';

interface HUDProps {
  gold: number;
  adventurers: Adventurer[];
  quests: Quest[];
  gameLog: string[];
  gamePhase: 'playing' | 'lost';
  selectedAdventurerId: string | null;
  showQuestBoard: boolean;
  upgrades: Upgrades;
  questsCompleted: number;
  tavernPrestige: 0 | 1 | 2 | 3;
  onRecruit: (id: string) => void;
  onSelectAdventurer: (id: string | null) => void;
  onToggleQuestBoard: () => void;
  onDispatchQuest: (questId: string, adventurerIds: string[]) => void;
  onRefreshQuests: () => void;
  onPlaySound: (type: 'recruit' | 'questComplete' | 'questFail') => void;
  onNewGame: () => void;
  onSpendUpgradePoint: (adventurerId: string, stat: 'hp' | 'attack' | 'defense') => void;
  onPrestigeAdventurer: (id: string) => void;
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(15,8,2,0.92)',
  border: '1px solid #5c3315',
  borderRadius: 8,
  padding: 12,
  backdropFilter: 'blur(4px)',
};

function isElite(adv: Adventurer) {
  return adv.level >= ELITE_LEVEL;
}

function XpBar({ adv }: { adv: Adventurer }) {
  if (adv.level >= MAX_LEVEL) {
    return <span style={{ color: adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : '#ffd700', fontSize: 10, fontStyle: 'italic' }}>
      {adv.prestigeClass ? `✦ ${PRESTIGE_CLASS_LABELS[adv.prestigeClass]}` : 'Max Level'}
    </span>;
  }
  const nextThreshold = XP_THRESHOLDS[adv.level];
  const prevThreshold = XP_THRESHOLDS[adv.level - 1];
  const pct = Math.min(100, ((adv.xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
      <div style={{ background: '#2a1a08', borderRadius: 3, height: 5, flex: 1, border: '1px solid #3d2410' }}>
        <div style={{
          background: isElite(adv) ? 'linear-gradient(90deg, #f1c40f, #e67e22)' : 'linear-gradient(90deg, #5dade2, #3498db)',
          width: `${pct}%`,
          height: '100%',
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ color: '#666', fontSize: 9, whiteSpace: 'nowrap' }}>{adv.xp}/{nextThreshold}</span>
    </div>
  );
}

function LevelBadge({ adv }: { adv: Adventurer }) {
  const elite = adv.level >= ELITE_LEVEL;
  const prestiged = !!adv.prestigeClass;
  const bgColor = prestiged
    ? `linear-gradient(135deg, ${PRESTIGE_CLASS_COLORS[adv.prestigeClass!]}, ${PRESTIGE_CLASS_COLORS[adv.prestigeClass!]}88)`
    : elite
    ? 'linear-gradient(135deg, #f1c40f, #e67e22)'
    : 'rgba(255,255,255,0.1)';
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 'bold',
      padding: '1px 5px',
      borderRadius: 3,
      background: bgColor,
      color: (elite || prestiged) ? '#1a0d00' : '#aaa',
      border: prestiged
        ? `1px solid ${PRESTIGE_CLASS_COLORS[adv.prestigeClass!]}`
        : elite ? '1px solid #f1c40f' : '1px solid #444',
      flexShrink: 0,
    }}>
      {prestiged ? '✦' : elite ? '★' : ''}Lv{adv.level}
    </span>
  );
}

function TopBarInfo({ gold, roomsIncome, questsCompleted, tavernPrestige }: {
  gold: number; roomsIncome: number; questsCompleted: number; tavernPrestige: 0 | 1 | 2 | 3;
}) {
  const nextThreshold = TAVERN_PRESTIGE_THRESHOLDS[tavernPrestige];
  const prevThreshold = tavernPrestige > 0 ? TAVERN_PRESTIGE_THRESHOLDS[tavernPrestige - 1] : 0;
  const atMax = tavernPrestige === 3;
  const pct = atMax
    ? 100
    : Math.min(100, ((questsCompleted - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
  const tierLabel = tavernPrestige === 0 ? null : TAVERN_PRESTIGE_NAMES[tavernPrestige - 1];

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 18, textShadow: '0 1px 4px #000' }}>
            {gold} Gold
          </span>
          {roomsIncome > 0 && (
            <span style={{ color: '#2ecc71', fontSize: 11, fontStyle: 'italic' }}>
              +{roomsIncome}/min
            </span>
          )}
        </div>
        <span style={{ color: tavernPrestige > 0 ? '#f1c40f' : '#4a3a28', fontSize: 11, fontWeight: tavernPrestige > 0 ? 'bold' : 'normal' }}>
          {tierLabel ? `★ ${tierLabel}` : 'Unknown Tavern'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#3a2a18', fontSize: 9, whiteSpace: 'nowrap' }}>Prestige</span>
        <div style={{ background: '#2a1a08', borderRadius: 3, height: 4, flex: 1, border: '1px solid #3d2410' }}>
          <div style={{
            background: atMax
              ? 'linear-gradient(90deg, #f1c40f, #e67e22)'
              : tavernPrestige > 0
              ? 'linear-gradient(90deg, #8a5422, #c8960c)'
              : 'linear-gradient(90deg, #3d2410, #5c3315)',
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ color: '#3a2a18', fontSize: 9, whiteSpace: 'nowrap' }}>
          {atMax ? 'MAX' : `${questsCompleted}/${nextThreshold}`}
        </span>
      </div>
    </div>
  );
}

function AdventurerCard({ adv, isSelected, onSelect, onRecruit, onAllocate, onPrestige }: {
  adv: Adventurer;
  isSelected: boolean;
  onSelect: () => void;
  onRecruit: (id: string) => void;
  onAllocate?: () => void;
  onPrestige?: () => void;
}) {
  const baseColor = CLASS_COLORS[adv.class];
  const prestigeColor = adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : null;
  const color = prestigeColor ?? baseColor;
  const elite = isElite(adv);
  const isPrestiged = !!adv.prestigeClass;
  const canPrestige = adv.status === 'recruited' && adv.level >= MAX_LEVEL && !adv.prestigeClass;

  const eliteBorder = (elite || isPrestiged)
    ? `1px solid ${isPrestiged ? color : '#f1c40f'}`
    : `1px solid ${isSelected ? color : '#5c3315'}`;

  const eliteGlow = isPrestiged
    ? `0 0 8px ${color}66, 0 0 2px ${color}44`
    : elite
    ? `0 0 8px #f1c40f66, 0 0 2px #f1c40f44`
    : isSelected ? `0 0 4px ${color}44` : 'none';

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(255,255,255,0.12)' : isPrestiged ? `${color}0d` : elite ? 'rgba(241,196,15,0.06)' : 'rgba(255,255,255,0.05)',
        border: eliteBorder,
        borderRadius: 6,
        padding: '6px 8px',
        marginBottom: 4,
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: eliteGlow,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 13, flex: 1 }}>{adv.name}</span>
        {isPrestiged && (
          <span style={{
            fontSize: 9, fontWeight: 'bold', color: '#000',
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            borderRadius: 8, padding: '1px 5px',
            flexShrink: 0,
          }}>
            ★ Prestige
          </span>
        )}
        {(adv.upgradePoints ?? 0) > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 'bold', color: '#1a0d00',
            background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
            borderRadius: 8, padding: '1px 5px',
            boxShadow: '0 0 6px #f1c40f88',
            animation: 'pulse 1.5s ease-in-out infinite',
            flexShrink: 0,
          }}>
            {adv.upgradePoints} pts
          </span>
        )}
        <LevelBadge adv={adv} />
        <span style={{ color: '#aaa', fontSize: 10 }}>
          {adv.status === 'on-quest' ? 'On Quest' : adv.status === 'idle' ? 'Visitor' : 'Ready'}
        </span>
      </div>
      <div style={{ marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: isPrestiged ? color : '#aaa', fontSize: 11 }}>
          {isPrestiged ? PRESTIGE_CLASS_LABELS[adv.prestigeClass!] : CLASS_LABELS[adv.class]}
        </span>
        <span style={{ color: '#f1c40f', fontSize: 11 }}>⚡ {adv.power}</span>
        {adv.attack !== undefined && (
          <span style={{ color: CLASS_STAT_COLORS.attack, fontSize: 11 }}>⚔ {adv.attack}</span>
        )}
        {adv.defense !== undefined && (
          <span style={{ color: CLASS_STAT_COLORS.defense, fontSize: 11 }}>🛡 {adv.defense}</span>
        )}
        <XpBar adv={adv} />
      </div>
      {adv.hp !== undefined && adv.maxHp !== undefined && (
        <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: CLASS_STAT_COLORS.hp, fontSize: 9, flexShrink: 0 }}>HP</span>
          <div style={{ background: '#1a0a0a', borderRadius: 2, height: 4, flex: 1, border: '1px solid #3d1515' }}>
            <div style={{
              background: adv.hp / adv.maxHp > 0.5
                ? '#27ae60'
                : adv.hp / adv.maxHp > 0.25
                ? '#e67e22'
                : '#e74c3c',
              width: `${Math.max(0, (adv.hp / adv.maxHp) * 100)}%`,
              height: '100%',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ color: '#666', fontSize: 9, whiteSpace: 'nowrap' }}>{adv.hp}/{adv.maxHp}</span>
        </div>
      )}
      {adv.status === 'idle' && isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onRecruit(adv.id); }}
          style={{
            marginTop: 4,
            background: '#c8960c',
            border: 'none',
            borderRadius: 4,
            color: '#1a0d00',
            fontWeight: 'bold',
            fontSize: 12,
            padding: '3px 10px',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'serif',
          }}
        >
          Recruit (Free)
        </button>
      )}
      {adv.status === 'recruited' && onAllocate && (() => {
        const pts = adv.upgradePoints ?? 0;
        const hasPoints = pts > 0;
        return (
          <button
            disabled={!hasPoints}
            onClick={(e) => { e.stopPropagation(); if (hasPoints) onAllocate(); }}
            style={{
              marginTop: 4,
              background: hasPoints ? 'linear-gradient(180deg, #c8960c 0%, #a07008 100%)' : '#2a1a08',
              border: `1px solid ${hasPoints ? '#f1c40f' : '#3d2410'}`,
              borderRadius: 4,
              color: hasPoints ? '#1a0d00' : '#555',
              fontWeight: 'bold',
              fontSize: 11,
              padding: '3px 10px',
              cursor: hasPoints ? 'pointer' : 'not-allowed',
              width: '100%',
              fontFamily: 'serif',
              boxShadow: hasPoints ? '0 0 6px #f1c40f55' : 'none',
            }}
          >
            {hasPoints ? `✦ Allocate ${pts} Point${pts !== 1 ? 's' : ''}` : 'Allocate Points'}
          </button>
        );
      })()}
      {canPrestige && onPrestige && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrestige(); }}
          style={{
            marginTop: 4,
            background: 'linear-gradient(180deg, #6c3483 0%, #4a235a 100%)',
            border: '1px solid #8e44ad',
            borderRadius: 4,
            color: '#e8d5a0',
            fontWeight: 'bold',
            fontSize: 11,
            padding: '3px 10px',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'serif',
            boxShadow: '0 0 6px #8e44ad55',
          }}
        >
          ✦ Prestige (−{PRESTIGE_ADVENTURER_COST}g)
        </button>
      )}
    </div>
  );
}

function StatAllocationPopup({ adv, onClose, onSpend }: {
  adv: Adventurer;
  onClose: () => void;
  onSpend: (stat: 'hp' | 'attack' | 'defense') => void;
}) {
  const pts = adv.upgradePoints ?? 0;
  const color = adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : CLASS_COLORS[adv.class];

  const statBtn = (
    label: string,
    stat: 'hp' | 'attack' | 'defense',
    current: number,
    next: number,
    btnColor: string,
  ) => (
    <button
      disabled={pts === 0}
      onClick={() => onSpend(stat)}
      style={{
        background: pts === 0 ? '#2a1a08' : `rgba(${btnColor},0.15)`,
        border: `1px solid ${pts === 0 ? '#3d2410' : `rgba(${btnColor},0.5)`}`,
        borderRadius: 6,
        color: pts === 0 ? '#555' : '#e8d5a0',
        fontFamily: 'serif',
        fontWeight: 'bold',
        fontSize: 13,
        padding: '8px 10px',
        cursor: pts === 0 ? 'not-allowed' : 'pointer',
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 11, color: pts === 0 ? '#444' : `rgb(${btnColor})` }}>{label}</span>
      <span style={{ fontSize: 12 }}>
        {current} → <span style={{ color: pts === 0 ? '#555' : '#2ecc71' }}>{next}</span>
      </span>
      <span style={{ fontSize: 10, color: '#666' }}>−1 pt</span>
    </button>
  );

  return (
    <div style={{
      position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
      pointerEvents: 'auto', zIndex: 150,
    }}>
      <div style={{
        background: 'rgba(15,8,2,0.97)',
        border: `2px solid ${color}`,
        borderRadius: 12,
        padding: '16px 18px',
        minWidth: 280,
        boxShadow: `0 0 24px ${color}44, 0 4px 16px rgba(0,0,0,0.9)`,
        fontFamily: 'serif',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 8, right: 10,
            background: 'none', border: 'none', color: '#666', fontSize: 16, cursor: 'pointer',
          }}
        >✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
          <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 16 }}>{adv.name}</span>
          <span style={{ color: '#888', fontSize: 12 }}>
            {adv.prestigeClass ? PRESTIGE_CLASS_LABELS[adv.prestigeClass] : CLASS_LABELS[adv.class]}
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 13,
            color: pts > 0 ? '#f1c40f' : '#666',
            fontWeight: 'bold',
          }}>
            {pts > 0 ? `✦ ${pts} upgrade point${pts !== 1 ? 's' : ''} to spend` : 'No points remaining'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {statBtn('+5 Max HP', 'hp', adv.maxHp, adv.maxHp + 5, '231,76,60')}
          {statBtn('+1 Attack', 'attack', adv.attack, adv.attack + 1, '230,126,34')}
          {statBtn('+1 Defense', 'defense', adv.defense, adv.defense + 1, '52,152,219')}
        </div>
      </div>
    </div>
  );
}

function PrestigeConfirmPopup({ adv, gold, onConfirm, onClose }: {
  adv: Adventurer;
  gold: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const prestigeClass = PRESTIGE_CLASS_FOR[adv.class];
  const color = PRESTIGE_CLASS_COLORS[prestigeClass];
  const canAfford = gold >= PRESTIGE_ADVENTURER_COST;

  return (
    <div style={{
      position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
      pointerEvents: 'auto', zIndex: 150,
    }}>
      <div style={{
        background: 'rgba(15,8,2,0.97)',
        border: `2px solid ${color}`,
        borderRadius: 12,
        padding: '16px 18px',
        minWidth: 280,
        boxShadow: `0 0 24px ${color}44, 0 4px 16px rgba(0,0,0,0.9)`,
        fontFamily: 'serif',
        position: 'relative',
        textAlign: 'center',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 8, right: 10,
            background: 'none', border: 'none', color: '#666', fontSize: 16, cursor: 'pointer',
          }}
        >✕</button>

        <div style={{ fontSize: 11, color: '#888', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
          Prestige Ascension
        </div>
        <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>
          {adv.name}
        </div>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>
          {CLASS_LABELS[adv.class]} →{' '}
          <span style={{ color, fontWeight: 'bold' }}>{PRESTIGE_CLASS_LABELS[prestigeClass]}</span>
        </div>
        <div style={{
          background: `${color}11`, border: `1px solid ${color}44`,
          borderRadius: 6, padding: '8px 10px', marginBottom: 12, fontSize: 12,
        }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 3 }}>New Class Ability</div>
          <div style={{ color }}>{PRESTIGE_CLASS_PASSIVE_LABELS[prestigeClass]}</div>
        </div>
        <div style={{ color: canAfford ? '#f1c40f' : '#e74c3c', fontSize: 13, marginBottom: 12 }}>
          Cost: {PRESTIGE_ADVENTURER_COST}g{!canAfford ? ' (not enough gold)' : ''}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: '#2a1a08', border: '1px solid #5c3315',
              borderRadius: 6, color: '#888', fontFamily: 'serif',
              fontSize: 13, padding: '7px 0', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            disabled={!canAfford}
            onClick={() => { if (canAfford) { onConfirm(); onClose(); } }}
            style={{
              flex: 1,
              background: canAfford
                ? `linear-gradient(180deg, ${color}cc 0%, ${color}88 100%)`
                : '#2a1a08',
              border: `1px solid ${canAfford ? color : '#3d2410'}`,
              borderRadius: 6,
              color: canAfford ? '#fff' : '#555',
              fontFamily: 'serif',
              fontWeight: 'bold',
              fontSize: 13,
              padding: '7px 0',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              textShadow: canAfford ? '0 1px 3px rgba(0,0,0,0.6)' : 'none',
            }}
          >
            Ascend ✦
          </button>
        </div>
      </div>
    </div>
  );
}

function RecruitPopup({ adv, onRecruit, onClose, onPlaySound }: {
  adv: Adventurer;
  onRecruit: (id: string) => void;
  onClose: () => void;
  onPlaySound: (type: 'recruit' | 'questComplete' | 'questFail') => void;
}) {
  const baseColor = CLASS_COLORS[adv.class];
  const prestigeColor = adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : null;
  const color = prestigeColor ?? baseColor;
  const isRecruited = adv.status === 'recruited';
  const elite = isElite(adv);
  const isPrestiged = !!adv.prestigeClass;
  const nextThreshold = adv.level < MAX_LEVEL ? XP_THRESHOLDS[adv.level] : null;
  const prevThreshold = XP_THRESHOLDS[adv.level - 1];
  const xpPct = nextThreshold !== null
    ? Math.min(100, ((adv.xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
    : 100;

  return (
    <div style={{
      position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
      pointerEvents: 'auto', zIndex: 150,
    }}>
      <div style={{
        background: 'rgba(15,8,2,0.96)',
        border: `2px solid ${isPrestiged ? color : elite ? '#f1c40f' : color}`,
        borderRadius: 12,
        padding: '16px 20px',
        minWidth: 260,
        boxShadow: isPrestiged
          ? `0 0 24px ${color}66, 0 0 8px ${color}44, 0 4px 16px rgba(0,0,0,0.8)`
          : elite
          ? `0 0 24px #f1c40f66, 0 0 8px #f1c40f44, 0 4px 16px rgba(0,0,0,0.8)`
          : `0 0 24px ${color}44, 0 4px 16px rgba(0,0,0,0.8)`,
        fontFamily: 'serif',
        textAlign: 'center',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 8, right: 10,
            background: 'none', border: 'none', color: '#666', fontSize: 16, cursor: 'pointer',
          }}
        >✕</button>

        {isPrestiged && (
          <div style={{
            fontSize: 10, fontWeight: 'bold', color: '#000',
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            borderRadius: 8, padding: '2px 8px', marginBottom: 8, display: 'inline-block',
          }}>
            ✦ PRESTIGE — {PRESTIGE_CLASS_LABELS[adv.prestigeClass!].toUpperCase()}
          </div>
        )}
        {!isPrestiged && elite && (
          <div style={{
            fontSize: 10, fontWeight: 'bold', color: '#1a0d00',
            background: 'linear-gradient(90deg, #f1c40f, #e67e22)',
            borderRadius: 8, padding: '2px 8px', marginBottom: 8, display: 'inline-block',
          }}>
            ★ ELITE ADVENTURER ★
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
          <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 17 }}>{adv.name}</span>
        </div>
        <div style={{ color: isPrestiged ? color : '#b0a090', fontSize: 13, marginBottom: 4 }}>
          {isPrestiged ? PRESTIGE_CLASS_LABELS[adv.prestigeClass!] : CLASS_LABELS[adv.class]}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ color: '#f1c40f', fontSize: 14 }}>⚡ Power: {adv.power}</div>
          <div style={{
            fontSize: 12, fontWeight: 'bold',
            color: isPrestiged ? color : elite ? '#f1c40f' : '#aaa',
          }}>
            {isPrestiged ? '✦' : elite ? '★' : ''}Lv {adv.level}
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10,
        }}>
          <div style={{ textAlign: 'center', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 6, padding: '5px 10px', minWidth: 60 }}>
            <div style={{ color: CLASS_STAT_COLORS.hp, fontSize: 9, marginBottom: 2 }}>HP</div>
            <div style={{ color: '#e8d5a0', fontSize: 13, fontWeight: 'bold' }}>{adv.hp}/{adv.maxHp}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)', borderRadius: 6, padding: '5px 10px', minWidth: 60 }}>
            <div style={{ color: CLASS_STAT_COLORS.attack, fontSize: 9, marginBottom: 2 }}>ATTACK</div>
            <div style={{ color: '#e8d5a0', fontSize: 13, fontWeight: 'bold' }}>{adv.attack}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 6, padding: '5px 10px', minWidth: 60 }}>
            <div style={{ color: CLASS_STAT_COLORS.defense, fontSize: 9, marginBottom: 2 }}>DEFENSE</div>
            <div style={{ color: '#e8d5a0', fontSize: 13, fontWeight: 'bold' }}>{adv.defense}</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${color}44`,
          borderRadius: 6,
          padding: '6px 10px',
          marginBottom: 12,
          fontSize: 12,
        }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>Class Ability</div>
          <div style={{ color }}>
            {isPrestiged
              ? PRESTIGE_CLASS_PASSIVE_LABELS[adv.prestigeClass!]
              : CLASS_PASSIVE_LABELS[adv.class]}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          {adv.level < MAX_LEVEL ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#888', fontSize: 10 }}>XP to next level</span>
                <span style={{ color: '#aaa', fontSize: 10 }}>{adv.xp} / {nextThreshold}</span>
              </div>
              <div style={{ background: '#2a1a08', borderRadius: 4, height: 6, border: '1px solid #3d2410' }}>
                <div style={{
                  background: elite
                    ? 'linear-gradient(90deg, #f1c40f, #e67e22)'
                    : 'linear-gradient(90deg, #5dade2, #3498db)',
                  width: `${xpPct}%`,
                  height: '100%',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </>
          ) : (
            <div style={{ color: isPrestiged ? color : '#ffd700', fontSize: 12, fontStyle: 'italic' }}>
              {isPrestiged ? `✦ ${PRESTIGE_CLASS_LABELS[adv.prestigeClass!]}` : 'Maximum level reached!'}
            </div>
          )}
        </div>

        {!isRecruited ? (
          <button
            onClick={() => { onRecruit(adv.id); onPlaySound('recruit'); onClose(); }}
            style={{
              background: `linear-gradient(180deg, ${color}cc 0%, ${color}88 100%)`,
              border: `1px solid ${color}`,
              borderRadius: 6,
              color: '#fff',
              fontFamily: 'serif',
              fontWeight: 'bold',
              fontSize: 14,
              padding: '7px 20px',
              cursor: 'pointer',
              width: '100%',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}
          >
            Recruit
          </button>
        ) : (
          <div style={{ color: '#2ecc71', fontSize: 13, fontStyle: 'italic' }}>Already in your party</div>
        )}
      </div>
    </div>
  );
}

function ActiveQuestItem({ quest }: { quest: Quest }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeLeft = quest.completesAt ? Math.max(0, Math.ceil((quest.completesAt - now) / 1000)) : null;
  const typeColor = QUEST_TYPE_COLORS[quest.questType];

  return (
    <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #3d2410' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span style={{
          fontSize: 9, fontWeight: 'bold', color: typeColor,
          background: `${typeColor}22`, border: `1px solid ${typeColor}44`,
          borderRadius: 3, padding: '1px 4px',
        }}>
          {QUEST_TYPE_LABELS[quest.questType]}
        </span>
        <div style={{ color: '#e8d5a0', fontSize: 12, fontWeight: 'bold', flex: 1 }}>{quest.name}</div>
      </div>
      <div style={{ color: '#f39c12', fontSize: 11 }}>
        {timeLeft !== null ? `Returns in ${timeLeft}s` : 'In progress...'}
      </div>
      <div style={{ color: '#ffd700', fontSize: 11 }}>+{quest.reward}g on success</div>
    </div>
  );
}

function QuestCard({ quest, availableAdventurers, gold, dispatchCost, onDispatch }: {
  quest: Quest;
  availableAdventurers: Adventurer[];
  gold: number;
  dispatchCost: number;
  onDispatch: (qid: string, aids: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(availableAdventurers.map(a => a.id))
  );

  const selectedAdventurers = availableAdventurers.filter(a => selectedIds.has(a.id));

  function getEffectivePower(adv: Adventurer): number {
    return adv.power + getAdventurerBonus(adv, quest.questType);
  }

  const selectedPower = selectedAdventurers.reduce((sum, a) => sum + getEffectivePower(a), 0);
  const canDispatch = quest.status === 'available' && selectedAdventurers.length > 0 && gold >= dispatchCost;
  const willSucceed = selectedPower >= quest.powerRequired;

  const now = Date.now();
  const timeLeft = quest.completesAt ? Math.max(0, Math.ceil((quest.completesAt - now) / 1000)) : null;

  const statusColors: Record<string, string> = {
    available: '#2ecc71', active: '#f39c12', completed: '#3498db', failed: '#e74c3c',
  };
  const statusLabel: Record<string, string> = {
    available: 'Available', active: 'In Progress', completed: 'Completed', failed: 'Failed',
  };

  const typeColor = QUEST_TYPE_COLORS[quest.questType];

  const toggleAdventurer = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid #5c3315',
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 'bold', color: typeColor,
              background: `${typeColor}22`, border: `1px solid ${typeColor}44`,
              borderRadius: 4, padding: '1px 6px',
            }}>
              {QUEST_TYPE_LABELS[quest.questType]}
            </span>
          </div>
          <h3 style={{ color: '#e8d5a0', margin: 0, fontSize: 15 }}>{quest.name}</h3>
        </div>
        <span style={{
          color: statusColors[quest.status],
          fontSize: 11,
          background: 'rgba(0,0,0,0.4)',
          padding: '2px 6px',
          borderRadius: 10,
          whiteSpace: 'nowrap',
        }}>
          {statusLabel[quest.status]}
        </span>
      </div>
      <p style={{ color: '#999', fontSize: 12, margin: '0 0 8px', lineHeight: 1.4 }}>{quest.description}</p>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ color: '#ffd700' }}>Reward: {quest.reward}g</span>
        <span style={{ color: '#e74c3c' }}>Min Power: ⚡{quest.powerRequired}</span>
        {quest.status === 'available' && (
          <span style={{ color: willSucceed ? '#2ecc71' : '#e74c3c' }}>
            Effective: ⚡{selectedPower}
          </span>
        )}
        {timeLeft !== null && <span style={{ color: '#f39c12' }}>Returns in: {timeLeft}s</span>}
      </div>

      {quest.status === 'available' && availableAdventurers.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#b0a090', fontSize: 11, marginBottom: 4 }}>Select adventurers to send:</div>
          {availableAdventurers.map(adv => {
            const checked = selectedIds.has(adv.id);
            const color = adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : CLASS_COLORS[adv.class];
            const effPower = getEffectivePower(adv);
            const hasBonus = effPower > adv.power;
            const elite = isElite(adv);
            return (
              <label
                key={adv.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 6px', borderRadius: 4, marginBottom: 2,
                  background: checked ? (elite || adv.prestigeClass ? `${color}14` : 'rgba(255,255,255,0.08)') : 'transparent',
                  border: `1px solid ${checked ? color : 'transparent'}`,
                  cursor: 'pointer',
                  boxShadow: checked && (elite || adv.prestigeClass) ? `0 0 6px ${color}33` : 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAdventurer(adv.id)}
                  style={{ accentColor: color, width: 13, height: 13 }}
                />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ color: '#e8d5a0', fontSize: 12, flex: 1 }}>
                  {adv.name}
                  {adv.prestigeClass && <span style={{ color, marginLeft: 3 }}>✦</span>}
                  {!adv.prestigeClass && elite && <span style={{ color: '#f1c40f', marginLeft: 3 }}>★</span>}
                </span>
                <LevelBadge adv={adv} />
                <span style={{ color: '#aaa', fontSize: 11 }}>
                  {adv.prestigeClass ? PRESTIGE_CLASS_LABELS[adv.prestigeClass] : CLASS_LABELS[adv.class]}
                </span>
                <span style={{ color: hasBonus ? '#2ecc71' : '#f1c40f', fontSize: 11 }}>
                  ⚡{effPower}{hasBonus ? ` (+${effPower - adv.power})` : ''}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {quest.status === 'available' && (
        <button
          onClick={() => onDispatch(quest.id, selectedAdventurers.map(a => a.id))}
          disabled={!canDispatch}
          style={{
            marginTop: 2,
            background: !canDispatch ? '#3a3a3a' : willSucceed ? '#2c7a3a' : '#7a2c2c',
            border: 'none',
            borderRadius: 6,
            color: !canDispatch ? '#666' : '#e8d5a0',
            padding: '7px 14px',
            cursor: !canDispatch ? 'not-allowed' : 'pointer',
            width: '100%',
            fontSize: 13,
            fontWeight: 'bold',
            fontFamily: 'serif',
          }}
        >
          {availableAdventurers.length === 0
            ? 'No idle recruits available'
            : selectedAdventurers.length === 0
            ? 'Select adventurers to send'
            : gold < dispatchCost
            ? `Need ${dispatchCost}g to dispatch`
            : `Send ${selectedAdventurers.length} adventurer${selectedAdventurers.length !== 1 ? 's' : ''} (−${dispatchCost}g)`}
        </button>
      )}
    </div>
  );
}

function QuestBoardModal({ quests, adventurers, gold, dispatchCost, onDispatch, onRefresh, onClose }: {
  quests: Quest[];
  adventurers: Adventurer[];
  gold: number;
  dispatchCost: number;
  onDispatch: (qid: string, aids: string[]) => void;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const idleRecruits = adventurers.filter(a => a.status === 'recruited');
  const completedCount = quests.filter(q => q.status === 'completed' || q.status === 'failed').length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a0d04',
          border: '2px solid #7a4a1e',
          borderRadius: 12,
          padding: 24,
          width: 580,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 0 40px rgba(0,0,0,0.8)',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ color: '#e8d5a0', margin: 0, fontSize: 22 }}>Quest Board</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: '#888', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
          Dispatching costs <span style={{ color: '#ffd700' }}>{dispatchCost}g</span>
          {dispatchCost < DISPATCH_COST && <span style={{ color: '#2ecc71' }}> (Guild Hall discount!)</span>}.
          Class abilities grant bonus power on matching quest types — shown in <span style={{ color: '#2ecc71' }}>green</span>.
        </p>
        {quests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
            availableAdventurers={idleRecruits}
            gold={gold}
            dispatchCost={dispatchCost}
            onDispatch={onDispatch}
          />
        ))}
        {completedCount >= 1 && (
          <button
            onClick={onRefresh}
            style={{
              marginTop: 8,
              background: '#3d2410',
              border: '1px solid #7a4a1e',
              borderRadius: 6,
              color: '#e8d5a0',
              padding: '8px 16px',
              cursor: 'pointer',
              width: '100%',
              fontFamily: 'serif',
              fontSize: 14,
            }}
          >
            Refresh Quest Board
          </button>
        )}
      </div>
    </div>
  );
}

function CollapsibleHeader({ label, count, open, onToggle, color = '#e8d5a0' }: {
  label: string; count?: number; open: boolean; onToggle: () => void; color?: string;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', userSelect: 'none', marginBottom: open ? 8 : 0,
      }}
    >
      <span style={{ color, fontWeight: 'bold', fontSize: 13 }}>
        {label}{count !== undefined ? ` (${count})` : ''}
      </span>
      <span style={{ color: '#7a6a5a', fontSize: 11, marginLeft: 6 }}>{open ? '▲' : '▼'}</span>
    </div>
  );
}

function LeftPanel({ roster, wanderers, selectedAdventurerId, onSelectAdventurer, onRecruit, onAllocate, onPrestige }: {
  roster: Adventurer[];
  wanderers: Adventurer[];
  selectedAdventurerId: string | null;
  onSelectAdventurer: (id: string | null) => void;
  onRecruit: (id: string) => void;
  onAllocate: (id: string) => void;
  onPrestige: (id: string) => void;
}) {
  const [partyOpen, setPartyOpen] = useState(true);
  const [visitorsOpen, setVisitorsOpen] = useState(true);

  return (
    <div style={{
      position: 'absolute', top: 120, left: 0, bottom: 0,
      width: 220, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'auto', overflowY: 'auto',
    }}>
      {roster.length > 0 && (
        <div style={panelStyle}>
          <CollapsibleHeader
            label="Your Party" count={roster.length}
            open={partyOpen} onToggle={() => setPartyOpen(o => !o)}
          />
          {partyOpen && roster.map(adv => (
            <AdventurerCard
              key={adv.id} adv={adv}
              isSelected={selectedAdventurerId === adv.id}
              onSelect={() => onSelectAdventurer(selectedAdventurerId === adv.id ? null : adv.id)}
              onRecruit={onRecruit}
              onAllocate={() => onAllocate(adv.id)}
              onPrestige={() => onPrestige(adv.id)}
            />
          ))}
        </div>
      )}
      {wanderers.length > 0 && (
        <div style={panelStyle}>
          <CollapsibleHeader
            label="In the Tavern" count={wanderers.length}
            open={visitorsOpen} onToggle={() => setVisitorsOpen(o => !o)}
            color="#b0a090"
          />
          {visitorsOpen && wanderers.map(adv => (
            <AdventurerCard
              key={adv.id} adv={adv}
              isSelected={selectedAdventurerId === adv.id}
              onSelect={() => onSelectAdventurer(selectedAdventurerId === adv.id ? null : adv.id)}
              onRecruit={onRecruit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RightPanel({ activeQuests, gameLog, onToggleQuestBoard }: {
  activeQuests: Quest[];
  gameLog: string[];
  onToggleQuestBoard: () => void;
}) {
  const [questsOpen, setQuestsOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(true);

  return (
    <div style={{
      position: 'absolute', top: 120, right: 0, bottom: 0,
      width: 210, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'auto',
    }}>
      <button
        onClick={onToggleQuestBoard}
        style={{
          background: 'linear-gradient(180deg, #8a5422 0%, #5c3315 100%)',
          border: '1px solid #a0631e',
          borderRadius: 8,
          color: '#e8d5a0',
          fontFamily: 'serif',
          fontWeight: 'bold',
          fontSize: 15,
          padding: '10px 16px',
          cursor: 'pointer',
          letterSpacing: 0.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          flexShrink: 0,
        }}
      >
        Quest Board
      </button>

      {activeQuests.length > 0 && (
        <div style={panelStyle}>
          <CollapsibleHeader
            label="Active Quests" count={activeQuests.length}
            open={questsOpen} onToggle={() => setQuestsOpen(o => !o)}
            color="#f39c12"
          />
          {questsOpen && activeQuests.map(q => <ActiveQuestItem key={q.id} quest={q} />)}
        </div>
      )}

      <div style={{ ...panelStyle, flex: logOpen ? 1 : 0, overflowY: logOpen ? 'auto' : 'hidden', minHeight: 0 }}>
        <CollapsibleHeader
          label="Event Log"
          open={logOpen} onToggle={() => setLogOpen(o => !o)}
          color="#b0a090"
        />
        {logOpen && gameLog.map((entry, i) => (
          <div key={i} style={{
            color: i === 0 ? '#e8d5a0' : '#7a6a5a',
            fontSize: 11,
            marginBottom: 4,
            lineHeight: 1.4,
          }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HUD({
  gold, adventurers, quests, gameLog, gamePhase,
  selectedAdventurerId, showQuestBoard, upgrades,
  questsCompleted, tavernPrestige,
  onRecruit, onSelectAdventurer, onToggleQuestBoard, onDispatchQuest, onRefreshQuests, onPlaySound,
  onNewGame, onSpendUpgradePoint, onPrestigeAdventurer,
}: HUDProps) {
  const [allocateId, setAllocateId] = useState<string | null>(null);
  const [prestigeId, setPrestigeId] = useState<string | null>(null);
  const roster = adventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
  const wanderers = adventurers.filter(a => a.status === 'idle' || a.status === 'entering');
  const activeQuests = quests.filter(q => q.status === 'active');
  const rosterMax = ROSTER_CAPS[(upgrades.rosterSlots ?? 1) - 1];

  const selectedAdv = selectedAdventurerId
    ? adventurers.find(a => a.id === selectedAdventurerId) ?? null
    : null;

  const allocateAdv = allocateId
    ? adventurers.find(a => a.id === allocateId) ?? null
    : null;

  const prestigeAdv = prestigeId
    ? adventurers.find(a => a.id === prestigeId) ?? null
    : null;

  const newGameButtonStyle: React.CSSProperties = {
    marginTop: 24,
    background: 'linear-gradient(180deg, #8a5422 0%, #5c3315 100%)',
    border: '1px solid #a0631e',
    borderRadius: 8,
    color: '#e8d5a0',
    fontFamily: 'serif',
    fontWeight: 'bold',
    fontSize: 16,
    padding: '10px 32px',
    cursor: 'pointer',
    letterSpacing: 0.5,
  };

  if (gamePhase === 'lost') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        fontFamily: 'serif',
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>&#x1F480;</div>
          <h1 style={{ color: '#e74c3c', fontSize: 40, margin: '0 0 12px' }}>Defeated</h1>
          <p style={{ color: '#e8d5a0', fontSize: 20 }}>All your adventurers were lost.</p>
          <p style={{ color: '#888', fontSize: 15, marginTop: 8 }}>
            Your tavern earned <span style={{ color: '#ffd700' }}>{gold} gold</span> and completed{' '}
            <span style={{ color: '#c8960c' }}>{questsCompleted} quests</span> before falling silent.
          </p>
          <button onClick={onNewGame} style={newGameButtonStyle}>New Game</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: 'serif', userSelect: 'none', zIndex: 100 }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', padding: '10px 16px',
        pointerEvents: 'none',
      }}>
        <div style={{ ...panelStyle, pointerEvents: 'auto', minWidth: 320, position: 'relative' }}>
          <TopBarInfo
            gold={gold}
            roomsIncome={(upgrades.rooms ?? 0) * 3 * 2}
            questsCompleted={questsCompleted}
            tavernPrestige={tavernPrestige}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
            <span>Roster: {roster.length}/{rosterMax}</span>
            <span>Visitors: {wanderers.length}</span>
            <span>Active Quests: {activeQuests.length}</span>
          </div>
          <button
            onClick={onNewGame}
            title="Wipe save and start a new game"
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(60,20,5,0.8)',
              border: '1px solid #5c3315',
              borderRadius: 5,
              color: '#7a6a5a',
              fontFamily: 'serif',
              fontSize: 10,
              padding: '2px 7px',
              cursor: 'pointer',
              letterSpacing: 0.3,
            }}
          >
            New Game
          </button>
        </div>
      </div>

      {/* Left panel */}
      <LeftPanel
        roster={roster}
        wanderers={wanderers}
        selectedAdventurerId={selectedAdventurerId}
        onSelectAdventurer={onSelectAdventurer}
        onRecruit={onRecruit}
        onAllocate={(id) => { setAllocateId(id); onSelectAdventurer(null); }}
        onPrestige={(id) => { setPrestigeId(id); onSelectAdventurer(null); }}
      />

      {/* Right panel */}
      <RightPanel
        activeQuests={activeQuests}
        gameLog={gameLog}
        onToggleQuestBoard={onToggleQuestBoard}
      />

      {/* Recruit popup */}
      {selectedAdv && !showQuestBoard && !allocateId && !prestigeId && (
        <RecruitPopup
          adv={selectedAdv}
          onRecruit={onRecruit}
          onClose={() => onSelectAdventurer(null)}
          onPlaySound={onPlaySound}
        />
      )}

      {/* Stat Allocation popup */}
      {allocateAdv && !showQuestBoard && (
        <StatAllocationPopup
          adv={allocateAdv}
          onClose={() => setAllocateId(null)}
          onSpend={(stat) => {
            onSpendUpgradePoint(allocateAdv.id, stat);
            if ((allocateAdv.upgradePoints ?? 0) <= 1) setAllocateId(null);
          }}
        />
      )}

      {/* Prestige confirm popup */}
      {prestigeAdv && !showQuestBoard && (
        <PrestigeConfirmPopup
          adv={prestigeAdv}
          gold={gold}
          onConfirm={() => onPrestigeAdventurer(prestigeAdv.id)}
          onClose={() => setPrestigeId(null)}
        />
      )}

      {/* Help hint */}
      {wanderers.length > 0 && roster.length === 0 && !selectedAdv && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', textAlign: 'center',
        }}>
          <div style={{
            color: '#c8aa80', fontSize: 14, fontStyle: 'italic',
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20,
          }}>
            Click an adventurer to recruit them!
          </div>
        </div>
      )}
      {adventurers.length === 0 && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}>
          <div style={{
            color: '#7a6a5a', fontSize: 13, fontStyle: 'italic',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          }}>
            Adventurers will arrive soon...
          </div>
        </div>
      )}

      {showQuestBoard && (
        <div style={{ pointerEvents: 'auto' }}>
          <QuestBoardModal
            quests={quests}
            adventurers={adventurers}
            gold={gold}
            dispatchCost={upgrades.guildHall ? Math.floor(DISPATCH_COST / 2) : DISPATCH_COST}
            onDispatch={onDispatchQuest}
            onRefresh={onRefreshQuests}
            onClose={onToggleQuestBoard}
          />
        </div>
      )}
    </div>
  );
}
