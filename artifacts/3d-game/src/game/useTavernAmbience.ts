import { useEffect, useRef, useCallback } from 'react';

export type SoundCue = 'recruit' | 'questComplete' | 'questFail';

export function useTavernAmbience() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  const startAmbience = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.connect(ctx.destination);
    masterRef.current = master;

    const freqs = [55, 110, 165];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.6 / (i + 1), ctx.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280 + i * 80, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.05 + i * 0.03, ctx.currentTime);
      lfoGain.gain.setValueAtTime(20, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(master);
      osc.start();
    });
  }, []);

  const playSound = useCallback((type: SoundCue) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';

    if (type === 'recruit') {
      osc.frequency.setValueAtTime(392, ctx.currentTime);
      osc.frequency.setValueAtTime(523, ctx.currentTime + 0.1);
    } else if (type === 'questComplete') {
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.setValueAtTime(415, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(523, ctx.currentTime + 0.24);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(165, ctx.currentTime + 0.2);
    }

    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  }, []);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return { startAmbience, playSound };
}
