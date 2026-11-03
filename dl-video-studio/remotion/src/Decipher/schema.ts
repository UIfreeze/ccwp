import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// "Deciphered" — original DL piece. Style inspired by a user-supplied cinematic reference
// (dark teal world, glass cards, chaos → core → order → logo), with DL's own message and assets.
// Defaults live inline on each <Composition> in Root.tsx so Studio can save edits.
export const decipherSchema = z.object({
  chaosCaption: z.string(),
  gridCaption: z.string(),
  deliverables: z.array(z.string()).min(4).max(12),
  tagline: z.string(),
  endCard: z.boolean(),
  background: zColor(),
  glow: zColor(),
  glowSoft: zColor(),
  warm: zColor(),
  withSound: z.boolean(),
  showSafeArea: z.boolean(),
});
export type DecipherProps = z.infer<typeof decipherSchema>;

/** Scene windows in seconds [start, end]. Neighbouring scenes overlap slightly for cross-fades. */
export const T = {
  chaos: [0, 11.2],
  hyper: [10.4, 14.6],
  grid: [14.0, 19.9],
  tunnel: [19.4, 24.9],
  hero: [24.4, 28.3],
  logo: [28.0, 35.4],
  end: [34.8, 37.5],
} as const;
export const DECIPHER_SECONDS = 37.5;
