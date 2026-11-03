import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, clamp, hexA } from "./util";
import MARK_POINTS from "./markPoints.json";

// OFFICIAL DL logo files, displayed unmodified. Particle targets were sampled from the mark's own pixels.
export const MARK_SRC = staticFile("brand/dl-mark-on-dark.png");
export const LOCKUP_SRC = staticFile("brand/dl-lockup-on-light.webp");

export const LogoReveal: React.FC<{ glow: string; glowSoft: string; tagline: string; bloomToEndCard: boolean }> = ({ glow, glowSoft, tagline, bloomToEndCard }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const end = durationInFrames / fps;
  const u = Math.min(width, height) / 1080;
  const landscape = width > height * 1.2;
  const size = (landscape ? 360 : 400) * u;
  const cx = width / 2;
  const cy = height * (landscape ? 0.4 : 0.42);
  const floorY = cy + size / 2 + 24 * u;

  const converge = interpolate(t, [0.35, 2.1], [0, 1], { ...clamp, easing: EASE.inOut });
  const reveal = interpolate(t, [1.9, 2.7], [0, 1], { ...clamp, easing: EASE.out });
  const sweep = interpolate(t, [4.2, 5.2], [-0.5, 1.5], clamp);
  const scale = interpolate(t, [1.9, 2.7, end], [0.95, 1, 1.04], { ...clamp, easing: EASE.out });
  const bloom = bloomToEndCard ? interpolate(t, [end - 0.7, end], [0, 1], { ...clamp, easing: EASE.in }) : 0;

  const markStyle: React.CSSProperties = { width: size, height: size, display: "block" };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 50% at 50% ${(cy / height) * 100}%, ${hexA(glowSoft, 0.35)} 0%, #050807 70%)`, opacity: interpolate(t, [0, 0.4], [0, 1], clamp) }}>
      {/* Reflective floor + drifting fog. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: floorY, bottom: 0, background: `linear-gradient(180deg, ${hexA(glow, 0.1)} 0%, #030504 60%)`, borderTop: `1px solid ${hexA(glow, 0.25)}` }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          position: "absolute", top: floorY - 120 * u, height: 260 * u, width: width * 0.7, borderRadius: "50%",
          left: width * (0.15 + 0.12 * Math.sin(t * 0.25 + i * 2)) - width * 0.2 + i * width * 0.15,
          background: `radial-gradient(ellipse, ${hexA(glow, 0.16)} 0%, transparent 70%)`, filter: `blur(${30 * u}px)`,
          opacity: interpolate(t, [0.5, 2.5], [0, 1], clamp),
        }} />
      ))}

      {/* Particles converge onto the shape of the official mark. */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: interpolate(t, [2.2, 3.0], [1, 0], clamp) }}>
        {(MARK_POINTS as [number, number][]).map(([px, py], i) => {
          const tx = cx + (px - 0.5) * size;
          const ty = cy + (py - 0.5) * size;
          const sa = random(`lp-a-${i}`) * Math.PI * 2;
          const sr = (0.35 + random(`lp-r-${i}`) * 0.6) * Math.max(width, height);
          const sx = cx + Math.cos(sa) * sr;
          const sy = cy + Math.sin(sa) * sr * 0.7;
          const swirl = Math.sin(converge * Math.PI) * 90 * u * (random(`lp-s-${i}`) - 0.5);
          const x = sx + (tx - sx) * converge + Math.cos(sa + Math.PI / 2) * swirl;
          const y = sy + (ty - sy) * converge + Math.sin(sa + Math.PI / 2) * swirl;
          return <circle key={i} cx={x} cy={y} r={(2 + random(`lp-z-${i}`) * 2.6) * u} fill={random(`lp-c-${i}`) > 0.7 ? "#ffffff" : glow}
            opacity={interpolate(t, [0.1 + random(`lp-d-${i}`) * 0.4, 0.6 + random(`lp-d-${i}`) * 0.4], [0, 1], clamp)} />;
        })}
      </svg>

      {/* Official mark + light sweep + floor reflection. */}
      <div style={{
        position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, overflow: "hidden", scale: String(scale), opacity: reveal,
        boxShadow: `0 0 ${50 * u * reveal}px ${hexA(glow, 0.45)}, 0 0 0 ${1.5 * u}px ${hexA(glow, 0.5 * reveal)}`,
      }}>
        <Img src={MARK_SRC} style={markStyle} />
        <div style={{ position: "absolute", top: "-50%", height: "200%", width: "30%", left: `${sweep * 100}%`, rotate: "18deg", background: `linear-gradient(90deg, transparent, ${hexA("#ffffff", 0.28)}, transparent)` }} />
      </div>
      <div style={{
        position: "absolute", left: cx - size / 2, top: floorY + 2 * u, width: size, height: size, scale: `${scale} ${-scale}`, opacity: 0.2 * reveal,
        maskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 55%)", WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 55%)",
      }}>
        <Img src={MARK_SRC} style={markStyle} />
      </div>

      <div style={{
        position: "absolute", left: 60 * u, right: 60 * u, top: floorY + (landscape ? 44 : 70) * u, textAlign: "center",
        color: "#f2fffb", fontSize: (landscape ? 58 : 66) * u, fontWeight: 700, letterSpacing: "-0.01em",
        opacity: interpolate(t, [3.2, 3.8], [0, 1], clamp), translate: `0px ${interpolate(t, [3.2, 4.0], [18 * u, 0], { ...clamp, easing: EASE.out })}px`,
        textShadow: `0 0 ${24 * u}px ${hexA(glow, 0.45)}`,
      }}>{tagline}</div>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.7) 100%)" }} />
      {bloom > 0 ? (
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${(cy / height) * 100}%, #ffffff ${bloom * 70}%, ${hexA("#ffffff", 0)} ${bloom * 140 + 1}%)`, opacity: Math.min(1, bloom * 1.4) }} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Final card: the full official lockup on white, the background it was designed for. */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const landscape = width > height * 1.2;
  const lockupW = width * (landscape ? 0.6 : 0.84);
  return (
    <AbsoluteFill style={{ background: "#ffffff", alignItems: "center", justifyContent: "center" }}>
      <Img src={LOCKUP_SRC} style={{
        width: lockupW, height: "auto",
        opacity: interpolate(t, [0.35, 1.0], [0, 1], clamp),
        scale: String(interpolate(t, [0.35, 2.7], [0.97, 1.0], { ...clamp, easing: EASE.out })),
      }} />
    </AbsoluteFill>
  );
};
