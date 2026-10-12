import React from 'react';
import {C} from '../theme';

// Shared bone drawing primitives (used by the T. rex, Iguanodon and loose fossils).

type P = {x: number; y: number};

/** Classic knobbed bone between two points: shaft + two lobes at each end. */
export const Bone: React.FC<{
  a: P;
  b: P;
  w: number;
  fill?: string;
  stroke?: string;
  sw?: number;
}> = ({a, b, w, fill = C.bone, stroke = C.ink, sw = 4}) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const r = w * 0.62;
  const shape = (
    <>
      <rect x={0} y={-w / 2} width={len} height={w} rx={w / 2} />
      <circle cx={0} cy={-w * 0.42} r={r} />
      <circle cx={0} cy={w * 0.42} r={r} />
      <circle cx={len} cy={-w * 0.42} r={r} />
      <circle cx={len} cy={w * 0.42} r={r} />
    </>
  );
  return (
    <g transform={`translate(${a.x} ${a.y}) rotate(${ang})`}>
      {/* stroke pass behind, fill pass on top → single clean outer outline */}
      <g fill={stroke} stroke={stroke} strokeWidth={sw * 2} strokeLinejoin="round">
        {shape}
      </g>
      <g fill={fill}>{shape}</g>
      <rect x={r} y={-w * 0.12} width={Math.max(0, len - 2 * r)} height={w * 0.16} rx={w * 0.08} fill={C.boneShade} opacity={0.7} />
    </g>
  );
};

/** Catmull-Rom sampled curve through points. Returns n samples with tangents. */
export const sampleCurve = (pts: P[], n: number) => {
  const out: {x: number; y: number; ang: number; u: number}[] = [];
  const seg = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const f = u * seg;
    const k = Math.min(seg - 1, Math.floor(f));
    const t = f - k;
    const p0 = pts[Math.max(0, k - 1)];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[Math.min(pts.length - 1, k + 2)];
    const cr = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    const dcr = (a: number, b: number, c: number, d: number) =>
      0.5 * (-a + c + 2 * (2 * a - 5 * b + 4 * c - d) * t + 3 * (-a + 3 * b - 3 * c + d) * t * t);
    const x = cr(p0.x, p1.x, p2.x, p3.x);
    const y = cr(p0.y, p1.y, p2.y, p3.y);
    const ang = Math.atan2(dcr(p0.y, p1.y, p2.y, p3.y), dcr(p0.x, p1.x, p2.x, p3.x));
    out.push({x, y, ang, u});
  }
  return out;
};

/** Row of vertebrae (centrum + neural spine) along a curve. */
export const Spine: React.FC<{
  pts: P[];
  n: number;
  size: (u: number) => number;
  spine: (u: number) => number;
  fill?: string;
  stroke?: string;
}> = ({pts, n, size, spine, fill = C.bone, stroke = C.ink}) => {
  const s = sampleCurve(pts, n);
  const draw = (pass: 'stroke' | 'fill') =>
    s.map((p, i) => {
      const w = size(p.u);
      const h = spine(p.u);
      const deg = (p.ang * 180) / Math.PI;
      return (
        <g key={`${pass}${i}`} transform={`translate(${p.x} ${p.y}) rotate(${deg})`}>
          <rect
            x={-w * 0.42}
            y={-w * 0.36}
            width={w * 0.84}
            height={w * 0.72}
            rx={w * 0.26}
            fill={pass === 'fill' ? fill : stroke}
            stroke={pass === 'stroke' ? stroke : 'none'}
            strokeWidth={7}
          />
          {h > 2 && (
            <rect
              x={-w * 0.13}
              y={-w * 0.3 - h}
              width={w * 0.26}
              height={h}
              rx={w * 0.13}
              fill={pass === 'fill' ? fill : stroke}
              stroke={pass === 'stroke' ? stroke : 'none'}
              strokeWidth={7}
            />
          )}
        </g>
      );
    });
  return (
    <g>
      {draw('stroke')}
      {draw('fill')}
    </g>
  );
};
