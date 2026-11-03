// Generates public/decipher-sound.wav: ORIGINAL procedural sound design for the "Deciphered" piece.
// Pure Node, no dependencies, deterministic. Timings mirror src/Decipher (see the cue list below).
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "decipher-sound.wav");
if (process.argv.includes("--if-missing") && existsSync(OUT)) process.exit(0);

const SR = 48000;
const DUR = 37.5;
const N = Math.round(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 20261103;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const idx = (t) => Math.max(0, Math.min(N - 1, Math.round(t * SR)));
const put = (i, v, pan = 0) => { // pan -1..1, equal-power
  const a = (pan + 1) * Math.PI / 4;
  L[i] += v * Math.cos(a);
  R[i] += v * Math.sin(a);
};

// State-variable filter for swept band-pass / low-pass noise.
const svf = () => { let lp = 0, bp = 0; return (x, fc, q = 0.7) => { const f = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR); const hp = x - lp - q * bp; bp += f * hp; lp += f * bp; return { lp, bp, hp }; }; };

const drone = (t0, t1, gain) => {
  for (let i = idx(t0); i < idx(t1); i++) {
    const t = i / SR, p = (t - t0) / (t1 - t0);
    const env = Math.min(1, p * 4) * Math.min(1, (1 - p) * 5) * gain * (0.6 + 0.4 * p);
    const v = Math.sin(2 * Math.PI * 55 * t) * 0.6 + Math.sin(2 * Math.PI * 82.6 * t + Math.sin(t * 0.7)) * 0.35 + Math.sin(2 * Math.PI * 110.3 * t) * 0.15;
    put(i, v * env, Math.sin(t * 0.3) * 0.3);
  }
};
const air = (t0, t1, gain, fc = 900) => {
  const fl = svf(), fr = svf();
  for (let i = idx(t0); i < idx(t1); i++) {
    const t = i / SR, p = (t - t0) / (t1 - t0);
    const env = Math.min(1, p * 3) * Math.min(1, (1 - p) * 3) * gain;
    L[i] += fl(noise(), fc * (1 + 0.3 * Math.sin(t * 0.5)), 0.5).bp * env;
    R[i] += fr(noise(), fc * (1 + 0.3 * Math.cos(t * 0.45)), 0.5).bp * env;
  }
};
const riser = (t0, t1, gain, f0 = 200, f1 = 3000) => {
  const f = svf(); let ph = 0;
  for (let i = idx(t0); i < idx(t1); i++) {
    const p = (i / SR - t0) / (t1 - t0);
    const fc = f0 * Math.pow(f1 / f0, p);
    ph += 2 * Math.PI * (fc * 0.25) / SR;
    const env = Math.pow(p, 2.2) * gain;
    put(i, (f(noise(), fc, 0.3).bp * 0.9 + Math.sin(ph) * 0.25) * env, (p - 0.5) * 0.6);
  }
};
const whoosh = (t0, dur, gain, panFrom = -0.8, panTo = 0.8, fc0 = 300, fc1 = 2500) => {
  const f = svf();
  for (let i = idx(t0); i < idx(t0 + dur); i++) {
    const p = (i / SR - t0) / dur;
    const env = Math.sin(Math.PI * p) ** 2 * gain;
    const fc = fc0 + (fc1 - fc0) * Math.sin(Math.PI * p);
    put(i, f(noise(), fc, 0.4).bp * env * 1.6, panFrom + (panTo - panFrom) * p);
  }
};
const impact = (t, gain) => {
  let ph = 0; const f = svf();
  for (let i = idx(t); i < idx(t + 2.4); i++) {
    const d = i / SR - t;
    ph += 2 * Math.PI * (32 + 40 * Math.exp(-d * 6)) / SR;
    const sub = Math.sin(ph) * Math.exp(-d * 1.6);
    const crack = f(noise(), 1800 * Math.exp(-d * 3) + 200, 0.6).lp * Math.exp(-d * 7) * 1.4;
    const click = d < 0.004 ? noise() * (1 - d / 0.004) : 0;
    put(i, (sub + crack + click) * gain, 0);
  }
};
const bell = (t, f0, gain, decay = 2.5, pan = 0) => {
  const parts = [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12]];
  for (let i = idx(t); i < idx(t + decay * 2); i++) {
    const d = i / SR - t;
    let v = 0;
    for (const [m, a] of parts) v += Math.sin(2 * Math.PI * f0 * m * d) * a * Math.exp(-d * (3 + m) / decay);
    put(i, v * gain * Math.min(1, d / 0.003), pan);
  }
};
const tick = (t, f0, gain, pan = 0) => {
  for (let i = idx(t); i < idx(t + 0.08); i++) {
    const d = i / SR - t;
    put(i, (Math.sin(2 * Math.PI * f0 * d) * Math.exp(-d * 60) + (d < 0.002 ? noise() * 0.5 : 0)) * gain, pan);
  }
};
const kick = (t, gain) => {
  let ph = 0;
  for (let i = idx(t); i < idx(t + 0.35); i++) {
    const d = i / SR - t;
    ph += 2 * Math.PI * (45 + 90 * Math.exp(-d * 30)) / SR;
    put(i, Math.sin(ph) * Math.exp(-d * 9) * gain, 0);
  }
};
const sparkle = (t0, t1, perSec, gain) => {
  for (let t = t0; t < t1; t += 1 / perSec) {
    const p = (t - t0) / (t1 - t0);
    if (rnd() > 0.35 + p * 0.6) continue;
    tick(t + rnd() * 0.02, 2200 + rnd() * 4200, gain * (0.4 + p), noise() * 0.9);
  }
};
const pad = (t0, t1, freqs, gain, attack = 1, release = 2) => {
  for (let i = idx(t0); i < idx(t1); i++) {
    const t = i / SR, d = t - t0, r = t1 - t;
    const env = Math.min(1, d / attack) * Math.min(1, r / release) * gain;
    let l = 0, rr = 0;
    for (const f of freqs) { l += Math.sin(2 * Math.PI * f * 0.997 * t); rr += Math.sin(2 * Math.PI * f * 1.003 * t); }
    L[i] += l / freqs.length * env;
    R[i] += rr / freqs.length * env;
  }
};

// ---- Cue list (seconds) ----
drone(0, 9.6, 0.32); air(0, 9.4, 0.12);
sparkle(0.8, 6.5, 6, 0.05);                       // fragments drifting
riser(5.6, 9.4, 0.55, 150, 4000);                 // vortex pull
impact(9.4, 0.95);                                 // core absorbs everything
whoosh(9.5, 1.3, 0.5, 0.8, -0.8, 600, 4000);       // shockwave
air(10.4, 14.2, 0.1, 2400);                        // light-speed bed
riser(11.0, 12.7, 0.3, 800, 6000);                 // trail draws
bell(12.7, 523.25, 0.35, 2.2);                     // ring flares
whoosh(13.4, 1.0, 0.45, -0.6, 0.6, 400, 5000);     // into the grid
for (let i = 0; i < 12; i++) tick(14.0 + 0.15 + i * 0.12 + 0.55, 900 + (i % 4) * 220, 0.32, ((i % 4) - 1.5) / 2); // cards lock in
riser(16.6, 18.2, 0.18, 1500, 7000);               // scan beam
pad(14.0, 19.4, [110, 164.8, 220], 0.09, 1.2, 0.8); air(14.0, 19.2, 0.05, 1600); // grid bed
whoosh(18.8, 1.2, 0.55, 0, 0, 200, 3500);          // push into the tunnel
for (let t = 19.6, k = 0; t < 24.7; t += 0.45, k++) { kick(t, 0.7); if (k % 2) whoosh(t - 0.1, 0.5, 0.22, k % 4 === 1 ? -0.9 : 0.9, 0, 500, 2600); }
pad(19.4, 24.9, [55, 82.4, 110], 0.18, 1.5, 0.3);
riser(23.4, 24.9, 0.5, 300, 6000);
impact(24.9, 0.6); bell(24.95, 659.25, 0.25, 1.8);
[25.25, 25.45, 25.65].forEach((t, i) => { whoosh(t - 0.2, 0.45, 0.25, (i - 1) * 0.7, (i - 1) * 0.7, 800, 3000); tick(t + 0.2, 1200 + i * 300, 0.25, (i - 1) * 0.6); });
pad(24.9, 27.9, [220, 277.2, 329.6], 0.12, 0.6, 0.7);
// 27.9–28.4: near silence (the dip)
sparkle(28.35, 30.2, 30, 0.07); riser(28.6, 30.4, 0.45, 200, 5000);
impact(30.4, 1.0); bell(30.42, 392, 0.35, 3.5); bell(30.45, 587.3, 0.2, 3.5, 0.3);
pad(30.4, 37.2, [98, 146.8, 196, 293.7], 0.2, 0.05, 3.0);
bell(31.25, 783.99, 0.12, 2, -0.3); bell(31.95, 987.77, 0.1, 2, 0.3);
riser(32.0, 33.3, 0.08, 3000, 9000);              // light sweep
riser(34.5, 35.4, 0.12, 2000, 9000);              // bloom to the white end card
bell(35.2, 1046.5, 0.16, 3); bell(35.25, 1318.5, 0.09, 3, 0.2); // end card

// ---- Master: soft clip, normalise, fades, 16-bit stereo WAV ----
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.1); R[i] = Math.tanh(R[i] * 1.1); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.89 / (peak || 1);
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, i / (SR * 0.05), (N - i) / (SR * 1.0));
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g * fade)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g * fade)) * 32767), 46 + i * 4);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, buf);
console.log(`Wrote ${OUT} (${DUR}s, ${SR} Hz stereo)`);
