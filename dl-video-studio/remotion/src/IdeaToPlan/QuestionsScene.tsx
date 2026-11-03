import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WordReveal } from "./WordReveal";
import { useLayout } from "./layout";
import { dotCenterY } from "./IdeaDot";

// Offsets from the dot centre (in layout units), chosen so pills clear the headline, the dot and each other.
const PORTRAIT = [[-170, -190], [180, 155], [-150, 295], [210, -110]];
const LANDSCAPE = [[-520, -150], [500, -70], [-460, 170], [480, 200]];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const QuestionsScene: React.FC<{ headline: string; questions: string[]; ink: string; accent: string }> = ({
  headline,
  questions,
  ink,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const cx = L.width / 2;
  const cy = dotCenterY(L.height, L.width);
  const offsets = L.landscape ? LANDSCAPE : PORTRAIT;
  const converge = durationInFrames - 0.6 * fps;

  return (
    <AbsoluteFill>
      <WordReveal
        text={headline}
        delay={0.1 * fps}
        style={{
          position: "absolute",
          top: L.safeY + 40 * L.u,
          left: L.safeX,
          right: L.safeX,
          fontSize: L.headline,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: ink,
          opacity: interpolate(frame, [converge, durationInFrames], [1, 0], clamp),
        }}
      />
      {questions.map((q, i) => {
        const [ox, oy] = offsets[i % offsets.length];
        const start = 0.7 * fps + i * 0.35 * fps;
        const float = Math.sin((frame + i * 23) / (0.9 * fps)) * 7 * L.u;
        return (
          <div
            key={`${q}-${i}`}
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              translate: `calc(-50% + ${interpolate(frame, [converge, durationInFrames], [ox * L.u, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) })}px) calc(-50% + ${interpolate(frame, [converge, durationInFrames], [oy * L.u + float, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) })}px)`,
              scale:
                interpolate(frame, [start, start + 0.5 * fps], [0.6, 1], { ...clamp, easing: Easing.bezier(0.34, 1.3, 0.64, 1) }) *
                interpolate(frame, [converge + 0.3 * fps, durationInFrames], [1, 0.2], { ...clamp, easing: Easing.in(Easing.quad) }),
              opacity: interpolate(frame, [start, start + 0.3 * fps, durationInFrames - 0.15 * fps, durationInFrames], [0, 1, 1, 0], clamp),
              display: "flex",
              alignItems: "center",
              gap: 16 * L.u,
              whiteSpace: "nowrap",
              padding: `${22 * L.u}px ${34 * L.u}px ${22 * L.u}px ${22 * L.u}px`,
              borderRadius: 999,
              background: "#ffffff",
              border: `${2 * L.u}px solid ${accent}33`,
              boxShadow: `0 ${10 * L.u}px ${30 * L.u}px #1b1f2a14`,
              fontSize: L.body * 0.95,
              fontWeight: 600,
              color: ink,
            }}
          >
            <span
              style={{
                width: 44 * L.u,
                height: 44 * L.u,
                borderRadius: "50%",
                background: accent,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 28 * L.u,
                fontWeight: 800,
              }}
            >
              ?
            </span>
            {q}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
