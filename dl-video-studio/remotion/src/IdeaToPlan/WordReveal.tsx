import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Reveals a line word by word: each word rises and fades in, staggered. */
export const WordReveal: React.FC<{
  text: string;
  delay?: number; // frames
  style?: React.CSSProperties;
}> = ({ text, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  const stagger = Math.round(0.12 * fps);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.28em", ...style }}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          style={{
            display: "inline-block",
            opacity: interpolate(frame, [delay + i * stagger, delay + i * stagger + 0.4 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [delay + i * stagger, delay + i * stagger + 0.6 * fps], ["0px 0.45em", "0px 0em"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
};
