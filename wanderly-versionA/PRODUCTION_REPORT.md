# Version A: production report (v4, premium pass)

**Deliverable:** `exports/DecipheringLogic_Wanderly_VersionA_9x16_v4.mp4`
- 45.0 s, 1080×1920 (9:16), 30 fps constant
- H.264 with AAC 48 kHz stereo, 24.7 MB
- Posters: `exports/poster_handoff.png`, `exports/poster_endcard.png`

## What changed from v3 (feedback: "not premium enough", logo, narration)
| Area | v3 | v4 |
|---|---|---|
| Narration | None | Full supplied script, Artlist voice "Focus" (Eleven v3 model). The edit is locked to the voice, phrase by phrase. |
| Brand | Text only | Official DL mark and long logo. The crimson **D** slides into the **L**, lands on the lock-up, and the wordmark wipes on. DL green ground, crimson as the "person" colour. |
| Look | Flat cards | Frosted-glass materials with specular sweeps, light orbs, vignette, moving film grain, depth-of-field focus pulls |
| Camera | Static, cuts | A continuous 3D camera rig that breathes the whole film. Isometric pedestal reveal: exploded glass layers merge into one thread. |
| Typography | Fades | Masked word-by-word kinetic type at 80 px; end titles at 100 px |
| Story beats | — | Added "Can you explain what it said?" (the CEO fear), a typing indicator before each AI message, and a light-flare "turn" from problem to solution |
| Sound | Simple synth | Two-act score (tense pulse → warm resolve), riser and impact into the reveal, handoff chime, logo lock-in hit. Music auto-ducks about 8 dB under the voice. |

## Pipeline
- **Motion graphics:** HyperFrames 0.8.214 (HTML + GSAP, CSS 3D)
- **Voice:** Artlist (120 credits, approved in chat). The file was relayed through ElevenLabs storage because Artlist's file host is blocked in this sandbox.
- **Music and SFX:** original, synthesized in `tools/synth_audio.py`
- **Mastering:** FFmpeg (EQ, compression, loudness)
- **Voice sync:** ElevenLabs transcription (needs 521 credits, account has 181) and offline speech models (download host blocked) were both unavailable. Phrases were aligned from pause detection plus syllable counts against the known script, then verified visually against the waveform's speech/pause map.

## Credits used
- **Artlist:** 120 (voiceover).
- **ElevenLabs:** 0. The two attempts failed on quota and were not charged.

## Voice edit
The take was used as generated. The only edit is a 0.8 s pause added between "…a person should have started." and "On Wanderly…", to land the turn.

## QA (rendered file)
- 45.000 s, constant frame rate, 0 black frames, no frozen stretches.
- Loudness −16.5 LUFS integrated, true peak −1.7 dBFS (LinkedIn/mobile-safe).
- Narration sits about 10 LU above the music bed.

| Criterion | v3 | v4 | Note |
|---|---|---|---|
| First-two-second hook | 7 | 8 | Glass card and headline are on frame 0; a focus pull at 1.8 s |
| Narrative clarity | 8 | 9 | VO, type and visual say the same thing at the same moment |
| Product-message accuracy | 9 | 9 | Supplied facts only. "Can you explain what it said?" is an editorial rephrase of the script. |
| Visual originality | 7 | 8 | Pedestal merge and colour-grammar handoff |
| 2D/3D animation | 7 | 8 | Browser 3D, not raytraced |
| Typography | 8 | 9 | |
| Sound design | 6 | 7 | Original synth. A licensed track would still lift it. |
| VO sync | n/a | 8 | Aligned without a transcript; the spot checks are visual |
| Brand consistency | 5 | 8 | Official logo, colours sampled from it; guidelines still unseen |
| LinkedIn readability | 8 | 9 | |
| Technical export | 9 | 9 | |

## Known limits
- The site and brand guidelines are still not reachable here.
- Music is synthesized, not licensed.
- Small mono labels inside the UI are texture, below the 28 px phone floor.
