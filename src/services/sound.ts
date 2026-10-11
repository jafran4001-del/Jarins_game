// Web Audio API procedural sound engine

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private musicStep = 0;
  public sfxEnabled = true;
  public musicEnabled = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.musicGainNode = this.ctx.createGain();
      this.sfxGainNode = this.ctx.createGain();

      this.musicGainNode.gain.value = 0.18;
      this.sfxGainNode.gain.value = 0.35;

      this.musicGainNode.connect(this.ctx.destination);
      this.sfxGainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public playCoin() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Pentatonic high sparkle
    const notes = [987.77, 1174.66, 1318.51, 1567.98, 1760.0];
    const pitch = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playJump() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playSlide() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  public playLaneChange() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playPowerUp() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = this.ctx!.currentTime + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }

  public playCrash() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    // Low noise burst + thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  public playShieldBreak() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playThiefHit() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    // Cartoon bonk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playFanfare() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 698.46, 880.0],
      [659.25, 783.99, 987.77],
      [1046.5, 1318.51, 1567.98],
    ];

    chords.forEach((chord, i) => {
      chord.forEach(freq => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = this.ctx!.currentTime + i * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    });
  }

  public startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initCtx();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Upbeat melody pattern (C major / A minor upbeat arcade vibe)
    const melody = [
      261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 440.00, 392.00,
      349.23, 440.00, 523.25, 659.25, 523.25, 440.00, 392.00, 329.63,
    ];
    const bass = [
      130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.00, 196.00,
      130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.00, 196.00,
    ];

    const stepDuration = 220; // ms per 16th note

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGainNode || !this.musicEnabled) return;

      const idx = this.musicStep % melody.length;
      const mFreq = melody[idx];
      const bFreq = bass[idx];

      // Play lead note
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(mFreq, this.ctx.currentTime);

      leadGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      leadGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGainNode);
      leadOsc.start();
      leadOsc.stop(this.ctx.currentTime + 0.18);

      // Bass note
      if (idx % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bFreq, this.ctx.currentTime);

        bassGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGainNode);
        bassOsc.start();
        bassOsc.stop(this.ctx.currentTime + 0.35);
      }

      this.musicStep++;
    }, stepDuration);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const sound = new SoundEngine();
