let _enabled = true;

function vibrate(pattern: number | number[]) {
  if (!_enabled) return;
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export const Haptic = {
  correct: () => vibrate(50),
  wrong: () => vibrate([100, 50, 100]),
  combo: () => vibrate([30, 30, 30, 30, 30]),
  achievement: () => vibrate(200),
  button: () => vibrate(10),
  tick: () => vibrate(15),
};

export function setHapticEnabled(enabled: boolean) {
  _enabled = enabled;
}

export function isHapticEnabled(): boolean {
  return _enabled;
}
