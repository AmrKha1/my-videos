import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS} from './theme';
import {ramp, ease} from './lib/anim';
import {S1Missing} from './scenes/S1Missing';
import {S2Museum} from './scenes/S2Museum';
import {S6Iguanodon} from './scenes/S6Iguanodon';
import {Timeline} from './scenes/Timeline';

// Master timeline. All visuals are pure functions of t = frame / fps (seek-safe).
//  0.0 - 8.6   S1 the missing photograph
//  8.6 - 30.9  S2-S5 fossil -> museum -> reconstruction -> photo -> "uncomfortable"
// 29.1 - 32.6  timeline bridge (overlay)
// 30.2 - end   S6-S9 19th-century study -> best guess -> drawn/sculpted/displayed -> the point

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const museumFade = 1 - ramp(t, 29.75, 30.5, ease.inOutSine);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      {t >= 29.7 && <S6Iguanodon t={t} />}
      {t < 8.6 && <S1Missing t={t} />}
      {t >= 8.6 && t < 30.9 && (
        <AbsoluteFill style={{opacity: museumFade}}>
          <S2Museum t={t} />
        </AbsoluteFill>
      )}
      {t >= 29.1 && t < 32.6 && <Timeline t={t} />}

      {/* Audio: original narration untouched (volume 1); music + SFX are separate generated stems. */}
      <Audio src={staticFile('audio/narration_original.wav')} />
      <Audio src={staticFile('audio/music.wav')} />
      <Audio src={staticFile('audio/sfx.wav')} />
    </AbsoluteFill>
  );
};
