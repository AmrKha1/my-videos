import React from 'react';
import {C} from '../theme';

// The 19th-century Iguanodon *reconstruction* (heavy, lizard-like quadruped with a nose horn).
// Local coordinates: 1200 x 700, facing right, ground y = 648.
// It can be rendered as a dashed guess, a tinted reconstruction, an ink drawing, or stone.

export const IGUANODON_NOSE = {x: 1092, y: 318}; // where the spike lands as a "horn"

const BODY =
  'M30 560 C150 540 300 470 430 400 C520 340 650 318 780 333 C850 341 900 352 935 338 L962 400 C942 432 902 452 852 462 C782 482 652 492 540 472 C470 462 420 472 380 492 C280 542 150 572 30 568 Z';
const HEAD =
  'M922 334 C958 300 1020 294 1072 310 C1106 320 1126 336 1129 352 C1131 366 1116 373 1096 373 C1050 379 990 386 950 381 C928 376 914 360 922 334 Z';
const BELLY =
  'M380 492 C420 472 470 462 540 472 C652 492 782 482 852 462 C902 452 942 432 962 400 C962 450 900 490 800 505 C680 520 560 512 470 495 C430 490 400 498 380 505 Z';
const BACK_LEG =
  'M430 410 C480 380 560 400 560 450 C560 480 545 500 540 530 L548 610 C575 615 590 630 590 648 L500 648 C498 620 505 600 505 580 L490 520 C450 490 420 450 430 410 Z';
const FRONT_LEG =
  'M800 420 C840 405 880 425 875 465 L860 520 C870 560 870 600 868 610 C890 615 905 630 905 648 L818 648 C818 625 825 610 830 600 L820 530 C795 495 785 450 800 420 Z';
const HORN = 'M-19 6 C-11 -20 -5 -50 3 -66 C10 -42 16 -14 20 6 Z';
const MOUTH = 'M1122 360 C1070 365 1010 367 966 362';

export const SpikeShape: React.FC<{fill: string; stroke?: string; sw?: number; scale?: number}> = ({fill, stroke, sw = 0, scale = 1}) => (
  <g transform={`scale(${scale})`}>
    <path d={HORN} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" paintOrder="stroke" />
    <path d="M-6 0 C-3 -18 0 -36 3 -50" stroke={stroke ?? '#000'} strokeOpacity={0.18} strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);

export type IguanodonProps = {
  fill?: string;
  shade?: string;
  far?: string;
  belly?: string;
  fillAmt?: number;
  outline?: string;
  outlineW?: number;
  dashed?: boolean;
  draw?: number; // 0-1 draw-on for solid outlines
  outlineAmt?: number;
  knockBg?: string; // knock-out fill so only the outer silhouette is outlined
  horn?: number; // 0-1 horn presence on the nose
  hornFill?: string;
  eye?: boolean;
  hatching?: number; // engraving-style hatch lines (the "drawn" print)
};

export const Iguanodon: React.FC<IguanodonProps> = ({
  fill = C.theoryTint,
  shade = C.theory,
  far,
  belly,
  fillAmt = 1,
  outline = C.ink,
  outlineW = 7,
  dashed = false,
  draw = 1,
  outlineAmt = 0,
  knockBg,
  horn = 0,
  hornFill = C.bone,
  eye = true,
  hatching = 0,
}) => {
  const farC = far ?? shade;
  const parts = (withFar: boolean) => (
    <>
      {withFar && (
        <g transform="translate(46 -12)">
          <path d={BACK_LEG} />
          <path d={FRONT_LEG} />
        </g>
      )}
      <path d={BODY} />
      <path d={HEAD} />
      <path d={BACK_LEG} />
      <path d={FRONT_LEG} />
    </>
  );
  const drawProps = dashed
    ? {strokeDasharray: '20 15'}
    : draw < 1
      ? {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - draw}
      : {};

  return (
    <g>
      {outlineAmt > 0 && (
        <g opacity={outlineAmt}>
          <g fill="none" stroke={outline} strokeWidth={outlineW} strokeLinecap="round" strokeLinejoin="round">
            {/* pathLength must be on each path for the draw-on, so map explicitly */}
            {[BODY, HEAD, BACK_LEG, FRONT_LEG].map((d, i) => (
              <path key={i} d={d} {...drawProps} />
            ))}
            <g transform="translate(46 -12)">
              {[BACK_LEG, FRONT_LEG].map((d, i) => (
                <path key={i} d={d} {...drawProps} />
              ))}
            </g>
          </g>
          {knockBg && (
            <g fill={knockBg} stroke="none">
              {parts(true)}
            </g>
          )}
        </g>
      )}

      {fillAmt > 0 && (
        <g opacity={fillAmt}>
          <g transform="translate(46 -12)" fill={farC}>
            <path d={BACK_LEG} />
            <path d={FRONT_LEG} />
          </g>
          <path d={BODY} fill={fill} />
          <path d={BELLY} fill={belly ?? shade} opacity={belly ? 1 : 0.35} />
          {/* bold ridge bands */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${520 + i * 75} 345 q16 22 6 52`} stroke={shade} strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.45} />
          ))}
          <path d={HEAD} fill={fill} />
          <path d={MOUTH} stroke={shade} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d={BACK_LEG} fill={fill} />
          <path d={FRONT_LEG} fill={fill} />
          <path d="M430 410 C480 380 560 400 560 450 C556 430 520 410 470 412 Z" fill={shade} opacity={0.4} />
        </g>
      )}

      {hatching > 0 && (
        <g opacity={hatching} stroke={outline} strokeWidth={3} strokeLinecap="round">
          {Array.from({length: 18}).map((_, i) => {
            const x = 420 + i * 28;
            return <line key={i} x1={x} y1={470 + (i % 3) * 4} x2={x + 22} y2={440 + (i % 3) * 4} opacity={0.55} />;
          })}
          {Array.from({length: 6}).map((_, i) => (
            <line key={`l${i}`} x1={510 + i * 8} y1={560 + i * 12} x2={540 + i * 8} y2={545 + i * 12} opacity={0.5} />
          ))}
        </g>
      )}

      {eye && (fillAmt > 0.2 || outlineAmt > 0.2) && (
        <g opacity={Math.max(fillAmt, outlineAmt * draw)}>
          <circle cx={1012} cy={330} r={7} fill={C.ink} />
          <circle cx={1010} cy={328} r={2} fill={C.paperLight} />
          <ellipse cx={1118} cy={336} rx={5} ry={3} fill={C.ink} opacity={0.6} />
        </g>
      )}

      {horn > 0 && (
        <g transform={`translate(${IGUANODON_NOSE.x} ${IGUANODON_NOSE.y + 6}) scale(${horn})`}>
          <SpikeShape fill={hornFill} stroke={C.ink} sw={6} />
        </g>
      )}
    </g>
  );
};
