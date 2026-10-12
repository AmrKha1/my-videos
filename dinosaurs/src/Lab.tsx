import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from './theme';
import {TRex} from './components/TRex';

// Asset test bench (not part of the final video). Each frame shows a different state.
export const Lab: React.FC = () => {
  const f = useCurrentFrame();
  const states = [
    {ghost: 1, ghostBg: C.ink},
    {skeleton: 1},
    {skeleton: 1, tissue: 0.5},
    {tissue: 1},
    {tissue: 1, texture: 1, color: 1},
    {tissue: 1, texture: 1, color: 1, pose: 1, look: 1},
  ];
  const s = states[f % states.length];
  const dark = f % states.length === 0;
  return (
    <AbsoluteFill style={{background: dark ? C.ink : C.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <line x1={0} x2={1920} y1={200 + 648 * 1.2} y2={200 + 648 * 1.2} stroke={C.ink} strokeWidth={2} opacity={0.3} />
        <g transform="translate(240 200) scale(1.2)">
          <TRex id="lab" {...s} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
