# Binly — "No photograph of a living T. rex" (Remotion project)

This is a deterministic, seek-safe React and SVG animation. Every frame is a pure function of `t = frame / 60`.

## Layout
```
src/
  Root.tsx           compositions: Main (1920x1080, 60 fps, length = narration) + Lab (asset test bench)
  Main.tsx           master timeline + audio tracks
  cues.ts            narration cue sheet (word onsets, seconds)
  theme.ts           colour tokens + fonts
  lib/anim.ts        easing, ramps, keyframes, log-space camera keys
  components/
    TRex.tsx         layered T. rex: ghost / skeleton / flesh / texture / colour / pose / gaze dials
    Iguanodon.tsx    19th-c. reconstruction: dashed guess / tinted / ink print draw-on / stone
    bones.tsx        Bone + Spine primitives
    People.tsx       naturalist (2-bone IK arm) + visitor silhouettes
    Environments.tsx museum hall, plinth, earth strata
    common.tsx       Cam (parallax camera), Tag (semantic chip), Stamp, Polaroid, LightPool, Headline
  scenes/
    S1Missing.tsx    0–8.6 s
    S2Museum.tsx     8.6–30.9 s (fossil → museum → reconstruction → photo → "uncomfortable")
    Timeline.tsx     29.1–32.6 s bridge
    S6Iguanodon.tsx  29.7 s–end (study → best guess → drawn/sculpted/displayed → closing)
public/audio/        narration_original.wav (byte-identical copy), music.wav, sfx.wav
scripts/
  transcribe.mjs     (whisper.cpp route — not usable on this CPU, kept for reference)
  analyze-audio.mjs  levels + pause detection from the original WAV
  make-audio.mjs     generates music.wav + sfx.wav (deterministic synthesis, ducked by the VO envelope)
  stills.mjs         renders QA stills at given seconds
  montage.mjs        contact sheet (needs a full ffmpeg build: set FFMPEG=path)
analysis/            transcript_words.json (word timestamps), vo_16k.wav (analysis copy only)
```

## Commands
```bash
npm install
npx remotion studio
node scripts/make-audio.mjs public/audio/narration_original.wav public/audio
npx remotion render Main ../binly_dinosaurs_final.mp4 --codec=h264 --audio-codec=aac --audio-bitrate=320k --crf=16 --pixel-format=yuv420p --image-format=png
```
