import { useEffect, useRef, useState } from 'react';
import type { RendererPreference } from '../game/useRendererPreference';

interface OptionsSceneProps {
  preference: RendererPreference;
  effective: RendererPreference;
  webGPUSupported: boolean;
  onSetPreference: (next: RendererPreference) => void;
  onNewGame: () => void;
  onSave: () => number | null;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  lastAutoSavedAt: number | null;
}

function formatRelativeTime(ts: number, now: number): string {
  const diffMs = now - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

const CARD_STYLE_BASE: React.CSSProperties = {
  flex: 1,
  minWidth: 240,
  maxWidth: 320,
  padding: '20px 22px',
  borderRadius: 10,
  textAlign: 'left',
  fontFamily: 'serif',
  cursor: 'pointer',
  transition: 'all 0.15s',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

function RendererCard({
  title,
  badge,
  description,
  selected,
  disabled,
  disabledReason,
  warningNote,
  experimental,
  onSelect,
}: {
  title: string;
  badge: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  warningNote?: string;
  experimental?: boolean;
  onSelect: () => void;
}) {
  const accent = experimental ? '#c0641a' : '#a0631e';
  const style: React.CSSProperties = {
    ...CARD_STYLE_BASE,
    background: selected
      ? 'linear-gradient(180deg, #2a1808 0%, #1a0d04 100%)'
      : 'rgba(20,10,3,0.7)',
    border: selected ? `2px solid ${accent}` : '2px solid #3d2410',
    color: selected ? '#e8d5a0' : '#a08a70',
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
  return (
    <button
      type="button"
      style={style}
      onClick={() => { if (!disabled) onSelect(); }}
      disabled={disabled}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 'bold', color: selected ? '#ffd700' : '#c9b290' }}>
          {title}
        </span>
        <span style={{
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: 4,
          background: experimental ? (selected ? '#c0641a' : '#5c2a0a') : (selected ? '#a0631e' : '#3d2410'),
          color: selected ? '#1a0d00' : (experimental ? '#e0a060' : '#a08a70'),
          fontWeight: 'bold',
        }}>
          {badge}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#a89880' }}>
        {description}
      </p>
      {warningNote && (
        <p style={{ margin: 0, fontSize: 11, color: '#e0954a', fontStyle: 'italic', lineHeight: 1.45 }}>
          ⚠ {warningNote}
        </p>
      )}
      {disabled && disabledReason && (
        <p style={{ margin: 0, fontSize: 11, color: '#8a5a3a', fontStyle: 'italic' }}>
          {disabledReason}
        </p>
      )}
      {selected && !disabled && (
        <p style={{ margin: 0, fontSize: 11, color: '#ffd700', letterSpacing: 1 }}>
          ✓ Active
        </p>
      )}
    </button>
  );
}

const ACTION_BTN_BASE: React.CSSProperties = {
  fontFamily: 'serif',
  fontWeight: 'bold',
  fontSize: 13,
  padding: '9px 18px',
  borderRadius: 7,
  cursor: 'pointer',
  letterSpacing: 0.3,
};

const ABOUT_CARD_STYLE: React.CSSProperties = {
  background: 'rgba(20,10,3,0.7)',
  border: '1px solid #3d2410',
  borderRadius: 10,
  padding: '16px 18px',
};

const ABOUT_HEADING_STYLE: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 15,
  color: '#ffd700',
  letterSpacing: 0.5,
};

const ABOUT_TEXT_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
  color: '#bda886',
};

const ABOUT_LINK_STYLE: React.CSSProperties = {
  display: 'inline-block',
  width: 'fit-content',
  fontSize: 13,
  fontWeight: 'bold',
  color: '#e8c890',
  textDecoration: 'none',
  padding: '7px 12px',
  borderRadius: 6,
  background: 'rgba(90,50,15,0.4)',
  border: '1px solid #5c3315',
};

export function OptionsScene({
  preference,
  effective,
  webGPUSupported,
  onSetPreference,
  onNewGame,
  onSave,
  onExportSave,
  onImportSave,
  lastAutoSavedAt,
}: OptionsSceneProps) {
  const fallbackActive = preference === 'webgpu' && effective === 'webgl';
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const saveFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => {
    if (saveFlashTimerRef.current) clearTimeout(saveFlashTimerRef.current);
  }, []);

  const handleSave = () => {
    const ok = onSave();
    if (ok == null) return;
    setSaveFlash(true);
    if (saveFlashTimerRef.current) clearTimeout(saveFlashTimerRef.current);
    saveFlashTimerRef.current = setTimeout(() => setSaveFlash(false), 1800);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      top: 40,
      background: '#0d0700',
      overflowY: 'auto',
      padding: '40px 20px',
      fontFamily: 'serif',
      color: '#e8d5a0',
    }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{
          margin: '0 0 8px',
          fontSize: 28,
          color: '#ffd700',
          letterSpacing: 1,
        }}>
          Options
        </h1>
        <p style={{ margin: '0 0 28px', color: '#8a7a60', fontSize: 14 }}>
          Manage your save and tune how the tavern is drawn on your machine.
        </p>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{
            margin: '0 0 6px',
            fontSize: 18,
            color: '#c9b290',
            borderBottom: '1px solid #3d2410',
            paddingBottom: 6,
          }}>
            Save &amp; Progress
          </h2>
          <p style={{ margin: '0 0 14px', color: '#8a7a60', fontSize: 13 }}>
            Your game saves automatically. You can also save manually, export your save as a backup, or import a save file.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
            color: lastAutoSavedAt ? '#4a7a55' : '#5a5040',
            fontSize: 12,
            fontStyle: 'italic',
          }}>
            <span>
              {saveFlash
                ? <span style={{ color: '#2ecc71', fontStyle: 'normal', fontWeight: 'bold' }}>✓ Saved!</span>
                : lastAutoSavedAt
                  ? <>Auto-saved {formatRelativeTime(lastAutoSavedAt, now)}</>
                  : 'No auto-save yet — make a change to trigger one.'}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              onClick={handleSave}
              title="Save your progress right now"
              style={{
                ...ACTION_BTN_BASE,
                background: 'linear-gradient(180deg, #2a6a35 0%, #1a4a25 100%)',
                border: '1px solid #3a8a45',
                color: '#d8f0d8',
              }}
            >
              Save Now
            </button>
            <button
              onClick={onExportSave}
              title="Download your save file as a backup"
              style={{
                ...ACTION_BTN_BASE,
                background: 'linear-gradient(180deg, #2a4a7a 0%, #15305c 100%)',
                border: '1px solid #3a6aaa',
                color: '#cfe0f5',
              }}
            >
              Export Save
            </button>
            <button
              onClick={() => importFileRef.current?.click()}
              title="Load a previously exported save file"
              style={{
                ...ACTION_BTN_BASE,
                background: 'linear-gradient(180deg, #5a2a7a 0%, #3a155c 100%)',
                border: '1px solid #7a3aaa',
                color: '#e0cff5',
              }}
            >
              Import Save
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportSave(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => setShowNewGameConfirm(true)}
              title="Wipe your save and start over"
              style={{
                ...ACTION_BTN_BASE,
                background: 'linear-gradient(180deg, #8a2a0a 0%, #5c1a08 100%)',
                border: '1px solid #c0401a',
                color: '#f5d8c8',
                marginLeft: 'auto',
              }}
            >
              New Game
            </button>
          </div>
        </section>

        <section>
          <h2 style={{
            margin: '0 0 6px',
            fontSize: 18,
            color: '#c9b290',
            borderBottom: '1px solid #3d2410',
            paddingBottom: 6,
          }}>
            Renderer
          </h2>
          <p style={{ margin: '0 0 18px', color: '#8a7a60', fontSize: 13 }}>
            Choose how the 3D scenes are drawn. Changing this reloads the scene briefly.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <RendererCard
              title="Classic"
              badge="WebGL"
              description="The original renderer. Broadest browser support and the safest pick if you see any visual glitches."
              selected={preference === 'webgl'}
              onSelect={() => onSetPreference('webgl')}
            />
            <RendererCard
              title="Next-gen"
              badge="WebGPU"
              description="Modern renderer with sharper visuals and better performance on supported browsers."
              selected={preference === 'webgpu'}
              disabled={!webGPUSupported}
              disabledReason={!webGPUSupported ? 'Your browser does not advertise WebGPU support.' : undefined}
              onSelect={() => onSetPreference('webgpu')}
            />
            <RendererCard
              title="Babylon.js"
              badge="Beta"
              description="An alternative engine that renders the full tavern and owner's room — adventurers, furniture, lighting and the day/night cycle — just like the classic renderer."
              warningNote="Newer rendering path. Visuals are very close to the classic renderer but may differ slightly."
              experimental
              selected={preference === 'babylon'}
              onSelect={() => onSetPreference('babylon')}
            />
          </div>

          {fallbackActive && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(80,40,10,0.4)',
              border: '1px solid #5c3315',
              color: '#e8c890',
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              WebGPU isn't available in this browser, so the classic renderer is being used as a fallback.
            </div>
          )}

          {preference === 'babylon' && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(110,55,10,0.4)',
              border: '1px solid #8a4a1a',
              color: '#f0c08a',
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              ⚠ The Babylon.js renderer is a newer rendering path. It renders the full tavern and owner's room, but visuals may differ slightly from the classic renderer. Switch back to Classic or Next-gen at any time.
            </div>
          )}
        </section>

        <section style={{ marginTop: 36 }}>
          <h2 style={{
            margin: '0 0 6px',
            fontSize: 18,
            color: '#c9b290',
            borderBottom: '1px solid #3d2410',
            paddingBottom: 6,
          }}>
            About
          </h2>
          <p style={{ margin: '0 0 18px', color: '#8a7a60', fontSize: 13 }}>
            A little about this game and the person who made it.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={ABOUT_CARD_STYLE}>
              <h3 style={ABOUT_HEADING_STYLE}>Author</h3>
              <p style={ABOUT_TEXT_STYLE}>
                Hey — I&apos;m Joseph Wilson (you might know me online as <strong style={{ color: '#e8c890' }}>Menelik</strong>),
                the solo developer behind <em>The Wanderer&apos;s Rest</em>. I designed, coded, and built
                every part of this tavern by hand.
              </p>
            </div>

            <div style={ABOUT_CARD_STYLE}>
              <h3 style={ABOUT_HEADING_STYLE}>Why I Made This</h3>
              <p style={ABOUT_TEXT_STYLE}>
                This started as a proof of concept for a set of management mechanics I find genuinely
                fun to play with. I reached the limit of what I could fund on my own, but I didn&apos;t
                want the work to go to waste — so I&apos;ve posted it here both to share it and to gather
                feedback. If you have thoughts, I&apos;d love to hear them.
              </p>
            </div>

            <div style={ABOUT_CARD_STYLE}>
              <h3 style={ABOUT_HEADING_STYLE}>Get in Touch</h3>
              <p style={ABOUT_TEXT_STYLE}>
                Questions, feedback, or just want to say hi? Reach out:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <a
                  href="mailto:jaw1014@gmail.com"
                  style={ABOUT_LINK_STYLE}
                >
                  ✉ jaw1014@gmail.com
                </a>
                <a
                  href="https://cash.app/$Malbro"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={ABOUT_LINK_STYLE}
                >
                  💵 Support on Cash App — $Malbro
                </a>
              </div>
              <p style={{ ...ABOUT_TEXT_STYLE, fontSize: 12, color: '#7a6a50', marginTop: 4 }}>
                Any support is entirely optional and hugely appreciated — it helps me keep building.
              </p>
            </div>
          </div>
        </section>
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
    </div>
  );
}
