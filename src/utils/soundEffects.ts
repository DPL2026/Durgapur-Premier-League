// Web Audio API Synthesizer for high-fidelity sports auction broadcast sound effects

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Crisp electronic broadcast chime when a bid is placed
  public playBidPlaced() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio playback failsafe
    }
  }

  // Higher alert tone when a new highest bid is recorded
  public playNewHighestBid() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.12); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.18); // C6

      osc2.frequency.setValueAtTime(1046.50, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.36);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.36);
    } catch {
      // Audio playback failsafe
    }
  }

  // Double urgent warning click/tick as timer runs down (<= 3s)
  public playTimerWarning() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio playback failsafe
    }
  }

  // Dramatic auction hammer strike + triumphant celebratory brass chord for SOLD!
  public playSoldGavel() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Wooden gavel impact (low thump + noise burst)
      const oscGavel = this.ctx.createOscillator();
      const gainGavel = this.ctx.createGain();
      oscGavel.type = 'sawtooth';
      oscGavel.frequency.setValueAtTime(160, now);
      oscGavel.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      gainGavel.gain.setValueAtTime(0.4, now);
      gainGavel.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      oscGavel.connect(gainGavel);
      gainGavel.connect(this.ctx.destination);
      oscGavel.start(now);
      oscGavel.stop(now + 0.2);

      // 2. Triumphant fan-fare major triad (C - E - G - High C)
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.1 + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + 0.1 + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + 0.1 + idx * 0.05);
        osc.stop(now + 1.25);
      });
    } catch {
      // Audio playback failsafe
    }
  }

  // Deep referee/game buzzer for UNSOLD
  public playUnsoldBuzzer() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.4);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.52);
    } catch {
      // Audio playback failsafe
    }
  }
}

export const soundManager = new SoundManager();
