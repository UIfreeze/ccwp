import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, clamp, hexA } from "./util";

// PLACEHOLDER monogram (original geometry, 400×400 box). Replace with DL's official logo file before any public use.
const FRAME_PATH = "M110 40 H290 A70 70 0 0 1 360 110 V290 A70 70 0 0 1 290 360 H110 A70 70 0 0 1 40 290 V110 A70 70 0 0 1 110 40 Z";
const D_PATH = "M100 115 V285 H130 A85 85 0 0 0 130 115 Z";
const L_PATH = "M250 115 V285 H305";

type Seg = { len: number; at: (s: number) => [number, number] };
const line = (x1: number, y1: number, x2: number, y2: number): Seg => ({ len: Math.hypot(x2 - x1, y2 - y1), at: (s) => [x1 + (x2 - x1) * s, y1 + (y2 - y1) * s] });
const arc = (cx: number, cy: number, r: number, a1: number, a2: number): Seg => ({ len: Math.abs(a2 - a1) * r, at: (s) => [cx + Math.cos(a1 + (a2 - a1) * s) * r, cy + Math.sin(a1 + (a2 - a1) * s) * r] });
const H = Math.PI / 2;
const SEGMENTS: Seg[] = [
  line(110, 40, 290, 40), arc(290, 110, 70, -H, 0), line(360, 110, 360, 290), arc(290, 290, 70, 0, H),
  line(290, 360, 110, 360), arc(110, 290, 70, H, Math.PI), line(40, 290, 40, 110), arc(110, 110, 70, Math.PI, Math.PI + H),
  line(100, 115, 100, 285), line(100, 285, 130, 285), arc(130, 200, 85, H, -H), line(130, 115, 100, 115),
  line(250, 115, 250, 285), line(250, 285, 305, 285),
];

/** Evenly samples `n` points along all segments (deterministic). */
const samplePoints = (n: number) => {
  const total = SEGMENTS.reduce((a, s) => a + s.len, 0);
  return Array.from({ length: n }, (_, i) => {
    let d = (i / n) * total;
    for (const s of SEGMENTS) {
      if (d <= s.len) return s.at(d / s.len);
      d -= s.len;
    }
    return SEGMENTS[0].at(0);
  });
};
const POINTS = samplePoints(300);

const Mark: React.FC<{ size: number; glow: string; draw: number; fill: number; sweep: number }> = ({ size, glow, draw, fill, sweep }) => (
  <svg width={size} height={size} viewBox="0 0 400 400" style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="dl-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1d2b28" />
        <stop offset="1" stopColor="#0a1210" />
      </linearGradient>
      <linearGradient id="dl-letter" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d9fff4" />
        <stop offset="0.5" stopColor={glow} />
        <stop offset="1" stopColor="#0d8a6f" />
      </linearGradient>
      <linearGradient id="dl-sweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <clipPath id="dl-clip"><path d={FRAME_PATH} /></clipPath>
    </defs>
    <path d={FRAME_PATH} fill="url(#dl-fill)" opacity={fill} />
    <path d={D_PATH} fill="url(#dl-letter)" opacity={fill} />
    <path d={L_PATH} fill="none" stroke="url(#dl-letter)" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" opacity={fill} />
    {[FRAME_PATH, D_PATH, L_PATH].map((d, i) => (
      <path key={i} d={d} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} stroke={i === 0 ? glow : "#e8fffa"} strokeWidth={i === 0 ? 8 : 5}
        strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${glow})` }} />
    ))}
    <g clipPath="url(#dl-clip)">
      <rect x={-200 + sweep * 800} y={-40} width={140} height={480} fill="url(#dl-sweep)" transform={`rotate(18 200 200)`} />
    </g>
  </svg>
);

export const LogoReveal: React.FC<{ glow: string; glowSoft: string; tagline: string; brandName: string; showPlaceholderNotice: boolean }> = ({
  glow, glowSoft, tagline, brandName, showPlaceholderNotice,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const u = Math.min(width, height) / 1080;
  const landscape = width > height * 1.2;
  const size = (landscape ? 330 : 380) * u;
  const cx = width / 2;
  const cy = height * (landscape ? 0.4 : 0.42);
  const floorY = cy + size / 2 + 26 * u;

  const converge = interpolate(t, [0.35, 2.1], [0, 1], { ...clamp, easing: EASE.inOut });
  const draw = interpolate(t, [1.7, 2.6], [0, 1], { ...clamp, easing: EASE.inOut });
  const fill = interpolate(t, [2.4, 3.0], [0, 1], clamp);
  const sweep = interpolate(t, [4.2, 5.3], [0, 1], clamp);
  const scale = interpolate(t, [2.4, 3.0, 7], [0.96, 1, 1.04], { ...clamp, easing: EASE.out });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 50% at 50% ${(cy / height) * 100}%, ${hexA(glowSoft, 0.35)} 0%, #050807 70%)`, opacity: interpolate(t, [0, 0.4], [0, 1], clamp) }}>
      {/* Reflective floor + fog. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: floorY, bottom: 0, background: `linear-gradient(180deg, ${hexA(glow, 0.1)} 0%, #030504 60%)`, borderTop: `1px solid ${hexA(glow, 0.25)}` }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          position: "absolute", top: floorY - 120 * u, height: 260 * u, width: width * 0.7, borderRadius: "50%",
          left: width * (0.15 + 0.12 * Math.sin(t * 0.25 + i * 2)) - width * 0.2 + i * width * 0.15,
          background: `radial-gradient(ellipse, ${hexA(glow, 0.16)} 0%, transparent 70%)`, filter: `blur(${30 * u}px)`,
          opacity: interpolate(t, [0.5, 2.5], [0, 1], clamp),
        }} />
      ))}

      {/* Particles converge on the mark outline. */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: interpolate(t, [2.3, 3.0], [1, 0], clamp) }}>
        {POINTS.map(([px, py], i) => {
          const tx = cx + (px / 400 - 0.5) * size;
          const ty = cy + (py / 400 - 0.5) * size;
          const sa = random(`lp-a-${i}`) * Math.PI * 2;
          const sr = (0.35 + random(`lp-r-${i}`) * 0.6) * Math.max(width, height);
          const sx = cx + Math.cos(sa) * sr;
          const sy = cy + Math.sin(sa) * sr * 0.7;
          const e = converge;
          const swirl = Math.sin(e * Math.PI) * 90 * u * (random(`lp-s-${i}`) - 0.5);
          const x = sx + (tx - sx) * e + Math.cos(sa + Math.PI / 2) * swirl;
          const y = sy + (ty - sy) * e + Math.sin(sa + Math.PI / 2) * swirl;
          return <circle key={i} cx={x} cy={y} r={(2.4 + random(`lp-z-${i}`) * 3) * u} fill={random(`lp-c-${i}`) > 0.8 ? "#ffffff" : glow}
            opacity={interpolate(t, [0.1 + random(`lp-d-${i}`) * 0.4, 0.6 + random(`lp-d-${i}`) * 0.4], [0, 1], clamp)} />;
        })}
      </svg>

      {/* Mark + reflection. */}
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, scale: String(scale), filter: `drop-shadow(0 0 ${30 * u * fill}px ${hexA(glow, 0.5)})` }}>
        <Mark size={size} glow={glow} draw={draw} fill={fill} sweep={sweep} />
      </div>
      <div style={{
        position: "absolute", left: cx - size / 2, top: floorY + 2 * u, scale: `${scale} ${-scale}`, opacity: 0.22 * fill,
        maskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 55%)", WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 55%)",
      }}>
        <Mark size={size} glow={glow} draw={1} fill={1} sweep={0} />
      </div>

      <div style={{ position: "absolute", left: 60 * u, right: 60 * u, top: floorY + (landscape ? 40 : 70) * u, textAlign: "center" }}>
        <div style={{
          color: "#f2fffb", fontSize: (landscape ? 58 : 66) * u, fontWeight: 700, letterSpacing: "-0.01em",
          opacity: interpolate(t, [3.2, 3.8], [0, 1], clamp), translate: `0px ${interpolate(t, [3.2, 4.0], [18 * u, 0], { ...clamp, easing: EASE.out })}px`,
          textShadow: `0 0 ${24 * u}px ${hexA(glow, 0.45)}`,
        }}>{tagline}</div>
        <div style={{
          color: glow, fontSize: (landscape ? 30 : 36) * u, fontWeight: 600, letterSpacing: "0.32em", textTransform: "uppercase", marginTop: 18 * u,
          opacity: interpolate(t, [3.9, 4.5], [0, 1], clamp),
        }}>{brandName}</div>
      </div>
      {showPlaceholderNotice ? (
        <div style={{ position: "absolute", bottom: 26 * u, width: "100%", textAlign: "center", color: "#ffffff55", fontSize: 18 * u, letterSpacing: "0.1em", opacity: fill }}>
          PLACEHOLDER MARK — REPLACE WITH OFFICIAL DL LOGO
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.7) 100%)" }} />
    </AbsoluteFill>
  );
};
