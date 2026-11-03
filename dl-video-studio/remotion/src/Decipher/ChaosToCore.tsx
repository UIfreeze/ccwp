import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassCard } from "./GlassCard";
import { Icon, IconName } from "./Icons";
import { EASE, clamp, envelope, hexA, project } from "./util";

// A founder's scattered inputs. Original labels — no third-party apps or logos.
const FRAGMENTS: [IconName, string][] = [
  ["wave", "voice memo 03"], ["note", "notes_v3_FINAL"], ["deck", "pitch deck (draft)"], ["chart", "competitor list"],
  ["question", "who is it for?"], ["coin", "pricing??"], ["check", "feature wishlist"], ["sketch", "whiteboard photo"],
  ["chat", "investor feedback"], ["question", "MVP scope?"], ["people", "user interviews"], ["code", "tech stack?"],
];
const N = 78;

export const ChaosToCore: React.FC<{ glow: string; glowSoft: string; warm: string; caption: string }> = ({ glow, glowSoft, warm, caption }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const u = Math.min(width, height) / 1080;
  const cx = width / 2;
  const cy = height * 0.48;
  const f = Math.min(width, height) * 1.05;

  // Camera slowly pushes in, then the vortex pulls everything into the core.
  const Z0 = interpolate(t, [0, 6], [1350, 1050], { ...clamp, easing: EASE.inOut });
  const pull = interpolate(t, [5.6, 9.4], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.75, 0.6) });
  const burst = t - 9.4;

  const cards = Array.from({ length: N }, (_, i) => {
    const r = (k: number) => random(`frag-${i}-${k}`);
    const doc = i < 40;
    const a0 = r(1) * Math.PI * 2;
    const r0 = (doc ? 480 : 380) + r(2) * 820;
    const y0 = (r(3) - 0.5) * 1000;
    const spin = 0.12 + r(4) * 0.12;
    const angle = a0 + t * spin + pull * (2 + pull * 10) * (0.8 + r(5) * 0.5);
    const radius = r0 * Math.pow(1 - pull, 1.6);
    const x = Math.cos(angle) * radius;
    const z = Z0 + Math.sin(angle) * radius;
    const y = y0 * (1 - pull) + Math.sin(t * 0.9 + i) * 18 * (1 - pull);
    const { sx, sy, s } = project(x * u, y * u, z, f, cx, cy);
    const depthFade = interpolate(z, [220, 520, 2400, 3000], [0, 1, 1, 0.25], clamp);
    const sucked = interpolate(pull, [0.75, 1], [1, 0], clamp);
    const blur = Math.min(7, Math.abs(z - Z0) / 260 + pull * 4);
    const [icon, label] = FRAGMENTS[i % FRAGMENTS.length];
    return {
      key: i, z, sx, sy, s, icon, label, doc,
      opacity: depthFade * sucked * interpolate(t, [r(6) * 1.2, r(6) * 1.2 + 0.8], [0, 1], clamp),
      blur,
      rotY: (r(7) - 0.5) * 70 + t * 12 * (r(8) - 0.5) + pull * 220,
      rotZ: (r(9) - 0.5) * 40 + pull * 160,
      warmIcon: r(10) > 0.7,
    };
  }).sort((a, b) => b.z - a.z);

  const core = project(0, 0, Z0, f, cx, cy);
  const coreSize = interpolate(t, [4.8, 6.5, 9.0, 9.4, 9.8, 11], [0, 60, 120, 190, 140, 90], { ...clamp, easing: EASE.inOut }) * u * (core.s * 1.3);
  const flash = interpolate(burst, [-0.08, 0.05, 0.6], [0, 1, 0], clamp);
  const sceneOut = interpolate(frame, [durationInFrames - 0.8 * fps, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: sceneOut, overflow: "hidden" }}>
      {/* Floor grid + haze give a dark "studio" volume. */}
      <svg width={width} height={height} style={{ position: "absolute", opacity: 0.35 * (1 - pull) }}>
        {Array.from({ length: 21 }, (_, k) => {
          const x = (k - 10) * 260 * u;
          return <line key={`v${k}`} x1={cx + x * 0.08} y1={cy + 40 * u} x2={cx + x * 3.2} y2={height} stroke={hexA(glow, 0.25)} strokeWidth={1} />;
        })}
        {Array.from({ length: 10 }, (_, k) => {
          const y = cy + 40 * u + Math.pow(k / 9, 2.2) * (height - cy);
          return <line key={`h${k}`} x1={0} y1={y} x2={width} y2={y} stroke={hexA(glow, 0.12 + k * 0.015)} strokeWidth={1} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 45% at 50% 48%, ${hexA(glowSoft, 0.35 + pull * 0.4)} 0%, transparent 70%)` }} />

      {cards.map((c) =>
        c.opacity <= 0.01 ? null : (
          <div
            key={c.key}
            style={{
              position: "absolute",
              left: c.sx,
              top: c.sy,
              translate: "-50% -50%",
              scale: String(c.s * u * 1.55),
              opacity: c.opacity,
              filter: `blur(${c.blur}px)`,
              transform: `perspective(700px) rotateY(${c.rotY}deg) rotate(${c.rotZ}deg)`,
            }}
          >
            {c.doc ? (
              <GlassCard width={210} height={140} glow={glow} icon={c.icon} label={c.label} warm={c.warmIcon ? warm : undefined} intensity={0.55} />
            ) : (
              <div
                style={{
                  width: 74, height: 74, borderRadius: 18, display: "grid", placeItems: "center",
                  background: hexA("#0b1f1b", 0.75), border: `1.5px solid ${hexA(glow, 0.5)}`, boxShadow: `0 0 18px ${hexA(glow, 0.35)}`,
                }}
              >
                <Icon name={c.icon} size={40} color={c.warmIcon ? warm : glow} />
              </div>
            )}
          </div>
        ),
      )}

      {/* The logic core. */}
      <div
        style={{
          position: "absolute", left: core.sx, top: core.sy, width: coreSize, height: coreSize, translate: "-50% -50%", borderRadius: "50%",
          background: `radial-gradient(circle, #ffffff 0%, ${glow} 28%, ${hexA(glow, 0.25)} 55%, transparent 72%)`,
          boxShadow: `0 0 ${80 * u}px ${30 * u}px ${hexA(glow, 0.45)}`,
          opacity: interpolate(t, [4.8, 5.6], [0, 1], clamp),
        }}
      >
        <div style={{ position: "absolute", inset: "22%", borderRadius: "50%", border: `${2 * u}px solid ${hexA("#ffffff", 0.7)}`, scale: String(1 + 0.08 * Math.sin(t * 9)) }} />
      </div>

      {/* Shockwave + sparks when the core absorbs everything. */}
      {burst > 0 ? (
        <>
          <div
            style={{
              position: "absolute", left: core.sx, top: core.sy, translate: "-50% -50%", borderRadius: "50%",
              width: interpolate(burst, [0, 1.2], [80, 2400], { ...clamp, easing: EASE.out }) * u,
              height: interpolate(burst, [0, 1.2], [80, 2400], { ...clamp, easing: EASE.out }) * u,
              border: `${3 * u}px solid ${hexA(glow, 0.8)}`, boxShadow: `0 0 ${40 * u}px ${hexA(glow, 0.6)}`,
              opacity: interpolate(burst, [0, 1.2], [1, 0], clamp),
            }}
          />
          <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 140 }, (_, i) => {
              const a = random(`spark-a-${i}`) * Math.PI * 2;
              const v = (0.4 + random(`spark-v-${i}`) * 1.2) * Math.min(width, height) * 0.75;
              const d = v * interpolate(burst, [0, 1.6], [0, 1], { ...clamp, easing: EASE.out });
              const len = 30 * u * (1 - burst / 1.8);
              const o = interpolate(burst, [0, 0.1, 1.5], [0, 1, 0], clamp);
              return (
                <line key={i} x1={core.sx + Math.cos(a) * d} y1={core.sy + Math.sin(a) * d} x2={core.sx + Math.cos(a) * (d + len)} y2={core.sy + Math.sin(a) * (d + len)}
                  stroke={random(`spark-c-${i}`) > 0.85 ? "#ffffff" : glow} strokeWidth={2 * u} strokeLinecap="round" opacity={o} />
              );
            })}
          </svg>
        </>
      ) : null}

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 48%, #ffffff 0%, ${glow} 35%, ${hexA(glow, 0.6)} 100%)`, opacity: flash * 0.85 }} />

      <Caption text={caption} t={t} start={1.6} end={5.6} glow={glow} u={u} />
      <Vignette />
    </AbsoluteFill>
  );
};

export const Caption: React.FC<{ text: string; t: number; start: number; end: number; glow: string; u: number; bottom?: number }> = ({ text, t, start, end, glow, u, bottom = 0.14 }) => {
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute", left: 80 * u, right: 80 * u, bottom: `${bottom * 100}%`, textAlign: "center",
        color: "#e6fff9", fontSize: 34 * u, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase",
        textShadow: `0 0 ${18 * u}px ${hexA(glow, 0.7)}`,
        opacity: envelope(t, start, start + 0.6, end - 0.5, end),
        translate: `0px ${interpolate(t, [start, start + 0.9], [14 * u, 0], { ...clamp, easing: EASE.out })}px`,
      }}
    >
      {text}
    </div>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
);
