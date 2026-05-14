import { useEffect, useRef, useCallback } from 'react';

export type SoundCue = 'recruit' | 'questComplete' | 'questFail';

function createCracklingFire(ctx: AudioContext, master: GainNode) {
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const crackleGain = ctx.createGain();
  crackleGain.gain.setValueAtTime(0, ctx.currentTime);
  crackleGain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 5);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(800, ctx.currentTime);
  bandpass.Q.setValueAtTime(0.6, ctx.currentTime);

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(400, ctx.currentTime);

  const crackleEnvGain = ctx.createGain();
  crackleEnvGain.gain.setValueAtTime(1, ctx.currentTime);

  noise.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(crackleEnvGain);
  crackleEnvGain.connect(crackleGain);
  crackleGain.connect(master);
  noise.start();

  function scheduleCrackle() {
    if (ctx.state === 'closed') return;
    const when = ctx.currentTime + Math.random() * 0.4;
    crackleEnvGain.gain.setValueAtTime(0.1, when);
    crackleEnvGain.gain.linearRampToValueAtTime(1.4, when + 0.015);
    crackleEnvGain.gain.exponentialRampToValueAtTime(0.1, when + 0.08 + Math.random() * 0.12);
    setTimeout(scheduleCrackle, 120 + Math.random() * 500);
  }
  setTimeout(scheduleCrackle, 3000);
}

function createTavernMurmur(ctx: AudioContext, master: GainNode) {
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
}

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

    createTavernMurmur(ctx, master);
    createCracklingFire(ctx, master);
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
