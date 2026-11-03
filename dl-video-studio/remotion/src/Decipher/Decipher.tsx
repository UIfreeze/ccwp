import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { DecipherProps, T } from "./schema";
import { ChaosToCore } from "./ChaosToCore";
import { Hyperspace } from "./Hyperspace";
import { BlueprintGrid } from "./BlueprintGrid";
import { Tunnel } from "./Tunnel";
import { Hero } from "./Hero";
import { EndCard, LogoReveal } from "./LogoReveal";
import { SafeArea } from "../IdeaToPlan/SafeArea";

/**
 * "Deciphered" — original DL piece (synthetic demo).
 * Chaos of a founder's inputs → logic core → decode beam → structured plan → fly-through → blueprint → mark.
 */
export const Decipher: React.FC<DecipherProps> = (p) => {
  const { fps } = useVideoConfig();
  const { durationInFrames } = useVideoConfig();
  const seq = (k: keyof typeof T) => ({ from: Math.round(T[k][0] * fps), durationInFrames: Math.round((T[k][1] - T[k][0]) * fps) });
  // Without the end card, the logo scene simply holds to the end.
  const logoSeq = p.endCard ? seq("logo") : { from: seq("logo").from, durationInFrames: durationInFrames - seq("logo").from };
  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: '"Helvetica Neue", "Segoe UI", Arial, sans-serif' }}>
      <Sequence name="Chaos → core" {...seq("chaos")}>
        <ChaosToCore glow={p.glow} glowSoft={p.glowSoft} warm={p.warm} caption={p.chaosCaption} />
      </Sequence>
      <Sequence name="Decode beam" {...seq("hyper")}>
        <Hyperspace glow={p.glow} glowSoft={p.glowSoft} />
      </Sequence>
      <Sequence name="Blueprint grid" {...seq("grid")}>
        <BlueprintGrid items={p.deliverables} glow={p.glow} glowSoft={p.glowSoft} warm={p.warm} caption={p.gridCaption} />
      </Sequence>
      <Sequence name="Tunnel" {...seq("tunnel")}>
        <Tunnel items={p.deliverables} glow={p.glow} glowSoft={p.glowSoft} warm={p.warm} />
      </Sequence>
      <Sequence name="Hero" {...seq("hero")}>
        <Hero glow={p.glow} glowSoft={p.glowSoft} warm={p.warm} />
      </Sequence>
      <Sequence name="Mark" {...logoSeq}>
        <LogoReveal glow={p.glow} glowSoft={p.glowSoft} tagline={p.tagline} bloomToEndCard={p.endCard} />
      </Sequence>
      {p.endCard ? (
        <Sequence name="End card" {...seq("end")}>
          <EndCard />
        </Sequence>
      ) : null}
      {p.withSound ? <Html5Audio src={staticFile("decipher-sound.wav")} /> : null}
      {p.showSafeArea ? <SafeArea /> : null}
    </AbsoluteFill>
  );
};
