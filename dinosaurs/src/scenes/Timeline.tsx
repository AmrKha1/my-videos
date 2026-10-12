import React from 'react';
import {C, FONT_SERIF} from '../theme';
import {Q} from '../cues';
import {ease, ramp} from '../lib/anim';
import {Stage} from '../components/common';

// 29.1 - 32.6 s  Screen-space bridge: the camera "pans back in time" along a ruler
// and lands on the 19th century (spoken at 30.18-31.3).
export const Timeline: React.FC<{t: number}> = ({t}) => {
  const vis = Math.min(ramp(t, 29.1, 29.6), 1 - ramp(t, 31.9, 32.6, ease.inOutSine));
  if (vis <= 0) return null;
  const travel = ease.inOut(ramp(t, Q.before + 0.05, 30.4, ease.linear)) * 2600;
  const label = ramp(t, Q.century - 0.1, Q.century + 0.55, ease.linear);
  const y = 960;
  return (
    <Stage>
      <g opacity={vis}>
        <line x1={0} x2={1920} y1={y} y2={y} stroke={C.paper} strokeWidth={3} opacity={0.5} />
        {Array.from({length: 70}).map((_, i) => {
          const x = ((i * 60 + travel) % 4200) - 600;
          const major = i % 5 === 0;
          return <line key={i} x1={x} x2={x} y1={y} y2={y - (major ? 34 : 16)} stroke={C.paper} strokeWidth={major ? 4 : 2.5} opacity={major ? 0.6 : 0.35} />;
        })}
        {label > 0 && (
          <g opacity={ease.out(label)}>
            <circle cx={760} cy={y} r={12 * ease.outBack(Math.min(1, label * 1.3))} fill={C.paper} />
            <line x1={760} x2={760} y1={y - 12} y2={y - 64 * ease.out(label)} stroke={C.paper} strokeWidth={4} />
            <text x={790} y={y - 34 + (1 - ease.out(label)) * 14} fontFamily={FONT_SERIF} fontWeight={600} fontSize={58} fill={C.paper}>
              19th century
            </text>
          </g>
        )}
      </g>
    </Stage>
  );
};
