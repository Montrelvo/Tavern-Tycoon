import React, { useEffect, useState } from 'react';
import type { Adventurer, Quest, Upgrades } from '../game/types';
import {
  CLASS_COLORS, CLASS_LABELS, CLASS_PASSIVE_LABELS,
  WIN_GOLD, DISPATCH_COST, ELITE_LEVEL, MAX_LEVEL, XP_THRESHOLDS,
  QUEST_TYPE_LABELS, QUEST_TYPE_COLORS, CLASS_STAT_COLORS, ROSTER_CAPS,
} from '../game/constants';
import { getAdventurerBonus } from '../game/questUtils';

interface HUDProps {
  gold: number;
  adventurers: Adventurer[];
  quests: Quest[];
  gameLog: string[];
  gamePhase: 'playing' | 'won' | 'lost';
  selectedAdventurerId: string | null;
  showQuestBoard: boolean;
  upgrades: Upgrades;
  onRecruit: (id: string) => void;
  onSelectAdventurer: (id: string | null) => void;
  onToggleQuestBoard: () => void;
  onDispatchQuest: (questId: string, adventurerIds: string[]) => void;
  onRefreshQuests: () => void;
  onPlaySound: (type: 'recruit' | 'questComplete' | 'questFail') => void;
  onNewGame: () => void;
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
    return <span style={{ color: '#ffd700', fontSize: 10, fontStyle: 'italic' }}>Max Level</span>;
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

function LevelBadge({ level }: { level: number }) {
  const elite = level >= ELITE_LEVEL;
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 'bold',
      padding: '1px 5px',
      borderRadius: 3,
      background: elite ? 'linear-gradient(135deg, #f1c40f, #e67e22)' : 'rgba(255,255,255,0.1)',
      color: elite ? '#1a0d00' : '#aaa',
      border: elite ? '1px solid #f1c40f' : '1px solid #444',
      flexShrink: 0,
    }}>
      {elite ? '★' : ''}Lv{level}
    </span>
  );
}

function GoldBar({ gold, roomsIncome }: { gold: number; roomsIncome: number }) {
  const pct = Math.min(100, (gold / WIN_GOLD) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 18, textShadow: '0 1px 4px #000' }}>
            {gold} Gold
          </span>
          {roomsIncome > 0 && (
            <span style={{ color: '#2ecc71', fontSize: 11, fontStyle: 'italic' }}>
              +{roomsIncome}/min from rooms
            </span>
          )}
        </div>
        <span style={{ color: '#aaa', fontSize: 12 }}>Goal: {WIN_GOLD}g</span>
      </div>
      <div style={{ background: '#2a1a08', borderRadius: 4, height: 8, border: '1px solid #5c3315' }}>
        <div style={{
          background: 'linear-gradient(90deg, #c8960c, #ffd700)',
          width: `${pct}%`,
          height: '100%',
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function AdventurerCard({ adv, isSelected, onSelect, onRecruit }: {
  adv: Adventurer;
  isSelected: boolean;
  onSelect: () => void;
  onRecruit: (id: string) => void;
}) {
  const color = CLASS_COLORS[adv.class];
  const elite = isElite(adv);

  const eliteBorder = elite
    ? `1px solid #f1c40f`
    : `1px solid ${isSelected ? color : '#5c3315'}`;

  const eliteGlow = elite
    ? `0 0 8px #f1c40f66, 0 0 2px #f1c40f44`
    : isSelected ? `0 0 4px ${color}44` : 'none';

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(255,255,255,0.12)' : elite ? 'rgba(241,196,15,0.06)' : 'rgba(255,255,255,0.05)',
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
        <LevelBadge level={adv.level} />
        <span style={{ color: '#aaa', fontSize: 10 }}>
          {adv.status === 'on-quest' ? 'On Quest' : adv.status === 'idle' ? 'Visitor' : 'Ready'}
        </span>
      </div>
      <div style={{ marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#aaa', fontSize: 11 }}>{CLASS_LABELS[adv.class]}</span>
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
    </div>
  );
}

function RecruitPopup({ adv, onRecruit, onClose, onPlaySound }: {
  adv: Adventurer;
  onRecruit: (id: string) => void;
  onClose: () => void;
  onPlaySound: (type: 'recruit' | 'questComplete' | 'questFail') => void;
}) {
  const color = CLASS_COLORS[adv.class];
  const isRecruited = adv.status === 'recruited';
  const elite = isElite(adv);
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
        border: `2px solid ${elite ? '#f1c40f' : color}`,
        borderRadius: 12,
        padding: '16px 20px',
        minWidth: 260,
        boxShadow: elite
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

        {elite && (
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
        <div style={{ color: '#b0a090', fontSize: 13, marginBottom: 4 }}>
          {CLASS_LABELS[adv.class]}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ color: '#f1c40f', fontSize: 14 }}>⚡ Power: {adv.power}</div>
          <div style={{
            fontSize: 12, fontWeight: 'bold',
            color: elite ? '#f1c40f' : '#aaa',
          }}>
            {elite ? '★' : ''}Lv {adv.level}
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
          <div style={{ color: color }}>{CLASS_PASSIVE_LABELS[adv.class]}</div>
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
            <div style={{ color: '#ffd700', fontSize: 12, fontStyle: 'italic' }}>Maximum level reached!</div>
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

function QuestCard({ quest, availableAdventurers, gold, onDispatch }: {
  quest: Quest;
  availableAdventurers: Adventurer[];
  gold: number;
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
  const canDispatch = quest.status === 'available' && selectedAdventurers.length > 0 && gold >= DISPATCH_COST;
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
            const color = CLASS_COLORS[adv.class];
            const effPower = getEffectivePower(adv);
            const hasBonus = effPower > adv.power;
            const elite = isElite(adv);
            return (
              <label
                key={adv.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 6px', borderRadius: 4, marginBottom: 2,
                  background: checked ? (elite ? 'rgba(241,196,15,0.08)' : 'rgba(255,255,255,0.08)') : 'transparent',
                  border: `1px solid ${checked ? (elite ? '#f1c40f' : color) : 'transparent'}`,
                  cursor: 'pointer',
                  boxShadow: checked && elite ? '0 0 6px #f1c40f33' : 'none',
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
                  {elite && <span style={{ color: '#f1c40f', marginLeft: 3 }}>★</span>}
                </span>
                <LevelBadge level={adv.level} />
                <span style={{ color: '#aaa', fontSize: 11 }}>{CLASS_LABELS[adv.class]}</span>
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
            : gold < DISPATCH_COST
            ? `Need ${DISPATCH_COST}g to dispatch`
            : `Send ${selectedAdventurers.length} adventurer${selectedAdventurers.length !== 1 ? 's' : ''} (−${DISPATCH_COST}g)`}
        </button>
      )}
    </div>
  );
}

function QuestBoardModal({ quests, adventurers, gold, onDispatch, onRefresh, onClose }: {
  quests: Quest[];
  adventurers: Adventurer[];
  gold: number;
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
          Dispatching costs <span style={{ color: '#ffd700' }}>{DISPATCH_COST}g</span>.
          Class abilities grant bonus power on matching quest types — shown in <span style={{ color: '#2ecc71' }}>green</span>.
        </p>
        {quests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
            availableAdventurers={idleRecruits}
            gold={gold}
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
  onRecruit, onSelectAdventurer, onToggleQuestBoard, onDispatchQuest, onRefreshQuests, onPlaySound,
  onNewGame,
}: HUDProps) {
  const roster = adventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
  const wanderers = adventurers.filter(a => a.status === 'idle' || a.status === 'entering');
  const activeQuests = quests.filter(q => q.status === 'active');
  const rosterMax = ROSTER_CAPS[(upgrades.rosterSlots ?? 1) - 1];

  const selectedAdv = selectedAdventurerId
    ? adventurers.find(a => a.id === selectedAdventurerId) ?? null
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

  if (gamePhase === 'won') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        fontFamily: 'serif',
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>&#x1F3C6;</div>
          <h1 style={{ color: '#ffd700', fontSize: 40, margin: '0 0 12px' }}>Victory!</h1>
          <p style={{ color: '#e8d5a0', fontSize: 20 }}>Your tavern earned {gold} gold!</p>
          <p style={{ color: '#aaa', fontSize: 15, marginTop: 8 }}>Your adventurers are legends across the land.</p>
          <button onClick={onNewGame} style={newGameButtonStyle}>New Game</button>
        </div>
      </div>
    );
  }

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
            Your tavern earned <span style={{ color: '#ffd700' }}>{gold} gold</span> before falling silent.
          </p>
          <button onClick={onNewGame} style={newGameButtonStyle}>New Game</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: 'serif', userSelect: 'none', zIndex: 100 }}>
      {/* Top bar — offset 40px for the scene nav bar */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', padding: '10px 16px',
        pointerEvents: 'none',
      }}>
        <div style={{ ...panelStyle, pointerEvents: 'auto', minWidth: 300, position: 'relative' }}>
          <GoldBar gold={gold} roomsIncome={(upgrades.rooms ?? 0) * 3 * 2} />
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
      />

      {/* Right panel */}
      <RightPanel
        activeQuests={activeQuests}
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

      {showQuestBoard && (
        <div style={{ pointerEvents: 'auto' }}>
          <QuestBoardModal
            quests={quests}
            adventurers={adventurers}
            gold={gold}
            onDispatch={onDispatchQuest}
            onRefresh={onRefreshQuests}
            onClose={onToggleQuestBoard}
          />
        </div>
      )}
    </div>
  );
}
