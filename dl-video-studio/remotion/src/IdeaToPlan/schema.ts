import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// Everything here is editable in the Remotion Studio sidebar. Default values live inline on each
// <Composition> in Root.tsx so Studio can save sidebar edits back to the code.
// Colours follow the official DL logo: crimson #c93a5f and dark green #182420.
export const ideaToPlanSchema = z.object({
  hookText: z.string(),
  questionsHeadline: z.string(),
  questions: z.array(z.string()).min(1).max(4),
  planHeadline: z.string(),
  planItems: z.array(z.string()).min(1).max(4),
  ctaHeadline: z.string(),
  ctaButton: z.string(),
  showLogo: z.boolean(),
  background: zColor(),
  backgroundGlow: zColor(),
  ink: zColor(),
  accent: zColor(),
  dark: zColor(),
  showSafeArea: z.boolean(),
});

export type IdeaToPlanProps = z.infer<typeof ideaToPlanSchema>;


// Scene lengths in seconds. Total = 22s.
export const SCENES = { hook: 4, questions: 6, plan: 8, cta: 4 } as const;
export const TOTAL_SECONDS = SCENES.hook + SCENES.questions + SCENES.plan + SCENES.cta;
