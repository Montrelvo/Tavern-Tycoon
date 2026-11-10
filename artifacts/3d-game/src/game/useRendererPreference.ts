import { useCallback, useEffect, useState } from 'react';

export type RendererPreference = 'webgl' | 'webgpu' | 'babylon';

const STORAGE_KEY = 'tavern-owner.rendererPreference';

interface GPUAdapterLike {
  features?: ReadonlySet<string>;
}
interface GPULike {
  requestAdapter: () => Promise<GPUAdapterLike | null>;
}

async function detectWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  const gpu = (navigator as Navigator & { gpu?: GPULike }).gpu;
  if (!gpu || typeof gpu.requestAdapter !== 'function') return false;
  try {
    const adapter = await gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

function readStoredPreference(): RendererPreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'webgl' || raw === 'webgpu' || raw === 'babylon') return raw;
  } catch {
    /* localStorage unavailable */
  }
  return null;
}

function writeStoredPreference(value: RendererPreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* localStorage unavailable */
  }
}

export interface RendererPreferenceState {
  /** What the player picked (or the resolved default). */
  preference: RendererPreference;
  /** What is actually used right now (auto-falls back to webgl when webgpu is unsupported). */
  effective: RendererPreference;
  /** True when the current browser advertises WebGPU support. */
  webGPUSupported: boolean;
  /** True until the very first effective renderer is decided (avoids double-mount on hydration). */
  ready: boolean;
  setPreference: (next: RendererPreference) => void;
  /** Flag the current browser as WebGPU-incapable at runtime (used by the renderer error boundary). */
  markWebGPUUnsupported: () => void;
}

export function useRendererPreference(): RendererPreferenceState {
  const [webGPUSupported, setWebGPUSupported] = useState(false);
  const [preference, setPreferenceState] = useState<RendererPreference>(() => readStoredPreference() ?? 'babylon');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (readStoredPreference() !== 'webgpu') setReady(true);
    (async () => {
      const supported = await detectWebGPUSupport();
      if (cancelled) return;
      setWebGPUSupported(supported);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: RendererPreference) => {
    setPreferenceState(next);
    writeStoredPreference(next);
  }, []);

  const markWebGPUUnsupported = useCallback(() => {
    setWebGPUSupported(false);
  }, []);

  const effective: RendererPreference =
    preference === 'webgpu' && !webGPUSupported ? 'webgl' : preference;

  return { preference, effective, webGPUSupported, ready, setPreference, markWebGPUUnsupported };
}
