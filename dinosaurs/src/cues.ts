// Narration cue sheet (seconds). Word onsets come from analysis/transcript_words.json
// (Whisper small.en word timestamps), cross-checked against pauses measured from the
// waveform with scripts/analyze-audio.mjs. The voiceover is the master clock.

export const VO_DURATION = 56.3548;

export const Q = {
  // S1 — the missing photograph
  noPhoto: 0.0,
  existed: 3.14,
  noWitness: 3.98,
  noMuscle: 4.84,
  noSkin: 6.24,
  noColor: 7.54,
  // S2 — soft tissue gone, rock remains
  softTissue: 8.6,
  gone: 10.14,
  whatsLeft: 10.86,
  rock: 11.88,
  // S3 — pivot: "And yet" → museum
  andYet: 12.56,
  walkInto: 13.22,
  museum: 15.38,
  findTrex: 17.4,
  // S4 — the reconstruction builds up
  fleshed: 19.26,
  textured: 20.28,
  colored: 21.14,
  midStride: 22.0,
  lookingBack: 23.14,
  someone: 24.06,
  photograph: 25.56,
  // S5 — pivot: "Here's the uncomfortable part"
  uncomfortable: 26.46,
  wrong: 28.42,
  before: 29.24,
  // S6 — 19th century, Iguanodon
  century: 30.18,
  scientists: 31.74,
  firstDinos: 33.12,
  reconstructed: 34.44,
  iguanodon: 35.72,
  strange: 37.1,
  spike: 38.0,
  amongFossils: 39.22,
  couldntPlace: 40.38,
  // S7 — pivot: "Their best guess"
  bestGuess: 41.7,
  face: 44.14,
  horn: 44.9,
  nose: 46.06,
  // S8 — for years
  forYears: 46.72,
  drawn: 49.4,
  sculpted: 50.2,
  displayed: 50.94,
  publicW: 51.6,
  // S9 — the point
  stupidity: 52.08,
  bestPossible: 53.24,
  reading: 54.44,
  incomplete: 55.04,
  evidence: 55.62,
};
