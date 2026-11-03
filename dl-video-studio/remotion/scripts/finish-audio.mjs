// Post-render mastering: normalise to -14 LUFS integrated, true peak -1.5 dBTP, copy video untouched, +faststart.
// Uses the FFmpeg that ships with Remotion, so nothing extra is needed on Windows/macOS.
// Usage: node scripts/finish-audio.mjs <input.mp4> <output.mp4>
import { spawnSync } from "node:child_process";
const [input, output] = process.argv.slice(2);
if (!input || !output) { console.error("Usage: node scripts/finish-audio.mjs <input.mp4> <output.mp4>"); process.exit(1); }
const run = (args) => spawnSync("npx", ["remotion", "ffmpeg", ...args], { encoding: "utf8", shell: process.platform === "win32" });
// Pass 1: measure.
const m = run(["-hide_banner", "-i", input, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]);
const json = JSON.parse((m.stderr.match(/\{[\s\S]*?\}/g) || []).pop() || "{}");
if (!json.input_i) { console.error("Could not measure loudness:\n" + m.stderr.slice(-800)); process.exit(1); }
// Pass 2: apply linear normalisation with the measured values.
const filter = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${json.input_i}:measured_TP=${json.input_tp}:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}:offset=${json.target_offset}:linear=true`;
const r = run(["-hide_banner", "-y", "-i", input, "-c:v", "copy", "-af", filter, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", output]);
if (r.status !== 0) { console.error(r.stderr.slice(-800)); process.exit(1); }
console.log(`Mastered → ${output} (measured ${json.input_i} LUFS in, target -14 LUFS / -1.5 dBTP)`);
