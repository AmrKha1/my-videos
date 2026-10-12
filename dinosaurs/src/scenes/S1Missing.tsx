import React from 'react';
import {C, FONT_SANS} from '../theme';
import {Q} from '../cues';
import {camAt, ease, keys, mixHex, ramp} from '../lib/anim';
import {Cam, Polaroid, Stage, Stamp} from '../components/common';
import {TRex} from '../components/TRex';

// 0 - 8.6 s  "No photograph of a living T. rex has ever existed. No witness. No preserved
// muscle. No skin sample. No color chart."  Everything we lack is drawn as a dashed absence.

export const PHOTO = {x: 640, y: 500, w: 560};
export const REX_IN_PHOTO = 0.38; // rex scale inside the photo
export const REX_SCREEN = 1.1; // rex scale on screen when scene 2 takes over
export const REX_CENTER = {x: 595, y: 400}; // rex local "visual centre"

const dash = {fill: 'none', stroke: C.inkMute, strokeWidth: 5, strokeDasharray: '11 9', strokeLinecap: 'round' as const};

const Icon: React.FC<{kind: number}> = ({kind}) => {
  switch (kind) {
    case 0: // witness: an eye
      return (
        <g>
          <path d="M-86 0 Q0 -62 86 0 Q0 62 -86 0 Z" {...dash} />
          <circle r={28} {...dash} />
          <circle r={9} fill={C.inkMute} opacity={0.5} />
        </g>
      );
    case 1: // preserved muscle: fibre bundle
      return (
        <g>
          <path d="M-96 0 C-56 -54 56 -54 96 0 C56 54 -56 54 -96 0 Z" {...dash} />
          <path d="M-66 -16 C-22 -32 22 -32 66 -16" {...dash} />
          <path d="M-72 2 C-24 -6 24 -6 72 2" {...dash} />
          <path d="M-64 20 C-22 30 22 30 64 20" {...dash} />
          <path d="M-96 0 L-122 0 M96 0 L122 0" {...dash} />
        </g>
      );
    case 2: // skin sample: scale pattern in a sample square
      return (
        <g>
          <rect x={-78} y={-60} width={156} height={120} rx={14} {...dash} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={-51 + c * 34 + (r % 2) * 17 - 8} cy={-30 + r * 30} r={11} {...dash} strokeWidth={4} strokeDasharray="6 6" />)
          )}
        </g>
      );
    default: // colour chart: empty swatches
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-104 + i * 54} y={-30} width={46} height={60} rx={6} {...dash} />
          ))}
          <path d="M-104 50 L104 50" {...dash} />
        </g>
      );
  }
};

const CARDS = [
  {label: 'WITNESS', t: Q.noWitness, x: 1210, y: 300, rot: 2},
  {label: 'PRESERVED MUSCLE', t: Q.noMuscle, x: 1560, y: 318, rot: -2},
  {label: 'SKIN SAMPLE', t: Q.noSkin, x: 1220, y: 700, rot: -1.5},
  {label: 'COLOR CHART', t: Q.noColor, x: 1566, y: 690, rot: 2.5},
];

export const S1Missing: React.FC<{t: number}> = ({t}) => {
  const zEnd = REX_SCREEN / REX_IN_PHOTO;
  const cam = camAt(t, [
    [0, PHOTO.x, PHOTO.y + 10, 1.48],
    [3.55, PHOTO.x, PHOTO.y + 10, 1.62],
    [4.55, 965, 520, 1.0],
    [7.85, 960, 515, 1.05],
    [8.6, PHOTO.x, PHOTO.y, zEnd],
  ]);
  const dive = ramp(t, 7.85, 8.6, ease.inOut);
  const bg = mixHex(C.paper, C.ink, ramp(t, 8.05, 8.55, ease.inOutSine));
  const photoRot = keys(t, [
    [0, -3],
    [7.85, -3],
    [8.6, 0],
  ]);
  const ghost = ramp(t, 0.5, 2.4, ease.inOutSine);
  const stampP = ramp(t, Q.existed - 0.12, Q.existed + 0.38, ease.linear);
  const stampOut = 1 - ramp(t, 7.4, 7.9);
  const frameOut = 1 - ramp(t, 8.0, 8.5, ease.inOutSine);

  return (
    <Stage bg={bg}>
      <Cam cam={cam}>
        {/* faint ruled archival sheet */}
        <g opacity={0.55 * frameOut} stroke={C.paperShade} strokeWidth={2}>
          {Array.from({length: 22}).map((_, i) => (
            <line key={i} x1={-400} x2={2400} y1={-200 + i * 64} y2={-200 + i * 64} />
          ))}
        </g>

        {/* evidence cards: everything here is an absence */}
        {CARDS.map((c, i) => {
          const p = ramp(t, c.t - 0.1, c.t + 0.5, ease.out);
          if (p <= 0) return null;
          const out = ramp(t, 7.75 + i * 0.05, 8.25 + i * 0.05, ease.in);
          const none = ramp(t, c.t + 0.38, c.t + 0.8, ease.linear);
          return (
            <g
              key={i}
              transform={`translate(${c.x + (1 - p) * 140 + out * 520} ${c.y + (1 - p) * 60}) rotate(${c.rot + (1 - p) * 8})`}
              opacity={Math.min(1, p * 1.6)}
            >
              <rect x={-150 + 10} y={-165 + 14} width={300} height={330} rx={10} fill={C.ink} opacity={0.12} />
              <rect x={-150} y={-165} width={300} height={330} rx={10} fill={C.paperLight} stroke={C.paperDeep} strokeWidth={3} />
              <g transform="translate(0 -40)">
                <Icon kind={i} />
              </g>
              <text x={0} y={92} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={22} letterSpacing={2.4} fill={C.ink}>
                {c.label}
              </text>
              <Stamp x={0} y={132} text="NONE" p={none} color={C.ink} size={22} rot={-4} />
            </g>
          );
        })}

        {/* the photograph that was never taken */}
        <g opacity={1}>
          <Polaroid
            id="s1photo"
            x={PHOTO.x}
            y={PHOTO.y}
            w={PHOTO.w}
            rot={photoRot}
            caption="T. rex, living"
            captionP={ramp(t, 0.3, 1.2)}
            frameOpacity={frameOut}
            shadow={1 - dive}
          >
            <g transform={`translate(${-REX_CENTER.x * REX_IN_PHOTO} ${-REX_CENTER.y * REX_IN_PHOTO}) scale(${REX_IN_PHOTO})`}>
              <TRex id="s1rex" ghost={ghost} ghostBg={C.ink} ghostColor={C.paper} />
            </g>
          </Polaroid>
          <g opacity={stampOut}>
            <Stamp x={PHOTO.x + 10} y={PHOTO.y + 150} text="NO PHOTOGRAPH" p={stampP} size={42} rot={-7} />
          </g>
        </g>
      </Cam>
    </Stage>
  );
};
