import React from 'react';
import {C} from '../theme';
import {lerp, mixHex} from '../lib/anim';
import {Bone, Spine, sampleCurve} from './bones';

// Layered Tyrannosaurus asset. Local coordinates: 1200 x 700, facing right, ground y = 648.
// Every layer is a 0-1 dial so scenes can build the animal up word by word:
// ghost outline -> skeleton -> flesh -> texture -> colour -> pose -> gaze.

export type TRexProps = {
  id: string;
  ghost?: number; // dashed outline of the missing animal
  ghostColor?: string;
  ghostBg?: string; // fill used to knock out interior seams of the dashed outline
  ghostWidth?: number;
  skeleton?: number;
  boneFill?: string;
  boneStroke?: string;
  tissue?: number; // flesh coverage (soft wipe)
  wipe?: 'up' | 'fromTail';
  texture?: number; // scales, scutes, skin folds
  color?: number; // neutral grey -> coloured hide + pattern
  pose?: number; // 0 standing -> 1 mid-stride
  look?: number; // 0 neutral -> 1 looking at the viewer
  breathe?: number; // seconds for idle motion (0 = frozen statue)
};

const BODY =
  'M30 300 C180 270 360 215 500 196 C600 182 700 190 780 215 C830 230 860 215 895 190 L935 250 C935 300 915 345 880 375 C840 420 770 450 690 452 C610 455 545 430 500 400 C400 345 230 318 30 308 Z';
const HEAD =
  'M875 215 C890 170 940 148 1005 150 C1065 152 1115 172 1145 200 C1162 216 1164 242 1150 255 C1142 263 1132 266 1124 268 C1120 282 1100 295 1070 302 C1030 318 975 328 940 318 C905 306 885 285 875 262 Z';
const THROAT = 'M1080 296 C1050 310 1010 322 975 325 C960 325 948 322 940 318 C962 306 992 300 1022 297 C1046 295 1064 295 1080 296 Z';
const MOUTH = 'M1145 252 C1090 260 1030 264 975 262 C962 262 955 268 952 276';
const BELLY =
  'M30 304 C230 318 400 345 500 400 C545 430 610 455 690 452 C770 450 840 420 880 375 C905 400 870 455 770 470 C650 486 530 462 460 425 C350 368 190 332 30 312 Z';
const ARM = 'M832 372 C860 384 874 398 880 414 L884 426 L874 424 L870 418 C858 408 842 400 824 394 Z';
const THIGH =
  'M500 258 C590 238 672 288 662 380 C654 440 626 478 592 487 C548 492 514 440 500 390 C488 340 478 280 500 258 Z';
const THIGH_SHADE = 'M500 258 C590 238 672 288 662 380 C656 425 640 458 618 476 C640 400 620 300 500 258 Z';
const SHIN = 'M572 452 L624 470 C607 520 587 565 570 597 L536 590 C548 545 560 500 572 452 Z';
const FOOT =
  'M534 584 C556 577 580 591 600 609 L650 631 C662 639 656 649 642 649 L540 649 C524 640 521 602 534 584 Z';

const HIP = {x: 565, y: 300};
const KNEE = {x: 597, y: 468};
const ANKLE = {x: 552, y: 590};
const NECK = {x: 895, y: 232};

const SPINE_PTS = [
  {x: 50, y: 303},
  {x: 250, y: 268},
  {x: 430, y: 230},
  {x: 565, y: 212},
  {x: 700, y: 214},
  {x: 790, y: 232},
  {x: 850, y: 222},
  {x: 892, y: 208},
];
const DORSAL = [
  {x: 160, y: 291},
  {x: 300, y: 262},
  {x: 450, y: 220},
  {x: 565, y: 203},
  {x: 690, y: 204},
  {x: 770, y: 222},
];

const Leg: React.FC<{
  thigh: number;
  shin: number;
  foot: number;
  fill?: string;
  shade?: string;
  showFlesh: boolean;
  bones: boolean;
  boneFill?: string;
  boneStroke?: string;
}> = ({thigh, shin, foot, fill, shade, showFlesh, bones, boneFill, boneStroke}) => (
  <g transform={`rotate(${thigh} ${HIP.x} ${HIP.y})`}>
    <g transform={`rotate(${shin} ${KNEE.x} ${KNEE.y})`}>
      <g transform={`rotate(${foot} ${ANKLE.x} ${ANKLE.y})`}>
        {bones && (
          <>
            <Bone a={{x: 556, y: 594}} b={{x: 610, y: 630}} w={13} fill={boneFill} stroke={boneStroke} />
            <Bone a={{x: 612, y: 632}} b={{x: 646, y: 641}} w={8} fill={boneFill} stroke={boneStroke} sw={3} />
          </>
        )}
        {showFlesh && <path d={FOOT} fill={fill} />}
      </g>
      {bones && <Bone a={{x: 597, y: 472}} b={{x: 556, y: 586}} w={18} fill={boneFill} stroke={boneStroke} />}
      {showFlesh && <path d={SHIN} fill={fill} />}
    </g>
    {bones && <Bone a={{x: 565, y: 304}} b={{x: 597, y: 462}} w={24} fill={boneFill} stroke={boneStroke} />}
    {showFlesh && <path d={THIGH} fill={fill} />}
    {showFlesh && shade && <path d={THIGH_SHADE} fill={shade} opacity={0.45} />}
  </g>
);

export const TRex: React.FC<TRexProps> = ({
  id,
  ghost = 0,
  ghostColor = C.paper,
  ghostBg,
  ghostWidth = 7,
  skeleton = 0,
  boneFill = C.bone,
  boneStroke = C.ink,
  tissue = 0,
  wipe = 'up',
  texture = 0,
  color = 0,
  pose = 0,
  look = 0,
  breathe = 0,
}) => {
  const base = mixHex('#8A7B6C', C.hide, color);
  const dark = mixHex('#73665A', C.hideDark, color);
  const far = mixHex('#62564B', C.hideFar, color);
  const bellyC = mixHex('#998B7D', C.belly, color);
  const scuteC = mixHex('#685B50', C.scute, color);

  // pose: mid-stride (near leg forward, far leg pushing off)
  const nearT = lerp(0, -16, pose);
  const nearS = lerp(0, 10, pose);
  const nearF = lerp(0, 6, pose);
  const farT = lerp(0, 18, pose);
  const farS = lerp(0, 14, pose);
  const farF = lerp(0, -20, pose);
  const drop = 6 * pose;
  const bodyTilt = lerp(0, -2, pose);
  const breath = breathe ? Math.sin(breathe * 1.4) * 1.4 : 0;
  const headRot = lerp(0, 5, look) + (breathe ? Math.sin(breathe * 0.9) * 0.6 : 0);

  // Once the flesh is (nearly) complete, hide the skeleton underneath: a few neck vertebrae
  // sit outside the flesh silhouette and would otherwise poke through (found in 100% QA crop).
  const skel = skeleton * (1 - Math.min(1, Math.max(0, (tissue - 0.82) / 0.15)));

  const soft = 70;
  const edgeY = lerp(700 + soft, -soft, tissue);
  const edgeX = lerp(1260, -60, tissue);
  const showFlesh = tissue > 0.001;
  const mid = `${id}-mask`;
  const bodyClip = `${id}-bodyclip`;

  // Silhouette used by the ghost outline (fill inherited from the parent group)
  const allParts = (
    <>
      <g transform="translate(-34 -4)">
        <Leg thigh={farT} shin={farS} foot={farF} showFlesh bones={false} />
      </g>
      <path d={BODY} />
      <g transform={`rotate(${headRot} ${NECK.x} ${NECK.y})`}>
        <path d={HEAD} />
      </g>
      <path d={ARM} />
      <Leg thigh={nearT} shin={nearS} foot={nearF} showFlesh bones={false} />
    </>
  );

  const scutes = sampleCurve(DORSAL, 24);
  const pupilDx = lerp(0, -4, look);
  const pupilR = lerp(6.5, 9, look);

  const ribs = Array.from({length: 9}).map((_, i) => {
    const x = 640 + i * 26;
    const ys = 222 + Math.sin(((x - 640) / 220) * Math.PI) * 6;
    const yb = 432 - Math.pow((x - 640) / 220, 2) * 70;
    return `M${x} ${ys} Q${x + 42} ${ys + 95} ${x - 14} ${yb}`;
  });

  return (
    <g>
      <defs>
        <linearGradient
          id={`${mid}-g`}
          gradientUnits="userSpaceOnUse"
          {...(wipe === 'up' ? {x1: 0, y1: edgeY - soft, x2: 0, y2: edgeY + soft} : {x1: edgeX - soft, y1: 0, x2: edgeX + soft, y2: 0})}
        >
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id={mid} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1600} height={1100}>
          <rect x={-200} y={-200} width={1600} height={1100} fill={`url(#${mid}-g)`} />
        </mask>
        <clipPath id={bodyClip}>
          <path d={BODY} />
        </clipPath>
      </defs>

      <g transform={`translate(0 ${drop + breath * 0.3}) rotate(${bodyTilt} ${HIP.x} ${HIP.y})`}>
        {/* 1 - ghost: dashed outer silhouette only (stroke pass, then knock-out fill) */}
        {ghost > 0 && (
          <g opacity={ghost}>
            <g fill="none" stroke={ghostColor} strokeWidth={ghostWidth} strokeDasharray={`${ghostWidth * 3.1} ${ghostWidth * 2.3}`} strokeLinecap="round" strokeLinejoin="round">
              {allParts}
            </g>
            {ghostBg && (
              <g fill={ghostBg} stroke="none">
                {allParts}
              </g>
            )}
          </g>
        )}

        {/* 2 - skeleton */}
        {skel > 0 && (
          <g opacity={skel}>
            <g transform="translate(-34 -4)">
              <Leg thigh={farT} shin={farS} foot={farF} showFlesh={false} bones boneFill={boneFill} boneStroke={boneStroke} />
            </g>
            {ribs.map((d, i) => (
              <path key={`rs${i}`} d={d} stroke={boneStroke} strokeWidth={17} fill="none" strokeLinecap="round" />
            ))}
            {ribs.map((d, i) => (
              <path key={`rf${i}`} d={d} stroke={boneFill} strokeWidth={9} fill="none" strokeLinecap="round" />
            ))}
            {/* pelvis: ischium, pubis + boot, ilium blade */}
            <Bone a={{x: 548, y: 246}} b={{x: 498, y: 345}} w={13} fill={boneFill} stroke={boneStroke} />
            <Bone a={{x: 580, y: 244}} b={{x: 632, y: 398}} w={16} fill={boneFill} stroke={boneStroke} />
            <ellipse cx={640} cy={404} rx={32} ry={12} fill={boneFill} stroke={boneStroke} strokeWidth={8} paintOrder="stroke" />
            <path
              d="M482 232 C515 200 610 194 655 220 C640 246 570 254 492 250 C480 246 476 240 482 232 Z"
              fill={boneFill}
              stroke={boneStroke}
              strokeWidth={8}
              paintOrder="stroke"
              strokeLinejoin="round"
            />
            {/* scapula + arm */}
            <Bone a={{x: 812, y: 230}} b={{x: 852, y: 318}} w={14} fill={boneFill} stroke={boneStroke} />
            <Bone a={{x: 852, y: 324}} b={{x: 862, y: 364}} w={8} fill={boneFill} stroke={boneStroke} sw={3} />
            <Bone a={{x: 862, y: 366}} b={{x: 880, y: 396}} w={6} fill={boneFill} stroke={boneStroke} sw={3} />
            <Spine
              pts={SPINE_PTS}
              n={66}
              size={(u) => Math.max(11, lerp(11, 28, Math.min(1, u * 1.7)) - (u > 0.86 ? (u - 0.86) * 60 : 0))}
              spine={(u) => (u < 0.22 ? 0 : u < 0.8 ? lerp(5, 24, Math.sin(Math.min(1, (u - 0.22) / 0.5) * Math.PI * 0.5)) : 0)}
              fill={boneFill}
              stroke={boneStroke}
            />
            {/* skull */}
            <g transform={`rotate(${headRot} ${NECK.x} ${NECK.y})`}>
              {Array.from({length: 9}).map((_, i) => (
                <path key={i} d={`M${1012 + i * 13} 257 l5 14 l5 -14 Z`} fill={boneFill} stroke={boneStroke} strokeWidth={3} strokeLinejoin="round" />
              ))}
              <path
                d="M965 268 L1124 266 C1118 282 1100 294 1070 301 C1030 315 980 322 950 314 C942 300 948 280 965 268 Z M988 290 a22 8 0 1 0 44 0 a22 8 0 1 0 -44 0 Z"
                fillRule="evenodd"
                fill={boneFill}
                stroke={boneStroke}
                strokeWidth={8}
                paintOrder="stroke"
                strokeLinejoin="round"
              />
              <path
                d="M880 218 C894 176 942 156 1005 158 C1062 160 1110 178 1138 204 C1154 219 1154 240 1142 250 L1040 258 L965 260 C925 256 896 246 882 232 Z M975 192 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0 Z M1030 214 a30 15 0 1 0 60 0 a30 15 0 1 0 -60 0 Z M905 206 a20 17 0 1 0 40 0 a20 17 0 1 0 -40 0 Z"
                fillRule="evenodd"
                fill={boneFill}
                stroke={boneStroke}
                strokeWidth={8}
                paintOrder="stroke"
                strokeLinejoin="round"
              />
            </g>
            <Leg thigh={nearT} shin={nearS} foot={nearF} showFlesh={false} bones boneFill={boneFill} boneStroke={boneStroke} />
          </g>
        )}

        {/* 3 - flesh, texture, colour */}
        {showFlesh && (
          <g mask={`url(#${mid})`}>
            <g transform="translate(-34 -4)">
              <Leg thigh={farT} shin={farS} foot={farF} fill={far} showFlesh bones={false} />
            </g>
            <path d={BODY} fill={base} />
            <g clipPath={`url(#${bodyClip})`}>
              <path d={BELLY} fill={bellyC} />
              {/* colour pattern: bold dorsal bands (part of the "colored" beat) */}
              {color > 0 &&
                [0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const x = 290 + i * 70;
                  const k = Math.max(0, Math.min(1, color * 1.6 - i * 0.08));
                  return (
                    <path
                      key={i}
                      d={`M${x} 170 L${x + 30} 170 C${x + 28} 232 ${x + 14} 262 ${x - 4} ${292 + i * 4} C${x - 4} 252 ${x + 1} 214 ${x} 170 Z`}
                      fill={C.hideDark}
                      opacity={k * 0.8}
                    />
                  );
                })}
              {/* texture: scale rosettes */}
              {texture > 0 &&
                Array.from({length: 8}).map((_, r) =>
                  Array.from({length: 17}).map((__, c) => {
                    const x = 250 + c * 38 + (r % 2) * 19;
                    const y = 272 + r * 19;
                    const k = Math.max(0, Math.min(1, texture * 1.8 - (1 - x / 1000) * 0.8));
                    return <ellipse key={`${r}-${c}`} cx={x} cy={y} rx={5.5 * k} ry={3.5 * k} fill={dark} opacity={0.5} />;
                  })
                )}
            </g>
            {texture > 0 &&
              scutes.map((p, i) => {
                const k = Math.max(0, Math.min(1, texture * 1.6 - (1 - p.u) * 0.5));
                const s = lerp(4, 8, p.u) * k;
                return (
                  <ellipse key={i} cx={p.x} cy={p.y} rx={s * 1.3} ry={s} fill={scuteC} transform={`rotate(${(p.ang * 180) / Math.PI} ${p.x} ${p.y})`} />
                );
              })}
            {texture > 0 && (
              <g opacity={texture} stroke={dark} strokeWidth={5} fill="none" strokeLinecap="round">
                <path d="M880 300 C870 320 862 335 850 345" />
                <path d="M900 310 C892 330 884 345 872 356" />
              </g>
            )}
            <path d={ARM} fill={dark} />
            <g transform={`rotate(${headRot} ${NECK.x} ${NECK.y})`}>
              <path d={HEAD} fill={base} />
              <path d={THROAT} fill={bellyC} />
              <path d={MOUTH} stroke={dark} strokeWidth={6} fill="none" strokeLinecap="round" />
              <ellipse cx={1134} cy={212} rx={7} ry={4} fill={dark} />
              <path d="M962 172 C984 160 1008 160 1030 170" stroke={dark} strokeWidth={10} fill="none" strokeLinecap="round" />
              {texture > 0 && (
                <g opacity={texture} fill={dark}>
                  <ellipse cx={1080} cy={196} rx={9} ry={4.5} opacity={0.55} />
                  <ellipse cx={1056} cy={190} rx={7} ry={3.5} opacity={0.55} />
                  <ellipse cx={1100} cy={206} rx={6} ry={3} opacity={0.55} />
                </g>
              )}
              {/* eye */}
              <circle cx={995} cy={190} r={10 + look * 3} fill={C.paperLight} opacity={0.15 + look * 0.55} />
              <circle cx={995 + pupilDx} cy={190 + look * 1.5} r={pupilR} fill={C.ink} />
              <circle cx={992.5 + pupilDx} cy={187} r={2.2 + look * 1.3} fill={C.paperLight} />
            </g>
            <Leg thigh={nearT} shin={nearS} foot={nearF} fill={base} shade={dark} showFlesh bones={false} />
          </g>
        )}
      </g>
    </g>
  );
};
