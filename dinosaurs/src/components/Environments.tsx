import React from 'react';
import {C, FONT_SANS} from '../theme';
import {ease, ramp} from '../lib/anim';

// Deterministic pseudo-random (no Math.random) so every frame renders identically.
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const STRATA_TOP = 90;
const BANDS = [110, 150, 190, 230, 280, 360, 900];

/** Earth cross-section below the museum floor. `reveal(i)` 0-1 per band (sediment wipes in). */
export const Strata: React.FC<{reveal: (i: number) => number}> = ({reveal}) => {
  let y = STRATA_TOP;
  return (
    <g>
      {BANDS.map((h, i) => {
        const top = y;
        y += h;
        const r = reveal(i);
        if (r <= 0) return null;
        const x0 = -900;
        const w = 3800;
        const edge = i % 2 === 0 ? x0 : x0 + w * (1 - r);
        return (
          <g key={i}>
            <clipPath id={`band${i}`}>
              <rect x={edge} y={top - 30} width={w * r} height={h + 60} />
            </clipPath>
            <g clipPath={`url(#band${i})`}>
              {/* gently wavy layer boundary */}
              <path
                d={`M${x0} ${top + 8} ${Array.from({length: 20})
                  .map((_, k) => `Q${x0 + k * 190 + 95} ${top + (hash(i * 31 + k) - 0.5) * 22} ${x0 + (k + 1) * 190} ${top + 8 + (hash(i * 17 + k) - 0.5) * 10}`)
                  .join(' ')} L${x0 + w} ${top + h + 40} L${x0} ${top + h + 40} Z`}
                fill={C.strata[i]}
              />
              {Array.from({length: 26}).map((_, k) => {
                const px = x0 + hash(i * 97 + k) * w;
                const py = top + 24 + hash(i * 53 + k * 7) * (h - 40);
                const s = 6 + hash(k * 13 + i) * 16;
                return (
                  <ellipse
                    key={k}
                    cx={px}
                    cy={py}
                    rx={s * 1.5}
                    ry={s}
                    transform={`rotate(${(hash(k + i * 3) - 0.5) * 40} ${px} ${py})`}
                    fill={i < 3 ? C.strata[i + 1] : C.strata[i - 1]}
                    opacity={0.55}
                  />
                );
              })}
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** Museum hall in world coords. Floor plane -60..0, section cut at y = 0. */
export const MuseumHall: React.FC<{spot: number}> = ({spot}) => {
  const windows = [300, 960, 1620];
  const columns = [-30, 630, 1290, 1950];
  return (
    <g>
      <rect x={-900} y={-1500} width={3800} height={1440} fill={C.paper} />
      {/* ceiling band */}
      <rect x={-900} y={-1500} width={3800} height={170} fill={C.paperDeep} />
      <rect x={-900} y={-1340} width={3800} height={24} fill={C.paperShade} />
      {/* windows */}
      {windows.map((x) => (
        <g key={x}>
          <path d={`M${x - 160} -660 L${x - 160} -1020 A160 160 0 0 1 ${x + 160} -1020 L${x + 160} -660 Z`} fill={C.paperDeep} />
          <path d={`M${x - 136} -684 L${x - 136} -1020 A136 136 0 0 1 ${x + 136} -1020 L${x + 136} -684 Z`} fill={C.paperLight} />
          <g stroke={C.paperDeep} strokeWidth={10}>
            <line x1={x} y1={-1156} x2={x} y2={-684} />
            <line x1={x - 136} y1={-900} x2={x + 136} y2={-900} />
            <line x1={x - 136} y1={-790} x2={x + 136} y2={-790} />
          </g>
          <rect x={x - 180} y={-670} width={360} height={22} rx={4} fill={C.paperShade} />
        </g>
      ))}
      {/* light shafts (flat, low opacity) */}
      {windows.map((x) => (
        <path
          key={`s${x}`}
          d={`M${x - 136} -900 L${x + 136} -1000 L${x + 136 + 560} -60 L${x - 136 + 480} -60 Z`}
          fill={C.paperLight}
          opacity={0.42}
        />
      ))}
      {/* columns (lit from the left) */}
      {columns.map((x) => (
        <g key={`c${x}`}>
          <rect x={x - 55} y={-1316} width={110} height={1256} fill={C.paperShade} />
          <rect x={x + 22} y={-1316} width={33} height={1256} fill={C.paperDeep} />
          <rect x={x - 75} y={-1316} width={150} height={44} fill={C.paperDeep} />
          <rect x={x - 75} y={-112} width={150} height={52} fill={C.paperDeep} />
        </g>
      ))}
      {/* skirting + floor plane */}
      <rect x={-900} y={-84} width={3800} height={24} fill={C.paperDeep} />
      <rect x={-900} y={-60} width={3800} height={60} fill={C.paperShade} />
      {/* spotlight on the exhibit */}
      <g opacity={spot}>
        <path d="M760 -1330 L1160 -1330 L1620 -60 L300 -60 Z" fill={C.paperLight} opacity={0.35} />
      </g>
      {/* section cut: floor slab */}
      <rect x={-900} y={0} width={3800} height={STRATA_TOP} fill={C.paperDeep} />
      <rect x={-900} y={-4} width={3800} height={10} fill={C.ink} />
    </g>
  );
};

export const Plinth: React.FC<{x: number; w: number; label: string; labelP: number}> = ({x, w, label, labelP}) => (
  <g>
    <rect x={x - w / 2 + 16} y={-150 + 16} width={w} height={110} fill={C.ink} opacity={0.12} />
    <rect x={x - w / 2} y={-150} width={w} height={112} rx={4} fill={C.ink} />
    <rect x={x - w / 2} y={-150} width={w} height={14} rx={4} fill={C.inkLift} />
    <g opacity={ease.out(labelP)}>
      <rect x={x - 250} y={-118} width={500} height={52} rx={4} fill={C.paperShade} />
      <text x={x} y={-83} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={24} letterSpacing={5} fill={C.ink}>
        {label}
      </text>
    </g>
  </g>
);

export const sedimentReveal = (t: number, start: number) => (i: number) => ramp(t, start + (6 - i) * 0.1, start + 0.75 + (6 - i) * 0.1, ease.inOut);
