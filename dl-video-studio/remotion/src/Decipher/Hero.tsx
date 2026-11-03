import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Starfield } from "./Starfield";
import { Vignette } from "./ChaosToCore";
import { EASE, clamp, hexA } from "./util";

/** The hero object: a glass blueprint slab with three plan sheets rising out of it. */
export const Hero: React.FC<{ glow: string; glowSoft: string; warm: string }> = ({ glow, glowSoft, warm }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const end = durationInFrames / fps;
  const u = Math.min(width, height) / 1080;
  const landscape = width > height * 1.2;
  const pw = (landscape ? 760 : 640) * u;
  const ph = (landscape ? 470 : 430) * u;
  const sweep = interpolate(t, [1.2, 2.4], [-0.4, 1.4], clamp);

  const sheets = [
    { kind: "flow", x: -0.3, rot: -8, delay: 0.35 },
    { kind: "screen", x: 0, rot: 0, delay: 0.55 },
    { kind: "chart", x: 0.3, rot: 8, delay: 0.75 },
  ] as const;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${hexA(glowSoft, 0.4)} 0%, transparent 70%)`,
        opacity: interpolate(t, [end - 0.55, end - 0.1], [1, 0], clamp),
      }}
    >
      <Starfield width={width} height={height} cx={width / 2} cy={height / 2} travel={t * 0.05} speed={0.6} glow={glow} count={120} opacity={0.35} seed="herostar" />
      <AbsoluteFill style={{ perspective: 1700 * u }}>
        <div
          style={{
            position: "absolute", left: width / 2, top: height * 0.53, width: 0, height: 0, transformStyle: "preserve-3d",
            transform: `rotateX(${interpolate(t, [0, end], [20, 12], clamp)}deg) rotateY(${interpolate(t, [0, end], [-26, -6], { ...clamp, easing: EASE.out })}deg) translateZ(${interpolate(t, [0, end], [-200, 60], clamp) * u}px)`,
          }}
        >
          {/* Slab: back face, edge glow, front face. */}
          {[-36, 0].map((z) => (
            <div key={z} style={{
              position: "absolute", left: -pw / 2, top: -ph / 2, width: pw, height: ph, borderRadius: 26 * u, transform: `translateZ(${z * u}px)`,
              background: `linear-gradient(150deg, ${hexA("#ffffff", z ? 0.06 : 0.16)} 0%, ${hexA(glow, 0.1)} 50%, ${hexA("#04100d", 0.5)} 100%)`,
              border: `${2 * u}px solid ${hexA(glow, z ? 0.3 : 0.75)}`,
              boxShadow: z ? "none" : `0 0 ${60 * u}px ${hexA(glow, 0.35)}, inset 0 ${2 * u}px 0 ${hexA("#ffffff", 0.4)}`,
              overflow: "hidden",
            }}>
              {z === 0 ? (
                <div style={{ position: "absolute", top: -ph, bottom: -ph, width: pw * 0.25, left: sweep * pw, rotate: "20deg", background: `linear-gradient(90deg, transparent, ${hexA("#ffffff", 0.35)}, transparent)` }} />
              ) : null}
            </div>
          ))}
          {sheets.map((s, i) => {
            const p = interpolate(t, [s.delay, s.delay + 1.0], [0, 1], { ...clamp, easing: EASE.back });
            const sw = pw * 0.36;
            const sh = ph * 0.78;
            return (
              <div key={s.kind} style={{
                position: "absolute", left: -sw / 2, top: -sh / 2, width: sw, height: sh, borderRadius: 14 * u,
                transform: `translate3d(${s.x * pw}px, ${(-0.05 - 0.55 * p) * ph}px, ${(20 + 40 * i) * u}px) rotateZ(${s.rot * p}deg)`,
                opacity: interpolate(p, [0, 0.1], [0, 1], clamp),
                background: hexA("#e9fffa", 0.92), boxShadow: `0 ${10 * u}px ${40 * u}px ${hexA(glow, 0.45)}`, padding: 16 * u,
              }}>
                <SheetArt kind={s.kind} w={sw - 32 * u} h={sh - 32 * u} glow={glow} warm={warm} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette />
      <AbsoluteFill style={{ background: "#e8fffa", opacity: interpolate(t, [0, 0.45], [0.9, 0], clamp) }} />
    </AbsoluteFill>
  );
};

const SheetArt: React.FC<{ kind: "flow" | "screen" | "chart"; w: number; h: number; glow: string; warm: string }> = ({ kind, w, h, glow, warm }) => {
  const ink = "#123d36";
  if (kind === "flow") {
    const bx = w * 0.42, by = h * 0.12;
    const nodes = [[0.05, 0.08], [0.55, 0.3], [0.05, 0.52], [0.55, 0.74]];
    return (
      <svg width={w} height={h}>
        {nodes.slice(0, -1).map(([x, y], i) => (
          <path key={i} d={`M ${x * w + bx} ${y * h + by / 2} C ${w * 0.5} ${y * h + by / 2}, ${w * 0.5} ${nodes[i + 1][1] * h + by / 2}, ${nodes[i + 1][0] * w} ${nodes[i + 1][1] * h + by / 2}`} stroke={glow} strokeWidth={3} fill="none" />
        ))}
        {nodes.map(([x, y], i) => <rect key={i} x={x * w} y={y * h} width={bx} height={by} rx={6} fill={i === 3 ? warm : ink} />)}
      </svg>
    );
  }
  if (kind === "screen") {
    return (
      <svg width={w} height={h}>
        <rect x={w * 0.12} y={0} width={w * 0.76} height={h} rx={14} fill="none" stroke={ink} strokeWidth={3} />
        <rect x={w * 0.2} y={h * 0.08} width={w * 0.6} height={h * 0.22} rx={6} fill={glow} opacity={0.6} />
        {[0.38, 0.48, 0.58].map((y) => <rect key={y} x={w * 0.2} y={h * y} width={w * (y === 0.48 ? 0.4 : 0.6)} height={h * 0.05} rx={3} fill={ink} opacity={0.5} />)}
        <rect x={w * 0.2} y={h * 0.78} width={w * 0.6} height={h * 0.1} rx={h * 0.05} fill={ink} />
      </svg>
    );
  }
  return (
    <svg width={w} height={h}>
      {[0.25, 0.45, 0.35, 0.65, 0.85].map((v, i) => (
        <rect key={i} x={w * (0.06 + i * 0.19)} y={h * (0.62 - v * 0.55)} width={w * 0.13} height={h * v * 0.55} rx={4} fill={i === 4 ? warm : glow} />
      ))}
      <line x1={0} y1={h * 0.64} x2={w} y2={h * 0.64} stroke={ink} strokeWidth={3} />
      {[0, 1, 2].map((i) => <rect key={i} x={w * 0.06} y={h * (0.74 + i * 0.08)} width={w * (0.8 - i * 0.2)} height={h * 0.04} rx={3} fill={ink} opacity={0.45} />)}
    </svg>
  );
};
