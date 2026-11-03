import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WordReveal } from "./WordReveal";
import { useLayout } from "./layout";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CtaScene: React.FC<{ headline: string; button: string; logo: string; dark: string; accent: string }> = ({
  headline,
  button,
  logo,
  dark,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  return (
    <AbsoluteFill
      style={{
        background: dark,
        clipPath: `circle(${interpolate(frame, [0, 0.6 * fps], [0, 120], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) })}% at 50% 45%)`,
        alignItems: "center",
        justifyContent: "center",
        gap: 56 * L.u,
        padding: `${L.safeY}px ${L.safeX}px`,
      }}
    >
      <WordReveal
        text={headline}
        delay={0.45 * fps}
        style={{ fontSize: L.headline * 1.1, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#ffffff" }}
      />
      <div
        style={{
          background: accent,
          color: "#ffffff",
          fontSize: L.body,
          fontWeight: 700,
          padding: `${26 * L.u}px ${52 * L.u}px`,
          borderRadius: 999,
          scale: interpolate(frame, [1.2 * fps, 1.7 * fps], [0.7, 1], { ...clamp, easing: Easing.bezier(0.34, 1.4, 0.64, 1) }),
          opacity: interpolate(frame, [1.2 * fps, 1.45 * fps], [0, 1], clamp),
        }}
      >
        {button}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: L.safeY,
          fontSize: 26 * L.u,
          color: "#ffffff99",
          border: `${2 * L.u}px dashed #ffffff55`,
          borderRadius: 12 * L.u,
          padding: `${12 * L.u}px ${22 * L.u}px`,
          opacity: interpolate(frame, [1.7 * fps, 2.1 * fps], [0, 1], clamp),
        }}
      >
        {logo}
      </div>
    </AbsoluteFill>
  );
};
