import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Starfield } from "./Starfield";
import { Vignette } from "./ChaosToCore";
import { EASE, clamp, hexA } from "./util";

const bez = (p: number, a: number, b: number, c: number, d: number) =>
  (1 - p) ** 3 * a + 3 * (1 - p) ** 2 * p * b + 3 * (1 - p) * p ** 2 * c + p ** 3 * d;

/** The decode beam: light-speed field, a light trail that swoops into a ring, then the ring flares. */
export const Hyperspace: React.FC<{ glow: string; glowSoft: string }> = ({ glow, glowSoft }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const u = Math.min(width, height) / 1080;
  const cx = width / 2;
  const cy = height * 0.48;

  // Speed: fast out of the burst, eases while the trail draws, accelerates again into the next scene.
  const speed = interpolate(t, [0, 0.8, 2.6, 3.4, 4.2], [3.5, 1.2, 1, 2.5, 6], clamp);
  const travel = t * 0.32 + interpolate(t, [3.2, 4.2], [0, 0.45], { ...clamp, easing: EASE.in });
  const draw = interpolate(t, [0.7, 2.3], [0, 1], { ...clamp, easing: EASE.inOut });
  const arrive = t - 2.3;

  // Trail control points (relative to frame), three strands with slight offsets.
  const strands = [0, 1, 2].map((k) => {
    const o = (k - 1) * 26 * u;
    const pts = [
      [-0.1 * width, height * 0.82 + o],
      [width * 0.25, height * 0.95 - o * 2],
      [width * 0.2, cy - 40 * u + o],
      [cx, cy],
    ];
    const d = `M ${pts[0][0]} ${pts[0][1]} C ${pts[1][0]} ${pts[1][1]}, ${pts[2][0]} ${pts[2][1]}, ${pts[3][0]} ${pts[3][1]}`;
    return { d, pts, k };
  });
  const head = {
    x: bez(draw, strands[1].pts[0][0], strands[1].pts[1][0], strands[1].pts[2][0], strands[1].pts[3][0]),
    y: bez(draw, strands[1].pts[0][1], strands[1].pts[1][1], strands[1].pts[2][1], strands[1].pts[3][1]),
  };
  const ring = interpolate(arrive, [0, 0.25, 1.4], [40, 150, 120], { ...clamp, easing: EASE.out }) * u;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 48%, ${hexA(glowSoft, 0.25)} 0%, transparent 75%)`,
        opacity: interpolate(frame, [0, 0.4 * fps, durationInFrames - 0.5 * fps, durationInFrames], [0, 1, 1, 0], clamp),
      }}
    >
      <Starfield width={width} height={height} cx={cx} cy={cy} travel={travel} speed={speed} glow={glow} />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 ${10 * u}px ${glow})` }}>
        {strands.map((s) => (
          <path key={s.k} d={s.d} pathLength={1} fill="none" stroke={s.k === 1 ? "#dffff6" : glow} strokeWidth={(s.k === 1 ? 4 : 2) * u}
            strokeLinecap="round" strokeDasharray={`${draw} 1`} strokeDashoffset={0}
            opacity={interpolate(arrive, [0, 1], [0.95, 0.15], clamp)} />
        ))}
      </svg>
      {draw > 0 && draw < 1 ? (
        <div style={{ position: "absolute", left: head.x, top: head.y, width: 26 * u, height: 26 * u, translate: "-50% -50%", borderRadius: "50%", background: "#ffffff", boxShadow: `0 0 ${30 * u}px ${12 * u}px ${glow}` }} />
      ) : null}
      {arrive > -0.2 ? (
        <div
          style={{
            position: "absolute", left: cx, top: cy, width: ring, height: ring, translate: "-50% -50%", borderRadius: "50%",
            border: `${5 * u}px solid #e8fffa`, boxShadow: `0 0 ${40 * u}px ${14 * u}px ${hexA(glow, 0.8)}, inset 0 0 ${30 * u}px ${hexA(glow, 0.8)}`,
            opacity: interpolate(arrive, [-0.2, 0, 1.6, 1.9], [0, 1, 1, 0], clamp),
          }}
        />
      ) : null}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 48%, ${hexA("#ffffff", 0.9)} 0%, ${hexA(glow, 0.5)} 18%, transparent 55%)`, opacity: interpolate(arrive, [0, 0.06, 0.5], [0, 0.8, 0], clamp) }} />
      <Vignette />
    </AbsoluteFill>
  );
};
