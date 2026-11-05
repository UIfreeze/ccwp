---
name: glass-to-neon-lyrics
description: Make an emotional 16:9 lyric video that changes mood with the song — red frosted-glass Apple-Music-style lyrics card over a wall of giant red words that cracks and shatters, then full-screen clips with lyrics in the empty space, a key line cut out as giant fire-filled letters, and a pink neon rain ending with splashing, reflected words. Use when the user runs /glass-to-neon-lyrics or asks for this style, with a song MP3 (or clip), its lyrics, cover art and 4–6 clips/photos attached.
---

# Glass to Neon Lyrics

An emotional 1920×1080, 30 fps lyric video in three moods (glass card → clips → pink neon), like the *Arz Kiya Hai* (Anuv Jain × Lost Stories) lyric video. Every frame is drawn in code on an HTML canvas, rendered frame by frame in headless Chrome and encoded with ffmpeg. No stock footage and no image generators: only the user's song, lyrics, cover art and clips.

## Inputs (all from the user)
- **Song**: MP3/WAV, the full song or a clip. Use exactly the part they give.
- **Lyrics**: exactly as they wrote them, one line per line. Never correct, translate or re-spell them.
- **Cover art**: square image.
- **4–6 clips or photos**, each with the mood they want for that part.

If anything is missing, ask for it. Never invent lyrics, never download the song, and never use files the user didn't give.

## Rules for every run
1. **Word timing comes from forced alignment only** (torchaudio `MMS_FA` on the separated vocals). Never guess, never use Whisper word timestamps (they drift 1–3 s).
2. **Show a contact sheet of stills before the full render** and wait for a go-ahead.
3. **Ask before overwriting** any existing output file.
4. **Ask before installing** anything (demucs, torch, librosa, fonts). Check what's already there first.
5. Deliver the full-quality MP4 with the original audio **plus a 720p copy under 20 MB** for WhatsApp.
6. No logos, watermarks or branding the user didn't ask for.

## Step 0: Environment check
Check for Node 18+, ffmpeg, Chrome/Chromium (Playwright's is fine), Python 3.10+, `demucs`, `torch` + `torchaudio` (≥ 2.1 for `MMS_FA`), `librosa`, and the fonts **Inter** (800 and 900) and **Great Vibes**. Report what's missing and ask before installing. Load fonts from local files with `@font-face`. If they can't be downloaded, ask the user to drop the .ttf files into `fonts/`.

Project layout (in the folder with the user's files):
```
song.mp3  lyrics.txt  cover.jpg  clips/01.* … 06.*
work/      vocals.wav, no_vocals.wav, words.json, beats.json, plan.json, stills/
out/       <title>-1080p.mp4, <title>-720p-whatsapp.mp4
```

## Step 1: Analyse the song
1. **Separate vocals**: `demucs --two-stems=vocals -o work/sep song.mp3`, then copy to `work/vocals.wav` and `work/no_vocals.wav`.
2. **Force-align every lyric word** on `vocals.wav` with `torchaudio.pipelines.MMS_FA`:
   - resample to 16 kHz mono;
   - normalise the user's words for the aligner only (lowercase, strip punctuation; romanise Devanagari or Urdu script with `uroman` first). Keep a mapping back to the **exact original word** for display;
   - process in chunks of 30 s or less (align line by line using approximate line windows if needed);
   - write `work/words.json`: `[{ "line": 0, "i": 0, "text": "<exact word>", "start": s, "end": s }]`.
   - Sanity check: every word gets a time, times only increase, and nothing lands in long instrumental gaps. Re-align any line that fails.
3. **Beats**: `librosa.beat.beat_track` on `no_vocals.wav`. Check the tempo isn't halved or doubled (if it's under 70 BPM, test double). Also find **downbeats** and the strongest **onset peaks** for cuts. Write `work/beats.json`.
4. **Plan the parts by meaning**: read the lyrics, then split the song into
   - **Part 1, glass card**: opening lines, intimate;
   - **Part 2, clips**: one clip per lyric section, matched to the user's stated moods. **Each clip is used once only**;
   - **Key line**: the most important or quotable line, often the hook. Gets the fire-letters treatment;
   - **Part 3, pink neon ending**: the final lines.

   Cuts go on downbeats or onset peaks near line boundaries. Write `work/plan.json` and **tell the user which clip goes with which lines** (one short table) before rendering.

## Step 2: Part 1, the glass card
- Background: a slow-scrolling wall of the lyric words in giant deep-red caps (about 220–300 px, Inter 900, #3a0008 → #5c0010, 15–25% opacity variation), scrolling up about 20 px/s, with slight parallax between rows.
- Card: dark red **frosted glass** (rounded about 36 px, red gradient #5a0a14 → #2a0408 at about 75% opacity, inner highlight, 1 px light rim, soft drop shadow). Fake the blur by drawing a blurred copy of the background inside the card clip. Tilted slightly in 3D: draw the card to an offscreen canvas, then perspective-warp it (small rotateX/Y, about 4–6°, slowly breathing).
- Card content like the Apple Music lyrics screen: cover art (rounded) + song title + artists at the top, then the lyric lines left-aligned in large bold text.
  - **Current line**: each word fills from dim (35% white) to bright (100%) exactly from its `start` to `end` (a left-to-right fill inside the word).
  - **Next line** waits below, blurred (filter blur about 3 px, 30% opacity). Past lines scroll up and fade.
  - **On every line change**: the lines glide up with an ease-out (about 0.45 s) and a soft diagonal shine sweeps across the card (about 0.6 s).
- **End of part 1**: thin light crack lines grow from an impact point over about 0.5 s (a random branching polyline with glow). Then the card **shatters**: Voronoi-style polygon shards, each carrying its piece of the card image, fly toward the camera (scale up, spin, motion blur by drawing 3–4 ghost copies) with a red bloom that carries into the next part. Time the shatter to a strong beat.

## Step 3: Part 2, the clips
- Each clip full-screen in its **natural colours** with a slow push-in (scale 1.00 → 1.08 over the shot). Decode video clips to frames with ffmpeg at 30 fps once and cache them. Still photos use a slow Ken Burns move.
- **Lyrics go in the empty space**: find it per shot (sky above a person, area below the horizon, the dark side of the frame). Never put text over a face. Detect faces or bright subjects, or ask the user if it's unclear. Check every shot in the stills.
- Three-row typography, word by word on the voice:
  1. a small tracked caps row (Inter 600, about 28 px, letter-spacing 0.35em, 80% white);
  2. one big caps row (**Inter 800**, about 110–150 px);
  3. one word in red **Great Vibes** script (about 150 px, #e0213a) that **writes itself on**: reveal along the stroke with a moving clip mask from left to right over about 0.6 s, with a slight glow.

  Each word enters when it's sung (opacity + 20 px rise + 0.92 → 1 scale, ease-out 0.25 s).
- **Make still photos alive**, for example on a starry field: twinkling stars (random small points with sin-based brightness), 2–4 shooting stars (a streak with a fading tail, about 0.6 s each), and slow drifting light or haze.
- Transitions between shots: soft **white flashes** (about 0.25 s) or **red burns** (a red-orange radial wash plus overexposure) on the downbeat.

## Step 4: The key line, fire letters
- Black screen. The key line is set as **giant Inter 900 caps** that fill most of the frame. The fire clip (or the brightest clip given) is drawn **only inside the letters**: draw the clip, then `globalCompositeOperation = 'destination-in'` with the text.
- Words cut in on their sung times. Then the letters **scale up** (ease-in, about 1.2 s) until the clip fills the screen and the next shot begins.
- If the user gave no fire clip, ask which clip to use. Don't generate fire.

## Step 5: Part 3, the pink neon ending
- All clips in a **pink duotone** (shadows #12010a, highlights #ff4fa3), darker toward the bottom (vertical gradient multiply).
- Neon lyric words **drop in one by one** on their sung times with a small bounce (spring with about 10% overshoot). They **flicker on like a sign** (2–3 off/on flickers in the first 0.3 s), with a pink neon glow (shadowBlur layers: white core, #ff4fa3 glow, #ff1a75 outer).
- Each word **lands with a splash** on a wet floor: an expanding elliptical ripple plus 6–10 droplets following parabolas. The floor **mirrors** the words: flip vertically below the waterline at about 35% opacity, with a sine-wave horizontal displacement for ripples.
- **Light rain** across the frame (thin diagonal streaks) plus a few **drops on glass** (refractive circles that slide down slowly).
- On the last word, **hold the frame** and fade out to black over the song's last 2–3 s.

## Step 6: Finishing
- **Grain** (per-frame noise at about 4–6% opacity) and a **soft vignette** on every frame.
- Audio: the original song (or the user's clip), with a short fade in (0.3 s) and fade out (1.5–2 s). Keep the original loudness.
- Rendering: one HTML page with a canvas and a `renderFrame(t)` function, deterministic (seeded random, no clocks). Drive it with Playwright, step t by 1/30 s, screenshot or `toDataURL` each frame, and pipe to ffmpeg:
  `ffmpeg -framerate 30 -i frames/%05d.png -i song.mp3 -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart out/<title>-1080p.mp4`
- WhatsApp copy: 1280×720, CRF or bitrate tuned so the file is under 20 MB (two-pass if needed), AAC 128k, `+faststart`. Check the size.

## Step 7: Check before and after
1. **Before the full render**: a contact sheet of about 12 stills (the card mid-line, the crack, the shatter, each clip with its text, the fire line, the neon splash, the last frame). Check that no text sits over a face, nothing overflows the safe area (96 px margins), and each word is lit only while it's sung. Show it to the user and wait for an OK.
2. **After the render**: a 20-frame contact sheet. Spot-check word timing at 3 or more points against the audio. Confirm duration, 1920×1080, 30 fps, audio present, and the 720p file is under 20 MB.
3. Fix problems one at a time, by timestamp, and re-render only what changed.
