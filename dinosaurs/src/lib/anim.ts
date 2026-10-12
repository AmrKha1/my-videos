// Deterministic animation helpers. Everything is a pure function of time (seconds),
// so any frame can be rendered in isolation (seek-safe).

export type EaseFn = (x: number) => number;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const ease = {
  linear: (x: number) => x,
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  in: (x: number) => x * x * x,
  outQuint: (x: number) => 1 - Math.pow(1 - x, 5),
  inOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
  // gentle settle — ~4% overshoot, used sparingly for objects that "land"
  outBack: (x: number) => {
    const c1 = 1.2;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
} satisfies Record<string, EaseFn>;

/** 0 → 1 between a and b (seconds), eased and clamped. */
export const ramp = (t: number, a: number, b: number, fn: EaseFn = ease.inOut) =>
  fn(clamp01((t - a) / (b - a)));

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Piecewise keyframes [[time, value], ...] with easing between each pair. */
export const keys = (t: number, kf: [number, number][], fn: EaseFn = ease.inOut) => {
  if (t <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [t0, v0] = kf[i];
    const [t1, v1] = kf[i + 1];
    if (t <= t1) return lerp(v0, v1, fn(clamp01((t - t0) / (t1 - t0))));
  }
  return kf[kf.length - 1][1];
};

/** Visibility window: fades in over `fi` s from a, out over `fo` s ending at b. */
export const win = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) =>
  Math.min(ramp(t, a, a + fi, ease.inOutSine), 1 - ramp(t, b - fo, b, ease.inOutSine));

/** Smooth, deterministic "breathing" offset (no randomness). */
export const drift = (t: number, period: number, amp: number, phase = 0) =>
  Math.sin((t / period) * Math.PI * 2 + phase) * amp;

/** Camera keyframes [time, cx, cy, z, rot?]. Zoom is interpolated in log space. */
export type CamKey = [number, number, number, number, number?];
export const camAt = (t: number, kf: CamKey[], fn: EaseFn = ease.inOut) => {
  const at = (k: CamKey) => ({cx: k[1], cy: k[2], z: k[3], r: k[4] ?? 0});
  if (t <= kf[0][0]) return at(kf[0]);
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i];
    const b = kf[i + 1];
    if (t <= b[0]) {
      const k = fn(clamp01((t - a[0]) / (b[0] - a[0])));
      return {
        cx: lerp(a[1], b[1], k),
        cy: lerp(a[2], b[2], k),
        z: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k)),
        r: lerp(a[4] ?? 0, b[4] ?? 0, k),
      };
    }
  }
  return at(kf[kf.length - 1]);
};

export const mixHex =(a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp01(k)));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};
