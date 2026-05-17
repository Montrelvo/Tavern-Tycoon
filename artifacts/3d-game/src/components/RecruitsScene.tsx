import React, { useState } from 'react';
import type { Adventurer } from '../game/types';
import {
  CLASS_COLORS, CLASS_LABELS, CLASS_PASSIVE_LABELS,
  PRESTIGE_CLASS_COLORS, PRESTIGE_CLASS_LABELS, PRESTIGE_CLASS_PASSIVE_LABELS,
  PRESTIGE_CLASS_FOR, PRESTIGE_ADVENTURER_COST,
  STAT_LABELS, STAT_FULL_LABELS, STAT_COLORS, STAT_DESCRIPTIONS,
  MAX_LEVEL, XP_THRESHOLDS, ELITE_LEVEL, CLASS_STAT_COLORS,
} from '../game/constants';
import type { BaseStat } from '../game/types';

const BASE_STATS: BaseStat[] = ['str', 'dex', 'con', 'int', 'wis'];
const STAT_MAX = 30;

const panelBg: React.CSSProperties = {
  background: 'rgba(15,8,2,0.92)',
  border: '1px solid #5c3315',
  borderRadius: 8,
  fontFamily: 'serif',
};

function StatBar({ stat, value, max = STAT_MAX }: { stat: BaseStat; value: number; max?: number }) {
  const color = STAT_COLORS[stat];
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{
        width: 32, fontSize: 10, fontWeight: 'bold', color, textAlign: 'right', flexShrink: 0,
      }}>
        {STAT_LABELS[stat]}
      </span>
      <div style={{
        flex: 1, height: 10, background: '#1a0d04', borderRadius: 5,
        border: `1px solid ${color}33`, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 5, transition: 'width 0.4s ease',
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          width: `${pct}%`,
        }} />
      </div>
      <span style={{ width: 24, fontSize: 12, fontWeight: 'bold', color: '#e8d5a0', textAlign: 'right', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

function XpProgress({ adv }: { adv: Adventurer }) {
  if (adv.level >= MAX_LEVEL) {
    const c = adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : '#ffd700';
    return (
      <span style={{ color: c, fontSize: 11, fontStyle: 'italic' }}>
        {adv.prestigeClass ? `✦ ${PRESTIGE_CLASS_LABELS[adv.prestigeClass]}` : 'Max Level'}
      </span>
    );
  }
  const next = XP_THRESHOLDS[adv.level];
  const prev = XP_THRESHOLDS[adv.level - 1];
  const pct = Math.min(100, ((adv.xp - prev) / (next - prev)) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: '#2a1a08', borderRadius: 3, border: '1px solid #3d2410' }}>
        <div style={{
          height: '100%', borderRadius: 3, transition: 'width 0.4s ease',
          background: adv.level >= ELITE_LEVEL
            ? 'linear-gradient(90deg, #f1c40f, #e67e22)'
            : 'linear-gradient(90deg, #5dade2, #3498db)',
          width: `${pct}%`,
        }} />
      </div>
      <span style={{ color: '#666', fontSize: 9, whiteSpace: 'nowrap' }}>{adv.xp}/{next} XP</span>
    </div>
  );
}

function RosterCard({ adv, isSelected, onSelect }: {
  adv: Adventurer; isSelected: boolean; onSelect: () => void;
}) {
  const baseColor = CLASS_COLORS[adv.class];
  const color = adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : baseColor;
  const elite = adv.level >= ELITE_LEVEL;
  const isPrestiged = !!adv.prestigeClass;
  const hasPoints = (adv.upgradePoints ?? 0) > 0;

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '8px 10px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
        background: isSelected
          ? 'rgba(255,255,255,0.12)'
          : isPrestiged ? `${color}0d` : elite ? 'rgba(241,196,15,0.06)' : 'rgba(255,255,255,0.04)',
        border: isSelected
          ? `1px solid ${color}`
          : isPrestiged ? `1px solid ${color}88` : elite ? '1px solid #f1c40f66' : '1px solid #3d2410',
        boxShadow: isSelected
          ? `0 0 8px ${color}44`
          : isPrestiged ? `0 0 5px ${color}33` : elite ? '0 0 5px #f1c40f22' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {adv.name}
        </span>
        {hasPoints && (
          <span style={{
            fontSize: 8, fontWeight: 'bold', color: '#1a0d00',
            background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
            borderRadius: 8, padding: '1px 4px', boxShadow: '0 0 4px #f1c40f88', flexShrink: 0,
          }}>
            UP
          </span>
        )}
        <span style={{
          fontSize: 9, fontWeight: 'bold', padding: '1px 4px', borderRadius: 3, flexShrink: 0,
          background: isPrestiged
            ? `linear-gradient(135deg, ${color}, ${color}88)`
            : elite ? 'linear-gradient(135deg, #f1c40f, #e67e22)' : 'rgba(255,255,255,0.08)',
          color: (elite || isPrestiged) ? '#1a0d00' : '#888',
          border: isPrestiged ? `1px solid ${color}` : elite ? '1px solid #f1c40f' : '1px solid #444',
        }}>
          {isPrestiged ? '✦' : elite ? '★' : ''}Lv{adv.level}
        </span>
      </div>
      <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: isPrestiged ? color : '#888', fontSize: 10 }}>
          {isPrestiged ? PRESTIGE_CLASS_LABELS[adv.prestigeClass!] : CLASS_LABELS[adv.class]}
        </span>
        <span style={{ color: '#666', fontSize: 10 }}>
          {adv.status === 'on-quest' ? '⚔ On Quest' : '🏠 Ready'}
        </span>
      </div>
    </div>
  );
}

function StatTooltip({ stat }: { stat: BaseStat }) {
  return (
    <span style={{ color: '#666', fontSize: 10, fontStyle: 'italic' }}>
      {STAT_DESCRIPTIONS[stat]}
    </span>
  );
}

function DetailPanel({ adv, gold, onSpendUpgradePoint, onPrestigeAdventurer }: {
  adv: Adventurer;
  gold: number;
  onSpendUpgradePoint: (id: string, stat: 'hp' | 'attack' | 'defense') => void;
  onPrestigeAdventurer: (id: string) => void;
}) {
  const [hoveredStat, setHoveredStat] = useState<BaseStat | null>(null);
  const [prestigeConfirm, setPrestigeConfirm] = useState(false);

  const baseColor = CLASS_COLORS[adv.class];
  const color = adv.prestigeClass ? PRESTIGE_CLASS_COLORS[adv.prestigeClass] : baseColor;
  const isPrestiged = !!adv.prestigeClass;
  const elite = adv.level >= ELITE_LEVEL;
  const pts = adv.upgradePoints ?? 0;
  const canPrestige = adv.level >= MAX_LEVEL && !adv.prestigeClass && adv.status === 'recruited';
  const canAffordPrestige = gold >= PRESTIGE_ADVENTURER_COST;
  const prestigeClass = PRESTIGE_CLASS_FOR[adv.class];

  const statBtn = (
    label: string, stat: 'hp' | 'attack' | 'defense',
    current: number, next: number, btnColor: string,
  ) => (
    <button
      disabled={pts === 0}
      onClick={() => onSpendUpgradePoint(adv.id, stat)}
      style={{
        flex: 1,
        background: pts > 0 ? `rgba(${btnColor},0.15)` : '#1a0d04',
        border: `1px solid ${pts > 0 ? `rgba(${btnColor},0.5)` : '#3d2410'}`,
        borderRadius: 6, color: pts > 0 ? '#e8d5a0' : '#555',
        fontFamily: 'serif', fontWeight: 'bold', fontSize: 12,
        padding: '7px 6px', cursor: pts > 0 ? 'pointer' : 'not-allowed',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 10, color: pts > 0 ? `rgb(${btnColor})` : '#444' }}>{label}</span>
      <span>{current} → <span style={{ color: pts > 0 ? '#2ecc71' : '#555' }}>{next}</span></span>
      <span style={{ fontSize: 9, color: '#666' }}>−1 pt</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto', paddingRight: 4 }}>
      {/* Header */}
      <div style={{
        ...panelBg, padding: 16,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 0 16px ${color}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 20 }}>{adv.name}</span>
              {isPrestiged && (
                <span style={{
                  fontSize: 10, fontWeight: 'bold', color: '#000',
                  background: `linear-gradient(135deg, ${color}, ${color}99)`,
                  borderRadius: 8, padding: '1px 6px',
                }}>
                  ★ Prestige
                </span>
              )}
              {!isPrestiged && elite && (
                <span style={{
                  fontSize: 10, fontWeight: 'bold', color: '#1a0d00',
                  background: 'linear-gradient(90deg, #f1c40f, #e67e22)',
                  borderRadius: 8, padding: '1px 6px',
                }}>
                  ★ Elite
                </span>
              )}
            </div>
            <div style={{ color: isPrestiged ? color : '#b0a090', fontSize: 13, marginTop: 1 }}>
              {isPrestiged ? PRESTIGE_CLASS_LABELS[adv.prestigeClass!] : CLASS_LABELS[adv.class]}
              {' '}·{' '}
              <span style={{
                fontSize: 10, fontWeight: 'bold', padding: '1px 5px', borderRadius: 3,
                background: isPrestiged
                  ? `linear-gradient(135deg, ${color}, ${color}88)`
                  : elite ? 'linear-gradient(135deg, #f1c40f, #e67e22)' : 'rgba(255,255,255,0.1)',
                color: (elite || isPrestiged) ? '#1a0d00' : '#aaa',
              }}>
                {isPrestiged ? '✦' : elite ? '★' : ''}Lv {adv.level}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 16 }}>⚡ {adv.power}</div>
            <div style={{ color: '#888', fontSize: 10 }}>Power</div>
          </div>
        </div>

        {/* HP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ color: CLASS_STAT_COLORS.hp, fontSize: 10, width: 20, flexShrink: 0 }}>HP</span>
          <div style={{ flex: 1, height: 8, background: '#1a0a0a', borderRadius: 4, border: '1px solid #3d1515' }}>
            <div style={{
              background: adv.hp / adv.maxHp > 0.5 ? '#27ae60' : adv.hp / adv.maxHp > 0.25 ? '#e67e22' : '#e74c3c',
              width: `${Math.max(0, (adv.hp / adv.maxHp) * 100)}%`,
              height: '100%', borderRadius: 4, transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ color: '#888', fontSize: 10, whiteSpace: 'nowrap' }}>{adv.hp}/{adv.maxHp}</span>
        </div>

        {/* XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#5dade2', fontSize: 10, width: 20, flexShrink: 0 }}>XP</span>
          <div style={{ flex: 1 }}>
            <XpProgress adv={adv} />
          </div>
        </div>

        {/* Status */}
        <div style={{ marginTop: 8, fontSize: 11, color: adv.status === 'on-quest' ? '#f39c12' : '#2ecc71' }}>
          {adv.status === 'on-quest' ? '⚔ Currently on a quest' : '🏠 Resting at the tavern'}
        </div>
      </div>

      {/* Combat Stats */}
      <div style={{ ...panelBg, padding: '12px 14px' }}>
        <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 12, marginBottom: 8, letterSpacing: 0.5 }}>
          COMBAT STATS
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {[
            { label: 'Attack', value: adv.attack, color: CLASS_STAT_COLORS.attack, icon: '⚔' },
            { label: 'Defense', value: adv.defense, color: CLASS_STAT_COLORS.defense, icon: '🛡' },
            { label: 'Max HP', value: adv.maxHp, color: CLASS_STAT_COLORS.hp, icon: '❤' },
          ].map(({ label, value, color: c, icon }) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center', background: `${c}11`,
              border: `1px solid ${c}33`, borderRadius: 6, padding: '6px 4px',
            }}>
              <div style={{ color: c, fontSize: 11, marginBottom: 2 }}>{icon} {label}</div>
              <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 16 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{
          background: `${color}0d`, border: `1px solid ${color}33`,
          borderRadius: 6, padding: '6px 8px', fontSize: 11,
        }}>
          <span style={{ color: '#888' }}>Class ability: </span>
          <span style={{ color }}>
            {isPrestiged
              ? PRESTIGE_CLASS_PASSIVE_LABELS[adv.prestigeClass!]
              : CLASS_PASSIVE_LABELS[adv.class]}
          </span>
        </div>
      </div>

      {/* 5 Base Stats */}
      <div style={{ ...panelBg, padding: '12px 14px' }}>
        <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 12, marginBottom: 10, letterSpacing: 0.5 }}>
          BASE ATTRIBUTES
        </div>
        {BASE_STATS.map(stat => (
          <div
            key={stat}
            onMouseEnter={() => setHoveredStat(stat)}
            onMouseLeave={() => setHoveredStat(null)}
            style={{ cursor: 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ width: 80, fontSize: 11, color: STAT_COLORS[stat], flexShrink: 0 }}>
                {STAT_FULL_LABELS[stat]}
              </span>
            </div>
            <StatBar stat={stat} value={adv[stat]} />
            {hoveredStat === stat && (
              <div style={{ marginBottom: 6, marginTop: -2, paddingLeft: 40 }}>
                <StatTooltip stat={stat} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade Points */}
      {pts > 0 && (
        <div style={{
          ...panelBg, padding: '12px 14px',
          border: '1px solid #f1c40f88',
          boxShadow: '0 0 12px #f1c40f22',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 }}>
              UPGRADE POINTS
            </span>
            <span style={{
              fontSize: 11, fontWeight: 'bold', color: '#1a0d00',
              background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
              borderRadius: 8, padding: '2px 8px', boxShadow: '0 0 6px #f1c40f88',
            }}>
              {pts} point{pts !== 1 ? 's' : ''} available
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {statBtn('+5 Max HP', 'hp', adv.maxHp, adv.maxHp + 5, '231,76,60')}
            {statBtn('+1 Attack', 'attack', adv.attack, adv.attack + 1, '230,126,34')}
            {statBtn('+1 Defense', 'defense', adv.defense, adv.defense + 1, '52,152,219')}
          </div>
        </div>
      )}

      {/* Prestige */}
      {canPrestige && (
        <div style={{
          ...panelBg, padding: '12px 14px',
          border: `1px solid ${PRESTIGE_CLASS_COLORS[prestigeClass]}88`,
          boxShadow: `0 0 12px ${PRESTIGE_CLASS_COLORS[prestigeClass]}22`,
        }}>
          <div style={{ color: PRESTIGE_CLASS_COLORS[prestigeClass], fontWeight: 'bold', fontSize: 12, marginBottom: 6, letterSpacing: 0.5 }}>
            PRESTIGE ASCENSION
          </div>
          <div style={{ fontSize: 12, color: '#b0a090', marginBottom: 8 }}>
            {CLASS_LABELS[adv.class]} →{' '}
            <span style={{ color: PRESTIGE_CLASS_COLORS[prestigeClass], fontWeight: 'bold' }}>
              {PRESTIGE_CLASS_LABELS[prestigeClass]}
            </span>
          </div>
          <div style={{
            background: `${PRESTIGE_CLASS_COLORS[prestigeClass]}11`,
            border: `1px solid ${PRESTIGE_CLASS_COLORS[prestigeClass]}33`,
            borderRadius: 6, padding: '6px 8px', fontSize: 11, marginBottom: 10,
          }}>
            <span style={{ color: '#888' }}>New ability: </span>
            <span style={{ color: PRESTIGE_CLASS_COLORS[prestigeClass] }}>
              {PRESTIGE_CLASS_PASSIVE_LABELS[prestigeClass]}
            </span>
          </div>
          {!prestigeConfirm ? (
            <button
              onClick={() => setPrestigeConfirm(true)}
              style={{
                width: '100%',
                background: `linear-gradient(180deg, ${PRESTIGE_CLASS_COLORS[prestigeClass]}cc 0%, ${PRESTIGE_CLASS_COLORS[prestigeClass]}88 100%)`,
                border: `1px solid ${PRESTIGE_CLASS_COLORS[prestigeClass]}`,
                borderRadius: 6, color: '#fff', fontFamily: 'serif',
                fontWeight: 'bold', fontSize: 13, padding: '8px 0', cursor: 'pointer',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              ✦ Ascend — {PRESTIGE_ADVENTURER_COST}g
            </button>
          ) : (
            <div>
              <div style={{ color: canAffordPrestige ? '#f1c40f' : '#e74c3c', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                {canAffordPrestige
                  ? `Spend ${PRESTIGE_ADVENTURER_COST}g to ascend?`
                  : `Not enough gold (need ${PRESTIGE_ADVENTURER_COST}g)`}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPrestigeConfirm(false)}
                  style={{
                    flex: 1, background: '#2a1a08', border: '1px solid #5c3315',
                    borderRadius: 6, color: '#888', fontFamily: 'serif',
                    fontSize: 12, padding: '6px 0', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!canAffordPrestige}
                  onClick={() => { if (canAffordPrestige) { onPrestigeAdventurer(adv.id); setPrestigeConfirm(false); } }}
                  style={{
                    flex: 1,
                    background: canAffordPrestige
                      ? `linear-gradient(180deg, ${PRESTIGE_CLASS_COLORS[prestigeClass]}cc 0%, ${PRESTIGE_CLASS_COLORS[prestigeClass]}88 100%)`
                      : '#2a1a08',
                    border: `1px solid ${canAffordPrestige ? PRESTIGE_CLASS_COLORS[prestigeClass] : '#3d2410'}`,
                    borderRadius: 6, color: canAffordPrestige ? '#fff' : '#555',
                    fontFamily: 'serif', fontWeight: 'bold', fontSize: 12,
                    padding: '6px 0', cursor: canAffordPrestige ? 'pointer' : 'not-allowed',
                  }}
                >
                  Ascend ✦
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RecruitsScene({ adventurers, gold, onSpendUpgradePoint, onPrestigeAdventurer }: {
  adventurers: Adventurer[];
  gold: number;
  onSpendUpgradePoint: (adventurerId: string, stat: 'hp' | 'attack' | 'defense') => void;
  onPrestigeAdventurer: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const recruited = adventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
  const selectedAdv = recruited.find(a => a.id === selectedId) ?? null;
  const hasUpgradePoints = recruited.some(a => (a.upgradePoints ?? 0) > 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, paddingTop: 40,
      background: 'linear-gradient(180deg, #0d0700 0%, #0a0500 100%)',
      fontFamily: 'serif', display: 'flex', overflow: 'hidden',
    }}>
      {/* Left: roster list */}
      <div style={{
        width: 240, minWidth: 240, padding: '12px 10px',
        display: 'flex', flexDirection: 'column', gap: 0,
        borderRight: '1px solid #3d2410',
        overflowY: 'auto',
      }}>
        <div style={{
          color: '#e8d5a0', fontWeight: 'bold', fontSize: 14,
          letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #3d2410',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Your Roster</span>
          <span style={{ color: '#5c3315', fontSize: 11, fontWeight: 'normal' }}>
            {recruited.length} adventurer{recruited.length !== 1 ? 's' : ''}
          </span>
        </div>

        {recruited.length === 0 ? (
          <div style={{ color: '#5c3315', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
            No adventurers recruited yet.{'\n'}Head to the Tavern tab to recruit!
          </div>
        ) : (
          recruited.map(adv => (
            <RosterCard
              key={adv.id}
              adv={adv}
              isSelected={selectedId === adv.id}
              onSelect={() => setSelectedId(selectedId === adv.id ? null : adv.id)}
            />
          ))
        )}

        {hasUpgradePoints && (
          <div style={{
            marginTop: 8, padding: '6px 8px', borderRadius: 6,
            background: 'rgba(241,196,15,0.08)', border: '1px solid #f1c40f44',
            color: '#f1c40f', fontSize: 10, textAlign: 'center', fontStyle: 'italic',
          }}>
            ✦ Some adventurers have upgrade points to spend
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
        {selectedAdv ? (
          <DetailPanel
            adv={selectedAdv}
            gold={gold}
            onSpendUpgradePoint={onSpendUpgradePoint}
            onPrestigeAdventurer={onPrestigeAdventurer}
          />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 16, color: '#5c3315',
          }}>
            <div style={{ fontSize: 48 }}>⚔</div>
            <div style={{ fontSize: 16, color: '#7a6a5a' }}>Select an adventurer to view their details</div>
            <div style={{ fontSize: 12, color: '#4a3a28', textAlign: 'center', maxWidth: 300 }}>
              Manage stats, spend upgrade points, and unlock prestige ascension here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
