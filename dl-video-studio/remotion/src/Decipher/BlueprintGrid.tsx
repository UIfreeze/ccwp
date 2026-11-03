import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassCard } from "./GlassCard";
import { iconFor } from "./Icons";
import { Starfield } from "./Starfield";
import { Caption, Vignette } from "./ChaosToCore";
import { EASE, clamp, hexA } from "./util";

/** Order from chaos: deliverables fly out of the light and lock into a tilted 3D grid. */
export const BlueprintGrid: React.FC<{ items: string[]; glow: string; glowSoft: string; warm: string; caption: string }> = ({ items, glow, glowSoft, warm, caption }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const end = durationInFrames / fps;
  const u = Math.min(width, height) / 1080;
  const landscape = width > height * 1.2;
  const cx = width / 2;
  const cy = height * 0.48;

  const cols = landscape ? 4 : 3;
  const rows = Math.ceil(items.length / cols);
  const cw = (landscape ? 370 : 290) * u;
  const ch = (landscape ? 225 : 185) * u;
  const gap = 34 * u;
  const gridW = cols * cw + (cols - 1) * gap;
  const gridH = rows * ch + (rows - 1) * gap;

  const tiltX = interpolate(t, [0, end], [22, 8], { ...clamp, easing: EASE.out });
  const tiltY = interpolate(t, [0, end], [-14, 10], clamp);
  const push = interpolate(t, [end - 1.1, end], [0, 900], { ...clamp, easing: EASE.in }) * u;
  const scan = interpolate(t, [2.6, 4.2], [-0.15, 1.15], clamp);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 55% at 50% 48%, ${hexA(glowSoft, 0.3)} 0%, transparent 75%)`,
        opacity: interpolate(frame, [0, 0.35 * fps, durationInFrames - 0.5 * fps, durationInFrames], [0, 1, 1, 0], clamp),
      }}
    >
      <Starfield width={width} height={height} cx={cx} cy={cy} travel={t * 0.12} speed={interpolate(t, [0, 1.2], [6, 0.8], clamp)} glow={glow}
        count={180} opacity={interpolate(t, [0, 2.5], [1, 0.45], clamp)} seed="gridstar" />
      <AbsoluteFill style={{ perspective: 1500 * u, perspectiveOrigin: `50% 48%` }}>
        <div
          style={{
            position: "absolute", left: cx, top: cy, width: 0, height: 0, transformStyle: "preserve-3d",
            transform: `translateZ(${push}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          }}
        >
          {items.map((label, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = -gridW / 2 + col * (cw + gap);
            const y = -gridH / 2 + row * (ch + gap);
            const start = 0.15 + i * 0.12;
            const p = interpolate(t, [start, start + 0.9], [0, 1], { ...clamp, easing: EASE.out });
            const lit = interpolate(scan * (cols + 1), [col, col + 0.6, col + 1.6], [0, 1, 0.25], clamp);
            return (
              <div
                key={`${label}-${i}`}
                style={{
                  position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d",
                  transform: `translate3d(${x * p}px, ${y * p}px, ${(1 - p) * -1800 * u}px) rotateY(${(1 - p) * 120}deg)`,
                  opacity: interpolate(p, [0, 0.15], [0, 1], clamp),
                }}
              >
                <GlassCard width={cw} height={ch} glow={glow} icon={iconFor(label)} label={label} sub={String(i + 1).padStart(2, "0")}
                  warm={i % 5 === 2 ? warm : undefined} intensity={0.45 + lit * 0.55} />
              </div>
            );
          })}
          {/* Scan beam sweeping across the grid. */}
          <div
            style={{
              position: "absolute", top: -gridH / 2 - 60 * u, height: gridH + 120 * u, width: 6 * u,
              left: -gridW / 2 + scan * gridW, transform: "translateZ(20px)",
              background: `linear-gradient(180deg, transparent, ${glow}, #ffffff, ${glow}, transparent)`,
              boxShadow: `0 0 ${40 * u}px ${12 * u}px ${hexA(glow, 0.5)}`,
              opacity: scan > -0.1 && scan < 1.1 ? 0.9 : 0,
            }}
          />
        </div>
      </AbsoluteFill>
      <Caption text={caption} t={t} start={1.4} end={4.9} glow={glow} u={u} bottom={landscape ? 0.06 : 0.1} />
      <Vignette />
    </AbsoluteFill>
  );
};
