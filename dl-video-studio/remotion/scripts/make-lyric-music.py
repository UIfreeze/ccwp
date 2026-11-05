"""Original instrumental for the "Idea Se Udaan" one-line lyric reel. 120 BPM, A minor, 37 s.

Every sound is synthesised here (no samples, no third-party music), so the track is free to publish.
Needs: numpy, scipy.  Usage: python3 scripts/make-lyric-music.py public/lyric/music.wav
Structure (bar = 2 s): intro pad 0-4 | groove 4-18 | break + riser 18-20 | drop/chorus 20-32 | outro 32-37.
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
DUR = 37.0
BEAT = 0.5
BAR = 2.0
N = int(SR * DUR)
rng = np.random.default_rng(20261105)

L = np.zeros(N)
R = np.zeros(N)
REV_L = np.zeros(N)  # reverb send
REV_R = np.zeros(N)


def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x)


def lp_sweep(x, lo, hi, w):
    """Time-varying low-pass: blend between a dark and a bright filtered copy by envelope w (0..1)."""
    return lp(x, lo) * (1 - w) + lp(x, hi) * w


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def add(sig, start, gain=1.0, pan=0.0, send=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i : i + len(sig)] += sig * gain * gl
    R[i : i + len(sig)] += sig * gain * gr
    if send:
        REV_L[i : i + len(sig)] += sig * gain * send * gl
        REV_R[i : i + len(sig)] += sig * gain * send * gr


def saw(freq, t, phase=0.0):
    return 2 * ((freq * t + phase) % 1.0) - 1


# ---- instruments -------------------------------------------------------------
def kick():
    t = t_arr(0.45)
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = lp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 400) * 0.4
    return np.tanh((body + click) * 1.6)


def clap():
    t = t_arr(0.35)
    n = rng.standard_normal(len(t))
    env = np.zeros(len(t))
    for d in (0.0, 0.011, 0.023):
        env += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 140)
    env += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) * 16) * 0.5
    return bp(n, 900, 3200) * env * 1.4


def hat(open_=False):
    t = t_arr(0.3 if open_ else 0.06)
    n = hp(rng.standard_normal(len(t)), 7500, 4)
    return n * np.exp(-t * (12 if open_ else 70))


def bass(freq, dur):
    t = t_arr(dur)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 3.0)
    tone = lp_sweep(saw(freq, t) * 0.7, 380, 1300, np.exp(-t * 18)) + np.sin(2 * np.pi * freq * t) * 0.6
    return np.tanh(tone * env * 1.4)


def pluck(freq, dur=0.45):
    t = t_arr(dur)
    env = np.minimum(1, t / 0.002) * np.exp(-t * 7)
    tone = saw(freq, t) * 0.5 + saw(freq * 1.005, t) * 0.5
    return lp_sweep(tone, 900, 5900, np.exp(-t * 14)) * env


def pad(freqs, dur, bright):
    t = t_arr(dur)
    att = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.3)
    l = np.zeros(len(t))
    r = np.zeros(len(t))
    for f in freqs:
        for k, det in enumerate((-0.12, -0.05, 0.0, 0.05, 0.12)):
            v = saw(f * 2 ** (det / 12), t, rng.random())
            if k % 2:
                l += v
            else:
                r += v
    cut = 700 + 2600 * bright
    return lp(l, cut) * att * 0.08, lp(r, cut) * att * 0.08


def bell(freq, dur=3.0):
    t = t_arr(dur)
    out = np.zeros(len(t))
    for m, a in ((1, 1), (2.0, 0.35), (3.01, 0.18), (4.2, 0.08)):
        out += np.sin(2 * np.pi * freq * m * t) * a * np.exp(-t * (1.2 + m * 0.6))
    return out * np.minimum(1, t / 0.003)


def riser(dur):
    t = t_arr(dur)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    blocks = 24
    for b in range(blocks):
        s, e = int(len(t) * b / blocks), int(len(t) * (b + 1) / blocks)
        fc = 400 * (16 ** (b / blocks))
        out[s:e] = bp(n, fc, fc * 2.2)[s:e]
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1600 * (t / dur) ** 2) / SR) * 0.15
    return (out + sweep) * (t / dur) ** 2.2


def impact(dur=3.0):
    t = t_arr(dur)
    f = 30 + 45 * np.exp(-t * 5)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4)
    crash = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 5) * 0.5
    return np.tanh((boom + crash) * 1.3)


# ---- arrangement -------------------------------------------------------------
CHORDS = [  # (bass root Hz, pad voicing)
    (55.00, [220.00, 261.63, 329.63]),  # Am
    (43.65, [174.61, 220.00, 261.63]),  # F
    (65.41, [196.00, 261.63, 329.63]),  # C
    (49.00, [196.00, 246.94, 293.66]),  # G
]
kicks = []

for bar in range(int(DUR / BAR)):
    t0 = bar * BAR
    root, voicing = CHORDS[bar % 4]
    section = "intro" if t0 < 4 else "groove" if t0 < 18 else "break" if t0 < 20 else "chorus" if t0 < 32 else "outro"
    bright = {"intro": 0.05, "groove": 0.3, "break": 0.5, "chorus": 0.85, "outro": 0.6}[section]
    pl, pr = pad(voicing, BAR + 0.3, bright)
    pg = 1.25 if section == "chorus" else 1.0
    add(pl, t0, pg, -0.6, 0.5)
    add(pr, t0, pg, 0.6, 0.5)

    g = 0.7 if section == "groove" else 1.0  # verse sits back so the chorus lifts
    if section in ("groove", "chorus"):
        for b in range(4):
            tb = t0 + b * BEAT
            add(kick(), tb, 0.9 * (0.85 if section == "groove" else 1.0))
            kicks.append(tb)
            add(hat(open_=section == "chorus"), tb + BEAT / 2, 0.16 if section == "chorus" else 0.09, 0.3)
            if section == "chorus" or t0 >= 8:
                add(hat(), tb, 0.07, -0.3)
            if (b in (1, 3)) and (t0 >= 12):
                add(clap(), tb, 0.5 * g, 0, 0.25)
        for e in range(8):
            octave = 2 if (section == "chorus" and e % 4 == 3) else 1
            add(bass(root * octave, 0.24), t0 + e * BEAT / 2, 0.55 * g)
    if section == "chorus" or (section == "groove" and t0 >= 8):
        arp = [voicing[0] * 2, voicing[1] * 2, voicing[2] * 2, voicing[1] * 2]
        for s in range(16):
            if section == "groove" and s % 2:
                continue
            add(pluck(arp[s % 4] * (2 if section == "chorus" and s % 8 == 6 else 1)), t0 + s * BEAT / 4, 0.16 * g, (s % 4 - 1.5) / 3, 0.35)
    if section == "chorus":  # simple lead motif on top
        motif = [(0, 2), (0.75, 1), (1.0, 0), (1.5, 1)]
        for at, idx in motif:
            add(pluck(voicing[idx] * 4, 0.6), t0 + at, 0.11, 0.1, 0.5)

# Break: snare-roll style claps accelerate into the drop, plus a riser.
for k in range(16):
    tt = 18 + 2 * (1 - (1 - k / 16) ** 1.6)
    add(clap(), tt, 0.12 + 0.3 * k / 16, 0, 0.2)
add(riser(2.0), 18.0, 0.5, 0, 0.3)
add(impact(), 20.0, 0.75, 0, 0.3)
add(bell(440.0), 0.0, 0.18, 0, 0.6)
add(riser(1.5), 30.5, 0.35, 0, 0.3)
add(impact(4.0), 32.0, 0.8, 0, 0.35)
for f, p in ((220.0, -0.3), (329.63, 0.3), (523.25, 0)):
    add(bell(f, 4.5), 32.02, 0.14, p, 0.6)

# Sidechain pump on everything except drums would be ideal; approximate with a global duck after each kick.
duck = np.ones(N)
for tb in kicks:
    i = int(tb * SR)
    seg = np.arange(min(int(0.25 * SR), N - i)) / SR
    duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], 1 - 0.35 * np.exp(-seg / 0.08))

# Reverb: synthetic stereo hall impulse response.
tr = t_arr(2.4)
ir_l = rng.standard_normal(len(tr)) * np.exp(-tr * 2.6)
ir_r = rng.standard_normal(len(tr)) * np.exp(-tr * 2.6)
ir_l, ir_r = lp(ir_l, 6000), lp(ir_r, 6000)
wet_l = fftconvolve(REV_L, ir_l)[:N] * 0.025
wet_r = fftconvolve(REV_R, ir_r)[:N] * 0.025

mix_l = (L * duck + wet_l)
mix_r = (R * duck + wet_r)
fade = np.minimum(1, np.minimum(np.arange(N) / (0.02 * SR), (N - np.arange(N)) / (1.5 * SR)))
mix_l, mix_r = np.tanh(mix_l * 1.1) * fade, np.tanh(mix_r * 1.1) * fade
peak = max(np.abs(mix_l).max(), np.abs(mix_r).max())
out = np.stack([mix_l, mix_r], axis=1) / peak * 0.9

with wave.open(sys.argv[1] if len(sys.argv) > 1 else "music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print("wrote", sys.argv[1] if len(sys.argv) > 1 else "music.wav")
