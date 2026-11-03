import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, getRemotionEnvironment, getStaticFiles, interpolate, staticFile, useVideoConfig } from "remotion";
import { CUES, MUSIC_FILE_PREFIX, REQUIRED_SFX } from "./sound";

const AUDIO_EXT = /\.(wav|aac|m4a|mp3)$/i;
const findFile = (prefix: string) => getStaticFiles().find((f) => f.name.startsWith(prefix) && AUDIO_EXT.test(f.name))?.name ?? null;

/** Library sound: places every available cue on its frame. Missing files are skipped (and listed in Studio). */
export const LibrarySound: React.FC<{ sfxVolume: number; musicVolume: number; musicStart: number }> = ({ sfxVolume, musicVolume, musicStart }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const files = new Map(REQUIRED_SFX.map((id) => [id, findFile(`sfx/${id}.`)]));
  const missing = REQUIRED_SFX.filter((id) => !files.get(id));
  const music = findFile(MUSIC_FILE_PREFIX);
  const showMissing = getRemotionEnvironment().isStudio && missing.length > 0;

  return (
    <>
      {CUES.map((c, i) => {
        const file = files.get(c.songId);
        if (!file) return null;
        const from = Math.round(c.at * fps);
        const len = c.max ? Math.round(c.max * fps) : durationInFrames - from;
        const fadeIn = Math.max(1, Math.round((c.fadeIn ?? 0) * fps));
        const fadeOut = Math.max(3, Math.round((c.fadeOut ?? 0) * fps));
        return (
          <Sequence key={`${c.songId}-${i}`} name={`SFX: ${c.label}`} from={from} durationInFrames={len} layout="none">
            <Html5Audio
              src={staticFile(file)}
              trimBefore={c.trim ? Math.round(c.trim * fps) : undefined}
              playbackRate={c.rate ?? 1}
              volume={(f) => c.vol * sfxVolume * interpolate(f, [0, fadeIn, len - fadeOut, len], [c.fadeIn ? 0 : 1, 1, 1, c.max || c.fadeOut ? 0 : 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            />
          </Sequence>
        );
      })}
      {music ? (
        <Html5Audio
          src={staticFile(music)}
          trimBefore={Math.round(musicStart * fps)}
          // Music bed: ducks under the big hits, drops out for the pre-logo silence, swells for the logo.
          volume={(f) => musicVolume * interpolate(f / fps,
            [0, 1.5, 9.2, 9.4, 10.6, 27.6, 27.9, 30.3, 30.6, 36.5, 37.5],
            [0, 0.55, 0.6, 0.25, 0.55, 0.55, 0, 0, 0.7, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
      {showMissing ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 16, right: 16, background: "#000c", color: "#ffd27a", font: "14px monospace", padding: "8px 12px", borderRadius: 6, maxWidth: 520 }}>
            Studio only: {missing.length} of {REQUIRED_SFX.length} sound files missing in public/sfx/ ({missing.join(", ")}). See docs/SFX_CUE_SHEET.md.
          </div>
        </AbsoluteFill>
      ) : null}
    </>
  );
};
