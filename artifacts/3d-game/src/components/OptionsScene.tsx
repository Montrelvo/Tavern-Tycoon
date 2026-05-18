import type { RendererPreference } from '../game/useRendererPreference';

interface OptionsSceneProps {
  preference: RendererPreference;
  effective: RendererPreference;
  webGPUSupported: boolean;
  onSetPreference: (next: RendererPreference) => void;
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
  onSelect,
}: {
  title: string;
  badge: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}) {
  const style: React.CSSProperties = {
    ...CARD_STYLE_BASE,
    background: selected
      ? 'linear-gradient(180deg, #2a1808 0%, #1a0d04 100%)'
      : 'rgba(20,10,3,0.7)',
    border: selected ? '2px solid #a0631e' : '2px solid #3d2410',
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
          background: selected ? '#a0631e' : '#3d2410',
          color: selected ? '#1a0d00' : '#a08a70',
          fontWeight: 'bold',
        }}>
          {badge}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#a89880' }}>
        {description}
      </p>
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

export function OptionsScene({
  preference,
  effective,
  webGPUSupported,
  onSetPreference,
}: OptionsSceneProps) {
  const fallbackActive = preference === 'webgpu' && effective === 'webgl';

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
          Tune how the tavern is drawn on your machine.
        </p>

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
        </section>
      </div>
    </div>
  );
}
