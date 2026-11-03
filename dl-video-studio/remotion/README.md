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

## Export

```bash
npm run render:test   # half-size 4:5 test MP4 → ../exports/test-4x5.mp4
```

The first render downloads Remotion's headless browser (about 100 MB, one time). Full-size final exports follow an approved export plan.

## Versions and licence

- Pinned to Remotion **4.0.537** (released 2026-10-19) and React 19.2.9. Everything is pinned to exact versions on purpose.
- `zod` is forced to **4.6.7** via `overrides`, because the 4.5.4 that 4.0.537 ships with has a known high-severity advisory (GHSA-mrhx-c7xc-m3w5). Remotion itself moved to 4.6.7 in 4.0.540, so `npx remotion versions` shows a harmless version-mismatch notice until we upgrade.
- To upgrade later: run `npx remotion upgrade`, remove the override if no longer needed, then check Studio and a test render.
- **Licence:** free for individuals, non-profits and for-profit companies with up to 3 employees. Larger companies need a Remotion Company Licence (https://remotion.pro/license).
- Fonts use the system font stack (Helvetica Neue / Segoe UI / Arial) until DL's brand fonts are supplied. Colours and the logo are placeholders.
