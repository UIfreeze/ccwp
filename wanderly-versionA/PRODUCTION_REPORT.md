# Version A: production report

**Deliverable:** `exports/DecipheringLogic_Wanderly_VersionA_9x16_v3_noVO.mp4`
- 44.0 s, 1080×1920 (9:16), 30 fps constant
- H.264 yuv420p with AAC 48 kHz stereo, 10.0 MB

**Status: visuals, sound design and music are complete. The voiceover is NOT in this cut** (see Blockers).

## Pipeline used (verified in this environment)
| Task | Tool | Notes |
|---|---|---|
| Motion graphics, 2D/3D, typography, UI | HyperFrames 0.8.214 (HTML + GSAP 3.14, CSS 3D transforms) | Editable source in `index.html`; all timing lives in one `T` table |
| Rendering and encoding | HyperFrames render (headless Chromium + FFmpeg), `-q delivery` | |
| Music bed and SFX | Original synthesis in numpy (`tools/synth_audio.py`) | No licensing questions; cue times mirror `T` |
| QA | `hyperframes check` / `snapshot`; FFmpeg blackdetect, freezedetect, EBU R128 | |
| Voiceover | Not produced. See Blockers | |

## Blockers (honest)
1. **Voiceover**
   - The ElevenLabs workspace has 181 credits left, and the VO needs 602, so that generation failed and nothing was charged.
   - Artlist can do it: a quote with the voice "Focus" (middle-aged American male) came back at **120 Artlist credits**. It has not been run, because Artlist spending needs your approval.
   - There is no Fish Audio integration in this session.
2. **Network**
   - `decipheringlogic.com`, `artlist.io` and Artlist's file hosts are blocked by this cloud environment's network policy.
   - So brand guidelines and the logo could not be checked, and Artlist catalog music could not be downloaded or auditioned. I used original synthesized music instead.
3. **No official assets.** There's no Wanderly UI or Deciphering Logic logo, so the interface is neutral and conceptual, and the brand appears as type only.

## Creative decisions
- **One colour grammar:** blue is always AI and warm sand is always a person. The handoff is the moment the colour changes inside the same thread, so it reads with the sound off.
- **Arc: disorder → order.** The first half is 3D, tilted and scattered. The second half is flat, frontal and still. A hard silence at 15.2 s marks the turn.
- **No invented content.** Messages are skeleton bars, and the only product facts shown are the supplied ones. On-screen lines come from the directive's suggested overlays, plus the approved tagline.
- **Restraint:** no robots, brains, particles or fake metrics. The 3D is used only where depth means something: volume over time, and many threads.

## QA (self-scored against evidence; no 10s)
| Criterion | Score | Evidence or gap |
|---|---|---|
| First-two-second hook | 7 | Card and headline are on screen at frame 0. It's a calm open, not a jolt. |
| Narrative clarity | 8 | Problem → turn → handoff → rule → payoff, each with one line of type |
| Product-message accuracy | 9 | Only the supplied facts; no stats or features |
| Visual originality | 7 | A coherent system, though the language is within premium-SaaS norms |
| 2D/3D animation quality | 7 | Smooth, eased, staggered. The 3D is CSS-based, not a raytraced 3D engine. |
| Typography | 8 | Native fonts embedded, all proofread. Some small mono labels sit under the 28 px phone floor, but they're texture. |
| Sound design | 6 | Cue-accurate and restrained, but synthesized. A licensed track would lift it. |
| VO synchronisation | n/a | No VO yet; the timing sheet is ready |
| Brand consistency | 5 | The site and logo couldn't be checked |
| LinkedIn readability | 8 | Safe-area text, sound-off legible |
| Technical export | 9 | 44.000 s, CFR 30, no black frames, peak −5.1 dBFS, −20.3 LUFS (no VO) |

**Checks:**
- Freeze detection shows one 1.5 s hold at 22.5 s. It's a deliberate pause on the handoff.
- Lint passes with 0 errors.
- The remaining warnings are deliberate text overlaps in the "disorder" scene and low-contrast log texture.

## Before Version B (recommendations)
1. Approve the 120-credit Artlist VO, or top up ElevenLabs.
2. Allow `artlist.io`, `*.artlist.io` and `decipheringlogic.com` in the environment's network settings so I can fetch the VO and a licensed music track and check the brand.
3. Send the Deciphering Logic logo if you'd like it on the end card.

I'll then re-time the cues to the real take and re-render. That is a quick change, because all timing lives in one table.
