type SoundType = 'whistle' | 'whistle_end' | 'goal' | 'card';

class SoundEngine {
  private _ctx: AudioContext | null = null;
  private _enabled: boolean;

  constructor() {
    this._enabled = localStorage.getItem('elifoot_sound') !== 'false';
  }

  get enabled() {
    return this._enabled;
  }

  toggle(): boolean {
    this._enabled = !this._enabled;
    localStorage.setItem('elifoot_sound', String(this._enabled));
    return this._enabled;
  }

  private ctx(): AudioContext {
    if (!this._ctx) {
      this._ctx = new AudioContext();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  }

  private playTone(
    ctx: AudioContext,
    type: OscillatorType,
    frequency: number,
    startTime: number,
    duration: number,
    gainPeak: number = 0.4
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(gainPeak, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.01);
  }

  private playWhistle(): void {
    const ctx = this.ctx();
    const now = ctx.currentTime;
    const beepduration = 0.12;
    const gap = 0.08;

    this.playTone(ctx, 'sine', 2400, now, beepduration);
    this.playTone(ctx, 'sine', 2400, now + beepduration + gap, beepduration);
  }

  private playWhistleEnd(): void {
    const ctx = this.ctx();
    const now = ctx.currentTime;
    const shortDuration = 0.12;
    const longDuration = 0.35;
    const gap = 0.08;

    this.playTone(ctx, 'sine', 2400, now, shortDuration);
    this.playTone(ctx, 'sine', 2400, now + shortDuration + gap, shortDuration);
    this.playTone(ctx, 'sine', 2400, now + (shortDuration + gap) * 2, longDuration);
  }

  private playGoal(): void {
    const ctx = this.ctx();
    const now = ctx.currentTime;
    const notes = [220, 277, 330, 440];
    const noteDuration = 0.18;
    const gap = 0.05;

    notes.forEach((freq, i) => {
      const start = now + i * (noteDuration + gap);
      this.playTone(ctx, 'sine', freq, start, noteDuration, 0.5);
    });
  }

  private playCard(): void {
    const ctx = this.ctx();
    const now = ctx.currentTime;
    this.playTone(ctx, 'square', 300, now, 0.25, 0.3);
  }

  play(type: SoundType): void {
    if (!this._enabled) return;

    try {
      switch (type) {
        case 'whistle':
          this.playWhistle();
          break;
        case 'whistle_end':
          this.playWhistleEnd();
          break;
        case 'goal':
          this.playGoal();
          break;
        case 'card':
          this.playCard();
          break;
      }
    } catch (e) {
      // Silently ignore audio errors (e.g. browser policy)
    }
  }
}

export const soundEngine = new SoundEngine();
