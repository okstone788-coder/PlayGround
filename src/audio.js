// Tiny synthesized sound kit — no audio files, all WebAudio.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.42;
  }

  _tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, slideTo = null, attack = 0.008 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  _noise(dur, { vol = 0.08, at = 0, freq = 900, q = 0.8 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + at;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  click() {
    this.init();
    this._tone(760, 0.07, { type: 'triangle', vol: 0.09 });
  }

  plop() {
    this.init();
    this._tone(620, 0.13, { type: 'sine', vol: 0.18, slideTo: 260 });
    this._noise(0.07, { vol: 0.04, freq: 1800 });
  }

  chime() {
    this.init();
    this._tone(880, 0.22, { type: 'sine', vol: 0.1 });
    this._tone(1320, 0.26, { type: 'sine', vol: 0.06, at: 0.04 });
  }

  success() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this._tone(n, 0.3, { type: 'triangle', vol: 0.11, at: i * 0.075 });
      this._tone(n * 2, 0.18, { type: 'sine', vol: 0.035, at: i * 0.075 });
    });
  }

  perfect() {
    this.init();
    const notes = [659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((n, i) => {
      this._tone(n, 0.42, { type: 'sine', vol: 0.1, at: i * 0.08 });
    });
    this._noise(0.5, { vol: 0.03, freq: 4000 });
  }

  fail() {
    this.init();
    this._tone(392, 0.28, { type: 'triangle', vol: 0.1, slideTo: 262 });
    this._tone(196, 0.34, { type: 'sine', vol: 0.07, at: 0.1, slideTo: 160 });
  }

  tick() {
    this.init();
    this._tone(1500, 0.035, { type: 'square', vol: 0.03 });
  }

  swoosh() {
    this.init();
    this._noise(0.4, { vol: 0.05, freq: 700, q: 0.4 });
  }
}
