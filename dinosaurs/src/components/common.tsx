import React from 'react';
import {C, FONT_SANS, FONT_SERIF, H, W} from '../theme';
import {ease, ramp} from '../lib/anim';

export type CamState = {cx: number; cy: number; z: number; r?: number};

/** Camera: looks at world point (cx, cy) with zoom z. `depth` < 1 gives parallax for far layers. */
export const Cam: React.FC<{cam: CamState; depth?: number; children: React.ReactNode}> = ({cam, depth = 1, children}) => {
  const z = 1 + (cam.z - 1) * depth;
  const cx = cam.cx * depth + (W / 2) * (1 - depth);
  const cy = cam.cy * depth + (H / 2) * (1 - depth);
  return <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.r ?? 0}) scale(${z}) translate(${-cx} ${-cy})`}>{children}</g>;
};

export const Stage: React.FC<{bg?: string; children: React.ReactNode}> = ({bg, children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {bg && <rect width={W} height={H} fill={bg} />}
    {children}
  </svg>
);

export type TagKind = 'evidence' | 'theory' | 'caution' | 'ink' | 'oxblood';
const TAG_COLOR: Record<TagKind, string> = {
  evidence: C.evidence,
  theory: C.theory,
  caution: C.caution,
  ink: C.ink,
  oxblood: C.oxblood,
};

/** Semantic label chip. `p` (0-1) drives the reveal; optional leader line to a target point. */
export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  kind: TagKind;
  p: number;
  size?: number;
  to?: {x: number; y: number};
  anchor?: 'left' | 'right' | 'center';
  textColor?: string;
}> = ({x, y, text, kind, p, size = 26, to, anchor = 'left', textColor = C.paperLight}) => {
  if (p <= 0) return null;
  const col = TAG_COLOR[kind];
  const w = text.length * size * 0.8 + size * 2.3;
  const h = size * 1.9;
  const ox = anchor === 'left' ? 0 : anchor === 'right' ? -w : -w / 2;
  const reveal = ease.out(Math.min(1, p * 1.25));
  const textP = ramp(p, 0.35, 1, ease.out);
  return (
    <g>
      {to && (
        <g opacity={Math.min(1, p * 2)}>
          <path
            d={`M${x + ox + (anchor === 'right' ? w : anchor === 'left' ? 0 : w / 2)} ${y} L${to.x} ${to.y}`}
            stroke={col}
            strokeWidth={4}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - reveal}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={to.x} cy={to.y} r={9 * reveal} fill={col} stroke={C.paperLight} strokeWidth={3} />
        </g>
      )}
      <g transform={`translate(${x + ox} ${y - h / 2})`}>
        <clipPath id={`tagclip-${Math.round(x)}-${Math.round(y)}-${text.length}`}>
          <rect x={0} y={-4} width={w * reveal} height={h + 8} />
        </clipPath>
        <g clipPath={`url(#tagclip-${Math.round(x)}-${Math.round(y)}-${text.length})`}>
          <rect width={w} height={h} rx={h / 2} fill={col} />
          <circle cx={h / 2} cy={h / 2} r={size * 0.26} fill={textColor} opacity={0.9} />
          <text
            x={h * 0.86}
            y={h / 2 + size * 0.36}
            fontFamily={FONT_SANS}
            fontWeight={700}
            fontSize={size}
            letterSpacing={size * 0.08}
            fill={textColor}
            opacity={textP}
          >
            {text}
          </text>
        </g>
      </g>
    </g>
  );
};

/** Rubber-stamp text that thumps down (scale settle) at time p. */
export const Stamp: React.FC<{x: number; y: number; text: string; p: number; color?: string; size?: number; rot?: number}> = ({
  x,
  y,
  text,
  p,
  color = C.oxblood,
  size = 52,
  rot = -6,
}) => {
  if (p <= 0) return null;
  const s = 1.35 - 0.35 * ease.outBack(Math.min(1, p));
  const w = text.length * size * 0.66 + size * 1.2;
  const h = size * 1.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, p * 3)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke={color} strokeWidth={6} />
      <text
        x={0}
        y={size * 0.36}
        textAnchor="middle"
        fontFamily={FONT_SANS}
        fontWeight={700}
        fontSize={size}
        letterSpacing={size * 0.06}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
};

/** Instant-photo frame. Children render inside the image window (clipped). */
export const Polaroid: React.FC<{
  id: string;
  x: number;
  y: number;
  w?: number;
  rot?: number;
  scale?: number;
  imageBg?: string;
  caption?: string;
  captionP?: number;
  frameOpacity?: number;
  shadow?: number;
  children?: React.ReactNode;
}> = ({id, x, y, w = 480, rot = 0, scale = 1, imageBg = C.ink, caption, captionP = 1, frameOpacity = 1, shadow = 1, children}) => {
  const pad = w * 0.06;
  const img = w - pad * 2;
  const hTot = pad + img + w * 0.26;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <g opacity={frameOpacity}>
        <rect x={-w / 2 + 14} y={-pad - img / 2 + 18} width={w} height={hTot} rx={6} fill={C.ink} opacity={0.16 * shadow} />
        <rect x={-w / 2} y={-pad - img / 2} width={w} height={hTot} rx={6} fill={C.paperLight} />
      </g>
      <clipPath id={`${id}-win`}>
        <rect x={-img / 2} y={-img / 2} width={img} height={img} />
      </clipPath>
      <rect x={-img / 2} y={-img / 2} width={img} height={img} fill={imageBg} />
      <g clipPath={`url(#${id}-win)`}>{children}</g>
      {caption && (
        <text
          x={0}
          y={img / 2 + w * 0.15}
          textAnchor="middle"
          fontFamily={FONT_SERIF}
          fontStyle="italic"
          fontWeight={600}
          fontSize={w * 0.065}
          fill={C.ink}
          opacity={captionP * frameOpacity}
        >
          {caption}
        </text>
      )}
    </g>
  );
};

/** Flat "light pool": concentric low-opacity discs (no gradients → no banding). */
export const LightPool: React.FC<{x: number; y: number; r: number; color: string; strength?: number; sy?: number}> = ({
  x,
  y,
  r,
  color,
  strength = 1,
  sy = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(1 ${sy})`} fill={color}>
    {[1, 0.78, 0.58, 0.4].map((k, i) => (
      <circle key={i} r={r * k} opacity={0.07 * strength} />
    ))}
  </g>
);

export const Headline: React.FC<{
  x: number;
  y: number;
  text: string;
  p: number;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  italic?: boolean;
  weight?: number;
}> = ({x, y, text, p, size = 64, color = C.ink, anchor = 'middle', italic = false, weight = 600}) => {
  if (p <= 0) return null;
  const k = ease.out(Math.min(1, p));
  return (
    <text
      x={x}
      y={y + (1 - k) * 24}
      textAnchor={anchor}
      fontFamily={FONT_SERIF}
      fontStyle={italic ? 'italic' : 'normal'}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      opacity={k}
    >
      {text}
    </text>
  );
};
