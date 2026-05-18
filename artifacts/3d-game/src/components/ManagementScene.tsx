import React, { useState } from 'react';
import type { Upgrades, Materials, Adventurer } from '../game/types';
import { ROSTER_BASE, ROSTER_UPGRADE_SIZE, ROSTER_UPGRADE_COST, GEAR_RECIPES } from '../game/constants';

interface ManagementSceneProps {
  gold: number;
  upgrades: Upgrades;
  materials: Materials;
  rosterCount: number;
  tavernPrestige: 0 | 1 | 2 | 3;
  onHireUpgrade: (upgrade: 'cook' | 'cook_plus' | 'bard' | 'roster_expand' | 'rooms' | 'rooms_expansion' | 'basement' | 'training_grounds' | 'enchanter' | 'guild_hall') => void;
  onSellMaterials: () => void;
  onCraftGear: (recipeId: string, adventurerId: string) => void;
  recruitedCount: number;
  recruitedAdventurers: Adventurer[];
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
  opacity: 0.55,
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

function LockedBadge({ label }: { label: string }) {
  return (
    <span style={{
      color: '#4a3a28',
      fontSize: 13,
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid #2a1a08',
      borderRadius: 5,
      padding: '4px 10px',
    }}>
      🔒 {label}
    </span>
  );
}

function PrestigeTierBadge({ tier, required }: { tier: number; required: number }) {
  const tierNames = ['Renowned', 'Celebrated', 'Legendary'];
  const name = tierNames[required - 1];
  const colors = ['#c8960c', '#8e44ad', '#f1c40f'];
  const color = colors[required - 1];
  const unlocked = tier >= required;
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 'bold',
      padding: '2px 7px',
      borderRadius: 4,
      background: unlocked ? `${color}22` : 'rgba(0,0,0,0.3)',
      border: `1px solid ${unlocked ? color + '66' : '#2a1a08'}`,
      color: unlocked ? color : '#3a2a18',
    }}>
      ★ Requires: {name}
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

function RoomSlot({ n, active }: { n: number; active: boolean }) {
  return (
    <div style={{
      flex: 1,
      background: active ? 'rgba(200,150,12,0.1)' : 'rgba(0,0,0,0.3)',
      border: active ? '1px solid #c8960c66' : '1px dashed #3a2510',
      borderRadius: 5,
      padding: '8px 4px',
      textAlign: 'center',
      transition: 'all 0.2s',
    }}>
      <div style={{ fontSize: 16, marginBottom: 2 }}>{active ? '🛏' : '🔒'}</div>
      <div style={{ color: active ? '#c8960c' : '#2a1a08', fontSize: 9 }}>Room {n}</div>
      {active && <div style={{ color: '#7a6a5a', fontSize: 9 }}>+2g/min</div>}
    </div>
  );
}

export function ManagementScene({ gold, upgrades, materials, rosterCount, tavernPrestige, onHireUpgrade, onSellMaterials, onCraftGear, recruitedCount, recruitedAdventurers }: ManagementSceneProps) {
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const rosterMax = ROSTER_BASE + (upgrades.rosterSlots ?? 0) * ROSTER_UPGRADE_SIZE;
  const rooms = upgrades.rooms ?? 0;
  const basement = upgrades.basement ?? false;
  const roomIncomePm = rooms * 3 * 2;
  const sellRates = upgrades.enchanter
    ? { herbs: 6, ore: 12, relics: 24, bones: 16, pelts: 16, venom: 16 }
    : { herbs: 3, ore: 6, relics: 12, bones: 8, pelts: 8, venom: 8 };
  const totalMaterialValue =
    materials.herbs * sellRates.herbs + materials.ore * sellRates.ore + materials.relics * sellRates.relics +
    materials.bones * sellRates.bones + materials.pelts * sellRates.pelts + materials.venom * sellRates.venom;
  const hasMaterials = materials.herbs > 0 || materials.ore > 0 || materials.relics > 0 ||
    materials.bones > 0 || materials.pelts > 0 || materials.venom > 0;
  const prestige1Unlocked = tavernPrestige >= 1;
  const prestige2Unlocked = tavernPrestige >= 2;
  const prestige3Unlocked = tavernPrestige >= 3;

  return (
    <>
    {/* Adventurer picker modal */}
    {pendingRecipeId && (() => {
      const recipe = GEAR_RECIPES.find(r => r.id === pendingRecipeId)!;
      return (
        <div
          onClick={() => setPendingRecipeId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(15,8,2,0.98)',
              border: '1px solid #5c3315',
              borderRadius: 12,
              padding: '24px 28px',
              minWidth: 320,
              maxWidth: 440,
              fontFamily: 'serif',
            }}
          >
            <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 17, marginBottom: 4 }}>
              {recipe.icon} Equip {recipe.name}
            </div>
            <div style={{ color: '#7a6a5a', fontSize: 12, marginBottom: 18 }}>
              Choose which adventurer receives this gear
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recruitedAdventurers.map(adv => {
                const classColors: Record<string, string> = {
                  warrior: '#e67e22', mage: '#9b59b6', rogue: '#27ae60', healer: '#3498db',
                };
                const classIcons: Record<string, string> = {
                  warrior: '⚔', mage: '🔮', rogue: '🗡', healer: '💚',
                };
                const color = classColors[adv.class] ?? '#c8960c';
                const icon = classIcons[adv.class] ?? '👤';
                const isOnQuest = adv.status === 'on-quest';
                return (
                  <button
                    key={adv.id}
                    onClick={() => {
                      onCraftGear(pendingRecipeId, adv.id);
                      setPendingRecipeId(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: `rgba(${color === '#e67e22' ? '230,126,34' : color === '#9b59b6' ? '155,89,182' : color === '#27ae60' ? '39,174,96' : '52,152,219'},0.10)`,
                      border: `1px solid ${color}55`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontFamily: 'serif',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `rgba(200,150,12,0.15)`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `rgba(${color === '#e67e22' ? '230,126,34' : color === '#9b59b6' ? '155,89,182' : color === '#27ae60' ? '39,174,96' : '52,152,219'},0.10)`)}
                  >
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 14 }}>
                        {adv.name}
                        {isOnQuest && (
                          <span style={{ color: '#7a6a5a', fontWeight: 'normal', fontSize: 11, marginLeft: 8 }}>
                            (on quest)
                          </span>
                        )}
                      </div>
                      <div style={{ color, fontSize: 11, marginTop: 1 }}>
                        Lv.{adv.level} {adv.class.charAt(0).toUpperCase() + adv.class.slice(1)}
                        <span style={{ color: '#7a6a5a', marginLeft: 8 }}>
                          ⚔ {adv.attack} · 🛡 {adv.defense} · ❤ {adv.maxHp}
                        </span>
                      </div>
                    </div>
                    <span style={{ color: '#c8960c', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>
                      Equip →
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPendingRecipeId(null)}
              style={{
                marginTop: 16,
                width: '100%',
                background: 'transparent',
                border: '1px solid #3a2a18',
                borderRadius: 6,
                color: '#5a4a38',
                fontFamily: 'serif',
                fontSize: 13,
                padding: '7px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    })()}
    <div style={{
      position: 'fixed',
      inset: 0,
      top: 40,
      background: 'transparent',
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
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
          background: 'rgba(8,4,1,0.72)', borderRadius: 10, padding: '12px 16px',
          backdropFilter: 'blur(6px)', border: '1px solid rgba(92,51,21,0.4)',
        }}>
          <h1 style={{ color: '#e8d5a0', margin: 0, fontSize: 24, letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
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
            {roomIncomePm > 0 && (
              <span style={{ color: '#2ecc71', fontSize: 12, fontWeight: 'normal', marginLeft: 8 }}>
                +{roomIncomePm}/min
              </span>
            )}
          </div>
        </div>

        {/* Floor Management label */}
        <div style={{ color: '#4a3a28', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
          Floor Management
        </div>

        {/* Upper Rooms */}
        {rooms === 0 ? (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🏠</span>
              <div>
                <div style={sectionTitle}>Upper Rooms</div>
                <div style={sectionSubtitle}>Guest quarters above the tavern floor</div>
              </div>
            </div>
            <div style={{ color: '#7a6a5a', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
              Construct 3 inn rooms that earn <strong style={{ color: '#c8960c' }}>+2g per room per minute</strong> passively.
              Upgrade later for 3 more rooms and double the income.
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px dashed #2a1a08',
                  borderRadius: 5,
                  padding: '6px 4px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 14, marginBottom: 2, opacity: 0.25 }}>🔒</div>
                  <div style={{ color: '#2a1a08', fontSize: 9 }}>Room {n}</div>
                </div>
              ))}
            </div>
            <BuyButton
              label="Build Upper Rooms"
              cost={150}
              canAfford={gold >= 150}
              onClick={() => onHireUpgrade('rooms')}
            />
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🏠</span>
              <div style={{ flex: 1 }}>
                <div style={sectionTitle}>Upper Rooms</div>
                <div style={sectionSubtitle}>
                  {rooms === 1 ? '3 rooms open' : '6 rooms open'} — earning{' '}
                  <span style={{ color: '#2ecc71' }}>+{roomIncomePm}g/min</span>
                </div>
              </div>
              <span style={{
                color: '#2ecc71',
                fontSize: 11,
                background: 'rgba(46,204,113,0.1)',
                border: '1px solid #2ecc7144',
                borderRadius: 4,
                padding: '2px 8px',
              }}>Active</span>
            </div>

            {/* Room grid */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <RoomSlot key={n} n={n} active={n <= rooms * 3} />
              ))}
            </div>

            {rooms === 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PurchasedBadge label="Small Inn (3 rooms)" />
                <BuyButton
                  label="Inn Expansion"
                  cost={250}
                  canAfford={gold >= 250}
                  onClick={() => onHireUpgrade('rooms_expansion')}
                />
              </div>
            )}
            {rooms === 2 && (
              <PurchasedBadge label="Full Inn (6 rooms)" />
            )}
          </div>
        )}

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
              <BuyButton label="Hire Cook" cost={80} canAfford={gold >= 80} onClick={() => onHireUpgrade('cook')} />
            )}
            {upgrades.cook === 1 && (
              <>
                <PurchasedBadge label="Cook hired" />
                <BuyButton label="Upgrade to Cook+" cost={160} canAfford={gold >= 160} onClick={() => onHireUpgrade('cook_plus')} />
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
              <BuyButton label="Hire Bard" cost={60} canAfford={gold >= 60} onClick={() => onHireUpgrade('bard')} />
            )}
          </UpgradeRow>
        </div>

        {/* Basement */}
        {!basement ? (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>⛏</span>
              <div>
                <div style={sectionTitle}>Basement</div>
                <div style={sectionSubtitle}>Underground storage and supplies</div>
              </div>
            </div>
            <div style={{ color: '#7a6a5a', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
              Excavate a basement to store materials brought back from quests —{' '}
              <span style={{ color: '#c8960c' }}>Herbs (3g)</span>,{' '}
              <span style={{ color: '#aaa' }}>Ore (6g)</span>,{' '}
              <span style={{ color: '#9b59b6' }}>Relics (12g)</span>, and monster parts —{' '}
              <span style={{ color: '#c8b89a' }}>Bones</span>,{' '}
              <span style={{ color: '#a0724a' }}>Pelts</span>,{' '}
              <span style={{ color: '#2ecc71' }}>Venom</span>{' '}
              (8g each) — that can be sold for gold.
              Adventurers have a ~40% chance to bring back materials on successful quests.
            </div>
            <BuyButton
              label="Excavate Basement"
              cost={100}
              canAfford={gold >= 100}
              onClick={() => onHireUpgrade('basement')}
            />
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>⛏</span>
              <div style={{ flex: 1 }}>
                <div style={sectionTitle}>Basement Storage</div>
                <div style={sectionSubtitle}>
                  Materials from quest returns accumulate here
                  {upgrades.enchanter && <span style={{ color: '#8e44ad', marginLeft: 6 }}>✦ Enchanted (2× rates)</span>}
                </div>
              </div>
              {hasMaterials && (
                <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 13 }}>
                  Worth: {totalMaterialValue}g
                </span>
              )}
            </div>

            {/* Material inventory — crafting supplies */}
            <div style={{ color: '#4a3a28', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              Crafting Supplies
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[
                { key: 'herbs' as const, label: 'Herbs', icon: '🌿', color: '#c8960c', rate: sellRates.herbs },
                { key: 'ore' as const, label: 'Ore', icon: '⚙', color: '#aaa', rate: sellRates.ore },
                { key: 'relics' as const, label: 'Relics', icon: '💎', color: '#9b59b6', rate: sellRates.relics },
              ].map(({ key, label, icon, color, rate }) => (
                <div key={key} style={{
                  flex: 1,
                  background: materials[key] > 0 ? `rgba(${hexToRgbStr(color)},0.08)` : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${materials[key] > 0 ? color + '55' : '#2a1a08'}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                  <div style={{ color, fontWeight: 'bold', fontSize: 18 }}>{materials[key]}</div>
                  <div style={{ color: '#7a6a5a', fontSize: 11, marginBottom: 1 }}>{label}</div>
                  <div style={{ color: '#4a3a28', fontSize: 10 }}>{rate}g each</div>
                </div>
              ))}
            </div>

            {/* Material inventory — monster parts */}
            <div style={{ color: '#4a3a28', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              Monster Parts
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { key: 'bones' as const, label: 'Bones', icon: '🦴', color: '#c8b89a', rate: sellRates.bones },
                { key: 'pelts' as const, label: 'Pelts', icon: '🐾', color: '#a0724a', rate: sellRates.pelts },
                { key: 'venom' as const, label: 'Venom', icon: '🧪', color: '#2ecc71', rate: sellRates.venom },
              ].map(({ key, label, icon, color, rate }) => (
                <div key={key} style={{
                  flex: 1,
                  background: materials[key] > 0 ? `rgba(${hexToRgbStr(color)},0.08)` : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${materials[key] > 0 ? color + '55' : '#2a1a08'}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                  <div style={{ color, fontWeight: 'bold', fontSize: 18 }}>{materials[key]}</div>
                  <div style={{ color: '#7a6a5a', fontSize: 11, marginBottom: 1 }}>{label}</div>
                  <div style={{ color: '#4a3a28', fontSize: 10 }}>{rate}g each</div>
                </div>
              ))}
            </div>

            {hasMaterials ? (
              <button
                onClick={onSellMaterials}
                style={{
                  background: 'linear-gradient(180deg, #1a6b2a 0%, #0d4519 100%)',
                  border: '1px solid #2ecc71',
                  borderRadius: 6,
                  color: '#2ecc71',
                  fontFamily: 'serif',
                  fontWeight: 'bold',
                  fontSize: 14,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Sell All Materials — +{totalMaterialValue}g
              </button>
            ) : (
              <div style={{ color: '#4a3a28', fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>
                No materials in storage. Send adventurers on quests to gather resources.
              </div>
            )}
          </div>
        )}

        {/* Gear Crafting — only when basement is unlocked */}
        {basement && (
          <>
            <div style={{ color: '#4a3a28', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '20px 0 10px' }}>
              Gear Crafting
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>⚒</span>
                <div>
                  <div style={sectionTitle}>Smithy &amp; Alchemist</div>
                  <div style={sectionSubtitle}>
                    Craft gear from herbs and ore — equip to a chosen adventurer
                  </div>
                </div>
              </div>

              {/* Material stock reminder */}
              <div style={{
                display: 'flex', gap: 10, marginBottom: 14,
                background: 'rgba(0,0,0,0.3)', border: '1px solid #2a1a08',
                borderRadius: 7, padding: '8px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>🌿</span>
                  <span style={{ color: '#c8960c', fontWeight: 'bold', fontSize: 14 }}>{materials.herbs}</span>
                  <span style={{ color: '#7a6a5a', fontSize: 12 }}>Herbs</span>
                </div>
                <div style={{ color: '#3a2a18', fontSize: 14, alignSelf: 'center' }}>·</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>⛏️</span>
                  <span style={{ color: '#aaa', fontWeight: 'bold', fontSize: 14 }}>{materials.ore}</span>
                  <span style={{ color: '#7a6a5a', fontSize: 12 }}>Ore</span>
                </div>
                {recruitedCount === 0 && (
                  <div style={{ marginLeft: 'auto', color: '#7a6a5a', fontSize: 11, fontStyle: 'italic', alignSelf: 'center' }}>
                    Recruit adventurers to equip
                  </div>
                )}
              </div>

              {/* Recipe cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GEAR_RECIPES.map(recipe => {
                  const guildLocked = recipe.requiresGuildHall && !upgrades.guildHall;
                  const canAffordHerbs = materials.herbs >= recipe.cost.herbs;
                  const canAffordOre = materials.ore >= recipe.cost.ore;
                  const canAfford = canAffordHerbs && canAffordOre;
                  const hasRecruited = recruitedCount > 0;
                  const canCraft = !guildLocked && canAfford && hasRecruited;

                  return (
                    <div
                      key={recipe.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        background: guildLocked
                          ? 'rgba(0,0,0,0.1)'
                          : canCraft
                            ? 'rgba(200,150,12,0.06)'
                            : 'rgba(0,0,0,0.2)',
                        border: guildLocked
                          ? '1px solid #1e1208'
                          : canCraft
                            ? '1px solid #c8960c44'
                            : '1px solid #2a1a08',
                        borderRadius: 8,
                        padding: '10px 12px',
                        opacity: guildLocked ? 0.45 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Icon */}
                      <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>
                        {recipe.icon}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 14 }}>
                            {recipe.name}
                          </div>
                          {guildLocked && (
                            <span style={{
                              fontSize: 9, fontWeight: 'bold', color: '#f1c40f',
                              background: 'rgba(241,196,15,0.12)', border: '1px solid rgba(241,196,15,0.3)',
                              borderRadius: 3, padding: '1px 5px', letterSpacing: 0.5,
                            }}>
                              🏛 Guild Hall
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#7a6a5a', fontSize: 11, lineHeight: 1.4, marginBottom: 7 }}>
                          {recipe.description}
                        </div>

                        {/* Effects */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {recipe.effects.map((eff, i) => {
                            const statLabel = eff.stat === 'maxHp' ? 'Max HP' : eff.stat === 'attack' ? 'Attack' : 'Defense';
                            const statColor = eff.stat === 'maxHp' ? '#e74c3c' : eff.stat === 'attack' ? '#e67e22' : '#3498db';
                            return (
                              <span key={i} style={{
                                background: `rgba(${hexToRgbStr(statColor)},0.12)`,
                                border: `1px solid ${statColor}44`,
                                borderRadius: 4,
                                color: statColor,
                                fontSize: 11,
                                fontWeight: 'bold',
                                padding: '2px 7px',
                              }}>
                                +{eff.amount} {statLabel}
                              </span>
                            );
                          })}
                          <span style={{ color: '#4a3a28', fontSize: 11, alignSelf: 'center' }}>
                            · chosen adventurer
                          </span>
                        </div>

                        {/* Cost row — always show both herb and ore so players see the exact full cost */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: '#4a3a28', fontSize: 11 }}>Requires:</span>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: canAffordHerbs ? 'rgba(200,150,12,0.1)' : 'rgba(200,50,50,0.1)',
                            border: `1px solid ${canAffordHerbs ? '#c8960c55' : '#e74c3c55'}`,
                            borderRadius: 4,
                            padding: '2px 7px',
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: canAffordHerbs ? '#c8960c' : '#e74c3c',
                          }}>
                            🌿 {recipe.cost.herbs} Herb{recipe.cost.herbs !== 1 ? 's' : ''}
                            {recipe.cost.herbs > 0 && !canAffordHerbs && (
                              <span style={{ fontWeight: 'normal', fontSize: 10, color: '#e74c3c' }}>
                                &nbsp;({materials.herbs}/{recipe.cost.herbs})
                              </span>
                            )}
                          </span>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: canAffordOre ? 'rgba(170,170,170,0.08)' : 'rgba(200,50,50,0.1)',
                            border: `1px solid ${canAffordOre ? '#aaa5' : '#e74c3c55'}`,
                            borderRadius: 4,
                            padding: '2px 7px',
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: canAffordOre ? '#aaa' : '#e74c3c',
                          }}>
                            ⛏️ {recipe.cost.ore} Ore
                            {recipe.cost.ore > 0 && !canAffordOre && (
                              <span style={{ fontWeight: 'normal', fontSize: 10, color: '#e74c3c' }}>
                                &nbsp;({materials.ore}/{recipe.cost.ore})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Equip to button */}
                      <button
                        onClick={() => canCraft && setPendingRecipeId(recipe.id)}
                        disabled={!canCraft}
                        style={{
                          flexShrink: 0,
                          background: canCraft
                            ? 'linear-gradient(180deg, #8a5422 0%, #5c3315 100%)'
                            : '#1a0e05',
                          border: canCraft ? '1px solid #a0631e' : '1px solid #2a1a08',
                          borderRadius: 6,
                          color: canCraft ? '#e8d5a0' : '#3a2510',
                          fontFamily: 'serif',
                          fontWeight: 'bold',
                          fontSize: 13,
                          padding: '7px 14px',
                          cursor: canCraft ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                          alignSelf: 'center',
                        }}
                      >
                        {guildLocked ? '🔒' : 'Equip to…'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Prestige Upgrades */}
        <div style={{ color: '#4a3a28', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '20px 0 10px' }}>
          Prestige Upgrades
        </div>

        {/* Training Grounds — Prestige I */}
        <div style={prestige1Unlocked ? cardStyle : lockedCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>⚔</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <div style={sectionTitle}>Training Grounds</div>
                <PrestigeTierBadge tier={tavernPrestige} required={1} />
              </div>
              <div style={sectionSubtitle}>Dedicated facilities to accelerate adventurer growth</div>
            </div>
          </div>
          <div style={{ color: '#7a6a5a', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
            Construct a training yard that increases quest XP gains by{' '}
            <strong style={{ color: '#c8960c' }}>+50%</strong> for all adventurers. Stacks with the Bard bonus.
          </div>
          {upgrades.trainingGrounds ? (
            <PurchasedBadge label="Training Grounds active" />
          ) : prestige1Unlocked ? (
            <BuyButton label="Build Training Grounds" cost={50} canAfford={gold >= 50} onClick={() => onHireUpgrade('training_grounds')} />
          ) : (
            <LockedBadge label="Reach Renowned prestige to unlock" />
          )}
        </div>

        {/* Enchanter's Study — Prestige II */}
        <div style={prestige2Unlocked ? cardStyle : lockedCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🔮</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <div style={sectionTitle}>Enchanter's Study</div>
                <PrestigeTierBadge tier={tavernPrestige} required={2} />
              </div>
              <div style={sectionSubtitle}>A resident enchanter appraises your rare finds</div>
            </div>
          </div>
          <div style={{ color: '#7a6a5a', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
            An enchanter doubles the sell value of all materials:{' '}
            <span style={{ color: '#c8960c' }}>Herbs → 6g</span>,{' '}
            <span style={{ color: '#aaa' }}>Ore → 12g</span>,{' '}
            <span style={{ color: '#9b59b6' }}>Relics → 24g</span>,{' '}
            <span style={{ color: '#c8b89a' }}>Bones → 16g</span>,{' '}
            <span style={{ color: '#a0724a' }}>Pelts → 16g</span>,{' '}
            <span style={{ color: '#2ecc71' }}>Venom → 16g</span>.
          </div>
          {upgrades.enchanter ? (
            <PurchasedBadge label="Enchanter in residence" />
          ) : prestige2Unlocked ? (
            <BuyButton label="Hire Enchanter" cost={150} canAfford={gold >= 150} onClick={() => onHireUpgrade('enchanter')} />
          ) : (
            <LockedBadge label="Reach Celebrated prestige to unlock" />
          )}
        </div>

        {/* Guild Hall — Prestige III */}
        <div style={prestige3Unlocked ? cardStyle : lockedCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🏛</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <div style={sectionTitle}>Guild Hall</div>
                <PrestigeTierBadge tier={tavernPrestige} required={3} />
              </div>
              <div style={sectionSubtitle}>Unlock master-tier crafting recipes for your adventurers</div>
            </div>
          </div>
          <div style={{ color: '#7a6a5a', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
            Establish a Guild Hall to unlock three advanced crafting recipes —{' '}
            <strong style={{ color: '#e8d5a0' }}>Fortifying Tonic</strong>,{' '}
            <strong style={{ color: '#e8d5a0' }}>War Kit</strong>, and{' '}
            <strong style={{ color: '#e8d5a0' }}>Bulwark Set</strong> — for significantly stronger stat bonuses.
          </div>
          {upgrades.guildHall ? (
            <PurchasedBadge label="Guild Hall established" />
          ) : prestige3Unlocked ? (
            <BuyButton label="Build Guild Hall" cost={300} canAfford={gold >= 300} onClick={() => onHireUpgrade('guild_hall')} />
          ) : (
            <LockedBadge label="Reach Legendary prestige to unlock" />
          )}
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

          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'rgba(255,255,255,0.04)', border: '1px solid #2a1a08',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e8d5a0', fontWeight: 'bold', fontSize: 14 }}>
                {rosterMax} adventurer slots
              </div>
              <div style={{ color: '#7a6a5a', fontSize: 12, marginTop: 2 }}>
                Base 10 + {(upgrades.rosterSlots ?? 0)} upgrade{(upgrades.rosterSlots ?? 0) !== 1 ? 's' : ''} × {ROSTER_UPGRADE_SIZE}
              </div>
              <div style={{ color: '#7a6a5a', fontSize: 12, marginTop: 4 }}>
                Current roster: <span style={{ color: '#e8d5a0' }}>{rosterCount}</span> / {rosterMax}
              </div>
            </div>
            <BuyButton
              label={`+${ROSTER_UPGRADE_SIZE} slots`}
              cost={ROSTER_UPGRADE_COST}
              canAfford={gold >= ROSTER_UPGRADE_COST}
              onClick={() => onHireUpgrade('roster_expand')}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function hexToRgbStr(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return '200,150,12';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
