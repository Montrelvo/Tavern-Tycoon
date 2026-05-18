import { useEffect, useRef, useCallback, useState } from 'react';

export type SoundCue = 'recruit' | 'questComplete' | 'questFail' | 'goldDrop' | 'levelUp';

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

  const fireGain = ctx.createGain();
  fireGain.gain.setValueAtTime(0, ctx.currentTime);
  fireGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 6);

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
  crackleEnvGain.connect(fireGain);
  fireGain.connect(master);
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
  const murmurGain = ctx.createGain();
  murmurGain.gain.setValueAtTime(0, ctx.currentTime);
  murmurGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 8);
  murmurGain.connect(master);

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
    filter.connect(murmurGain);
    osc.start();
  });
}

export function useTavernAmbience() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  const startAmbience = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(isMutedRef.current ? 0 : 1, ctx.currentTime);
    master.connect(ctx.destination);
    masterRef.current = master;

    createTavernMurmur(ctx, master);
    createCracklingFire(ctx, master);
  }, []);

  const toggleMute = useCallback(() => {
    const master = masterRef.current;
    const ctx = ctxRef.current;
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (master && ctx) {
      master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.05);
    }
  }, []);

  const playSound = useCallback((type: SoundCue) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    const destination = masterRef.current ?? ctx.destination;

    if (type === 'recruit') {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      gain.connect(destination);
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.setValueAtTime(523, now + 0.1);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.55);

    } else if (type === 'questComplete') {
      // Multi-note fanfare: four oscillators play a rising major arpeggio
      // then all resolve together on the final chord
      const notes = [
        { freq: 392, start: 0,    dur: 0.25 },  // G4
        { freq: 494, start: 0.18, dur: 0.25 },  // B4
        { freq: 587, start: 0.34, dur: 0.25 },  // D5
        { freq: 784, start: 0.50, dur: 0.55 },  // G5
      ];
      // Harmony layer: lower octave held through
      const harmFreqs = [196, 247, 294];
      harmFreqs.forEach((freq, i) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.05, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        g.connect(destination);
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now);
        o.connect(g);
        o.start(now + i * 0.02);
        o.stop(now + 1.15);
      });
      notes.forEach(({ freq, start, dur }) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + start);
        g.gain.linearRampToValueAtTime(0.22, now + start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        g.connect(destination);
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + start);
        o.connect(g);
        o.start(now + start);
        o.stop(now + start + dur + 0.05);
      });

    } else if (type === 'questFail') {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      gain.connect(destination);
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(165, now + 0.2);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.55);

    } else if (type === 'goldDrop') {
      // Coin-clink chime: two quick high sine tones with fast metallic decay
      const coinNotes = [
        { freq: 1568, start: 0,    vol: 0.20 },  // G6
        { freq: 2093, start: 0.07, vol: 0.16 },  // C7
        { freq: 1760, start: 0.13, vol: 0.10 },  // A6 (shimmer tail)
      ];
      coinNotes.forEach(({ freq, start, vol }) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, now + start);
        g.gain.exponentialRampToValueAtTime(0.001, now + start + 0.28);
        g.connect(destination);
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + start);
        // Slight downward pitch drift for natural bell decay
        o.frequency.exponentialRampToValueAtTime(freq * 0.96, now + start + 0.28);
        o.connect(g);
        o.start(now + start);
        o.stop(now + start + 0.32);
      });

    } else if (type === 'levelUp') {
      // Triumphant ascending chord: arpeggio sweeps up then full chord blooms
      const arpNotes = [
        { freq: 261.6, start: 0,    dur: 0.18 },  // C4
        { freq: 329.6, start: 0.12, dur: 0.18 },  // E4
        { freq: 392.0, start: 0.22, dur: 0.18 },  // G4
        { freq: 523.3, start: 0.32, dur: 0.50 },  // C5
        { freq: 659.3, start: 0.40, dur: 0.50 },  // E5
        { freq: 784.0, start: 0.48, dur: 0.60 },  // G5
      ];
      // Pad: warm chord swell underneath
      const padFreqs = [130.8, 164.8, 196.0, 261.6];
      padFreqs.forEach((freq, i) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + 0.1);
        g.gain.linearRampToValueAtTime(0.06, now + 0.35);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        g.connect(destination);
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now);
        o.connect(g);
        o.start(now + i * 0.03);
        o.stop(now + 1.35);
      });
      arpNotes.forEach(({ freq, start, dur }) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + start);
        g.gain.linearRampToValueAtTime(0.24, now + start + 0.025);
        g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        g.connect(destination);
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + start);
        o.connect(g);
        o.start(now + start);
        o.stop(now + start + dur + 0.05);
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return { startAmbience, playSound, toggleMute, isMuted };
}
