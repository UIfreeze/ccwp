# "Deciphered" — professional sound cue sheet

Replaces the synthesised sound (rejected by the user as unprofessional) with licensed Artlist sound effects from established sound-design labels (BOOM Library, Epic Stock Media, Sound Response, 344 Audio and others).

**How it works:** save each file in `remotion/public/sfx/` named by its Artlist ID (for example `91962.wav`; `.aac`, `.m4a` and `.mp3` also work). `src/Decipher/sound.ts` places each one on its frame, with volume curves and clean 3-frame cut fades. `npm run render:deciphered` renders, then masters to **−14 LUFS / −1.5 dBTP**. Studio shows a yellow note listing any files still missing. These files are git-ignored, because Artlist's licence doesn't allow redistributing them.

Downloads use **no AI credits**. Each one counts toward your Artlist daily download limit and records a licensed download under your plan.

| # | Artlist ID | Sound | Label | Used at | Role |
| --- | --- | --- | --- | --- | --- |
| 1 | 22701 | [Riser, sci fi, futuristic, slow swirling acceleration](https://artlist.io/sfx/track/riser-sci-fi-futuristic-slow-swirling-acceleration--/22701) | Federico Soler | 5.2–9.33s | Vortex pull, cut hard into the impact |
| 2 | 91962 | [Sci Tech Transitions – Cinematic Metallic Boom Impact](https://artlist.io/sfx/track/sci-tech-transitions---cinematic-metallic-boom-impact-long-tonal-fade/91962) | Unrealsfx | 9.33s | Core absorbs everything |
| 3 | 81150 | [Sci Fi Transitions – Supersonic Whoosh](https://artlist.io/sfx/track/sci-fi-transitions---supersonic-whoosh/81150) | Sound Response | 9.4s | Shockwave |
| 4 | 29798 | [Transitions – Whoosh, Super Fast Sky Scraping](https://artlist.io/sfx/track/transitions---whoosh-super-fast-sky-scraping/29798) | BOOM Library | 10.3s | Jump to light speed |
| 5 | 114114 | [Cinematic Routines – Shimmering Light](https://artlist.io/sfx/track/cinematic-routines---shimmering-light/114114) | Effectsworks | 11.0s | Decode beam draws in |
| 6 | 93801 | [Momentous Transitions – Fast Motion Whoosh](https://artlist.io/sfx/track/momentous-transitions---fast-motion-whoosh/93801) | Ni Sound | 13.45s, 18.75s | Into the grid; into the tunnel |
| 7 | 98871 | [Graphical Essence – Digital Button, Confirm](https://artlist.io/sfx/track/graphical-essence---digital-button-confirm/98871) | DeanKR | 14.63s, then 12 times | Each card locks into the grid (pitch varied) |
| 8 | 75548 | [Prime Transitions – Airy Whoosh, Fast Swipe, Low Pitch](https://artlist.io/sfx/track/prime-transitions----airy-whoosh-fast-swipe-low-pitch/75548) | Selkor Studio | 16.55s | Scan beam |
| 9 | 96873 | [Power Accents – Fast Sweeping Whoosh, Right to Left](https://artlist.io/sfx/track/power-accents---fast-sweeping-whoosh-right-to-left/96873) | Airborne Sound | 20.3s, 22.1s | Tunnel pass-bys |
| 10 | 52606 | [Whooshes and Transitions – Whoosh, Fast, Elastic](https://artlist.io/sfx/track/whooshes-and-transitions---whoosh-fast-elastic-/52606) | Adam Pietruszko | 21.2s | Tunnel pass-by |
| 11 | 110513 | [Cinematic Pulses – Electronic Stutter Riser](https://artlist.io/sfx/track/cinematic-pulses---electronic-stutter-riser/110513) | Callum Donaldson | 23.0–24.83s | Light at the end of the tunnel |
| 12 | 90916 | [Just Transitions – Booming Cinematic Impact, Rattle](https://artlist.io/sfx/track/just-transitions---booming-cinematic-impact-rattle/90916) | SoundBits | 24.83s | Flash into the blueprint |
| 13 | 93818 | [SciTech Game – Pop Up Menu Click](https://artlist.io/sfx/track/scitech-game---pop-up-menu-click/93818) | Ni Sound | 25.18s, 25.38s, 25.58s | The three sheets pop out |
| 14 | 126242 | [This Is Cinema – Spinning Riser](https://artlist.io/sfx/track/this-is-cinema---spinning-riser/126242) | Flaviu Ciocan | 28.4–30.33s | Particles gather into the DL mark |
| 15 | 84686 | [Intense Trailer Elements – Deep Cinematic Impact, Boom](https://artlist.io/sfx/track/intense-trailer-elements---deep-cinematic-impact-boom-flutter-reverb/84686) | 344 Audio | 30.33s | The official mark lands |
| 16 | 110689 | [All That Glitters – Pure and Cinematic Logo](https://artlist.io/sfx/track/all-that-glitters---pure-and-cinematic-logo/110689) | CB Sounddesign | 30.33s | Logo shimmer through to the end card |

27.8–28.4s is left deliberately silent before the logo, as in the reference.

**Chosen from catalog descriptions, not by listening:** this cloud session can't reach Artlist's audio servers. After the first render with real files, levels and choices may need a pass. Volumes are in `sound.ts`, and there are master `sfxVolume`/`musicVolume` controls in Studio.

## Optional music bed
Professional trailers usually run a music bed under the effects. Save one as `public/sfx/music.mp3`. It automatically ducks under the 9.4s impact, drops out for the pre-logo silence and swells on the logo. Set `musicStart` in Studio to choose where in the track it starts. Unheard candidates from the catalog: *Signal to Noise* by Michael Oates (118 BPM) and *Particle Cannon (No Backing Vocals)* by Shaked Shachar (122 BPM).
