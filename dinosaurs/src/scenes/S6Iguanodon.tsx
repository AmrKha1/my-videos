import React from 'react';
import {C, FONT_SANS, FONT_SERIF, W} from '../theme';
import {Q} from '../cues';
import {camAt, drift, ease, lerp, mixHex, ramp} from '../lib/anim';
import {Cam, LightPool, Stage, Tag} from '../components/common';
import {Iguanodon, IGUANODON_NOSE, SpikeShape} from '../components/Iguanodon';
import {Scientist, scientistHand} from '../components/People';
import {Figure} from '../components/People';
import {Bone} from '../components/bones';
import {hash} from '../components/Environments';

// 30.2 s - end, one continuous world:
//  lamp-lit study (scientists, Iguanodon, the strange spike) -> the pinned reconstruction sheet
//  ("best guess": a horn on the nose) -> lights up, years pass: drawn, sculpted, displayed
//  -> the statue is peeled back to what it really was: a reading of incomplete evidence.

const SCI = {x: 560, y: 1080, s: 1.25};
const SHEET = {x: 460, y: -760, w: 1200, h: 640};
const IG_SHEET = {x: 560, y: -700, s: 0.8};
const STATUE = {x: 2049, y: -356, s: 0.95};
const SPIKE_TABLE = {x: 772, y: 688};

const toWorld = (p: {x: number; y: number}) => ({x: SCI.x + p.x * SCI.s, y: SCI.y + p.y * SCI.s});
const toLocal = (p: {x: number; y: number}) => ({x: (p.x - SCI.x) / SCI.s, y: (p.y - SCI.y) / SCI.s});

const lerpPt = (a: {x: number; y: number}, b: {x: number; y: number}, k: number) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});

export const S6Iguanodon: React.FC<{t: number}> = ({t}) => {
  // ---------- camera ----------
  const cam = camAt(t, [
    [30.2, 960, 560, 1.06],
    [33.0, 940, 540, 1.0],
    [34.6, 1060, -430, 1.18],
    [36.4, 1060, -440, 1.22],
    [37.5, 880, 560, 1.3],
    [40.6, 860, 540, 1.36],
    [42.0, 1060, -440, 1.25],
    [44.3, 1120, -430, 1.32],
    [46.6, 1240, -420, 1.5],
    [48.9, 1808, -150, 0.62],
    [50.95, 1880, -150, 0.64],
    [53.5, 2600, -60, 1.0],
    [56.4, 2620, -60, 1.04],
  ]);

  // ---------- lighting / environment ----------
  const day = ramp(t, Q.forYears + 0.05, Q.forYears + 1.2, ease.inOutSine);
  const wall = mixHex(C.ink, C.paper, day);
  const studyOut = 1 - day;

  // ---------- scientist & spike ----------
  const chin = {x: 50, y: -458};
  const grab = toLocal({x: SPIKE_TABLE.x + 4, y: SPIKE_TABLE.y - 6});
  const show = {x: 112, y: -478};
  const rest = {x: 70, y: -300};
  const reach = ramp(t, Q.spike - 0.2, Q.spike + 0.55, ease.inOut);
  const lift = ramp(t, Q.spike + 0.6, Q.spike + 1.4, ease.inOut);
  const lower = ramp(t, 42.6, 43.4, ease.inOut);
  let target = lerpPt(rest, chin, ramp(t, 31.2, 32.2, ease.inOut));
  target = lerpPt(target, rest, ramp(t, 35.6, 36.3, ease.inOut));
  target = lerpPt(target, grab, reach);
  target = lerpPt(target, show, lift);
  target = lerpPt(target, rest, lower);
  const hand = toWorld(scientistHand(target));
  const held = t >= Q.spike + 0.55;

  const flyK = ramp(t, 43.55, Q.horn, ease.inOut);
  const landed = t >= Q.horn;
  const noseWorld = {x: IG_SHEET.x + IGUANODON_NOSE.x * IG_SHEET.s, y: IG_SHEET.y + (IGUANODON_NOSE.y + 6) * IG_SHEET.s};
  const spikeStart = held ? {x: hand.x + 4, y: hand.y - 8} : SPIKE_TABLE;
  let spikePos = spikeStart;
  let spikeRot = held ? lerp(70, -8, ramp(t, Q.spike + 0.55, Q.spike + 1.3)) : 70;
  let spikeScale = 1;
  const inFlight = t >= 43.55 && !landed;
  if (inFlight) {
    const arc = Math.sin(flyK * Math.PI) * -220;
    spikePos = {x: lerp(spikeStart.x, noseWorld.x, flyK), y: lerp(spikeStart.y, noseWorld.y, flyK) + arc};
    spikeRot = lerp(-8, 360, ease.inOut(flyK));
    spikeScale = lerp(1, IG_SHEET.s, flyK);
  }
  const blink = [33.9, 36.8, 39.7, 44.0].some((b) => t > b && t < b + 0.12) ? 1 : 0;
  const tilt = ramp(t, Q.couldntPlace - 0.1, Q.couldntPlace + 0.5) * 9 - ramp(t, 42.4, 43.0) * 9;
  const brow = ramp(t, Q.strange - 0.1, Q.strange + 0.4) - ramp(t, 42.4, 43.0) * 0.6;
  const spikePulse = ramp(t, Q.strange - 0.1, Q.strange + 0.4) * (1 - ramp(t, 40.6, 41.4));
  const thinkQ = ramp(t, Q.couldntPlace, Q.couldntPlace + 0.45, ease.out) * (1 - ramp(t, 41.3, 41.8));

  // ---------- the sheet (their reconstruction) ----------
  const sketch = ramp(t, 33.4, 35.4, ease.inOut);
  const title = ramp(t, Q.iguanodon - 0.05, Q.iguanodon + 0.6, ease.linear);
  const guessMarks = [0, 1, 2].map((i) => ramp(t, 40.95 + i * 0.22, 41.4 + i * 0.22, ease.out) * (1 - ramp(t, Q.bestGuess + 0.5, Q.bestGuess + 1.0)));
  const fillGuess = ramp(t, 42.4, 43.5, ease.inOut);
  const bestTag = ramp(t, Q.horn + 0.1, Q.horn + 0.6, ease.linear) * (1 - ramp(t, 47.4, 47.9));
  const noseRing = t > Q.nose - 0.1 ? Math.max(0, 1 - (t - (Q.nose - 0.1)) / 0.9) : 0;

  // ---------- years: drawn, sculpted, displayed ----------
  const frameIn = ramp(t, 47.0, 47.9, ease.inOut);
  const toInk = ramp(t, 48.2, Q.drawn + 0.35, ease.inOut);
  const drawOn = ramp(t, 48.4, Q.drawn + 0.3, ease.inOut);
  const gallery = ramp(t, 47.1, 48.2, ease.inOutSine);
  const carve = ramp(t, Q.sculpted - 0.2, Q.sculpted + 0.65, ease.inOut);
  const crowdIn = ramp(t, Q.displayed - 0.2, Q.displayed + 0.6, ease.out);
  const crowdOut = ramp(t, Q.stupidity, Q.stupidity + 0.7, ease.inOut);
  const sweep = ramp(t, Q.forYears, 52.5, ease.inOutSine);
  const caption = (a: number) => ramp(t, a - 0.05, a + 0.4, ease.out) * (1 - ramp(t, Q.stupidity, Q.stupidity + 0.5));

  // ---------- the point ----------
  const reading = ramp(t, Q.bestPossible, Q.bestPossible + 0.9, ease.inOut);
  const evidence = ramp(t, Q.bestPossible + 0.4, Q.reading + 0.5, ease.inOut);
  const tagRead = ramp(t, Q.bestPossible + 0.6, Q.bestPossible + 1.1, ease.linear);
  const tagEv = ramp(t, Q.reading + 0.2, Q.reading + 0.7, ease.linear);
  const head1 = ramp(t, Q.bestPossible - 0.05, Q.bestPossible + 0.6);
  const head2 = ramp(t, Q.incomplete - 0.05, Q.incomplete + 0.6);

  const books = Array.from({length: 22}).map((_, i) => ({
    w: 26 + hash(i) * 22,
    h: 120 + hash(i + 40) * 70,
    c: [C.inkLift, C.inkMute, '#5A2A20', C.inkSoft][Math.floor(hash(i + 7) * 4)],
  }));

  return (
    <Stage bg={wall}>
      <Cam cam={cam}>
        {/* ---------------- study ---------------- */}
        <g opacity={studyOut}>
          {Array.from({length: 40}).map((_, i) => (
            <rect key={i} x={-1000 + i * 120} y={-1500} width={56} height={2700} fill={C.inkSoft} opacity={0.55} />
          ))}
          {/* bookshelf */}
          <g transform="translate(1500 90)">
            <rect x={0} y={0} width={420} height={612} fill={C.inkSoft} />
            {[0, 1, 2].map((r) => {
              let x = 18;
              return (
                <g key={r}>
                  {books.slice(r * 7, r * 7 + 7).map((b, i) => {
                    const el = <rect key={i} x={x} y={190 * (r + 1) - b.h * 0.8} width={b.w} height={b.h * 0.8} rx={3} fill={b.c} />;
                    x += b.w + 6;
                    return el;
                  })}
                  <rect x={0} y={190 * (r + 1)} width={420} height={14} fill={C.inkLift} />
                </g>
              );
            })}
          </g>
          <LightPool x={250} y={590} r={1100} color={C.lamp} strength={1.5 + drift(t, 2.3, 0.08)} />
        </g>

        {/* ---------------- gallery (fades in as the years pass) ---------------- */}
        {gallery > 0 && (
          <g opacity={gallery}>
            {[0, 1, 2].map((i) => {
              const x = lerp(-300, 1700, sweep) + i * 900;
              return <path key={i} d={`M${x} -1400 L${x + 300} -1400 L${x + 900} 470 L${x + 600} 470 Z`} fill={C.paperLight} opacity={0.45} />;
            })}
            <rect x={-1000} y={440} width={5000} height={30} fill={C.paperDeep} />
            <rect x={-1000} y={470} width={5000} height={1100} fill={C.paperShade} />
          </g>
        )}

        {/* ---------------- the sheet / framed print ---------------- */}
        <g>
          {frameIn > 0 && (
            <g opacity={frameIn}>
              <rect x={SHEET.x - 60 + 18} y={SHEET.y - 60 + 22} width={SHEET.w + 120} height={SHEET.h + 120} fill={C.ink} opacity={0.15} />
              <rect x={SHEET.x - 60} y={SHEET.y - 60} width={SHEET.w + 120} height={SHEET.h + 120} rx={6} fill={C.inkLift} />
              <rect x={SHEET.x - 24} y={SHEET.y - 24} width={SHEET.w + 48} height={SHEET.h + 48} fill="none" stroke={C.caution} strokeWidth={5} />
            </g>
          )}
          <rect x={SHEET.x + 14} y={SHEET.y + 20} width={SHEET.w} height={SHEET.h} fill={C.ink} opacity={0.25 * studyOut} />
          <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} fill={C.paperLight} />
          {/* lamp light falling on the sheet */}
          <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} fill={C.lamp} opacity={0.1 * studyOut} />
          {[SHEET.x + 28, SHEET.x + SHEET.w - 28].map((x) => (
            <circle key={x} cx={x} cy={SHEET.y + 28} r={11} fill={C.oxblood} opacity={studyOut} />
          ))}
          <text x={SHEET.x + 50} y={SHEET.y + 84} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={50} fill={C.ink} opacity={title}>
            Iguanodon
          </text>
          <clipPath id="sketchWipe">
            <rect x={SHEET.x} y={SHEET.y} width={SHEET.w * sketch} height={SHEET.h} />
          </clipPath>
          {/* their reconstruction: dashed (guess) -> plum fill -> ink print.
              The clip lives OUTSIDE the scaled group so its rect is in world space. */}
          <g clipPath="url(#sketchWipe)" opacity={1 - toInk}>
            <g transform={`translate(${IG_SHEET.x} ${IG_SHEET.y}) scale(${IG_SHEET.s})`}>
              <Iguanodon
                fillAmt={fillGuess}
                fill={C.theoryTint}
                shade={C.theory}
                outline={C.theory}
                dashed
                outlineAmt={1}
                outlineW={8}
                knockBg={C.paperLight}
                eye={fillGuess > 0.3}
              />
            </g>
          </g>
          <g transform={`translate(${IG_SHEET.x} ${IG_SHEET.y}) scale(${IG_SHEET.s})`}>
            {toInk > 0 && (
              <g opacity={toInk}>
                <Iguanodon fillAmt={0} outline={C.ink} outlineW={6} outlineAmt={1} draw={drawOn} knockBg={drawOn >= 1 ? C.paperLight : undefined} hatching={drawOn} />
              </g>
            )}
            {/* "couldn't quite place it": candidate spots */}
            {[
              {x: 150, y: 520},
              {x: 640, y: 300},
              {x: 880, y: 600},
            ].map((m, i) =>
              guessMarks[i] > 0 ? (
                <g key={i} transform={`translate(${m.x} ${m.y}) scale(${guessMarks[i]})`} opacity={guessMarks[i]}>
                  <g transform="rotate(-20)" opacity={0.9}>
                    <SpikeShape fill="none" stroke={C.caution} sw={5} scale={1.1} />
                  </g>
                  <text x={44} y={-30} fontFamily={FONT_SERIF} fontWeight={700} fontSize={64} fill={C.caution}>
                    ?
                  </text>
                </g>
              ) : null
            )}
            {/* the horn, once landed */}
            {landed && (
              <g transform={`translate(${IGUANODON_NOSE.x} ${IGUANODON_NOSE.y + 6}) scale(${lerp(1.18, 1, ease.outBack(ramp(t, Q.horn, Q.horn + 0.35, ease.linear)))})`}>
                <SpikeShape fill={mixHex(C.bone, C.paperLight, toInk)} stroke={C.ink} sw={6} />
              </g>
            )}
            {noseRing > 0 && (
              <circle cx={IGUANODON_NOSE.x} cy={IGUANODON_NOSE.y - 24} r={60 + (1 - noseRing) * 50} fill="none" stroke={C.oxblood} strokeWidth={8} opacity={noseRing} />
            )}
          </g>
          <Tag x={SHEET.x + 640} y={SHEET.y + 96} text="BEST GUESS: A NOSE HORN" kind="theory" p={bestTag} to={{x: noseWorld.x - 4, y: noseWorld.y - 40}} size={24} />
          <text x={SHEET.x + SHEET.w / 2} y={SHEET.y + SHEET.h + 130} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={56} letterSpacing={12} fill={C.ink} opacity={caption(Q.drawn)}>
            DRAWN
          </text>
        </g>

        {/* ---------------- workbench ---------------- */}
        <g opacity={studyOut}>
          {/* lamp */}
          <g transform="translate(250 700)">
            <rect x={-60} y={-18} width={120} height={18} rx={6} fill={C.inkLift} />
            <path d="M-40 -18 C-46 -60 -34 -80 0 -84 C34 -80 46 -60 40 -18 Z" fill={C.oxblood} />
            <path d="M-26 -84 C-34 -120 -30 -170 -16 -200 L16 -200 C30 -170 34 -120 26 -84 Z" fill={C.paperLight} opacity={0.35} />
            <path d={`M0 ${-104 - drift(t, 0.7, 4)} C14 -124 10 -150 0 -168 C-10 -150 -14 -124 0 ${-104 - drift(t, 0.7, 4)} Z`} fill={C.lamp} />
            <circle cy={-135} r={52} fill={C.lamp} opacity={0.18} />
          </g>
          {/* scientist behind the bench */}
          <g transform={`translate(${SCI.x} ${SCI.y}) scale(${SCI.s})`}>
            <Scientist hand={target} headTilt={tilt} blink={blink} brow={Math.max(0, brow)} breathe={t} lit={1} />
          </g>
          {/* bench */}
          <rect x={60} y={700} width={1820} height={36} rx={4} fill={C.inkMute} />
          <rect x={60} y={700} width={1820} height={8} fill={C.lamp} opacity={0.35} />
          <rect x={60} y={736} width={1820} height={600} fill={C.inkLift} />
          {[300, 900, 1500].map((x) => (
            <g key={x}>
              <rect x={x - 200} y={780} width={400} height={180} rx={6} fill="none" stroke={C.inkSoft} strokeWidth={6} />
              <circle cx={x} cy={870} r={10} fill={C.lamp} opacity={0.5} />
            </g>
          ))}
          {/* fossils on the bench */}
          <Bone a={{x: 880, y: 676}} b={{x: 1110, y: 684}} w={30} />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${1186 + i * 62} 664)`}>
              <rect x={-24} y={-6} width={48} height={42} rx={14} fill={C.bone} stroke={C.ink} strokeWidth={4} />
              <rect x={-7} y={-40} width={14} height={36} rx={7} fill={C.bone} stroke={C.ink} strokeWidth={4} />
            </g>
          ))}
          <path d="M1380 700 L1530 700 C1528 680 1500 664 1460 662 C1420 660 1390 672 1380 700 Z" fill={C.bone} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${1400 + i * 24} 668 l6 -16 l6 16 Z`} fill={C.bone} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          ))}
          <Tag x={1080} y={600} text="FOSSILS" kind="evidence" p={ramp(t, Q.amongFossils - 0.05, Q.amongFossils + 0.5, ease.linear) * (1 - ramp(t, 40.9, 41.4))} size={24} anchor="center" />
          {/* specimen label */}
          <g transform={`translate(0 ${(1 - ease.out(ramp(t, Q.iguanodon - 0.1, Q.iguanodon + 0.5, ease.linear))) * 30})`} opacity={ramp(t, Q.iguanodon - 0.1, Q.iguanodon + 0.3)}>
            <rect x={900} y={712} width={300} height={56} rx={4} fill={C.paperLight} />
            <text x={1050} y={751} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={32} fill={C.ink}>
              Iguanodon
            </text>
          </g>
          {spikePulse > 0 && !inFlight && (
            <g transform={`translate(${spikePos.x} ${spikePos.y - 20})`}>
              <circle r={62 + drift(t, 0.9, 6)} fill="none" stroke={C.caution} strokeWidth={6} opacity={spikePulse} />
              <circle r={62 + drift(t, 0.9, 6)} fill={C.caution} opacity={0.12 * spikePulse} />
            </g>
          )}
          {thinkQ > 0 && (
            <text x={SCI.x + 130} y={SCI.y - 590 * SCI.s + (1 - thinkQ) * 20} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={110} fill={C.caution} opacity={thinkQ}>
              ?
            </text>
          )}
          <Tag
            x={spikePos.x + 90}
            y={spikePos.y - 120}
            text="SPIKE-SHAPED BONE"
            kind="caution"
            p={ramp(t, Q.spike - 0.05, Q.spike + 0.5, ease.linear) * (1 - ramp(t, 40.7, 41.2))}
            size={24}
          />
        </g>

        {/* the spike itself (on the bench, in hand, in flight) */}
        {!landed && (
          <g transform={`translate(${spikePos.x} ${spikePos.y}) rotate(${spikeRot}) scale(${spikeScale})`} opacity={studyOut + (inFlight ? 1 : 0)}>
            <SpikeShape fill={C.bone} stroke={C.ink} sw={6} />
          </g>
        )}

        {/* ---------------- statue ---------------- */}
        {gallery > 0 && (
          <g opacity={gallery}>
            <rect x={2050 + 16} y={260 + 16} width={1100} height={210} fill={C.ink} opacity={0.12} />
            <rect x={2050} y={260} width={1100} height={210} rx={4} fill={C.ink} />
            <rect x={2050} y={260} width={1100} height={14} fill={C.inkLift} />
            <g opacity={caption(Q.sculpted)}>
              <rect x={2350} y={322} width={500} height={86} rx={4} fill={C.paperShade} />
              <text x={2600} y={381} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={46} letterSpacing={10} fill={C.ink}>
                SCULPTED
              </text>
            </g>
            <clipPath id="carveBlock">
              <rect x={2000} y={lerp(-480, 262, carve)} width={1200} height={800} />
            </clipPath>
            <clipPath id="carveStatue">
              <rect x={2000} y={-600} width={1200} height={lerp(120, 862, carve)} />
            </clipPath>
            <g clipPath="url(#carveBlock)" opacity={1 - reading}>
              <path d="M2090 -330 L3120 -370 L3140 262 L2070 262 Z" fill={C.paperDeep} />
              <path d="M2090 -330 L3120 -370 L3124 -300 L2090 -270 Z" fill={C.paperShade} />
            </g>
            {carve > 0 && carve < 1 && (
              <g fill={C.paperDeep}>
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const y0 = lerp(-480, 262, carve);
                  const fall = ((t * 3 + hash(i)) % 1) * 140;
                  return <rect key={i} x={2150 + hash(i + 3) * 900} y={y0 + fall} width={14} height={10} rx={3} transform={`rotate(${hash(i) * 90} ${2150 + hash(i + 3) * 900} ${y0 + fall})`} />;
                })}
              </g>
            )}
            <g clipPath="url(#carveStatue)">
              <g transform={`translate(${STATUE.x} ${STATUE.y}) scale(${STATUE.s})`}>
                <g opacity={1 - reading}>
                  <Iguanodon fill={C.paperShade} shade={C.paperDeep} far={C.paperDeep} belly={C.paperLight} horn={1} hornFill={C.paperShade} eye={false} />
                  <circle cx={1012} cy={330} r={7} fill={C.paperDeep} />
                </g>
                {reading > 0 && (
                  <g opacity={reading}>
                    <Iguanodon fillAmt={0} outline={C.theory} outlineW={8} dashed outlineAmt={1} knockBg={C.paper} eye={false} />
                    {/* the actual evidence: a handful of bones (green = confirmed) */}
                    <g opacity={evidence}>
                      <Bone a={{x: 470, y: 420}} b={{x: 515, y: 575}} w={28} fill={C.bone} stroke={C.evidence} sw={5} />
                      {[0, 1, 2, 3].map((i) => (
                        <g key={i} transform={`translate(${590 + i * 62} 362)`}>
                          <rect x={-24} y={-20} width={48} height={40} rx={14} fill={C.bone} stroke={C.evidence} strokeWidth={5} />
                          <rect x={-7} y={-52} width={14} height={34} rx={7} fill={C.bone} stroke={C.evidence} strokeWidth={5} />
                        </g>
                      ))}
                      <path d="M960 372 L1080 372 C1078 352 1050 340 1020 338 C990 336 968 348 960 372 Z" fill={C.bone} stroke={C.evidence} strokeWidth={5} strokeLinejoin="round" />
                      <Bone a={{x: 830, y: 470}} b={{x: 850, y: 590}} w={20} fill={C.bone} stroke={C.evidence} sw={5} />
                    </g>
                    <g transform={`translate(${IGUANODON_NOSE.x} ${IGUANODON_NOSE.y + 6})`}>
                      <SpikeShape fill={C.bone} stroke={C.caution} sw={7} />
                    </g>
                    <text x={IGUANODON_NOSE.x + 40} y={IGUANODON_NOSE.y - 60} fontFamily={FONT_SERIF} fontWeight={700} fontSize={72} fill={C.caution} opacity={tagEv}>
                      ?
                    </text>
                  </g>
                )}
              </g>
            </g>
            <text x={2600} y={-210} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={56} letterSpacing={12} fill={C.ink} opacity={caption(Q.displayed)}>
              DISPLAYED
            </text>
            <Tag x={2160} y={-330} text="READING" kind="theory" p={tagRead} to={{x: STATUE.x + 520 * STATUE.s, y: STATUE.y + 330 * STATUE.s}} size={28} />
            <Tag x={2200} y={366} text="EVIDENCE" kind="evidence" p={tagEv} to={{x: STATUE.x + 500 * STATUE.s, y: STATUE.y + 520 * STATUE.s}} size={28} />
          </g>
        )}
      </Cam>

      {/* ---------------- the public (foreground parallax) ---------------- */}
      {crowdIn > 0 && crowdOut < 1 && (
        <Cam cam={cam} depth={1.15}>
          <g transform={`translate(${(1 - crowdIn) * 900} ${crowdOut * 700})`}>
            <g transform="translate(1990 720) scale(1.6)">
              <Figure kind="tophat" color={C.ink} />
            </g>
            <g transform="translate(2240 720) scale(1.6)">
              <Figure kind="bonnet" color={C.inkSoft} />
            </g>
            <g transform="translate(2470 720) scale(1.6)">
              <Figure kind="child" color={C.ink} point={ramp(t, 51.2, 51.7, ease.out)} />
            </g>
            <g transform="translate(2990 720) scale(-1.6 1.6)">
              <Figure kind="bonnet" color={C.ink} />
            </g>
            <g transform="translate(3230 720) scale(-1.6 1.6)">
              <Figure kind="tophat" color={C.inkSoft} />
            </g>
          </g>
        </Cam>
      )}

      {/* ---------------- closing line ---------------- */}
      {head1 > 0 && (
        <text x={W / 2} y={128 + (1 - ease.out(head1)) * 16} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={60} fill={C.ink}>
          <tspan fillOpacity={ease.out(head1)}>the best possible </tspan>
          <tspan fill={C.theory} fillOpacity={ease.out(head1)}>
            reading
          </tspan>
          <tspan fillOpacity={ease.out(head2)}> of </tspan>
          <tspan fill={C.evidence} fillOpacity={ease.out(head2)}>
            incomplete evidence
          </tspan>
        </text>
      )}
    </Stage>
  );
};
