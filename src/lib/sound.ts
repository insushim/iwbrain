let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _volume = 0.7;
let _muted = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    masterGain = audioContext.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function getMasterGain(): GainNode {
  getAudioContext();
  return masterGain!;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gainValue: number = 0.3,
  delay: number = 0,
) {
  if (_muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + delay + duration,
  );

  osc.connect(gain);
  gain.connect(getMasterGain());

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.05);
}

export const SoundEffects = {
  correct: () => {
    playTone(523, 0.12, "sine", 0.3, 0);
    playTone(659, 0.15, "sine", 0.3, 0.08);
  },

  wrong: () => {
    playTone(200, 0.2, "square", 0.15, 0);
    playTone(180, 0.15, "square", 0.1, 0.1);
  },

  combo: (level: number) => {
    const baseFreq = 440 + level * 80;
    playTone(baseFreq, 0.08, "sine", 0.2, 0);
    playTone(baseFreq + 100, 0.1, "sine", 0.25, 0.05);
  },

  click: () => {
    playTone(800, 0.04, "sine", 0.1, 0);
  },

  gameStart: () => {
    playTone(523, 0.1, "sine", 0.25, 0);
    playTone(659, 0.1, "sine", 0.25, 0.12);
    playTone(784, 0.15, "sine", 0.3, 0.24);
  },

  gameOver: () => {
    playTone(784, 0.15, "sine", 0.2, 0);
    playTone(659, 0.15, "sine", 0.2, 0.15);
    playTone(523, 0.15, "sine", 0.2, 0.3);
    playTone(392, 0.25, "sine", 0.15, 0.45);
  },

  levelUp: () => {
    const ctx = getAudioContext();
    if (_muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(getMasterGain());
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  },

  tick: () => {
    playTone(1000, 0.03, "sine", 0.12, 0);
  },

  achievement: () => {
    playTone(523, 0.12, "sine", 0.3, 0);
    playTone(659, 0.12, "sine", 0.3, 0.1);
    playTone(784, 0.12, "sine", 0.3, 0.2);
    playTone(1047, 0.25, "sine", 0.35, 0.3);
  },

  hint: () => {
    playTone(880, 0.15, "sine", 0.15, 0);
    playTone(1100, 0.2, "sine", 0.1, 0.1);
  },

  dailyComplete: () => {
    playTone(523, 0.1, "sine", 0.3, 0);
    playTone(659, 0.1, "sine", 0.3, 0.1);
    playTone(784, 0.1, "sine", 0.3, 0.2);
    playTone(1047, 0.1, "sine", 0.3, 0.3);
    playTone(1319, 0.3, "sine", 0.35, 0.4);
  },
};

export function setVolume(vol: number) {
  _volume = Math.max(0, Math.min(1, vol));
  if (masterGain) {
    masterGain.gain.value = _volume;
  }
}

export function setMuted(muted: boolean) {
  _muted = muted;
}

export function getVolume(): number {
  return _volume;
}

export function isMuted(): boolean {
  return _muted;
}

export function initAudio() {
  getAudioContext();
}
