# Learning log

Records only what was actually accessed and verified. Format: date · source · what was checked · finding · confidence.

## 2026-11-03
- **Handbook V5** (supplied by the user, read in full via text extraction). It is the controlling spec. Key constraints were applied to the build: approval gates, local-first, private by default, and no claims about unverified features.
- **Environment check:** Node 22.23.4 provides `node:sqlite`. Verified by running it. Confidence: high.
- **Remotion licensing**, *verified* against the official LICENSE.md in remotion-dev/remotion: free for individuals, non-profits and for-profit organisations with up to 3 employees; otherwise a Company License is needed. Confidence: high.
- No YouTube, Instagram, Notion, Drive or Docs references have been watched or read yet. All are marked Pending in `REFERENCE_REGISTER.md`.
- **Remotion Agent Skills** (remotion-dev/skills, read): official practices applied in the sample. Animations are driven by `useCurrentFrame()` + `interpolate()` (CSS transitions don't render), `fps`-based timing, `scale`/`translate` properties instead of `transform` strings, default props inline on each `<Composition>` so Studio can save edits, a Zod schema for sidebar editing, and safe areas of 80px sides and 100px top/bottom with minimum headline 84px and body 44px at 1080 wide. Verified in Studio and by test render. Confidence: high.
- **Dependency advisory:** zod <4.6.6, GHSA-mrhx-c7xc-m3w5 (memory exhaustion on oversized constrained collections). Remotion 4.0.537–4.0.539 depend on zod 4.5.4; 4.0.540 moved to 4.6.7. Verified via `npm audit` and npm metadata. Confidence: high.
