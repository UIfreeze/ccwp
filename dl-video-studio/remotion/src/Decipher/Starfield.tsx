import React from "react";
import { random } from "remotion";
import { hexA } from "./util";

/**
 * Radial "light-speed" streaks. `travel` is accumulated distance (drives positions),
 * `speed` scales streak length (motion-blur feel). Deterministic per seed.
 */
export const Starfield: React.FC<{
  width: number; height: number; cx: number; cy: number; travel: number; speed: number; glow: string; count?: number; opacity?: number; seed?: string;
}> = ({ width, height, cx, cy, travel, speed, glow, count = 260, opacity = 1, seed = "star" }) => {
  const R = Math.hypot(width, height) * 0.62;
  const u = Math.min(width, height) / 1080;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const a = random(`${seed}-a-${i}`) * Math.PI * 2;
        const v = 0.35 + random(`${seed}-v-${i}`) * 0.9;
        const p = (random(`${seed}-o-${i}`) + travel * v) % 1;
        const d = Math.pow(p, 2.2) * R;
        const len = Math.min(R * 0.5, (6 + d * 0.09) * speed * u * 1.6);
        const w = (0.6 + p * 2.4) * u * (random(`${seed}-w-${i}`) > 0.9 ? 1.8 : 1);
        const white = random(`${seed}-c-${i}`) > 0.88;
        return (
          <line key={i} x1={cx + Math.cos(a) * d} y1={cy + Math.sin(a) * d} x2={cx + Math.cos(a) * (d + len)} y2={cy + Math.sin(a) * (d + len)}
            stroke={white ? "#ffffff" : glow} strokeOpacity={Math.min(1, p * 1.6)} strokeWidth={w} strokeLinecap="round" />
        );
      })}
      <circle cx={cx} cy={cy} r={R * 0.06} fill={hexA(glow, 0.08)} />
    </svg>
  );
};
