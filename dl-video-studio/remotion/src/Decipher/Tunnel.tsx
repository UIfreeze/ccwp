import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassCard } from "./GlassCard";
import { iconFor } from "./Icons";
import { Vignette } from "./ChaosToCore";
import { EASE, clamp, hexA } from "./util";

type Slot = { key: string; wall: "L" | "R" | "F" | "C"; lane: number; k: number };

/** Fly-through corridor lined with glass work cards — the plan, organised and moving forward. */
export const Tunnel: React.FC<{ items: string[]; glow: string; glowSoft: string; warm: string }> = ({ items, glow, glowSoft, warm }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const end = durationInFrames / fps;
  const u = Math.min(width, height) / 1080;
  const landscape = width > height * 1.2;

  const W = (landscape ? 720 : 520) * u; // corridor half-width
  const H = (landscape ? 400 : 560) * u; // corridor half-height
  const D = 420 * u; // card spacing along the corridor
  const K = 12; // slots per lane
  const persp = 900 * u;
  const travel = (t * 1.9 + interpolate(t, [end - 1.2, end], [0, 1.6], { ...clamp, easing: EASE.in })) * D;

  const slots: Slot[] = [];
  for (let k = 0; k < K; k++) {
    for (const wall of ["L", "R", "F", "C"] as const) for (const lane of [0, 1]) slots.push({ key: `${wall}${lane}${k}`, wall, lane, k });
  }

  const cards = slots.map((s, idx) => {
    const span = K * D;
    const z = 250 * u - ((((s.k * D + s.lane * D * 0.5 - travel) % span) + span) % span);
    if (z > persp * 0.75) return null;
    const fog = interpolate(z, [-span, -span * 0.55, 0, persp * 0.6], [0, 1, 1, 0.2], clamp);
    let transform = "";
    let cw = D * 0.82;
    let chh = H * 0.82;
    if (s.wall === "L" || s.wall === "R") {
      const y = (s.lane === 0 ? -0.5 : 0.5) * H;
      transform = `translate3d(${s.wall === "L" ? -W : W}px, ${y}px, ${z}px) rotateY(${s.wall === "L" ? 90 : -90}deg)`;
    } else {
      const x = (s.lane === 0 ? -0.5 : 0.5) * W;
      cw = W * 0.82;
      chh = D * 0.82;
      transform = `translate3d(${x}px, ${s.wall === "F" ? H : -H}px, ${z}px) rotateX(${s.wall === "F" ? 90 : -90}deg)`;
    }
    const label = items[(idx * 7 + s.k) % items.length];
    return { s, z, fog, transform, cw, chh, label, warmIcon: random(`tun-${s.key}`) > 0.8 };
  });

  const edges: [number, number][] = [[-W, -H], [W, -H], [-W, H], [W, H]];
  const endGlow = interpolate(t, [0, end - 1.4, end], [0.5, 0.7, 1.6], clamp);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${hexA(glowSoft, 0.55)} 0%, ${hexA(glowSoft, 0.12)} 30%, transparent 60%)`,
        opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        overflow: "hidden",
      }}
    >
      <AbsoluteFill style={{ perspective: persp, perspectiveOrigin: "50% 50%" }}>
        <div
          style={{
            position: "absolute", left: width / 2, top: height / 2, width: 0, height: 0, transformStyle: "preserve-3d",
            transform: `rotateZ(${Math.sin(t * 0.9) * 2.5}deg) rotateY(${Math.sin(t * 0.6) * 3}deg)`,
          }}
        >
          {edges.map(([x, y], i) => (
            <div key={i} style={{
              position: "absolute", left: -K * D / 2, top: -2 * u, width: K * D, height: 4 * u,
              transform: `translate3d(${x}px, ${y}px, ${-K * D / 2 + 200 * u}px) rotateY(90deg)`,
              background: `linear-gradient(90deg, transparent, ${glow} 30%, #ffffff 90%)`, boxShadow: `0 0 ${16 * u}px ${glow}`, opacity: 0.7,
            }} />
          ))}
          {cards.map((c) =>
            c === null ? null : (
              <div key={c.s.key} style={{ position: "absolute", left: -c.cw / 2, top: -c.chh / 2, transform: c.transform, opacity: c.fog, backfaceVisibility: "hidden" }}>
                <GlassCard width={c.cw} height={c.chh} glow={glow} icon={iconFor(c.label)} label={c.label} warm={c.warmIcon ? warm : undefined} intensity={0.5} />
              </div>
            ),
          )}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #ffffff 0%, ${glow} ${8 * endGlow}%, transparent ${22 * endGlow}%)`, opacity: Math.min(1, endGlow * 0.6) }} />
      <AbsoluteFill style={{ background: "#e8fffa", opacity: interpolate(t, [end - 0.35, end], [0, 0.9], clamp) }} />
      <Vignette />
    </AbsoluteFill>
  );
};
