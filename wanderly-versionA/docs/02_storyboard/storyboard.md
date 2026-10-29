# Timed storyboard: Version A

> **v4 note:** the shot list below is the v3 plan. The v4 premium pass keeps the same 10 beats, re-timed to the voiceover (see `docs/01_research_script/script_and_vo_timing.md`, "Voiceover as produced"), and adds:
> - glass materials, film grain and a continuous 3D camera;
> - the "Can you explain what it said?" beat;
> - the pedestal layer-merge reveal and the light-flare turn;
> - the DL logo lock-up.
>
> The palette moves to DL green and crimson: crimson is now the "person" colour.

## v3 shot plan (9:16, 1080×1920, 30 fps, 44.0 s)

**Design system**
- **Ground:** graphite #0b0c0f. **Text:** warm white #f2eee6.
- **AI** = electric blue #4c7dff. **Human/recruiter** = warm sand #f2c48d. This colour split is the film's grammar: blue is always AI and sand is always a person.
- **Type:** Inter Display (headlines), Inter (UI) and JetBrains Mono (labels). All type is native text, never generated.
- **Message content** is skeleton bars, so there's no invented copy and no gibberish.
- **Tool:** HyperFrames (HTML + GSAP, CSS 3D transforms), rendered to H.264/AAC MP4. Every shot is code-built; there are no stock or AI clips.

| # | Time | VO | Visual objective | Composition | Animation | Camera | Typography | Transition | SFX | Assets | Quality risks |
|---|------|----|------------------|-------------|-----------|--------|------------|------------|-----|--------|---------------|
| 1 | 0.0–3.8 | "A customer forwards…" | Hook: an unexpected forwarded reply | Single email card, centre | Card rises from soft blur; AI quote bars draw on; quote pulses | Slow 4% push-in | Kicker "Forwarded / A reply from your screening tool." | Card drops back and blurs out | Notification ping 0.3 s, tick 1.7 s | None | Visible on frame 0 for the feed thumbnail |
| 2 | 3.8–9.2 | "…three weeks… can't explain…" | Volume over time | Isometric 3D plane of message cards in 3 week columns | Cards drop in by column and row; stacks deepen in week 3 | Plane rotates −36° → −30° and dollies in | "Three weeks of AI conversations." | Cards scatter | 24 soft ticks, rising pitch | None | Week labels are texture, not reading text |
| 3 | 9.2–15.2 | "You open the logs… a person should have started." | The missing boundary | AI chip → path stops at "?" → dashed "Person" chip; log viewer below; scattered cards behind | Path draws, breaks, ? pulses; logs scroll | Static | "Where should AI stop?" → "When does a person take over?" | Everything collapses to centre | Texture swell, low tonk on "?" | None | Intentional clutter, kept dim and blurred |
| 4 | 15.2–18.4 | "On Wanderly, the nurse staffing marketplace," | Order replaces disorder | One conversation panel, Wanderly header (plain text, no logo) | Panel resolves from blur; header staggers in | Settle | Header in panel | Hard-silence beat at 15.2 s | Whoosh, sub-thump, shimmer | None | No official UI claimed; neutral conceptual interface |
| 5 | 18.4–21.0 | "the AI screens candidates," | AI's part of the thread | AI (blue, left) and candidate (grey, right) messages | Messages fly in from scattered positions and settle; AI bubbles glow | Static | "Step 1 / AI screens candidates." | — | Soft clicks per message | None | Avoids implying features beyond screening |
| 6 | 21.0–24.2 | "…a human recruiter takes over, in that same thread." | **Climax: the handoff** | Same panel; divider "Handed to recruiter"; owner pill | Blue line → pill pops → sand line; owner flips AI → Recruiter; light sweep runs down the existing thread; recruiter message lands below | Static (stillness sells it) | "Step 2 / Same thread. Full context." | Panel pulls back | Two-note rising chime | None | Must read in under 1 s; colour flip carries it |
| 7 | 24.2–30.4 | "Every AI step we build ends in a handoff to a person…" | It's a rule, not a one-off | Three 3D thread rails | Blue segments build; handoff nodes pop; sand segments grow | Rails tilt 24° → 14° | "Every AI step ends in a handoff to a person." | Rails blur out | Three node pings | None | Perspective keeps the rails readable |
| 8 | 30.4–33.8 | "The recruiter picks up mid-thread, with everything the AI said." | Context is inherited | Thread, close | Scrolls back to the top; blue bracket spans all AI messages; scrolls down; candidate replies to recruiter | Push-in on entry | "The recruiter picks up mid-thread." | — | Soft click | None | — |
| 9 | 33.8–38.2 | "You read one conversation, instead of… logs." | One thread beats fragments | Thread, with stray log fragments around the edges | Fragments get pulled in behind the thread and vanish | 3% slow push | "One conversation." | Thread blurs out | Ticks, inward whoosh | None | Fragments sit behind the panel, never over it |
| 10 | 38.2–44.0 | — | Resolution and brand | Single vertical line: blue → node → sand | Line draws, node pops, lines resolve, signature fades in | 3.5% slow push on lines | "One conversation. A clear handoff." / "Deciphering Logic" / "decipheringlogic.com" | Fade to black in the last 0.6 s | Thump and three-note chime | None (no logo supplied) | Brand shown as type only; logo to add once supplied |
