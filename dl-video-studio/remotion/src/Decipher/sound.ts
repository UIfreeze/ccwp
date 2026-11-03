// Professional sound design for "Deciphered": licensed Artlist SFX placed on exact frames.
// Each file lives at public/sfx/<songId>.<wav|aac|m4a|mp3> (git-ignored — licensed audio is never committed).
// Hits land ~2 frames BEFORE their visual, per house rules. Times are seconds on the composition timeline.

export type Cue = {
  songId: string;
  label: string; // what it does in the edit
  at: number; // start time (s)
  max?: number; // hard stop after this many seconds (a clean cut, with a 3-frame fade)
  trim?: number; // skip this many seconds at the start of the file
  vol: number; // 0..1 before the master SFX volume
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds before the cut/end
  rate?: number; // playback rate (small pitch variation for repeats)
};

const LOCK = (i: number): Cue => ({
  songId: "98871", label: `Card ${i + 1} locks into the grid`, at: 14.7 + i * 0.12 - 0.07, vol: 0.32 - (i % 3) * 0.04, rate: [1, 1.06, 0.95][i % 3], max: 0.6,
});

export const CUES: Cue[] = [
  { songId: "22701", label: "Swirling sci-fi riser: fragments pulled into the core", at: 5.2, max: 4.13, vol: 0.75, fadeIn: 1.2 },
  { songId: "91962", label: "Metallic boom impact: the core absorbs everything", at: 9.33, vol: 1.0 },
  { songId: "81150", label: "Supersonic whoosh: shockwave", at: 9.4, vol: 0.7 },
  { songId: "29798", label: "Super-fast whoosh: jump to light speed", at: 10.3, vol: 0.6 },
  { songId: "114114", label: "Shimmering light: the decode beam draws in", at: 11.0, max: 3.2, vol: 0.55, fadeOut: 0.8 },
  { songId: "93801", label: "Fast motion whoosh: warp into the grid", at: 13.45, vol: 0.6 },
  ...Array.from({ length: 12 }, (_, i) => LOCK(i)),
  { songId: "75548", label: "Airy low swipe: scan beam crosses the grid", at: 16.55, vol: 0.5 },
  { songId: "93801", label: "Fast motion whoosh: push into the tunnel", at: 18.75, vol: 0.7, rate: 0.9 },
  { songId: "96873", label: "Sweeping pass-by (tunnel)", at: 20.3, vol: 0.45 },
  { songId: "52606", label: "Elastic pass-by (tunnel)", at: 21.2, vol: 0.4 },
  { songId: "96873", label: "Sweeping pass-by (tunnel)", at: 22.1, vol: 0.45, rate: 1.08 },
  { songId: "110513", label: "Electronic stutter riser: light at the end of the tunnel", at: 23.0, max: 1.83, vol: 0.6, fadeIn: 0.3 },
  { songId: "90916", label: "Booming impact with rattle: flash into the blueprint", at: 24.83, vol: 0.85 },
  { songId: "93818", label: "Sheet pops out (1)", at: 25.18, vol: 0.4 },
  { songId: "93818", label: "Sheet pops out (2)", at: 25.38, vol: 0.4, rate: 1.07 },
  { songId: "93818", label: "Sheet pops out (3)", at: 25.58, vol: 0.4, rate: 1.14 },
  // 27.8–28.4: deliberate silence before the logo, as in the reference.
  { songId: "126242", label: "Spinning riser: particles gather into the DL mark", at: 28.4, max: 1.93, vol: 0.6, fadeIn: 0.5 },
  { songId: "84686", label: "Deep cinematic impact: the official mark lands", at: 30.33, vol: 0.95 },
  { songId: "110689", label: "Pure cinematic logo shimmer: mark, tagline and end card", at: 30.33, vol: 0.7, fadeOut: 1.0 },
];

export const MUSIC_FILE_PREFIX = "sfx/music."; // optional: public/sfx/music.<ext>

/** Unique Artlist SFX the cue sheet needs (for the download list). */
export const REQUIRED_SFX = [...new Set(CUES.map((c) => c.songId))];
