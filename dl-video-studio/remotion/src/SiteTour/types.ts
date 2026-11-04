import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export type Box = { x: number; y: number; w: number; h: number };
export type NavItem = Box & { text: string; href: string | null };
export type Heading = Box & { level: number; text: string };
export type CapturedPage = {
  name: string; url: string; image: string; fold: string; width: number; dpr: number; title: string; height: number;
  nav: NavItem[]; headings: Heading[]; ctas: NavItem[]; headerSticky: boolean; headerHeight: number; navText?: string;
};
export type Tour = { site: string; capturedAt: string; viewport: { width: number; height: number }; mobile: string; pages: CapturedPage[] };

export const siteTourSchema = z.object({
  introTitle: z.string(),
  introSub: z.string(),
  accessTitle: z.string(),
  maxPages: z.number().min(1).max(8),
  stopsPerPage: z.number().min(0).max(8),
  background: zColor(),
  accent: zColor(),
  sound: z.enum(["library", "off"]),
});
export type SiteTourProps = z.infer<typeof siteTourSchema> & { tour?: Tour | null };
