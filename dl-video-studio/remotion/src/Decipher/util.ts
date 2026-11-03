import { Easing, interpolate } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  back: Easing.bezier(0.34, 1.4, 0.64, 1),
};

/** 0→1→0 envelope: fades in over [a,b], holds, fades out over [c,d]. */
export const envelope = (t: number, a: number, b: number, c: number, d: number) =>
  interpolate(t, [a, b, c, d], [0, 1, 1, 0], clamp);

export const hexA = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0");
  return `#${full}${a}`;
};

/** Pinhole projection: camera at origin looking down +z. */
export const project = (x: number, y: number, z: number, f: number, cx: number, cy: number) => {
  const s = f / Math.max(z, 1);
  return { sx: cx + x * s, sy: cy + y * s, s };
};
