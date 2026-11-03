import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SCENES } from "./schema";
import { useLayout } from "./layout";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The "idea" dot persists from the hook through the questions, then bursts into the plan. */
export const IdeaDot: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame(); // composition-level frame
  const { fps } = useVideoConfig();
  const { width, height, u } = useLayout();
  const plan = (SCENES.hook + SCENES.questions) * fps;
  const size = 132 * u;
  const pulse = (frame % (1.6 * fps)) / (1.6 * fps);

  return (
    <div
      style={{
        position: "absolute",
        left: width / 2 - size / 2,
        top: dotCenterY(height, width) - size / 2,
        width: size,
        height: size,
        scale: interpolate(frame, [0.2 * fps, 1 * fps, plan - 0.5 * fps, plan, plan + 0.5 * fps], [0, 1, 1, 1.25, 0], {
          ...clamp,
          easing: Easing.bezier(0.34, 1.4, 0.64, 1),
        }),
        opacity: interpolate(frame, [plan, plan + 0.5 * fps], [1, 0], clamp),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `${3 * u}px solid ${accent}`,
          scale: String(1 + pulse * 1.3),
          opacity: 0.45 * (1 - pulse),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, #ffffffaa 0%, ${accent} 42%)`,
          boxShadow: `0 ${18 * u}px ${60 * u}px ${accent}66`,
        }}
      />
    </div>
  );
};

/** Shared so scenes can place things relative to the dot. */
// Portrait frames sit the dot a little above centre; square and landscape frames need it lower to clear the headline.
export const dotCenterY = (height: number, width = 1080) => height * (height / width > 1.15 ? 0.45 : 0.56);
