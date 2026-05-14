import React, { useEffect, useState } from 'react';
import type { Adventurer, Quest } from '../game/types';
import { CLASS_COLORS, CLASS_LABELS, WIN_GOLD, DISPATCH_COST } from '../game/constants';

interface HUDProps {
  gold: number;
  adventurers: Adventurer[];
  quests: Quest[];
  gameLog: string[];
  gamePhase: 'playing' | 'won' | 'lost';
  selectedAdventurerId: string | null;
  showQuestBoard: boolean;
  onRecruit: (id: string) => void;
  onSelectAdventurer: (id: string | null) => void;
  onToggleQuestBoard: () => void;
  onDispatchQuest: (questId: string, adventurerIds: string[]) => void;
  onRefreshQuests: () => void;
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(15,8,2,0.92)',
  border: '1px solid #5c3315',
  borderRadius: 8,
  padding: 12,
  backdropFilter: 'blur(4px)',
};

function GoldBar({ gold }: { gold: number }) {
  const pct = Math.min(100, (gold / WIN_GOLD) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 18, textShadow: '0 1px 4px #000' }}>
          {gold} Gold
        </span>
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
  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isSelected ? color : '#5c3315'}`,
        borderRadius: 6,
        padding: '6px 8px',
        marginBottom: 4,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 13, flex: 1 }}>{adv.name}</span>
        <span style={{ color: '#aaa', fontSize: 10 }}>
          {adv.status === 'on-quest' ? 'On Quest' : adv.status === 'idle' ? 'Visitor' : 'Ready'}
        </span>
      </div>
      <div style={{ marginTop: 2, display: 'flex', gap: 8 }}>
        <span style={{ color: '#aaa', fontSize: 11 }}>{CLASS_LABELS[adv.class]}</span>
        <span style={{ color: '#f1c40f', fontSize: 11 }}>⚡ {adv.power}</span>
      </div>
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

function ActiveQuestItem({ quest }: { quest: Quest }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeLeft = quest.completesAt ? Math.max(0, Math.ceil((quest.completesAt - now) / 1000)) : null;

  return (
    <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #3d2410' }}>
      <div style={{ color: '#e8d5a0', fontSize: 12, fontWeight: 'bold' }}>{quest.name}</div>
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
  const selectedPower = selectedAdventurers.reduce((sum, a) => sum + a.power, 0);
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
        <h3 style={{ color: '#e8d5a0', margin: 0, fontSize: 15, flex: 1 }}>{quest.name}</h3>
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
            Selected: ⚡{selectedPower}
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
            return (
              <label
                key={adv.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 6px', borderRadius: 4, marginBottom: 2,
                  background: checked ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${checked ? color : 'transparent'}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAdventurer(adv.id)}
                  style={{ accentColor: color, width: 13, height: 13 }}
                />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ color: '#e8d5a0', fontSize: 12, flex: 1 }}>{adv.name}</span>
                <span style={{ color: '#aaa', fontSize: 11 }}>
                  {CLASS_LABELS[adv.class]}
                </span>
                <span style={{ color: '#f1c40f', fontSize: 11 }}>⚡{adv.power}</span>
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
          width: 560,
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
          Dispatching costs <span style={{ color: '#ffd700' }}>{DISPATCH_COST}g</span>. All idle recruits are sent together.
          Party power must meet or exceed requirements to succeed.
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

export function HUD({
  gold, adventurers, quests, gameLog, gamePhase,
  selectedAdventurerId, showQuestBoard,
  onRecruit, onSelectAdventurer, onToggleQuestBoard, onDispatchQuest, onRefreshQuests,
}: HUDProps) {
  const roster = adventurers.filter(a => a.status === 'recruited' || a.status === 'on-quest');
  const wanderers = adventurers.filter(a => a.status === 'idle' || a.status === 'entering');
  const activeQuests = quests.filter(q => q.status === 'active');

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
          <p style={{ color: '#7a6a5a', fontSize: 13, marginTop: 16, fontStyle: 'italic' }}>
            Reload the page to try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: 'serif', userSelect: 'none', zIndex: 100 }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', padding: '10px 16px',
        pointerEvents: 'none',
      }}>
        <div style={{ ...panelStyle, pointerEvents: 'auto', minWidth: 300 }}>
          <GoldBar gold={gold} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
            <span>Roster: {roster.length}/8</span>
            <span>Visitors: {wanderers.length}</span>
            <span>Active Quests: {activeQuests.length}</span>
          </div>
        </div>
      </div>

      {/* Left panel */}
      <div style={{
        position: 'absolute', top: 80, left: 0, bottom: 0,
        width: 210, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'auto', overflowY: 'auto',
      }}>
        {roster.length > 0 && (
          <div style={panelStyle}>
            <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>Your Party</div>
            {roster.map(adv => (
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
            <div style={{ color: '#b0a090', fontSize: 13, marginBottom: 6 }}>In the Tavern</div>
            {wanderers.map(adv => (
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

      {/* Right panel */}
      <div style={{
        position: 'absolute', top: 80, right: 0, bottom: 0,
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
          }}
        >
          Quest Board
        </button>

        {activeQuests.length > 0 && (
          <div style={panelStyle}>
            <div style={{ color: '#f39c12', fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>Active Quests</div>
            {activeQuests.map(q => <ActiveQuestItem key={q.id} quest={q} />)}
          </div>
        )}

        <div style={{ ...panelStyle, flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ color: '#b0a090', fontSize: 12, marginBottom: 6 }}>Event Log</div>
          {gameLog.map((entry, i) => (
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

      {/* Help hint */}
      {wanderers.length > 0 && roster.length === 0 && (
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
