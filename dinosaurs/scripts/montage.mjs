// Tiles PNG stills into a contact sheet using Remotion's bundled ffmpeg.
// usage: node scripts/montage.mjs <inDir> <out.png> [cols=3] [tileWidth=640]
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [, , inDir, out, cols = '3', tw = '640'] = process.argv;
const files = fs.readdirSync(inDir).filter((f) => /^t.*\.png$/.test(f)).sort();
const tmp = path.join(inDir, '_seq');
fs.rmSync(tmp, {recursive: true, force: true});
fs.mkdirSync(tmp);
files.forEach((f, i) => fs.copyFileSync(path.join(inDir, f), path.join(tmp, `s${String(i).padStart(3, '0')}.png`)));
const rows = Math.ceil(files.length / Number(cols));
const th = Math.round((Number(tw) * 9) / 16);
// Needs a full ffmpeg build (Remotion's bundled one lacks pad/tile/drawtext): set FFMPEG=<path>.
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const labels = files.map((f) => f.replace(/^t0*/, '').replace(/\.png$/, '') + 's');
fs.writeFileSync(path.join(tmp, 'labels.txt'), labels.join('\n'));
const label = `drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='%{eif\\:n\\:d}':x=12:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6`;
execFileSync(
  ffmpeg,
  ['-y', '-loglevel', 'error', '-i', path.join(tmp, 's%03d.png'), '-vf', `scale=w=${tw}:h=${th}:flags=lanczos,${label},pad=w=${Number(tw) + 8}:h=${th + 8}:x=4:y=4:color=gray,tile=layout=${cols}x${rows}`, '-frames:v', '1', out],
  {stdio: 'inherit'}
);
console.log(labels.map((l, i) => `${i}=${l}`).join('  '));
console.log(files.join('  '));
