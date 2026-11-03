import React from "react";
import { AbsoluteFill } from "remotion";
import { useLayout } from "./layout";

/** Preview-only guide: keep key text inside the dashed box. Tall 9:16 frames also mark typical platform UI zones. */
export const SafeArea: React.FC = () => {
  const L = useLayout();
  const tall = L.height / L.width > 1.6;
  const zone = { position: "absolute", left: 0, right: 0, background: "#ff00ff18", borderTop: "2px dashed #ff00ff66" } as const;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: L.safeX, right: L.safeX, top: L.safeY, bottom: L.safeY, border: "3px dashed #ff00ffaa" }} />
      {tall ? (
        <>
          <div style={{ ...zone, top: 0, height: L.height * 0.08, borderTop: "none", borderBottom: "2px dashed #ff00ff66" }} />
          <div style={{ ...zone, bottom: 0, height: L.height * 0.2 }} />
        </>
      ) : null}
      <div style={{ position: "absolute", top: 12, left: 12, fontSize: 22 * L.u, color: "#ff00ff", fontFamily: "monospace" }}>
        SAFE AREA (preview only)
      </div>
    </AbsoluteFill>
  );
};
