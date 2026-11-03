import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WordReveal } from "./WordReveal";
import { useLayout } from "./layout";
import { dotCenterY } from "./IdeaDot";

export const HookScene: React.FC<{ text: string; ink: string }> = ({ text, ink }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { width, height, u, safeX, headline } = useLayout();
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(frame, [durationInFrames - 0.35 * fps, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <WordReveal
        text={text}
        delay={0.7 * fps}
        style={{
          position: "absolute",
          top: dotCenterY(height, width) + 150 * u,
          left: safeX,
          right: safeX,
          fontSize: headline,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: ink,
          textAlign: "center",
        }}
      />
    </AbsoluteFill>
  );
};
