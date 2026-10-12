import React from 'react';
import {C} from '../theme';

// Story-specific figures. The scientist is a generic 19th-century naturalist (not a real person).
// Local origin = between the feet, y up is negative. Height ~ 560.

export const SHOULDER = {x: 28, y: -412};
const L1 = 98; // upper arm
const L2 = 90; // forearm

/** Two-bone IK: angles (radians) so the hand reaches `target` (local coords), elbow bending down/out. */
export const armIK = (target: {x: number; y: number}) => {
  const dx = target.x - SHOULDER.x;
  const dy = target.y - SHOULDER.y;
  const raw = Math.hypot(dx, dy) || 1;
  const d = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 0.5, raw));
  const base = Math.atan2(dy, dx);
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const a1 = base + Math.acos(Math.max(-1, Math.min(1, cosA)));
  const elbow = {x: SHOULDER.x + Math.cos(a1) * L1, y: SHOULDER.y + Math.sin(a1) * L1};
  const reach = {x: SHOULDER.x + (dx / raw) * d, y: SHOULDER.y + (dy / raw) * d};
  const a2 = Math.atan2(reach.y - elbow.y, reach.x - elbow.x);
  const hand = {x: elbow.x + Math.cos(a2) * L2, y: elbow.y + Math.sin(a2) * L2};
  return {a1, a2, elbow, hand};
};

const limb = (a: {x: number; y: number}, b: {x: number; y: number}, w: number, color: string) => (
  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" />
);

export const Scientist: React.FC<{
  hand: {x: number; y: number}; // IK target for the front hand (local)
  headTilt?: number; // degrees
  blink?: number; // 0-1
  brow?: number; // 0-1 raised
  breathe?: number; // seconds
  lit?: number; // lamp-side highlight strength
}> = ({hand, headTilt = 0, blink = 0, brow = 0, breathe = 0, lit = 1}) => {
  const arm = armIK(hand);
  const b = Math.sin(breathe * 1.6) * 2.2;
  const coat = C.inkLift;
  const coatShade = '#3F352F';
  return (
    <g>
      {/* legs + shoes */}
      <path d="M-40 -232 L-6 -232 L-10 -10 L-38 -10 Z" fill={C.inkSoft} />
      <path d="M2 -232 L36 -232 L32 -10 L4 -10 Z" fill={'#4F433A'} />
      <ellipse cx={-22} cy={-6} rx={30} ry={11} fill={C.ink} />
      <ellipse cx={26} cy={-6} rx={32} ry={11} fill={C.ink} />

      <g transform={`translate(0 ${b})`}>
        {/* back arm */}
        {limb({x: -40, y: -400}, {x: -58, y: -300}, 34, coatShade)}
        {limb({x: -58, y: -300}, {x: -50, y: -212}, 30, coatShade)}
        <circle cx={-50} cy={-202} r={14} fill={C.skinShade} />

        {/* frock coat */}
        <path d="M-62 -438 C-88 -424 -98 -384 -98 -330 L-104 -168 C-60 -158 -10 -160 20 -172 L70 -196 C76 -262 72 -344 62 -404 C52 -430 18 -444 -62 -438 Z" fill={coat} />
        <path d="M-62 -438 C-88 -424 -98 -384 -98 -330 L-104 -168 C-88 -165 -74 -164 -60 -164 L-56 -330 C-56 -380 -48 -420 -62 -438 Z" fill={coatShade} />
        {/* waistcoat + shirt front + cravat */}
        <path d="M6 -426 L52 -414 L56 -282 L22 -270 Z" fill={C.oxblood} opacity={0.85} />
        <path d="M14 -430 L40 -424 L32 -380 Z" fill={C.paperLight} />
        <path d="M18 -432 L44 -428 L36 -404 L26 -400 Z" fill={C.ink} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={46} cy={-380 + i * 30} r={4} fill={C.lamp} opacity={0.8} />
        ))}

        {/* head */}
        <g transform={`rotate(${headTilt} 10 -440)`}>
          <rect x={-6} y={-458} width={30} height={30} fill={C.skinShade} />
          <ellipse cx={14} cy={-498} rx={48} ry={56} fill={C.skin} />
          {/* nose */}
          <path d="M56 -504 C70 -496 72 -486 58 -480 Z" fill={C.skinShade} />
          {/* side whiskers + hair */}
          <path d="M-30 -520 C-38 -480 -26 -446 6 -440 C-6 -460 -10 -490 -4 -514 Z" fill={C.inkMute} />
          <path d="M-36 -510 C-44 -548 -14 -566 18 -560 C-2 -552 -18 -536 -20 -512 Z" fill={C.inkMute} />
          <ellipse cx={-6} cy={-498} rx={9} ry={14} fill={C.skinShade} />
          {/* spectacles + eye */}
          <circle cx={38} cy={-506} r={14} fill="none" stroke={C.ink} strokeWidth={3.5} />
          <line x1={24} y1={-508} x2={0} y2={-512} stroke={C.ink} strokeWidth={3} />
          {blink < 0.5 ? (
            <circle cx={40} cy={-506} r={4.5} fill={C.ink} />
          ) : (
            <line x1={34} y1={-506} x2={46} y2={-506} stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
          )}
          <path d={`M26 ${-526 - brow * 7} C34 ${-532 - brow * 9} 44 ${-532 - brow * 9} 52 ${-526 - brow * 6}`} stroke={C.inkMute} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M40 -470 C46 -468 52 -470 56 -474" stroke={C.skinShade} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>

        {/* front arm (IK) */}
        {limb(SHOULDER, arm.elbow, 36, coat)}
        {limb(arm.elbow, arm.hand, 31, coat)}
        <circle cx={arm.hand.x} cy={arm.hand.y} r={15} fill={C.skin} />
        {/* lamp-side rim light */}
        <path d="M62 -404 C72 -344 76 -262 70 -196 L62 -200 C66 -262 64 -340 56 -396 Z" fill={C.lamp} opacity={0.25 * lit} />
      </g>
    </g>
  );
};

/** Hand position in local coords after IK (so held objects can follow it exactly). */
export const scientistHand = (target: {x: number; y: number}) => armIK(target).hand;

type Visitor = 'tophat' | 'bonnet' | 'child' | 'modern' | 'modernChild';

/** Flat silhouette visitor. Origin at feet. */
export const Figure: React.FC<{kind: Visitor; color?: string; point?: number}> = ({kind, color = C.inkSoft, point = 0}) => {
  switch (kind) {
    case 'tophat':
      return (
        <g fill={color}>
          <rect x={-22} y={-200} width={18} height={200} rx={6} />
          <rect x={4} y={-200} width={18} height={200} rx={6} />
          <path d="M-46 -380 C-50 -300 -52 -220 -48 -150 L48 -150 C52 -220 50 -300 46 -380 C20 -398 -20 -398 -46 -380 Z" />
          <circle cx={0} cy={-418} r={34} />
          <rect x={-30} y={-500} width={60} height={70} rx={4} />
          <rect x={-46} y={-438} width={92} height={10} rx={5} />
        </g>
      );
    case 'bonnet':
      return (
        <g fill={color}>
          <path d="M-90 0 C-80 -120 -60 -220 -40 -300 L40 -300 C60 -220 80 -120 90 0 Z" />
          <path d="M-36 -300 C-40 -340 -30 -370 0 -372 C30 -370 40 -340 36 -300 Z" />
          <circle cx={0} cy={-398} r={30} />
          <path d="M-40 -400 C-40 -446 40 -446 44 -400 L34 -390 C30 -420 -30 -420 -30 -390 Z" />
          <path d="M70 -60 C110 -90 120 -150 90 -190 C80 -130 70 -100 60 -80 Z" />
        </g>
      );
    case 'child':
      return (
        <g fill={color}>
          <rect x={-16} y={-120} width={13} height={120} rx={5} />
          <rect x={3} y={-120} width={13} height={120} rx={5} />
          <path d="M-30 -230 C-34 -180 -36 -140 -34 -110 L34 -110 C36 -140 34 -180 30 -230 C14 -242 -14 -242 -30 -230 Z" />
          <circle cx={0} cy={-262} r={28} />
          <g transform={`rotate(${-point * 70} 22 -220)`}>
            <rect x={14} y={-226} width={16} height={86} rx={8} />
          </g>
        </g>
      );
    case 'modern':
      return (
        <g fill={color}>
          <rect x={-24} y={-210} width={20} height={210} rx={8} />
          <rect x={4} y={-210} width={20} height={210} rx={8} />
          <path d="M-44 -372 C-50 -300 -48 -250 -44 -196 L44 -196 C48 -250 50 -300 44 -372 C20 -388 -20 -388 -44 -372 Z" />
          <circle cx={0} cy={-412} r={34} />
        </g>
      );
    case 'modernChild':
      return (
        <g fill={color}>
          <rect x={-15} y={-118} width={13} height={118} rx={5} />
          <rect x={2} y={-118} width={13} height={118} rx={5} />
          <path d="M-28 -222 C-32 -180 -32 -140 -30 -112 L30 -112 C32 -140 32 -180 28 -222 C12 -232 -12 -232 -28 -222 Z" />
          <circle cx={0} cy={-252} r={27} />
          <g transform={`rotate(${-point * 75} 20 -212)`}>
            <rect x={12} y={-218} width={15} height={84} rx={7.5} />
          </g>
        </g>
      );
  }
};
