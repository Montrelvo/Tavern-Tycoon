import React, { useEffect, useRef, useState } from 'react';
import type { Adventurer, Quest, BountyQuest, Upgrades, DropNotification, Materials } from '../game/types';
import {
  CLASS_COLORS, CLASS_LABELS, CLASS_PASSIVE_LABELS,
  ELITE_LEVEL, MAX_LEVEL, XP_THRESHOLDS,
  QUEST_TYPE_LABELS, QUEST_TYPE_COLORS, CLASS_STAT_COLORS, ROSTER_BASE, ROSTER_UPGRADE_SIZE,
  PRESTIGE_CLASS_LABELS, PRESTIGE_CLASS_COLORS, PRESTIGE_CLASS_PASSIVE_LABELS,
  PRESTIGE_CLASS_FOR, TAVERN_PRESTIGE_THRESHOLDS, TAVERN_PRESTIGE_NAMES,
  PRESTIGE_ADVENTURER_COST,
  QUEST_TIER_COLORS, QUEST_TIER_LABELS,
} from '../game/constants';
import { getAdventurerBonus } from '../game/questUtils';

const MATERIAL_ICONS: Record<keyof Materials, string> = {
  herbs: '🌿',
  ore: '⛏️',
  relics: '🏺',
  bones: '🦴',
  pelts: '🐾',
  venom: '🧪',
};

const MATERIAL_LABELS_HUD: Record<keyof Materials, string> = {
  herbs: 'Herb',
  ore: 'Ore',
  relics: 'Relic',
  bones: 'Bone',
  pelts: 'Pelt',
  venom: 'Venom',
};

function DropToast({ notification, onDismiss }: { notification: DropNotification; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setLeaving(true);
      timerRef.current = setTimeout(onDismiss, 400);
    }, 4000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const opacity = visible && !leaving ? 1 : 0;
  const translateY = visible && !leaving ? 0 : 24;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 60,
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY}px)`,
        opacity,
        transition: leaving ? 'opacity 0.4s ease, transform 0.4s ease' : 'opacity 0.35s ease, transform 0.35s ease',
        zIndex: 500,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(10,5,1,0.97)',
          border: '2px solid #c8960c',
          borderRadius: 12,
          padding: '12px 20px',
          boxShadow: '0 0 32px rgba(200,150,12,0.35), 0 4px 20px rgba(0,0,0,0.9)',
          fontFamily: 'serif',
          textAlign: 'center',
          minWidth: 200,
        }}
      >
        <div style={{ color: '#c8960c', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Materials Found
        </div>
        <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>
          {notification.questName}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {notification.drops.map(({ material, qty }) => (
            <div
              key={material}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(200,150,12,0.08)',
                border: '1px solid rgba(200,150,12,0.25)',
                borderRadius: 8,
                padding: '6px 12px',
                minWidth: 52,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{MATERIAL_ICONS[material]}</span>
              <span style={{ color: '#e8d5a0', fontSize: 13, fontWeight: 'bold' }}>×{qty}</span>
              <span style={{ color: '#888', fontSize: 10 }}>
                {MATERIAL_LABELS_HUD[material]}{qty > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface HUDProps {
  gold: number;
  adventurers: Adventurer[];
  quests: Quest[];
  bounties: BountyQuest[];
  gameLog: string[];
  gamePhase: 'playing' | 'lost';
  selectedAdventurerId: string | null;
  showQuestBoard: boolean;
  upgrades: Upgrades;
  questsCompleted: number;
  tavernPrestige: 0 | 1 | 2 | 3;
  lastDropNotification: DropNotification | null;
  onRecruit: (id: string) => void;
  onSelectAdventurer: (id: string | null) => void;
  onToggleQuestBoard: () => void;
  onDispatchQuest: (questId: string, adventurerIds: string[]) => void;
  onRejectQuest: (questId: string) => void;
  onAcceptBounty: (bountyId: string) => void;
  onAbandonBounty: (bountyId: string) => void;
  onRejectBounty: (bountyId: string) => void;
  onPlaySound: (type: 'recruit' | 'questComplete' | 'questFail') => void;
  onNewGame: () => void;
  onSave: () => number | null;
  lastAutoSavedAt: number | null;
}

function formatRelativeTime(ts: number, now: number): string {
  const diffMs = now - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
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

function ActiveBountyItem({ bounty }: { bounty: BountyQuest }) {
  const typeColor = QUEST_TYPE_COLORS[bounty.targetMonsterType] ?? '#c8960c';
  const pct = bounty.requiredKills > 0
    ? Math.min(1, bounty.currentKills / bounty.requiredKills)
    : 0;

  return (
    <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #3d2410' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span style={{
          fontSize: 9, fontWeight: 'bold', color: typeColor,
          background: `${typeColor}22`, border: `1px solid ${typeColor}44`,
          borderRadius: 3, padding: '1px 4px', flexShrink: 0,
        }}>
          {QUEST_TYPE_LABELS[bounty.targetMonsterType]}
        </span>
        <div style={{ color: '#e8d5a0', fontSize: 11, fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bounty.name}
        </div>
        <span style={{ color: '#b0a080', fontSize: 10, flexShrink: 0 }}>
          {bounty.currentKills}/{bounty.requiredKills}
        </span>
      </div>
      <div style={{
        height: 4, borderRadius: 2, background: '#2a1a08',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${pct * 100}%`,
          background: pct >= 1 ? '#2ecc71' : typeColor,
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}

function QuestCard({ quest, availableAdventurers, partyCap, onSetPartyCap, onDispatch, onReject }: {
  quest: Quest;
  availableAdventurers: Adventurer[];
  partyCap: number;
  onSetPartyCap: (n: number) => void;
  onDispatch: (qid: string, aids: string[]) => void;
  onReject: (qid: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(availableAdventurers.map(a => a.id))
  );

  useEffect(() => {
    setSelectedIds(prev => new Set(Array.from(prev).filter(id => availableAdventurers.some(a => a.id === id))));
  }, [availableAdventurers]);

  const selectedAdventurers = availableAdventurers.filter(a => selectedIds.has(a.id));

  function getEffectivePower(adv: Adventurer): number {
    return adv.power + getAdventurerBonus(adv, quest.questType);
  }

  const selectedPower = selectedAdventurers.reduce((sum, a) => sum + getEffectivePower(a), 0);
  const canDispatch = quest.status === 'available' && selectedAdventurers.length > 0;
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
  const tier = quest.tier ?? 'common';
  const tierColor = QUEST_TIER_COLORS[tier];
  const tierLabel = QUEST_TIER_LABELS[tier];

  const toggleAdventurer = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < partyCap) {
        next.add(id);
      }
      return next;
    });
  };

  const adjustCap = (delta: number) => {
    const next = Math.max(1, Math.min(availableAdventurers.length || 1, partyCap + delta));
    if (next < selectedIds.size) {
      setSelectedIds(ids => new Set(Array.from(ids).slice(0, next)));
    }
    onSetPartyCap(next);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${tier === 'common' ? '#5c3315' : tierColor + '66'}`,
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
      boxShadow: tier !== 'common' ? `0 0 8px ${tierColor}18` : 'none',
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
            <span style={{
              fontSize: 10, fontWeight: 'bold', color: tierColor,
              background: `${tierColor}18`, border: `1px solid ${tierColor}55`,
              borderRadius: 4, padding: '1px 6px',
              letterSpacing: 0.3,
            }}>
              {tierLabel}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#b0a090', fontSize: 11 }}>Party cap:</span>
            <button
              onClick={() => adjustCap(-1)}
              disabled={partyCap <= 1}
              style={{
                width: 22, height: 22, borderRadius: 4, border: '1px solid #5c3315',
                background: partyCap <= 1 ? '#1a0d04' : '#3a1e08', color: partyCap <= 1 ? '#3a2a18' : '#e8d5a0',
                cursor: partyCap <= 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >−</button>
            <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 13, minWidth: 16, textAlign: 'center' }}>
              {partyCap}
            </span>
            <button
              onClick={() => adjustCap(1)}
              disabled={partyCap >= availableAdventurers.length}
              style={{
                width: 22, height: 22, borderRadius: 4, border: '1px solid #5c3315',
                background: partyCap >= availableAdventurers.length ? '#1a0d04' : '#3a1e08',
                color: partyCap >= availableAdventurers.length ? '#3a2a18' : '#e8d5a0',
                cursor: partyCap >= availableAdventurers.length ? 'not-allowed' : 'pointer',
                fontWeight: 'bold', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >+</button>
            <span style={{ color: '#5a4a3a', fontSize: 11 }}>of {availableAdventurers.length} available</span>
          </div>
          <div style={{ color: '#b0a090', fontSize: 11, marginBottom: 4 }}>
            Select adventurers to send ({selectedIds.size}/{partyCap} selected):
          </div>
          {availableAdventurers.map(adv => {
            const checked = selectedIds.has(adv.id);
            const atCap = !checked && selectedIds.size >= partyCap;
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
                  cursor: atCap ? 'not-allowed' : 'pointer',
                  opacity: atCap ? 0.45 : 1,
                  boxShadow: checked && (elite || adv.prestigeClass) ? `0 0 6px ${color}33` : 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAdventurer(adv.id)}
                  disabled={atCap}
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
          {selectedIds.size >= partyCap && selectedIds.size < availableAdventurers.length && (
            <div style={{ color: '#7a5a30', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
              Party cap reached — lower the cap or deselect someone to swap
            </div>
          )}
        </div>
      )}

      {quest.status === 'available' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onDispatch(quest.id, selectedAdventurers.map(a => a.id))}
            disabled={!canDispatch}
            style={{
              marginTop: 2,
              flex: 1,
              background: !canDispatch ? '#3a3a3a' : willSucceed ? '#2c7a3a' : '#7a2c2c',
              border: 'none',
              borderRadius: 6,
              color: !canDispatch ? '#666' : '#e8d5a0',
              padding: '7px 14px',
              cursor: !canDispatch ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 'bold',
              fontFamily: 'serif',
            }}
          >
            {availableAdventurers.length === 0
              ? 'No idle recruits available'
              : selectedAdventurers.length === 0
              ? 'Select adventurers to send'
              : `Send ${selectedAdventurers.length} adventurer${selectedAdventurers.length !== 1 ? 's' : ''}`}
          </button>
          <button
            onClick={() => onReject(quest.id)}
            style={{
              marginTop: 2,
              background: 'transparent',
              border: '1px solid #4a3020',
              borderRadius: 6,
              color: '#6a5a48',
              padding: '7px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'serif',
              whiteSpace: 'nowrap',
            }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function BountyCard({ bounty, activeBountyCount, onAccept, onAbandon, onReject }: {
  bounty: BountyQuest;
  activeBountyCount: number;
  onAccept: (id: string) => void;
  onAbandon: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const typeColor = QUEST_TYPE_COLORS[bounty.targetMonsterType] ?? '#c8960c';
  const typeLabel = QUEST_TYPE_LABELS[bounty.targetMonsterType] ?? bounty.targetMonsterType;
  const progressPct = Math.min(100, (bounty.currentKills / bounty.requiredKills) * 100);
  const isCompleted = bounty.status === 'completed';
  const isActive = bounty.status === 'active';
  const isAvailable = bounty.status === 'available';
  const canAccept = isAvailable && activeBountyCount < 4;

  return (
    <div style={{
      background: isCompleted
        ? 'rgba(46,204,113,0.06)'
        : isActive
        ? 'rgba(200,150,12,0.08)'
        : 'rgba(0,0,0,0.3)',
      border: `1px solid ${isCompleted ? '#2ecc7155' : isActive ? '#c8960c66' : '#3d2410'}`,
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 14 }}>{bounty.name}</span>
            {isActive && (
              <span style={{
                fontSize: 10, fontWeight: 'bold', padding: '1px 6px', borderRadius: 4,
                background: 'rgba(200,150,12,0.2)', border: '1px solid #c8960c66', color: '#c8960c',
              }}>ACTIVE</span>
            )}
            {isCompleted && (
              <span style={{
                fontSize: 10, fontWeight: 'bold', padding: '1px 6px', borderRadius: 4,
                background: 'rgba(46,204,113,0.2)', border: '1px solid #2ecc7166', color: '#2ecc71',
              }}>DONE</span>
            )}
          </div>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{bounty.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 4, fontWeight: 'bold',
              background: `${typeColor}22`, border: `1px solid ${typeColor}66`, color: typeColor,
            }}>{typeLabel}</span>
            {bounty.reward > 0 && (
              <span style={{ color: '#ffd700', fontSize: 12, fontWeight: 'bold' }}>+{bounty.reward}g</span>
            )}
            {bounty.materialReward && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 11, fontWeight: 'bold', color: '#c8aa80',
                background: 'rgba(255,255,255,0.06)', border: '1px solid #3d2410',
                borderRadius: 4, padding: '1px 6px',
              }}>
                {MATERIAL_ICONS[bounty.materialReward.type]}
                {bounty.materialReward.amount} {MATERIAL_LABELS_HUD[bounty.materialReward.type]}{bounty.materialReward.amount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ color: isCompleted ? '#2ecc71' : isActive ? '#c8960c' : '#888', fontWeight: 'bold', fontSize: 16 }}>
            {bounty.currentKills}/{bounty.requiredKills}
          </div>
          <div style={{ color: '#555', fontSize: 10 }}>kills</div>
        </div>
      </div>

      {/* Progress bar */}
      {(isActive || isCompleted) && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ background: '#1a0a02', borderRadius: 4, height: 6, border: '1px solid #2a1208', overflow: 'hidden' }}>
            <div style={{
              background: isCompleted
                ? 'linear-gradient(90deg, #2ecc71, #27ae60)'
                : 'linear-gradient(90deg, #c8960c, #e67e22)',
              width: `${progressPct}%`,
              height: '100%',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {isAvailable && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <button
            onClick={() => onAccept(bounty.id)}
            disabled={!canAccept}
            style={{
              background: canAccept
                ? 'linear-gradient(180deg, #8a5422 0%, #5c3315 100%)'
                : '#1a0d04',
              border: canAccept ? '1px solid #a0631e' : '1px solid #2a1208',
              borderRadius: 5,
              color: canAccept ? '#e8d5a0' : '#3a2a18',
              fontFamily: 'serif',
              fontWeight: 'bold',
              fontSize: 12,
              padding: '5px 14px',
              cursor: canAccept ? 'pointer' : 'not-allowed',
            }}
          >
            {canAccept ? 'Accept Bounty' : 'Max active bounties (4)'}
          </button>
          <button
            onClick={() => onReject(bounty.id)}
            style={{
              background: 'transparent',
              border: '1px solid #4a3020',
              borderRadius: 5,
              color: '#6a5a48',
              fontFamily: 'serif',
              fontWeight: 'bold',
              fontSize: 12,
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            Reject
          </button>
        </div>
      )}

      {isActive && !confirmingAbandon && (
        <button
          onClick={() => setConfirmingAbandon(true)}
          style={{
            background: 'transparent',
            border: '1px solid #5a2020',
            borderRadius: 5,
            color: '#a05050',
            fontFamily: 'serif',
            fontWeight: 'bold',
            fontSize: 12,
            padding: '4px 12px',
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          Abandon
        </button>
      )}

      {isActive && confirmingAbandon && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ color: '#c88', fontSize: 12, flex: 1 }}>Abandon this bounty? Progress will be lost.</span>
          <button
            onClick={() => { onAbandon(bounty.id); setConfirmingAbandon(false); }}
            style={{
              background: 'linear-gradient(180deg, #7a2222 0%, #4a1515 100%)',
              border: '1px solid #9a3333',
              borderRadius: 5,
              color: '#f0c0c0',
              fontFamily: 'serif',
              fontWeight: 'bold',
              fontSize: 12,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            Yes, Abandon
          </button>
          <button
            onClick={() => setConfirmingAbandon(false)}
            style={{
              background: '#1a0d04',
              border: '1px solid #3d2410',
              borderRadius: 5,
              color: '#7a6a5a',
              fontFamily: 'serif',
              fontWeight: 'bold',
              fontSize: 12,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            Keep
          </button>
        </div>
      )}
    </div>
  );
}

function QuestBoardModal({ quests, bounties, adventurers, gold, partyCap, onSetPartyCap, onDispatch, onRejectQuest, onAcceptBounty, onAbandonBounty, onRejectBounty, onClose }: {
  quests: Quest[];
  bounties: BountyQuest[];
  adventurers: Adventurer[];
  gold: number;
  partyCap: number;
  onSetPartyCap: (n: number) => void;
  onDispatch: (qid: string, aids: string[]) => void;
  onRejectQuest: (questId: string) => void;
  onAcceptBounty: (bountyId: string) => void;
  onAbandonBounty: (bountyId: string) => void;
  onRejectBounty: (bountyId: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'quests' | 'bounties'>('quests');
  const idleRecruits = adventurers.filter(a => a.status === 'recruited');
  const activeBountyCount = bounties.filter(b => b.status === 'active').length;

  const tabStyle = (tab: 'quests' | 'bounties'): React.CSSProperties => ({
    flex: 1,
    padding: '8px 0',
    background: activeTab === tab ? 'rgba(140,80,30,0.3)' : 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #c8960c' : '2px solid #2a1a08',
    color: activeTab === tab ? '#e8d5a0' : '#7a6a5a',
    fontFamily: 'serif',
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer',
    letterSpacing: 0.3,
  });

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#e8d5a0', margin: 0, fontSize: 22 }}>Quest Board</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 16, gap: 0 }}>
          <button style={tabStyle('quests')} onClick={() => setActiveTab('quests')}>
            Quests
          </button>
          <button style={tabStyle('bounties')} onClick={() => setActiveTab('bounties')}>
            Bounties
            {activeBountyCount > 0 && (
              <span style={{ color: '#c8960c', fontSize: 11, marginLeft: 4 }}>({activeBountyCount} active)</span>
            )}
          </button>
        </div>

        {activeTab === 'quests' && (
          <>
            <p style={{ color: '#888', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
              Class abilities grant bonus power on matching quest types — shown in <span style={{ color: '#2ecc71' }}>green</span>.
              Reject a quest to replace it with a fresh one.
            </p>
            {quests.filter(q => q.status === 'available' || q.status === 'active').map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                availableAdventurers={idleRecruits}
                partyCap={partyCap}
                onSetPartyCap={setPartyCap}
                onDispatch={onDispatch}
                onReject={onRejectQuest}
              />
            ))}
          </>
        )}

        {activeTab === 'bounties' && (
          <>
            <p style={{ color: '#888', fontSize: 13, margin: '0 0 4px', lineHeight: 1.5 }}>
              Accept standing bounties and fill them passively as adventurers complete quests. Up to 4 active at once.
              Reject a bounty to replace it with a fresh one.
            </p>
            <div style={{ color: '#7a6a5a', fontSize: 11, marginBottom: 16 }}>
              Active: <span style={{ color: '#c8960c' }}>{activeBountyCount}/4</span>
              {' · '}
              Available: <span style={{ color: '#aaa' }}>{bounties.filter(b => b.status === 'available').length}</span>
            </div>

            {bounties.length === 0 && (
              <div style={{ color: '#555', textAlign: 'center', fontStyle: 'italic', padding: '20px 0' }}>
                No bounties available.
              </div>
            )}

            {bounties.map(bounty => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                activeBountyCount={activeBountyCount}
                onAccept={onAcceptBounty}
                onAbandon={onAbandonBounty}
                onReject={onRejectBounty}
              />
            ))}
          </>
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

function LeftPanel({ roster, wanderers, selectedAdventurerId, onSelectAdventurer, onRecruit }: {
  roster: Adventurer[];
  wanderers: Adventurer[];
  selectedAdventurerId: string | null;
  onSelectAdventurer: (id: string | null) => void;
  onRecruit: (id: string) => void;
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

function RightPanel({ activeQuests, activeBounties, gameLog, onToggleQuestBoard }: {
  activeQuests: Quest[];
  activeBounties: BountyQuest[];
  gameLog: string[];
  onToggleQuestBoard: () => void;
}) {
  const [questsOpen, setQuestsOpen] = useState(true);
  const [bountiesOpen, setBountiesOpen] = useState(true);
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

      {activeBounties.length > 0 && (
        <div style={panelStyle}>
          <CollapsibleHeader
            label="Active Bounties" count={activeBounties.length}
            open={bountiesOpen} onToggle={() => setBountiesOpen(o => !o)}
            color="#c8960c"
          />
          {bountiesOpen && activeBounties.map(b => <ActiveBountyItem key={b.id} bounty={b} />)}
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
  gold, adventurers, quests, bounties, gameLog, gamePhase,
  selectedAdventurerId, showQuestBoard, upgrades,
  questsCompleted, tavernPrestige, lastDropNotification,
  onRecruit, onSelectAdventurer, onToggleQuestBoard, onDispatchQuest, onRejectQuest,
  onAcceptBounty, onAbandonBounty, onRejectBounty, onPlaySound,
  onNewGame, onSave, lastAutoSavedAt,
}: HUDProps) {
  const roster = adventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
  const wanderers = adventurers.filter(a => a.status === 'idle' || a.status === 'entering');
  const activeQuests = quests.filter(q => q.status === 'active');
  const rosterMax = ROSTER_BASE + (upgrades.rosterSlots ?? 0) * ROSTER_UPGRADE_SIZE;

  const selectedAdv = selectedAdventurerId
    ? adventurers.find(a => a.id === selectedAdventurerId) ?? null
    : null;

  const [activeDropNotification, setActiveDropNotification] = useState<DropNotification | null>(null);
  const shownNotificationIdRef = useRef<number | null>(null);
  const idleRecruits = adventurers.filter(a => a.status === 'recruited');
  const [partyCap, setPartyCap] = useState<number>(1);
  const [saveFlash, setSaveFlash] = useState(false);
  const saveFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (saveFlashTimerRef.current) clearTimeout(saveFlashTimerRef.current);
    };
  }, []);

  const handleSave = () => {
    const ok = onSave();
    if (ok === null) return;
    setSaveFlash(true);
    if (saveFlashTimerRef.current) clearTimeout(saveFlashTimerRef.current);
    saveFlashTimerRef.current = setTimeout(() => setSaveFlash(false), 1800);
  };

  useEffect(() => {
    const count = idleRecruits.length;
    setPartyCap(prev => Math.max(1, Math.min(count || 1, prev)));
  }, [idleRecruits.length]);

  useEffect(() => {
    if (lastDropNotification && lastDropNotification.id !== shownNotificationIdRef.current) {
      shownNotificationIdRef.current = lastDropNotification.id;
      setActiveDropNotification(lastDropNotification);
    }
  }, [lastDropNotification]);

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
      <>
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
            <button onClick={() => setShowNewGameConfirm(true)} style={newGameButtonStyle}>New Game</button>
          </div>
        </div>
        {showNewGameConfirm && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 400,
            fontFamily: 'serif',
          }}>
            <div style={{
              background: 'rgba(15,8,2,0.98)',
              border: '2px solid #8a3a1a',
              borderRadius: 14,
              padding: '28px 32px',
              minWidth: 300,
              maxWidth: 360,
              boxShadow: '0 0 40px rgba(200,80,20,0.25), 0 8px 32px rgba(0,0,0,0.95)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
                Start a New Game?
              </div>
              <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5, marginBottom: 22 }}>
                This will permanently erase your current save, including all gold, adventurers, and progress. This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowNewGameConfirm(false)}
                  style={{
                    flex: 1,
                    background: '#2a1a08',
                    border: '1px solid #5c3315',
                    borderRadius: 7,
                    color: '#c8b090',
                    fontFamily: 'serif',
                    fontWeight: 'bold',
                    fontSize: 14,
                    padding: '9px 0',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowNewGameConfirm(false); onNewGame(); }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(180deg, #8a2a0a 0%, #5c1a08 100%)',
                    border: '1px solid #c0401a',
                    borderRadius: 7,
                    color: '#e8d5a0',
                    fontFamily: 'serif',
                    fontWeight: 'bold',
                    fontSize: 14,
                    padding: '9px 0',
                    cursor: 'pointer',
                  }}
                >
                  Wipe &amp; Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </>
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
          {(upgrades.rooms ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, fontSize: 11, color: '#666' }}>
              <span>
                Rooms: {upgrades.rooms}
                <span style={{ color: '#2ecc71', marginLeft: 6 }}>
                  +{(upgrades.rooms ?? 0) * 6} gold/min
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Save + New Game buttons — fixed top-right */}
      <div style={{
        position: 'fixed', top: 12, right: 16,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        pointerEvents: 'auto',
        zIndex: 110,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Auto-save indicator */}
          {lastAutoSavedAt && !saveFlash && (
            <span style={{
              color: '#4a7a55',
              fontFamily: 'serif',
              fontSize: 9,
              fontStyle: 'italic',
              letterSpacing: 0.2,
            }}>
              Auto-saved {formatRelativeTime(lastAutoSavedAt, now)}
            </span>
          )}
          {/* "Saved!" flash (manual save only) */}
          {saveFlash && (
            <span style={{
              color: '#2ecc71',
              fontFamily: 'serif',
              fontSize: 10,
              fontWeight: 'bold',
              letterSpacing: 0.3,
              animation: 'none',
              opacity: 1,
            }}>
              ✓ Saved!
            </span>
          )}
          {/* Save button */}
          <button
            onClick={handleSave}
            title="Save your progress"
            style={{
              background: 'rgba(10,40,15,0.85)',
              border: '1px solid #2a6a35',
              borderRadius: 5,
              color: '#5aaa6a',
              fontFamily: 'serif',
              fontSize: 10,
              padding: '2px 7px',
              cursor: 'pointer',
              letterSpacing: 0.3,
            }}
          >
            Save
          </button>
          {/* New Game button */}
          <button
            onClick={() => setShowNewGameConfirm(true)}
            title="Wipe save and start a new game"
            style={{
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
      />

      {/* Right panel */}
      <RightPanel
        activeQuests={activeQuests}
        activeBounties={bounties.filter(b => b.status === 'active')}
        gameLog={gameLog}
        onToggleQuestBoard={onToggleQuestBoard}
      />

      {/* Recruit popup */}
      {selectedAdv && !showQuestBoard && (
        <RecruitPopup
          adv={selectedAdv}
          onRecruit={onRecruit}
          onClose={() => onSelectAdventurer(null)}
          onPlaySound={onPlaySound}
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

      {/* Drop notification toast */}
      {activeDropNotification && (
        <DropToast
          key={activeDropNotification.id}
          notification={activeDropNotification}
          onDismiss={() => setActiveDropNotification(null)}
        />
      )}

      {showQuestBoard && (
        <div style={{ pointerEvents: 'auto' }}>
          <QuestBoardModal
            quests={quests}
            bounties={bounties}
            adventurers={adventurers}
            gold={gold}
            partyCap={partyCap}
            onSetPartyCap={setPartyCap}
            onDispatch={onDispatchQuest}
            onRejectQuest={onRejectQuest}
            onAcceptBounty={onAcceptBounty}
            onAbandonBounty={onAbandonBounty}
            onRejectBounty={onRejectBounty}
            onClose={onToggleQuestBoard}
          />
        </div>
      )}

      {/* New Game confirmation modal */}
      {showNewGameConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 400,
          fontFamily: 'serif',
          pointerEvents: 'auto',
        }}>
          <div style={{
            background: 'rgba(15,8,2,0.98)',
            border: '2px solid #8a3a1a',
            borderRadius: 14,
            padding: '28px 32px',
            minWidth: 300,
            maxWidth: 360,
            boxShadow: '0 0 40px rgba(200,80,20,0.25), 0 8px 32px rgba(0,0,0,0.95)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
            <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
              Start a New Game?
            </div>
            <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5, marginBottom: 22 }}>
              This will permanently erase your current save, including all gold, adventurers, and progress. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowNewGameConfirm(false)}
                style={{
                  flex: 1,
                  background: '#2a1a08',
                  border: '1px solid #5c3315',
                  borderRadius: 7,
                  color: '#c8b090',
                  fontFamily: 'serif',
                  fontWeight: 'bold',
                  fontSize: 14,
                  padding: '9px 0',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowNewGameConfirm(false); onNewGame(); }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(180deg, #8a2a0a 0%, #5c1a08 100%)',
                  border: '1px solid #c0401a',
                  borderRadius: 7,
                  color: '#e8d5a0',
                  fontFamily: 'serif',
                  fontWeight: 'bold',
                  fontSize: 14,
                  padding: '9px 0',
                  cursor: 'pointer',
                }}
              >
                Wipe &amp; Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
