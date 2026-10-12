// Renders QA stills of the Main composition at given times (seconds) using one bundle.
// usage: node scripts/stills.mjs <outDir> 1.5 3.2 ...
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [, , outDir, ...times] = process.argv;
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Main'});
for (const s of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
  const output = path.join(outDir, `t${Number(s).toFixed(2).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, imageFormat: 'png', chromiumOptions: {gl: 'swangle'}});
  console.log('wrote', output);
}
