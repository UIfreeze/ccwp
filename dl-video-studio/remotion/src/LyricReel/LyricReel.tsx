import React from "react";
import { AbsoluteFill, Easing, Html5Audio, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// "Idea Se Udaan" — original one-line ink lyric reel (style learned from the aansh.ai guides; lyrics, drawings and music are original). No logo or branding.
// 120 BPM: beat 0.5 s, bar 2 s. Every lyric line = 2 bars. Music: public/lyric/music.wav (scripts/make-lyric-music.py).

export const LYRIC_SECONDS = 37;
const BEAT = 0.5;
const P = 700; // points per drawing
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MORPH = Easing.bezier(0.65, 0, 0.35, 1);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);

type Drawing = { d: string; dots?: [number, number][] };
const DRAWINGS: Drawing[] = [
  // 0 light bulb (an idea)
  { d: "M 440 700 C 440 640 330 610 330 470 C 330 330 430 250 500 250 C 570 250 670 330 670 470 C 670 610 560 640 560 700 L 560 800 L 440 800 L 440 700 L 470 700 L 470 560 L 500 610 L 530 560 L 530 700" },
  // 1 heart inside a heart
  { d: "M 500 380 C 450 260 270 270 270 420 C 270 560 430 650 500 740 C 570 650 730 560 730 420 C 730 270 550 260 500 380 C 480 330 380 330 380 420 C 380 500 460 560 500 610 C 540 560 620 500 620 420 C 620 330 520 330 500 380" },
  // 2 eye with a spiral iris (a dream)
  { d: "M 200 500 C 330 330 670 330 800 500 C 670 670 330 670 200 500 L 400 500 C 400 440 450 400 500 400 C 560 400 600 450 600 500 C 600 560 550 600 500 600 C 440 600 410 550 420 500 C 430 460 470 440 500 445 C 535 450 555 480 550 510 C 545 540 515 555 490 545" },
  // 3 constellation (a map in the stars)
  { d: "M 200 650 L 320 520 L 300 380 L 450 300 L 560 420 L 700 330 L 800 450 L 690 600 L 560 560 L 450 700 L 320 520",
    dots: [[200, 650], [320, 520], [300, 380], [450, 300], [560, 420], [700, 330], [800, 450], [690, 600], [560, 560], [450, 700]] },
  // 4 network: every line connected
  { d: "M 500 250 L 720 375 L 720 625 L 500 750 L 280 625 L 280 375 L 500 250 L 500 500 L 720 375 L 500 500 L 720 625 L 500 500 L 500 750 L 500 500 L 280 625 L 500 500 L 280 375",
    dots: [[500, 250], [720, 375], [720, 625], [500, 750], [280, 625], [280, 375], [500, 500]] },
  // 5 the plan becomes an app screen
  { d: "M 380 240 L 620 240 C 650 240 660 250 660 280 L 660 720 C 660 750 650 760 620 760 L 380 760 C 350 760 340 750 340 720 L 340 280 C 340 250 350 240 380 240 L 380 300 L 620 300 L 620 420 L 380 420 L 380 460 L 600 460 L 600 490 L 380 490 L 380 530 L 560 530 L 560 560 L 380 560 L 380 650 L 620 650 L 620 700 L 380 700" },
  // 6 rocket (take off)
  { d: "M 500 220 C 580 300 610 420 600 560 L 660 640 L 660 720 L 590 680 L 410 680 L 340 720 L 340 640 L 400 560 C 390 420 420 300 500 220 L 500 300 C 540 300 560 360 540 400 C 520 440 480 440 460 400 C 440 360 460 300 500 300" },
];

// Lyric lines: [start s, words, drawing index]. Each word lands on a beat of the line's first bar.
const LINES: [number, string[], number][] = [
  [4, ["ek", "chhota", "sa", "idea"], 0],
  [8, ["dil", "mein", "jalta", "hai"], 1],
  [12, ["aankhon", "mein", "sapna", "hai"], 2],
  [16, ["taaron", "ka", "naksha", "banta"], 3],
  [20, ["har", "line", "se", "line"], 4],
  [24, ["plan", "ban", "jaata", "hai"], 5],
  [28, ["ab", "udne", "ki", "baari"], 6],
];
const OUTRO = 32;

let cache: [number, number][][] | null = null;
/** Resamples each SVG path into P evenly spaced points (uses the browser's SVG geometry, so it runs in Studio and render). */
const points = () => {
  if (cache) return cache;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  cache = DRAWINGS.map(({ d }) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
    const len = path.getTotalLength();
    return Array.from({ length: P }, (_, i) => {
      const pt = path.getPointAtLength((i / (P - 1)) * len);
      return [pt.x, pt.y] as [number, number];
    });
  });
  return cache;
};

export const LyricReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const pts = points();

  // Which drawing, and how far into the morph from the previous one.
  const lineIdx = LINES.reduce((acc, [s], i) => (t >= s ? i : acc), -1);
  const target = lineIdx < 0 ? 0 : LINES[lineIdx][2];
  const prev = lineIdx <= 0 ? 0 : LINES[lineIdx - 1][2];
  const since = lineIdx < 0 ? 0 : t - LINES[lineIdx][0];
  const m = MORPH(Math.min(1, since / 0.32));

  // Layout: drawing box 1000 → ~860 px, centred in the upper-middle (Reels safe area).
  const S = 0.86;
  const ox = (width - 1000 * S) / 2;
  const oy = 300;

  // Kick-drum punch (4 s → 32 s, except the break), with a bigger hit on the drop.
  const onKick = t >= 4 && t < OUTRO && !(t >= 18 && t < 20);
  const sinceKick = onKick ? t % BEAT : 9;
  const drop = t - 20;
  const punch = 1 + (onKick ? 0.022 * Math.exp(-sinceKick * 12) : 0) + (drop >= 0 && drop < 1 ? 0.07 * Math.exp(-drop * 5) : 0);

  // Rocket lift-off at the end of the last line, then the line collapses into the mark.
  const lift = interpolate(t, [31.0, 32.0], [0, -1200], { ...clamp, easing: Easing.in(Easing.cubic) });
  const collapse = interpolate(t, [OUTRO, OUTRO + 0.4], [0, 1], { ...clamp, easing: MORPH });
  const intro = interpolate(t, [0.3, 3.2], [0, 1], { ...clamp, easing: OUT }); // line draws itself on

  const cur = pts[target];
  const from = pts[prev];
  const shown = Math.max(2, Math.round(P * intro));
  const poly: string[] = [];
  for (let i = 0; i < shown; i++) {
    const wob = Math.sin(t * 2.2 + i * 0.09) * 1.6; // tiny hand-drawn breathing
    let x = from[i][0] + (cur[i][0] - from[i][0]) * m + wob;
    let y = from[i][1] + (cur[i][1] - from[i][1]) * m + wob * 0.6;
    if (collapse > 0) { x = x + (500 - x) * collapse; y = y + (500 - y) * collapse; }
    poly.push(`${(ox + x * S).toFixed(1)},${(oy + y * S + lift).toFixed(1)}`);
  }
  const head = poly[Math.floor((t * 0.35 % 1) * (shown - 1))].split(",").map(Number);
  const dots = DRAWINGS[target].dots && m > 0.95 && collapse === 0 ? DRAWINGS[target].dots : null;

  // Background warms from midnight navy to deep crimson as the song builds.
  const warm = interpolate(t, [0, 16, 20, 31, 33], [0, 0.25, 0.75, 1, 0.6], clamp);
  const bgTop = mixHex("#0a1024", "#3a1410", warm);
  const glowCol = mixHex("#3b5bdb", "#ff6b5e", warm);
  const ink = "#fff1e6";
  const streaks = interpolate(t, [18, 20, 23.5, 24, 28.5, 30, 32], [0, 1, 1, 0, 0, 1, 0], clamp);
  const flash = (drop >= 0 ? interpolate(drop, [0, 0.05, 0.35], [0, 0.35, 0], clamp) : 0) + interpolate(t, [OUTRO + 0.3, OUTRO + 0.4, OUTRO + 0.9], [0, 0.6, 0], clamp);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${bgTop} 0%, #05060b 75%)`, overflow: "hidden", fontFamily: '"Helvetica Neue", "Segoe UI", Arial, sans-serif' }}>
      <Html5Audio src={staticFile("lyric/music.wav")} />
      <Grain t={t} />
      {streaks > 0 ? <Streaks t={t} amount={streaks} color={ink} /> : null}

      <AbsoluteFill style={{ scale: String(punch), transformOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", left: width / 2 - 450, top: oy + 430 - 450, width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, ${glowCol}55 0%, transparent 65%)`, filter: "blur(30px)", opacity: 1 - collapse }} />
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 6px ${glowCol}) drop-shadow(0 0 22px ${glowCol})` }}>
          <polyline points={poly.join(" ")} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={1 - interpolate(collapse, [0.8, 1], [0, 1], clamp)} />
          {dots?.map(([x, y], i) => (
            <circle key={i} cx={ox + x * S} cy={oy + y * S + lift} r={11 + 3 * Math.sin(t * 6 + i)} fill={ink} />
          ))}
          {t < OUTRO ? <circle cx={head[0]} cy={head[1]} r={9} fill="#ffffff" /> : null}
          {t > 31 && t < OUTRO ? <Flame x={ox + 500 * S} y={oy + 700 * S + lift} t={t} color={ink} /> : null}
        </svg>
      </AbsoluteFill>

      {t < 4.2 ? <Title t={t} ink={ink} glow={glowCol} /> : null}
      {lineIdx >= 0 && t < OUTRO ? <Lyric t={t} line={LINES[lineIdx]} ink={ink} glow={glowCol} /> : null}
      {t >= OUTRO + 0.2 ? <Outro t={t - OUTRO} ink={ink} glow={glowCol} /> : null}
      <AbsoluteFill style={{ background: "#fff6ee", opacity: flash, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

const Lyric: React.FC<{ t: number; line: [number, string[], number]; ink: string; glow: string }> = ({ t, line, ink, glow }) => {
  const [start, words] = line;
  const out = interpolate(t, [start + 3.7, start + 3.98], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1270, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 26, rowGap: 6, opacity: out }}>
      {words.map((w, i) => {
        const at = start + i * BEAT - 0.07; // lands just ahead of the beat
        const p = interpolate(t, [at, at + 0.22], [0, 1], { ...clamp, easing: OUT });
        const active = t >= at && t < at + BEAT + (i === words.length - 1 ? 2 : 0);
        return (
          <span key={i} style={{
            fontSize: 104, fontWeight: 800, letterSpacing: "-0.01em", color: ink, opacity: p,
            translate: `0px ${(1 - p) * 40}px`, scale: String(interpolate(p, [0, 1], [0.8, 1])),
            textShadow: active ? `0 0 18px ${glow}, 0 0 44px ${glow}` : `0 0 10px ${glow}88`,
          }}>{w}</span>
        );
      })}
    </div>
  );
};

const Title: React.FC<{ t: number; ink: string; glow: string }> = ({ t, ink, glow }) => (
  <div style={{ position: "absolute", top: 1290, width: "100%", textAlign: "center", opacity: interpolate(t, [0.8, 1.4, 3.6, 4.0], [0, 1, 1, 0], clamp) }}>
    <div style={{ color: ink, fontSize: 96, fontWeight: 800, letterSpacing: "0.02em", textShadow: `0 0 30px ${glow}` }}>Idea Se Udaan</div>
    <div style={{ color: `${ink}aa`, fontSize: 34, letterSpacing: "0.3em", marginTop: 18, textTransform: "uppercase" }}>one line · one idea</div>
  </div>
);

const Outro: React.FC<{ t: number; ink: string; glow: string }> = ({ t, ink, glow }) => {
  const p = interpolate(t, [0.2, 1.0], [0, 1], { ...clamp, easing: OUT });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44, paddingBottom: 200 }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: ink, opacity: p, scale: String(interpolate(p, [0, 1], [0.4, 1]) * (1 + 0.08 * Math.sin(t * 5))), boxShadow: `0 0 30px 10px ${glow}, 0 0 90px 30px ${glow}88` }} />
      <div style={{ color: ink, fontSize: 76, fontWeight: 800, opacity: interpolate(t, [0.9, 1.5], [0, 1], clamp), textShadow: `0 0 26px ${glow}` }}>idea se udaan tak</div>
    </AbsoluteFill>
  );
};

const Flame: React.FC<{ x: number; y: number; t: number; color: string }> = ({ x, y, t, color }) => {
  const f = 1 + 0.25 * Math.sin(t * 40);
  return <path d={`M ${x - 40} ${y} Q ${x} ${y + 170 * f} ${x + 40} ${y}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />;
};

const Streaks: React.FC<{ t: number; amount: number; color: string }> = ({ t, amount, color }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: amount * 0.5 }}>
    {Array.from({ length: 40 }, (_, i) => {
      const x = random(`sx${i}`) * 1080;
      const len = 120 + random(`sl${i}`) * 260;
      const y = ((random(`sy${i}`) * 2400 + t * (1400 + random(`sv${i}`) * 900)) % 2400) - 300;
      return <line key={i} x1={x} y1={y} x2={x} y2={y + len} stroke={color} strokeWidth={2} opacity={0.5 * random(`so${i}`)} />;
    })}
  </svg>
);

const Grain: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "screen" }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(t * 30) % 50} /></filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

const mixHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
};
