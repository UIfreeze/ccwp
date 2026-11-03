import React from "react";
import { Icon, IconName } from "./Icons";
import { hexA } from "./util";

/** Original glass "document" card: tinted glass, bright rim, folded corner, icon and label. */
export const GlassCard: React.FC<{
  width: number;
  height: number;
  glow: string;
  icon?: IconName;
  label?: string;
  sub?: string;
  warm?: string; // optional accent colour for the icon
  intensity?: number; // 0..1 rim/glow strength
  style?: React.CSSProperties;
}> = ({ width, height, glow, icon, label, sub, warm, intensity = 0.6, style }) => {
  const u = Math.min(width, height) / 100;
  const fold = 14 * u;
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        borderRadius: 9 * u,
        background: `linear-gradient(145deg, ${hexA("#ffffff", 0.16)} 0%, ${hexA(glow, 0.1)} 45%, ${hexA("#06120f", 0.55)} 100%)`,
        border: `${Math.max(1, 1.4 * u)}px solid ${hexA(glow, 0.35 + 0.35 * intensity)}`,
        boxShadow: `inset 0 ${1.2 * u}px 0 ${hexA("#ffffff", 0.35)}, 0 0 ${26 * u * intensity}px ${hexA(glow, 0.35 * intensity)}`,
        clipPath: `polygon(0 0, calc(100% - ${fold}px) 0, 100% ${fold}px, 100% 100%, 0 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 11 * u,
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: fold, height: fold, background: hexA(glow, 0.45), clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
      {icon ? <Icon name={icon} size={30 * u} color={warm ?? glow} /> : <span />}
      {label ? (
        <div style={{ color: "#e9fffa", fontWeight: 600, fontSize: 15 * u, lineHeight: 1.15, letterSpacing: "0.01em" }}>
          {label}
          {sub ? <div style={{ color: hexA(glow, 0.8), fontWeight: 500, fontSize: 10 * u, marginTop: 3 * u, letterSpacing: "0.08em", textTransform: "uppercase" }}>{sub}</div> : null}
        </div>
      ) : null}
    </div>
  );
};
