// Generates the original music bed and the SFX stem for the Binly T. rex / Iguanodon video.
// Pure, deterministic synthesis (seeded noise). The narration is only READ (for its timing
// envelope, used to duck the music) and is never modified.
//
// usage: node scripts/make-audio.mjs <narration.wav> <outDir>
import fs from 'node:fs';
import path from 'node:path';

const [, , voPath, outDir] = process.argv;
const SR = 44100;

// ---------------------------------------------------------------- WAV io
const readWav = (file) => {
  const b = fs.readFileSync(file);
  let p = 12, fmt, data;
  while (p < b.length - 8) {
    const id = b.toString('ascii', p, p + 4);
    const size = b.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = {ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12)};
    if (id === 'data') data = b.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size % 2);
  }
  const n = data.length / 2 / fmt.ch;
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let c = 0; c < fmt.ch; c++) v += data.readInt16LE((i * fmt.ch + c) * 2);
    mono[i] = v / fmt.ch / 32768;
  }
  return {n, mono, sr: fmt.sr};
};

const writeWav = (file, L, R) => {
  const n = L.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 4, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, b);
};

// ---------------------------------------------------------------- helpers
const mulberry = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const biquad = (type, f, q) => {
  const w = (2 * Math.PI * f) / SR;
  const a = Math.sin(w) / (2 * q);
  const c = Math.cos(w);
  let b0, b1, b2;
  if (type === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else if (type === 'hp') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  else [b0, b1, b2] = [a, 0, -a]; // band-pass
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
};

// Freeverb-style reverb (mono in -> stereo out)
const makeReverb = (room = 0.84, damp = 0.35) => {
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const mk = (spread) => {
    const combs = combT.map((d) => ({buf: new Float32Array(d + spread), i: 0, f: 0}));
    const aps = apT.map((d) => ({buf: new Float32Array(d + spread), i: 0}));
    return (x) => {
      let out = 0;
      for (const cb of combs) {
        const y = cb.buf[cb.i];
        cb.f = y * (1 - damp) + cb.f * damp;
        cb.buf[cb.i] = x + cb.f * room;
        cb.i = (cb.i + 1) % cb.buf.length;
        out += y;
      }
      for (const ap of aps) {
        const b = ap.buf[ap.i];
        ap.buf[ap.i] = out + b * 0.5;
        ap.i = (ap.i + 1) % ap.buf.length;
        out = b - out;
      }
      return out * 0.03;
    };
  };
  const l = mk(0), r = mk(23);
  return (x) => [l(x), r(x)];
};

// ---------------------------------------------------------------- narration envelope
const vo = readWav(voPath);
const N = vo.n;
const DUR = N / SR;
console.log(`narration: ${DUR.toFixed(4)} s, ${N} samples`);
const env = new Float32Array(N);
{
  // RMS follower, then attack/release smoothing
  let acc = 0;
  const win = Math.round(SR * 0.03);
  const sq = new Float32Array(N);
  for (let i = 0; i < N; i++) sq[i] = vo.mono[i] * vo.mono[i];
  for (let i = 0; i < N; i++) {
    acc += sq[i] - (i >= win ? sq[i - win] : 0);
    env[i] = Math.sqrt(Math.max(0, acc) / win);
  }
  let g = 0;
  const att = Math.exp(-1 / (SR * 0.08)), rel = Math.exp(-1 / (SR * 0.45));
  for (let i = 0; i < N; i++) {
    const target = Math.min(1, env[i] / 0.06);
    g = target > g ? att * g + (1 - att) * target : rel * g + (1 - rel) * target;
    env[i] = g;
  }
}

// ---------------------------------------------------------------- MUSIC
// [start s, notes (MIDI), brightness 0-1, level]
const CHORDS = [
  [0.0, [50, 57, 64, 65], 0.35, 0.9], // Dm(add9) — curiosity
  [8.6, [46, 53, 57, 62], 0.22, 0.8], // Bbmaj7 — into the dark / rock
  [12.6, [43, 50, 57, 58, 62], 0.4, 0.9], // Gm9 — rising
  [15.3, [45, 53, 57, 60, 64], 0.55, 1.0], // F/A — the museum
  [17.4, [41, 53, 57, 64, 67], 0.65, 1.1], // Fmaj9 — "standing there"
  [19.2, [50, 57, 60, 64, 65], 0.55, 1.0], // Dm9 — the build-up
  [21.0, [46, 53, 57, 60, 62], 0.6, 1.05], // Bbmaj9
  [22.8, [41, 53, 57, 60, 65], 0.62, 1.05], // F
  [24.4, [40, 52, 55, 60, 67], 0.66, 1.1], // C/E
  [26.4, [38, 51, 57, 62], 0.15, 0.75], // D + Eb tension — "uncomfortable"
  [30.2, [50, 57, 62, 65], 0.35, 0.85], // Dm — 19th-century study
  [33.1, [43, 55, 58, 62], 0.38, 0.85], // Gm/D
  [36.6, [45, 52, 55, 61], 0.4, 0.85], // A7sus-ish — the strange bone
  [39.2, [50, 57, 62, 65], 0.35, 0.8], // Dm — couldn't place it
  [41.7, [46, 53, 58, 62], 0.45, 0.9], // Bb — best guess
  [43.4, [48, 55, 60, 64], 0.5, 0.95], // C
  [44.9, [50, 57, 62, 65, 69], 0.55, 1.0], // Dm — horn lands
  [46.7, [41, 53, 57, 60], 0.55, 1.0], // F — for years
  [48.6, [40, 52, 55, 60], 0.58, 1.0], // C/E
  [50.2, [38, 53, 57, 62], 0.6, 1.05], // Dm
  [51.2, [46, 53, 57, 62], 0.6, 1.05], // Bb
  [52.1, [43, 55, 58, 62, 65], 0.45, 0.95], // Gm9 — it wasn't stupidity
  [53.3, [46, 53, 57, 60, 64], 0.5, 1.0], // Bbmaj9
  [54.9, [50, 57, 62, 64, 65], 0.45, 1.05], // Dm(add9) — resolve
];

// sparse melodic plucks (music box / felt piano), [time, midi, vel]
const PLUCKS = [];
const motif = [69, 65, 64, 62, 64, 65, 62, 57];
const addRun = (from, to, step, transp, vel, notes = motif) => {
  let k = 0;
  for (let tt = from; tt < to; tt += step * (k % 3 === 2 ? 1.5 : 1)) {
    PLUCKS.push([tt, notes[k % notes.length] + transp, vel]);
    k++;
  }
};
addRun(0.4, 8.2, 1.15, 0, 0.55);
addRun(15.4, 19.0, 0.9, 12, 0.35, [69, 72, 76, 74, 72, 69]);
addRun(30.5, 41.4, 0.82, 12, 0.42, [62, 65, 69, 67, 65, 64, 62, 57]);
addRun(46.8, 51.9, 0.75, 12, 0.35, [65, 69, 72, 69, 67, 64]);
PLUCKS.push([53.3, 74, 0.45], [54.0, 72, 0.4], [55.04, 69, 0.45], [55.62, 74, 0.5]);
PLUCKS.push([28.42, 63, 0.4]); // the "?" — a single dissonant note
PLUCKS.push([44.9, 74, 0.6], [44.9, 62, 0.5]); // the horn lands

// soft bass pulse in the build-up and the "years" passage
const PULSES = [];
const rootAt = (tt) => {
  let r = CHORDS[0][1][0];
  for (const c of CHORDS) if (c[0] <= tt) r = c[1][0];
  return r;
};
for (let tt = 19.3; tt < 25.5; tt += 0.75) PULSES.push([tt, rootAt(tt) - 12 + (rootAt(tt) < 45 ? 12 : 0)]);
for (let tt = 47.0; tt < 52.0; tt += 0.75) PULSES.push([tt, rootAt(tt) - 12 + (rootAt(tt) < 45 ? 12 : 0)]);

const music = () => {
  const L = new Float32Array(N), R = new Float32Array(N);
  const dry = new Float32Array(N); // mono pad/pluck bus before reverb
  const padL = new Float32Array(N), padR = new Float32Array(N);
  const XF = 1.4; // chord crossfade seconds

  // pad: each chord is a voice group with its own fade in/out
  CHORDS.forEach((ch, ci) => {
    const start = ch[0];
    const end = ci + 1 < CHORDS.length ? CHORDS[ci + 1][0] : DUR + 2;
    const i0 = Math.max(0, Math.floor((start - XF) * SR));
    const i1 = Math.min(N, Math.ceil((end + XF) * SR));
    const bright = ch[2];
    const lvl = ch[3];
    ch[1].forEach((m, ni) => {
      const det = [-0.07, 0.0, 0.08];
      const phases = det.map(() => 0);
      const f = mtof(m);
      const pan = ((ni % 3) - 1) * 0.35;
      for (let i = i0; i < i1; i++) {
        const tt = i / SR;
        const a = smooth((tt - (start - XF)) / XF) * (1 - smooth((tt - end) / XF));
        if (a <= 0) continue;
        let s = 0;
        for (let d = 0; d < 3; d++) {
          const fd = f * Math.pow(2, det[d] / 12) * (1 + 0.0015 * Math.sin(tt * (0.3 + d * 0.11)));
          phases[d] += fd / SR;
          const ph = phases[d] * 2 * Math.PI;
          s += Math.sin(ph) + 0.32 * Math.sin(2 * ph) + 0.14 * Math.sin(3 * ph) + 0.06 * Math.sin(4 * ph);
        }
        // slow breathing swell
        const breath = 0.85 + 0.15 * Math.sin(tt * 0.9 + ni);
        // brightness: darker sections lean on the fundamental, brighter ones keep upper notes forward
        const v = (s / 3) * a * lvl * breath * (m < 48 ? 0.8 : 0.4 + bright * 0.3) * 0.05;
        padL[i] += v * (1 - pan);
        padR[i] += v * (1 + pan);
      }
    });
  });
  const lpL = biquad('lp', 1900, 0.5), lpR = biquad('lp', 1900, 0.5);
  const hpL = biquad('hp', 60, 0.7), hpR = biquad('hp', 60, 0.7);
  for (let i = 0; i < N; i++) {
    padL[i] = hpL(lpL(padL[i]));
    padR[i] = hpR(lpR(padR[i]));
  }

  // plucks / bells
  for (const [t0, m, vel] of PLUCKS) {
    const f = mtof(m);
    const i0 = Math.floor(t0 * SR);
    const len = Math.floor(2.6 * SR);
    for (let k = 0; k < len && i0 + k < N; k++) {
      const tt = k / SR;
      const atk = Math.min(1, tt / 0.004);
      const ph = 2 * Math.PI * f * tt;
      const s =
        Math.sin(ph) * Math.exp(-tt * 2.2) +
        0.35 * Math.sin(2 * ph) * Math.exp(-tt * 4) +
        0.12 * Math.sin(3.01 * ph) * Math.exp(-tt * 7) +
        0.05 * Math.sin(5.4 * ph) * Math.exp(-tt * 12);
      dry[i0 + k] += s * atk * vel * 0.045;
    }
  }
  // bass pulses
  for (const [t0, m] of PULSES) {
    const f = mtof(m);
    const i0 = Math.floor(t0 * SR);
    for (let k = 0; k < SR * 0.9 && i0 + k < N; k++) {
      const tt = k / SR;
      const s = Math.sin(2 * Math.PI * f * tt) * Math.min(1, tt / 0.012) * Math.exp(-tt * 4.5);
      dry[i0 + k] += s * 0.055;
    }
  }

  // reverb
  const rev = makeReverb(0.86, 0.4);
  for (let i = 0; i < N; i++) {
    const mono = dry[i] + (padL[i] + padR[i]) * 0.35;
    const [wl, wr] = rev(mono);
    L[i] = padL[i] + dry[i] * 0.9 + wl * 0.9;
    R[i] = padR[i] + dry[i] * 0.9 + wr * 0.9;
  }

  // ducking under narration (music only), fades at both ends
  for (let i = 0; i < N; i++) {
    const tt = i / SR;
    const duck = 1 - 0.42 * env[i];
    const fade = smooth(tt / 1.2) * (1 - smooth((tt - (DUR - 1.6)) / 1.6));
    L[i] *= duck * fade;
    R[i] *= duck * fade;
  }
  return [L, R];
};

// ---------------------------------------------------------------- SFX
const sfx = () => {
  const L = new Float32Array(N), R = new Float32Array(N);
  const rnd = mulberry(1234);
  const add = (t0, len, fn, pan = 0, gain = 1) => {
    const i0 = Math.floor(t0 * SR);
    for (let k = 0; k < len * SR && i0 + k < N; k++) {
      const v = fn(k / SR) * gain;
      L[i0 + k] += v * (1 - pan * 0.6);
      R[i0 + k] += v * (1 + pan * 0.6);
    }
  };
  const noiseHit = (dur, lpHz, decay, gain, shape = (x) => Math.exp(-x * decay)) => {
    const f = biquad('lp', lpHz, 0.7);
    return (tt) => (tt < dur ? f(rnd() * 2 - 1) * shape(tt) * gain : 0);
  };
  const thump = (f0, f1, decay, gain) => {
    let ph = 0;
    return (tt) => {
      const f = f1 + (f0 - f1) * Math.exp(-tt * 18);
      ph += f / SR;
      return Math.sin(2 * Math.PI * ph) * Math.min(1, tt / 0.003) * Math.exp(-tt * decay) * gain;
    };
  };
  const whoosh = (dur, from, to, gain) => {
    let f = biquad('bp', from, 0.8);
    let lastHz = from;
    return (tt) => {
      const k = tt / dur;
      const hz = from + (to - from) * k;
      if (Math.abs(hz - lastHz) > 40) {
        f = biquad('bp', hz, 0.8);
        lastHz = hz;
      }
      return f(rnd() * 2 - 1) * Math.sin(Math.PI * Math.min(1, k)) ** 2 * gain;
    };
  };

  // "NO PHOTOGRAPH" stamp
  add(3.06, 0.5, thump(110, 52, 14, 0.22));
  add(3.06, 0.2, noiseHit(0.2, 1800, 30, 0.12));
  // evidence cards arriving (only twice — restraint)
  add(3.9, 0.45, whoosh(0.4, 2600, 1800, 0.05), 0.4);
  add(6.18, 0.45, whoosh(0.4, 2400, 1700, 0.04), 0.5);
  // dive into the photograph
  add(7.95, 0.75, whoosh(0.7, 300, 1400, 0.07));
  // soft tissue crumbling away
  add(10.1, 1.2, noiseHit(1.2, 900, 2.5, 0.035, (x) => Math.sin(Math.PI * Math.min(1, x / 1.2)) ** 2), -0.3);
  // sediment settling / rock
  add(10.95, 1.6, noiseHit(1.6, 140, 1.8, 0.26, (x) => Math.min(1, x / 0.15) * Math.exp(-x * 1.8)));
  // rising up through the earth
  add(12.6, 2.6, whoosh(2.6, 200, 900, 0.05));
  // camera shutter (two soft clicks)
  add(25.5, 0.05, noiseHit(0.03, 3200, 120, 0.12));
  add(25.56, 0.08, noiseHit(0.05, 2400, 80, 0.1));
  add(25.52, 0.4, thump(220, 140, 22, 0.05));
  // lights dim — low swell
  add(26.4, 1.6, thump(70, 55, 2.2, 0.12));
  // back in time
  add(29.3, 1.1, whoosh(1.1, 1500, 400, 0.05));
  // spike picked up: small bone clack
  add(38.25, 0.12, thump(950, 700, 50, 0.06), 0.2);
  add(38.27, 0.06, noiseHit(0.05, 4000, 90, 0.05), 0.2);
  // spike lands as a horn
  add(44.88, 0.4, thump(240, 150, 24, 0.14), 0.3);
  add(44.88, 0.08, noiseHit(0.06, 2500, 60, 0.08), 0.3);
  // chisel taps (sculpted)
  [50.0, 50.28, 50.52].forEach((tt, i) =>
    add(tt, 0.25, (x) => (Math.sin(2 * Math.PI * 2650 * x) * 0.6 + Math.sin(2 * Math.PI * 4130 * x) * 0.4) * Math.exp(-x * 30) * (0.045 - i * 0.008), 0.4)
  );
  // lights up / years passing
  add(46.7, 1.4, whoosh(1.4, 600, 1600, 0.035));
  return [L, R];
};

const [mL, mR] = music();
const [sL, sR] = sfx();

// Stem gain staging (the narration itself is never touched):
//  music ~20 dB under the voice while it speaks; SFX peaks ~22 dB under the voice peak.
const gainTo = (arrs, measured, target) => {
  const g = Math.pow(10, (target - measured) / 20);
  for (const a of arrs) for (let i = 0; i < a.length; i++) a[i] *= g;
};
{
  const sp = (i) => env[i] > 0.5;
  let s = 0, c = 0, vs = 0;
  for (let i = 0; i < N; i++) if (sp(i)) { s += mL[i] * mL[i]; vs += vo.mono[i] * vo.mono[i]; c++; }
  const musDb = 20 * Math.log10(Math.sqrt(s / c));
  const voDb = 20 * Math.log10(Math.sqrt(vs / c));
  gainTo([mL, mR], musDb, voDb - 20);
  let p = 0, vp = 0;
  for (let i = 0; i < N; i++) { p = Math.max(p, Math.abs(sL[i]), Math.abs(sR[i])); vp = Math.max(vp, Math.abs(vo.mono[i])); }
  gainTo([sL, sR], 20 * Math.log10(p), 20 * Math.log10(vp) - 22);
}

// levels report (narration-active regions)
const rms = (a, mask) => {
  let s = 0, c = 0;
  for (let i = 0; i < a.length; i++) if (mask(i)) { s += a[i] * a[i]; c++; }
  return 20 * Math.log10(Math.sqrt(s / Math.max(1, c)) + 1e-12);
};
const peak = (a) => 20 * Math.log10(a.reduce((m, v) => Math.max(m, Math.abs(v)), 0) + 1e-12);
const speech = (i) => env[i] > 0.5;
const quiet = (i) => env[i] < 0.1;
console.log(`VO   rms(speech) ${rms(vo.mono, speech).toFixed(1)} dBFS  peak ${peak(vo.mono).toFixed(1)}`);
console.log(`MUS  rms(speech) ${rms(mL, speech).toFixed(1)}  rms(pauses) ${rms(mL, quiet).toFixed(1)}  peak ${peak(mL).toFixed(1)}`);
console.log(`SFX  peak ${peak(sL).toFixed(1)} / ${peak(sR).toFixed(1)} dBFS`);

fs.mkdirSync(outDir, {recursive: true});
writeWav(path.join(outDir, 'music.wav'), mL, mR);
writeWav(path.join(outDir, 'sfx.wav'), sL, sR);
console.log('wrote music.wav, sfx.wav');
