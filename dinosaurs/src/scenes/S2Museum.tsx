import React from 'react';
import {C, FONT_SANS, FONT_SERIF, H, W} from '../theme';
import {Q} from '../cues';
import {camAt, drift, ease, lerp, mixHex, ramp} from '../lib/anim';
import {Cam, LightPool, Stage, Tag} from '../components/common';
import {TRex} from '../components/TRex';
import {Figure} from '../components/People';
import {MuseumHall, Plinth, Strata, sedimentReveal} from '../components/Environments';
import {REX_CENTER, REX_SCREEN} from './S1Missing';

// 8.6 - 30.9 s, one continuous world:
//   soft tissue gone -> bone in rock -> ("And yet") rise into the museum -> the reconstruction
//   builds up word by word -> a photo frame snaps shut on it -> ("Here's the uncomfortable part")
//   lights dim, the photo is peeled back to bone + guesswork.

const FOSSIL = {x: 960 - REX_CENTER.x, y: 1160 - REX_CENTER.y};
const MOUNT = {x: 960 - REX_CENTER.x, y: -150 - 648};
const FRAME = {cx: 960, cy: 470, w: 660, h: 660};

const BUILD = [
  {text: 'FLESH', t: Q.fleshed, to: {x: 640, y: 330}},
  {text: 'TEXTURE', t: Q.textured, to: {x: 470, y: 228}},
  {text: 'COLOR', t: Q.colored, to: {x: 372, y: 262}},
  {text: 'POSE', t: Q.midStride, to: {x: 560, y: 560}},
];

export const S2Museum: React.FC<{t: number}> = ({t}) => {
  // ---------- camera (world) ----------
  const cam = camAt(t, [
    [8.6, 960, 1160, REX_SCREEN],
    [12.45, 960, 1175, 1.0],
    [15.25, 960, -520, 0.84],
    [17.7, 960, -540, 0.92],
    [19.2, 930, -555, 0.96],
    [Q.someone, 880, -560, 1.08],
    [Q.photograph - 0.3, 960, -480, 0.5],
  ]);

  // ---------- fossil (scene 2) ----------
  const flesh2 = Math.min(ramp(t, 8.62, 9.5, ease.inOut), 1 - ramp(t, Q.gone - 0.1, Q.gone + 0.85, ease.inOut));
  const fleshWipe: 'up' | 'fromTail' = t < 9.8 ? 'up' : 'fromTail';
  const skel2 = ramp(t, 9.3, 9.5, ease.linear);
  const ghost2 = 1 - ramp(t, Q.whatsLeft + 0.3, Q.rock + 0.4, ease.inOutSine);
  const stone = ramp(t, Q.whatsLeft, Q.rock + 0.5, ease.inOut);
  const sink = ease.inOut(ramp(t, Q.whatsLeft, 12.6, ease.linear));
  const strata = sedimentReveal(t, Q.whatsLeft - 0.05);
  const evidenceTag = Math.min(ramp(t, Q.rock - 0.4, Q.rock + 0.4, ease.linear), 1 - ramp(t, 13.4, 13.9));

  // ---------- museum (scenes 3-4) ----------
  const spot = ramp(t, Q.findTrex - 0.3, Q.findTrex + 0.8, ease.inOutSine);
  const labelP = ramp(t, Q.findTrex, Q.findTrex + 0.7, ease.linear);
  const tissue = ramp(t, Q.fleshed - 0.05, Q.fleshed + 0.85, ease.inOut);
  const texture = ramp(t, Q.textured - 0.05, Q.textured + 0.75, ease.inOut);
  const color = ramp(t, Q.colored - 0.05, Q.colored + 0.75, ease.inOut);
  const pose = ramp(t, Q.midStride - 0.05, Q.midStride + 0.9, ease.inOut);
  const look = ramp(t, Q.lookingBack - 0.05, Q.lookingBack + 0.6, ease.inOut);
  const visitors = 1 - ramp(t, 18.9, 19.7, ease.inOutSine);
  const point = ramp(t, Q.findTrex + 0.2, Q.findTrex + 0.9, ease.out);
  const tagsOut = 1 - ramp(t, Q.someone - 0.1, Q.someone + 0.5);

  // ---------- photo frame + "uncomfortable" (scene 5) ----------
  const close = ramp(t, Q.someone, Q.photograph - 0.35, ease.inOut);
  const fw = lerp(2900, FRAME.w, close);
  const fh = lerp(2900 * (FRAME.h / FRAME.w), FRAME.h, close);
  const flash = t >= Q.photograph - 0.05 ? Math.max(0, 1 - (t - (Q.photograph - 0.05)) / 0.55) : 0;
  const settle = ramp(t, Q.photograph + 0.25, Q.photograph + 1.25, ease.inOut);
  const objS = lerp(1, 0.8, settle);
  const objR = lerp(0, -4, settle);
  const objX = lerp(0, -70, settle);
  const dim = ramp(t, Q.uncomfortable, Q.uncomfortable + 1.0, ease.inOutSine);
  const peel = ramp(t, 27.1, 28.3, ease.inOut);
  const question = ramp(t, Q.wrong - 0.1, Q.wrong + 0.4, ease.linear);
  const exit = ramp(t, Q.before + 0.05, 30.4, ease.inOut);
  const deskColor = mixHex(C.paper, C.inkSoft, dim * 0.85);

  // the mounted rex's dials, with the scene-5 peel applied
  const rexTissue = tissue * (1 - peel);
  const rexGhost = peel;

  const world = (
    <Cam cam={cam}>
      <Strata reveal={strata} />
      <MuseumHall spot={spot} />
      {/* fossil skeleton in the rock */}
      <g transform={`translate(${FOSSIL.x} ${FOSSIL.y + sink * 26}) rotate(${-4 * sink} ${REX_CENTER.x} ${REX_CENTER.y})`}>
        <TRex
          id="fossil"
          ghost={ghost2}
          ghostBg={C.ink}
          ghostColor={C.paper}
          skeleton={skel2}
          boneFill={mixHex(C.bone, '#CDBB98', stone)}
          tissue={flesh2}
          wipe={fleshWipe}
        />
      </g>
      <Tag x={1340} y={1350} text="EVIDENCE" kind="evidence" p={evidenceTag} to={{x: 1160, y: 1185}} size={28} />

      {/* the exhibit */}
      <g opacity={1}>
        {[965, 1180].map((x) => (
          <rect key={x} x={x - 5} y={-420} width={10} height={290} fill={C.inkLift} />
        ))}
        <Plinth x={960} w={1180} label="TYRANNOSAURUS REX" labelP={labelP} />
        <g transform={`translate(${MOUNT.x} ${MOUNT.y})`}>
          <TRex
            id="mount"
            skeleton={1}
            tissue={rexTissue}
            wipe="up"
            texture={texture}
            color={color}
            pose={pose}
            look={look}
            ghost={rexGhost}
            ghostColor={C.theory}
            ghostBg={C.paper}
            ghostWidth={16}
          />
        </g>
      </g>

      {/* reconstruction checklist (plum = inferred, not preserved) */}
      <g opacity={tagsOut}>
        <text x={40} y={-960} fontFamily={FONT_SANS} fontWeight={700} fontSize={24} letterSpacing={3} fill={C.theory} opacity={ramp(t, Q.fleshed - 0.2, Q.fleshed + 0.4)}>
          RECONSTRUCTED
        </text>
        {BUILD.map((b, i) => (
          <Tag
            key={b.text}
            x={40}
            y={-900 + i * 72}
            text={b.text}
            kind="theory"
            p={ramp(t, b.t - 0.05, b.t + 0.55, ease.linear)}
            size={26}
          />
        ))}
      </g>

      <LightPool x={960} y={-60} r={900} color={C.paperLight} strength={spot * 0.6} sy={0.12} />
    </Cam>
  );

  // visitors in the foreground (parallax layer)
  const crowd = (
    <Cam cam={cam} depth={1.18}>
      <g opacity={visitors} transform="translate(0 30)">
        <g transform="translate(180 0)">
          <Figure kind="modern" />
        </g>
        <g transform="translate(285 0)">
          <Figure kind="modernChild" point={point} />
        </g>
        <g transform="translate(1690 0) scale(-1 1)">
          <Figure kind="modern" />
        </g>
        <g transform="translate(1790 6) scale(-1 1)">
          <Figure kind="modern" color={C.ink} />
        </g>
      </g>
    </Cam>
  );

  const showFrame = t >= Q.someone - 0.05;
  const left = FRAME.cx - fw / 2;
  const top = FRAME.cy - fh / 2;
  const pad = 40;
  const bottom = 160;

  return (
    <Stage bg={showFrame ? deskColor : C.ink}>
      <g transform={`translate(${W * exit * 1.25} 0)`}>
        <g transform={`translate(${FRAME.cx + objX} ${FRAME.cy}) rotate(${objR}) scale(${objS}) translate(${-FRAME.cx} ${-FRAME.cy})`}>
          {showFrame && (
            <rect
              x={left - pad + 18}
              y={top - pad + 22}
              width={fw + pad * 2}
              height={fh + pad + bottom}
              rx={8}
              fill={C.ink}
              opacity={0.18 * settle}
            />
          )}
          <clipPath id="photoWindow">
            <rect x={showFrame ? left : -100} y={showFrame ? top : -100} width={showFrame ? fw : W + 200} height={showFrame ? fh : H + 200} />
          </clipPath>
          <g clipPath="url(#photoWindow)">
            {/* night/void background below ground before the museum is reached */}
            {world}
            {crowd}
          </g>
          {showFrame && (
            <g>
              <path
                d={`M${left - pad} ${top - pad} h${fw + pad * 2} v${fh + pad + bottom} h${-(fw + pad * 2)} Z M${left} ${top} v${fh} h${fw} v${-fh} Z`}
                fill={C.paperLight}
                fillRule="evenodd"
              />
              <text
                x={FRAME.cx}
                y={top + fh + bottom * 0.62}
                textAnchor="middle"
                fontFamily={FONT_SERIF}
                fontStyle="italic"
                fontWeight={600}
                fontSize={38}
                fill={C.ink}
                opacity={ramp(t, Q.photograph + 0.3, Q.photograph + 1.0)}
              >
                T. rex, reconstructed
              </text>
            </g>
          )}
        </g>
        {/* "We've gotten this badly wrong before." */}
        {question > 0 && (
          <text
            x={1380}
            y={600 + drift(t, 3, 4)}
            textAnchor="middle"
            fontFamily={FONT_SERIF}
            fontWeight={700}
            fontSize={300 * (1.25 - 0.25 * ease.outBack(Math.min(1, question)))}
            fill={C.oxblood}
            opacity={Math.min(1, question * 2.5)}
          >
            ?
          </text>
        )}
      </g>
      {flash > 0 && <rect width={W} height={H} fill={C.paperLight} opacity={0.85 * ease.in(flash)} />}
    </Stage>
  );
};
