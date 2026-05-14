import React from 'react';
import type { Upgrades } from '../game/types';
import { ROSTER_CAPS } from '../game/constants';

interface ManagementSceneProps {
  gold: number;
  upgrades: Upgrades;
  rosterCount: number;
  onHireUpgrade: (upgrade: 'cook' | 'cook_plus' | 'bard' | 'roster_2' | 'roster_3') => void;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(15,8,2,0.92)',
  border: '1px solid #5c3315',
  borderRadius: 10,
  padding: '16px 20px',
  marginBottom: 12,
  fontFamily: 'serif',
};

const lockedCardStyle: React.CSSProperties = {
  ...cardStyle,
  opacity: 0.5,
  border: '1px solid #3a2510',
};

const sectionTitle: React.CSSProperties = {
  color: '#e8d5a0',
  fontWeight: 'bold',
  fontSize: 16,
  marginBottom: 4,
};

const sectionSubtitle: React.CSSProperties = {
  color: '#7a6a5a',
  fontSize: 12,
  marginBottom: 12,
};

function BuyButton({ label, cost, canAfford, disabled, onClick }: {
  label: string; cost: number; canAfford: boolean; disabled?: boolean; onClick: () => void;
}) {
  const able = canAfford && !disabled;
  return (
    <button
      onClick={onClick}
      disabled={!able}
      style={{
        background: able
          ? 'linear-gradient(180deg, #8a5422 0%, #5c3315 100%)'
          : '#2a1a08',
        border: able ? '1px solid #a0631e' : '1px solid #3d2410',
        borderRadius: 6,
        color: able ? '#e8d5a0' : '#4a3a28',
        fontFamily: 'serif',
        fontWeight: 'bold',
        fontSize: 13,
        padding: '6px 14px',
        cursor: able ? 'pointer' : 'not-allowed',
        whiteSpace: 'nowrap',
      }}
    >
      {label} — {cost}g
    </button>
  );
}

function PurchasedBadge({ label }: { label: string }) {
  return (
    <span style={{
      color: '#2ecc71',
      fontWeight: 'bold',
      fontSize: 13,
      background: 'rgba(46,204,113,0.1)',
      border: '1px solid #2ecc7144',
      borderRadius: 5,
      padding: '4px 10px',
    }}>
      ✓ {label}
    </span>
  );
}

function UpgradeRow({ icon, title, description, children }: {
  icon: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid #2a1a08',
    }}>
      <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>{title}</div>
        <div style={{ color: '#7a6a5a', fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>{description}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
      </div>
    </div>
  );
}

export function ManagementScene({ gold, upgrades, rosterCount, onHireUpgrade }: ManagementSceneProps) {
  const rosterMax = ROSTER_CAPS[(upgrades.rosterSlots ?? 1) - 1];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      top: 40,
      background: '#0d0700',
      overflowY: 'auto',
      fontFamily: 'serif',
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: '24px 20px 48px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ color: '#e8d5a0', margin: 0, fontSize: 24, letterSpacing: 1 }}>
            Tavern Management
          </h1>
          <div style={{
            color: '#ffd700',
            fontWeight: 'bold',
            fontSize: 20,
            background: 'rgba(15,8,2,0.9)',
            border: '1px solid #5c3315',
            borderRadius: 8,
            padding: '6px 14px',
          }}>
            {gold} Gold
          </div>
        </div>

        {/* Building schematic label */}
        <div style={{ color: '#4a3a28', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
          Floor Management
        </div>

        {/* Upper Rooms — locked (future task) */}
        <div style={lockedCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🏠</span>
            <div>
              <div style={sectionTitle}>Upper Rooms</div>
              <div style={sectionSubtitle}>Guest quarters above the tavern floor</div>
            </div>
            <span style={{
              marginLeft: 'auto',
              color: '#4a3a28',
              fontSize: 11,
              border: '1px solid #3a2510',
              borderRadius: 4,
              padding: '2px 8px',
            }}>Coming Soon</span>
          </div>
          <div style={{ color: '#4a3a28', fontSize: 12, lineHeight: 1.5 }}>
            Construct inn rooms to house adventurers and earn passive gold income each minute.
            Unlock the basement first.
          </div>
        </div>

        {/* Ground Floor — Staff */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>🍺</span>
            <div>
              <div style={sectionTitle}>Ground Floor — Staff</div>
              <div style={sectionSubtitle}>Hire staff to improve services for your adventurers</div>
            </div>
          </div>

          <UpgradeRow
            icon="👨‍🍳"
            title="Cook"
            description={
              upgrades.cook === 0
                ? 'Hire a cook to restore 3 HP per 10s for all tavern adventurers (up from 1).'
                : upgrades.cook === 1
                ? 'Upgrade to Master Chef — restores 6 HP per 10s instead of 3.'
                : 'Master Chef — restoring 6 HP per 10s for all tavern adventurers.'
            }
          >
            {upgrades.cook === 0 && (
              <BuyButton
                label="Hire Cook"
                cost={80}
                canAfford={gold >= 80}
                onClick={() => onHireUpgrade('cook')}
              />
            )}
            {upgrades.cook === 1 && (
              <>
                <PurchasedBadge label="Cook hired" />
                <BuyButton
                  label="Upgrade to Cook+"
                  cost={160}
                  canAfford={gold >= 160}
                  onClick={() => onHireUpgrade('cook_plus')}
                />
              </>
            )}
            {upgrades.cook === 2 && <PurchasedBadge label="Master Chef" />}
          </UpgradeRow>

          <UpgradeRow
            icon="🎵"
            title="Bard"
            description={
              upgrades.bard
                ? 'Your bard is performing — quest XP earned +25% for all adventurers.'
                : 'Hire a bard to entertain adventurers and boost quest XP earned by +25%.'
            }
          >
            {upgrades.bard ? (
              <PurchasedBadge label="Bard performing" />
            ) : (
              <BuyButton
                label="Hire Bard"
                cost={60}
                canAfford={gold >= 60}
                onClick={() => onHireUpgrade('bard')}
              />
            )}
          </UpgradeRow>
        </div>

        {/* Basement — locked (future task) */}
        <div style={lockedCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>⛏</span>
            <div>
              <div style={sectionTitle}>Basement</div>
              <div style={sectionSubtitle}>Underground storage and supplies</div>
            </div>
            <span style={{
              marginLeft: 'auto',
              color: '#4a3a28',
              fontSize: 11,
              border: '1px solid #3a2510',
              borderRadius: 4,
              padding: '2px 8px',
            }}>Coming Soon</span>
          </div>
          <div style={{ color: '#4a3a28', fontSize: 12, lineHeight: 1.5 }}>
            Dig out a basement to store materials brought back from quests — herbs, ore, and relics
            that can be sold for gold or used in future upgrades.
          </div>
        </div>

        {/* Roster Size */}
        <div style={{ color: '#4a3a28', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '20px 0 10px' }}>
          Roster Capacity
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⚔</span>
            <div>
              <div style={sectionTitle}>Adventurer Roster</div>
              <div style={sectionSubtitle}>
                Expand your roster to recruit and field more adventurers at once
              </div>
            </div>
          </div>

          {/* Tier display */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              { slots: 1 as const, label: 'Small Crew', max: 5, cost: null },
              { slots: 2 as const, label: 'Guild Band', max: 8, cost: 100 },
              { slots: 3 as const, label: 'Full Company', max: 12, cost: 200 },
            ].map(tier => {
              const active = upgrades.rosterSlots === tier.slots;
              const purchased = (upgrades.rosterSlots ?? 1) >= tier.slots;
              return (
                <div
                  key={tier.slots}
                  style={{
                    flex: 1,
                    background: active ? 'rgba(200,150,12,0.12)' : purchased ? 'rgba(46,204,113,0.06)' : 'rgba(0,0,0,0.2)',
                    border: active
                      ? '2px solid #c8960c'
                      : purchased
                      ? '1px solid #2ecc7166'
                      : '1px solid #2a1a08',
                    borderRadius: 8,
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>
                    {purchased ? (active ? '⭐' : '✓') : '🔒'}
                  </div>
                  <div style={{ color: active ? '#ffd700' : purchased ? '#2ecc71' : '#4a3a28', fontWeight: 'bold', fontSize: 13 }}>
                    {tier.label}
                  </div>
                  <div style={{ color: '#7a6a5a', fontSize: 12, margin: '2px 0' }}>
                    Max {tier.max} adventurers
                  </div>
                  {tier.cost && !purchased && (
                    <div style={{ color: '#c8960c', fontSize: 12 }}>{tier.cost}g</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current usage */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#7a6a5a', fontSize: 13 }}>
              Current roster: <span style={{ color: '#e8d5a0' }}>{rosterCount}</span> / {rosterMax}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(upgrades.rosterSlots ?? 1) < 2 && (
                <BuyButton
                  label="Expand to 8 slots"
                  cost={100}
                  canAfford={gold >= 100}
                  onClick={() => onHireUpgrade('roster_2')}
                />
              )}
              {(upgrades.rosterSlots ?? 1) === 2 && (
                <BuyButton
                  label="Expand to 12 slots"
                  cost={200}
                  canAfford={gold >= 200}
                  onClick={() => onHireUpgrade('roster_3')}
                />
              )}
              {(upgrades.rosterSlots ?? 1) === 3 && (
                <PurchasedBadge label="Max capacity reached" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
