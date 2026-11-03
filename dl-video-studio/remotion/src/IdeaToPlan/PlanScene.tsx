import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WordReveal } from "./WordReveal";
import { useLayout } from "./layout";
import { dotCenterY } from "./IdeaDot";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PlanScene: React.FC<{ headline: string; items: string[]; ink: string; accent: string }> = ({
  headline,
  items,
  ink,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const cols = L.landscape ? Math.min(items.length, 4) : Math.min(items.length, 2);
  const rows = Math.ceil(items.length / cols);
  const gap = 28 * L.u;
  const cardW = (L.width - 2 * L.safeX - gap * (cols - 1)) / cols;
  const cardH = 230 * L.u;
  const gridH = rows * cardH + (rows - 1) * gap;
  const gridTop = Math.max(dotCenterY(L.height, L.width) - gridH / 2 + 60 * L.u, L.safeY + 260 * L.u);
  const exit = interpolate(frame, [durationInFrames - 0.4 * fps, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <WordReveal
        text={headline}
        delay={0.35 * fps}
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
        }}
      />
      {items.map((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = L.safeX + col * (cardW + gap);
        const y = gridTop + row * (cardH + gap);
        // Cards fly out from where the idea dot burst (frame centre).
        const fromX = L.width / 2 - (x + cardW / 2);
        const fromY = dotCenterY(L.height, L.width) - (y + cardH / 2);
        const start = 0.15 * fps + i * 0.22 * fps;
        const check = start + 0.9 * fps;
        return (
          <div
            key={`${item}-${i}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: cardW,
              height: cardH,
              borderRadius: 28 * L.u,
              background: "#ffffff",
              boxShadow: `0 ${14 * L.u}px ${40 * L.u}px #1b1f2a17`,
              padding: 34 * L.u,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              translate: `${interpolate(frame, [start, start + 0.7 * fps], [fromX, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })}px ${interpolate(frame, [start, start + 0.7 * fps], [fromY, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })}px`,
              scale: interpolate(frame, [start, start + 0.7 * fps], [0.25, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
              opacity: interpolate(frame, [start, start + 0.25 * fps], [0, 1], clamp),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 28 * L.u, fontWeight: 700, color: accent, letterSpacing: "0.06em" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  width: 48 * L.u,
                  height: 48 * L.u,
                  borderRadius: "50%",
                  background: accent,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 28 * L.u,
                  fontWeight: 800,
                  scale: interpolate(frame, [check, check + 0.35 * fps], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.6, 0.64, 1) }),
                }}
              >
                ✓
              </span>
            </div>
            <div style={{ fontSize: L.body, fontWeight: 700, color: ink, lineHeight: 1.15 }}>{item}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
