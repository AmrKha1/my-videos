// Reads the original WAV (read-only) and reports peak/RMS, plus pauses >= 200 ms.
// Also writes public/vo-envelope.json (10 ms RMS envelope) for optional audio-reactive use.
import fs from 'node:fs';

const file = process.argv[2];
const buf = fs.readFileSync(file);
let p = 12, fmt, data;
while (p < buf.length - 8) {
  const id = buf.toString('ascii', p, p + 4);
  const size = buf.readUInt32LE(p + 4);
  if (id === 'fmt ') fmt = {ch: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22)};
  if (id === 'data') data = buf.subarray(p + 8, p + 8 + size);
  p += 8 + size + (size % 2);
}
const n = data.length / 2 / fmt.ch;
const win = Math.round(fmt.sr * 0.01);
const env = [];
let peak = 0, sumSq = 0;
for (let i = 0; i < n; i += win) {
  let s = 0, c = 0;
  for (let j = i; j < Math.min(n, i + win); j++) {
    let v = 0;
    for (let k = 0; k < fmt.ch; k++) v += data.readInt16LE((j * fmt.ch + k) * 2) / 32768;
    v /= fmt.ch;
    s += v * v; c++;
    peak = Math.max(peak, Math.abs(v));
  }
  sumSq += s;
  env.push(Math.sqrt(s / c));
}
const db = (x) => (20 * Math.log10(x)).toFixed(1);
console.log(`format: ${fmt.ch}ch ${fmt.sr}Hz ${fmt.bits}bit, samples ${n}, duration ${(n / fmt.sr).toFixed(4)} s`);
console.log(`peak ${db(peak)} dBFS, overall RMS ${db(Math.sqrt(sumSq / n))} dBFS`);
const thr = 0.01; // ~ -40 dBFS
const pauses = [];
let start = null;
env.forEach((v, i) => {
  if (v < thr && start === null) start = i;
  if ((v >= thr || i === env.length - 1) && start !== null) {
    if (i - start >= 20) pauses.push(`${(start / 100).toFixed(2)}-${(i / 100).toFixed(2)}`);
    start = null;
  }
});
console.log('pauses >=200ms:', pauses.join('  '));
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(env.map((v) => +v.toFixed(4))));
