// Post-render QA. usage: FFMPEG=... FFPROBE=... node scripts/qa.mjs <video.mp4> <narration.wav> <qaDir>
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

const [, , video, vo, qaDir] = process.argv;
const FF = process.env.FFMPEG, FP = process.env.FFPROBE;
fs.mkdirSync(qaDir, {recursive: true});
const run = (bin, args) => execFileSync(bin, args, {maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe']});
// ffmpeg writes filter results to stderr
const ffLog = (args) => spawnSync(FF, ['-hide_banner', '-nostats', ...args], {encoding: 'utf8', maxBuffer: 1 << 30}).stderr;

const report = [];
const log = (s) => {
  console.log(s);
  report.push(s);
};

// 1. container / streams
const probe = JSON.parse(run(FP, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', video]).toString());
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
log(`file: ${path.basename(video)}  size ${(probe.format.size / 1e6).toFixed(1)} MB  container ${probe.format.format_name}  duration ${(+probe.format.duration).toFixed(3)} s`);
log(`video: ${v.codec_name} (${v.profile}) ${v.width}x${v.height} ${v.pix_fmt}  r_frame_rate ${v.r_frame_rate}  avg_frame_rate ${v.avg_frame_rate}  frames ${v.nb_read_frames}  duration ${(+v.duration).toFixed(3)} s  bitrate ${(v.bit_rate / 1e6).toFixed(1)} Mb/s`);
log(`audio: ${a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch ${(a.bit_rate / 1000).toFixed(0)} kb/s duration ${(+a.duration).toFixed(3)} s` : 'MISSING'}`);
const voProbe = JSON.parse(run(FP, ['-v', 'error', '-show_streams', '-of', 'json', vo]).toString()).streams[0];
log(`narration source: ${(+voProbe.duration).toFixed(4)} s`);

// 2. constant frame rate check (all pts deltas equal)
const pts = run(FP, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', video])
  .toString()
  .trim()
  .split(/\r?\n/)
  .map(Number);
const deltas = new Set();
for (let i = 1; i < pts.length; i++) deltas.add((pts[i] - pts[i - 1]).toFixed(4));
log(`frame interval set: ${[...deltas].join(', ')}  (constant 60 fps => 0.0167)`);

// 3. freeze / black detection
const fr = ffLog(['-i', video, '-vf', 'freezedetect=n=0.0005:d=1.2', '-map', '0:v', '-f', 'null', '-']);
const freezes = [...fr.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g)].map((m) => `${(+m[1]).toFixed(2)}s (+${(+m[2]).toFixed(2)}s)`);
log(`freezedetect (>=1.2 s near-identical frames): ${freezes.length ? freezes.join(', ') : 'none'}`);
const bl = ffLog(['-i', video, '-vf', 'blackdetect=d=0.1:pix_th=0.05', '-map', '0:v', '-f', 'null', '-']);
const blacks = [...bl.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => `${m[1]}-${m[2]}`);
log(`blackdetect: ${blacks.length ? blacks.join(', ') : 'none'}`);

// 4. loudness (final mix vs narration alone)
const lufs = (file) => {
  const out = ffLog(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const I = out.match(/I:\s+(-?[\d.]+) LUFS/g);
  const tp = out.match(/Peak:\s+(-?[\d.]+) dBFS/g);
  return `${I ? I[I.length - 1] : '?'}  true-peak ${tp ? tp[tp.length - 1] : '?'}`;
};
log(`loudness final mix: ${lufs(video)}`);
log(`loudness narration only: ${lufs(vo)}`);

// 5. narration alignment: cross-correlate decoded final audio with the source narration
const pcm = (file) => {
  const buf = run(FF, ['-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-']);
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};
const A = pcm(video), B = pcm(vo);
let best = -Infinity, bestLag = 0;
for (let lag = -400; lag <= 400; lag += 1) {
  let s = 0;
  for (let i = 4000; i < Math.min(A.length, B.length) - 4000; i += 3) s += A[i + lag] * B[i];
  if (s > best) {
    best = s;
    bestLag = lag;
  }
}
let num = 0, da = 0, db = 0;
for (let i = 0; i < Math.min(A.length, B.length); i++) {
  num += A[i] * B[i];
  da += A[i] * A[i];
  db += B[i] * B[i];
}
log(`narration alignment: best lag ${bestLag} samples @8 kHz = ${((bestLag / 8000) * 1000).toFixed(2)} ms; correlation at lag 0 = ${(num / Math.sqrt(da * db)).toFixed(4)}`);
log(`decoded audio lengths: final ${(A.length / 8000).toFixed(3)} s, narration ${(B.length / 8000).toFixed(3)} s`);

// 6. contact sheet (every 2 s) + full-res frames at key moments
spawnSync(FF, ['-v', 'error', '-y', '-i', video, '-vf', "fps=1/2,scale=384:-1,drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='%{pts\\:hms}':x=8:y=8:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x5:padding=6:color=gray", '-frames:v', '1', path.join(qaDir, 'contact_sheet_every_2s.png')]);
const keyTimes = [0.05, 3.5, 8.45, 8.7, 11.9, 14.0, 17.8, 22.9, 24.8, 25.6, 28.6, 30.0, 30.8, 38.8, 41.0, 44.95, 48.2, 50.6, 51.6, 55.8, 56.33];
for (const k of keyTimes) {
  spawnSync(FF, ['-v', 'error', '-y', '-ss', String(k), '-i', video, '-frames:v', '1', path.join(qaDir, `frame_${k.toFixed(2).padStart(5, '0')}s.png`)]);
}
// transitions strip: 8 frames across each transition
const trans = [[8.3, 8.9], [12.4, 15.4], [24.0, 26.0], [29.2, 31.0], [46.6, 49.0], [52.0, 54.0]];
trans.forEach(([s, e], i) => {
  spawnSync(FF, ['-v', 'error', '-y', '-ss', String(s), '-t', String(e - s), '-i', video, '-vf', `fps=${8 / (e - s)},scale=384:-1,tile=8x1:padding=4:color=gray`, '-frames:v', '1', path.join(qaDir, `transition_${i + 1}_${s}-${e}s.png`)]);
});
// waveform image of the final mix
spawnSync(FF, ['-v', 'error', '-y', '-i', video, '-filter_complex', 'showwavespic=s=1920x300:split_channels=1:colors=0x2B2420|0x8B2E1F', '-frames:v', '1', path.join(qaDir, 'final_mix_waveform.png')]);

fs.writeFileSync(path.join(qaDir, 'qa_measurements.txt'), report.join('\n') + '\n');
