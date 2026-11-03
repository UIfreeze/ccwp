import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { WordReveal } from "./WordReveal";
import { useLayout } from "./layout";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CtaScene: React.FC<{ headline: string; button: string; showLogo: boolean; dark: string; accent: string }> = ({
  headline,
  button,
  showLogo,
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
      {showLogo ? (
        // Official DL mark (its dark-green tile matches the brand dark background).
        <Img
          src={staticFile("brand/dl-mark-on-dark.png")}
          style={{ position: "absolute", bottom: L.safeY - 30 * L.u, width: 150 * L.u, height: 150 * L.u, opacity: interpolate(frame, [1.7 * fps, 2.1 * fps], [0, 1], clamp) }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
