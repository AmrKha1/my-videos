// Installs whisper.cpp + model into a local cache folder and produces word-level timestamps
// for the narration. Output: analysis/transcript.json (used only for timing — never alters the VO).
import path from 'node:path';
import fs from 'node:fs';
import {installWhisperCpp, downloadWhisperModel, transcribe, toCaptions} from '@remotion/install-whisper-cpp';

const whisperPath = path.resolve(process.argv[2] ?? 'whisper.cpp');
const model = 'medium.en';
await installWhisperCpp({to: whisperPath, version: '1.5.5'});
await downloadWhisperModel({model, folder: whisperPath});
const out = await transcribe({
  inputPath: path.resolve('analysis/vo_16k.wav'),
  whisperPath,
  whisperCppVersion: '1.5.5',
  model,
  tokenLevelTimestamps: true,
  splitOnWord: true,
});
const {captions} = toCaptions({whisperCppOutput: out});
fs.writeFileSync('analysis/transcript.json', JSON.stringify(captions, null, 1));
fs.writeFileSync('analysis/transcript.txt', captions.map((c) => c.text).join(''));
console.log(captions.map((c) => c.text).join(''));
