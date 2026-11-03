# DL Live Preview (Remotion)

Code-built motion graphics and UI animation for DL Video Studio, previewed live in Remotion Studio.
This is the **creation preview**, not a full editing timeline. The full edit, colour and sound happen in DaVinci Resolve.

## Run

```bash
npm install        # first time only
npm run dev        # opens Remotion Studio at http://localhost:3000
```

## Sample composition: IdeaToPlan (22s, 30fps, synthetic demo)

| Composition | Size | Use |
| --- | --- | --- |
| IdeaToPlan-4x5 | 1080 × 1350 | LinkedIn feed (primary) |
| IdeaToPlan-9x16 | 1080 × 1920 | Instagram Reels / Shorts (primary) |
| IdeaToPlan-1x1 | 1080 × 1080 | Square feed |
| IdeaToPlan-16x9 | 1920 × 1080 | YouTube / website |

All text, list items and colours are editable in Studio's right-hand panel, and sidebar edits can be saved back to `src/Root.tsx`. Turn on `showSafeArea` to see the text-safe box and, on 9:16, the zones covered by platform buttons. Layout adapts to each aspect ratio rather than cropping one master.

Scenes: Hook (4s) → Questions (6s) → Plan (8s) → CTA (4s). Scene lengths are in `src/IdeaToPlan/schema.ts`.

## Deciphered (37.5s, 30fps, synthetic demo)

An original DL piece styled after a user-supplied cinematic reference (dark teal world, glass cards, chaos → core → order → logo). It's DL's own message and assets: no footage, logos, icons, tagline or music were taken from the reference.

| Composition | Size |
| --- | --- |
| Deciphered-16x9 | 1920 × 1080 (matches the reference) |
| Deciphered-4x5 | 1080 × 1350 |
| Deciphered-9x16 | 1080 × 1920 |

Scenes (`src/Decipher/schema.ts`): chaos of a founder's inputs → vortex into the logic core (impact at 9.4s) → light-speed decode beam and ring → deliverables lock into a 3D grid with a scan beam → fly-through tunnel → glass blueprint hero → dip to black → particles form the official DL mark on a reflective floor → tagline → white end card with the full official lockup.

Editable in Studio: captions, the 12 deliverables (icons follow the wording), tagline, colours, sound on/off, end card on/off, and the safe-area guide.

**Official DL logo files** are in `public/brand/` and are displayed unmodified:
- `dl-mark-on-dark.png`: white DL on a dark-green (#182420) tile, for dark scenes.
- `dl-lockup-on-light.webp`: the full lockup (crimson D, dark-green L, wordmark, "BUILDING FUTURE") on a transparent background, for **light backgrounds only**. That's why it appears on the white end card.

The particle targets (`src/Decipher/markPoints.json`) were sampled from the mark's own white pixels. If DL has an SVG or a light-on-dark version of the full lockup, add it here and the end card can stay dark.

**Sound** is original and procedural: `scripts/make-sound.mjs` synthesises the drone, risers, impacts, whooshes, ticks, kicks, bells and pad, timed to the picture. It's created automatically as `public/decipher-sound.wav` (not stored in git) by `npm run dev` or the render scripts, or manually with `npm run sound`. Replace or supplement it with licensed music and SFX after approval.

## Export

```bash
npm run render:test         # half-size 4:5 test MP4 → ../exports/test-4x5.mp4
npm run render:deciphered   # full 1080p Deciphered → ../exports/deciphered-16x9.mp4 (about 4 min)
```

The first render downloads Remotion's headless browser (about 100 MB, one time). Full-size final exports follow an approved export plan.

## Versions and licence

- Pinned to Remotion **4.0.537** (released 2026-10-19) and React 19.2.9. Everything is pinned to exact versions on purpose.
- `zod` is forced to **4.6.7** via `overrides`, because the 4.5.4 that 4.0.537 ships with has a known high-severity advisory (GHSA-mrhx-c7xc-m3w5). Remotion itself moved to 4.6.7 in 4.0.540, so `npx remotion versions` shows a harmless version-mismatch notice until we upgrade.
- To upgrade later: run `npx remotion upgrade`, remove the override if no longer needed, then check Studio and a test render.
- **Licence:** free for individuals, non-profits and for-profit companies with up to 3 employees. Larger companies need a Remotion Company Licence (https://remotion.pro/license).
- Brand colours come from the official logo: crimson #c93a5f, dark green #182420. Fonts are still the system font stack until DL's brand fonts are supplied.
