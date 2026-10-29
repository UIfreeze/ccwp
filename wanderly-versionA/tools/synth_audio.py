"""Original synthesized music bed + UI sound effects for Version A.

Every cue time below mirrors the T table in index.html. Run:
    python3 tools/synth_audio.py
Writes assets/audio/music/music_bed.wav and assets/audio/sfx/sfx.wav (48 kHz stereo).
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 44.0
N = int(SR * DUR)
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(11)

T = dict(s1=0.0, s2=3.8, s3=9.2, k4=12.6, flush=15.2, s4=15.9, s5=18.4, s6=21.0,
         s7=24.2, s8=30.4, s9=33.8, end=38.2, out=44.0)


def t_axis(n):
    return np.arange(n) / SR


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    ai = max(ai, 1)
    e[:ai] = np.linspace(0, 1, ai)
    if di > 0:
        e[ai:ai + di] = np.linspace(1, s, len(e[ai:ai + di]))
    if ri > 0:
        e[-ri:] *= np.linspace(1, 0, ri)
    return e


def lowpass(x, cutoff):
    # one-pole lowpass, cutoff may be scalar or array
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def place(buf, sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * l
    buf[i:i + len(sig), 1] += sig * r


# ---------------- sound effects ----------------
def ping(freq=1318.5, dur=0.9):
    n = int(dur * SR); t = t_axis(n)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.01 * t) + 0.12 * np.sin(2 * np.pi * freq * 3.02 * t)
    return s * np.exp(-t * 6.5) * env_adsr(n, 0.004, 0, 1, 0.05)


def tick(freq=2200, dur=0.06):
    n = int(dur * SR); t = t_axis(n)
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t * 70)
    s += 0.4 * rng.standard_normal(n) * np.exp(-t * 160)
    return s * 0.5


def soft_click(dur=0.12):
    n = int(dur * SR); t = t_axis(n)
    s = np.sin(2 * np.pi * 520 * t) * np.exp(-t * 38) + 0.25 * np.sin(2 * np.pi * 1560 * t) * np.exp(-t * 60)
    return s


def whoosh(dur=0.9, rising=True, f0=300, f1=4000):
    n = int(dur * SR); t = t_axis(n)
    noise = rng.standard_normal(n)
    sweep = np.linspace(f0, f1, n) if rising else np.linspace(f1, f0, n)
    s = lowpass(noise, sweep) - lowpass(noise, sweep * 0.25)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** (2.2 if rising else 1.4)
    if rising:
        shape = (t / dur) ** 2.4
    return s * shape * 3.0


def thump(dur=1.6):
    n = int(dur * SR); t = t_axis(n)
    f = 46 + 50 * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 3.2) * env_adsr(n, 0.005, 0, 1, 0.2)


def shimmer(dur=2.2, base=880):
    n = int(dur * SR); t = t_axis(n)
    s = sum(np.sin(2 * np.pi * base * k * t + k) / k for k in (1, 1.5, 2, 3))
    return s * np.exp(-t * 1.6) * env_adsr(n, 0.25, 0, 1, 0.4) * 0.25


def chime(freqs, gap=0.16, dur=1.6):
    out = np.zeros(int((dur + gap * len(freqs)) * SR))
    for i, f in enumerate(freqs):
        p = ping(f, dur) * 0.8
        j = int(i * gap * SR)
        out[j:j + len(p)] += p
    return out


def low_tonk(dur=0.7):
    n = int(dur * SR); t = t_axis(n)
    return (np.sin(2 * np.pi * 196 * t) + 0.3 * np.sin(2 * np.pi * 392 * t)) * np.exp(-t * 7)


sfx = np.zeros((N, 2))
place(sfx, ping(1318.5), 0.30, 0.0, 0.32)                     # forwarded message lands
place(sfx, tick(2600), 1.72, 0.1, 0.10)
# three weeks of messages accumulate (one tick per slot)
for c in range(3):
    for r in range(8):
        t0 = T["s2"] + 0.15 + c * 1.45 + r * 0.13
        place(sfx, tick(1900 + 120 * r + 300 * c), t0, -0.5 + 0.5 * c, 0.05 + 0.012 * c)
# scatter: a restrained texture swell
place(sfx, whoosh(2.6, True, 200, 1800), T["s3"] - 0.2, 0.0, 0.10)
place(sfx, soft_click(), T["s3"] + 0.9, -0.6, 0.18)           # AI chip
place(sfx, low_tonk(), T["s3"] + 2.1, 0.0, 0.22)              # the question mark
place(sfx, soft_click(), T["k4"] - 0.2, 0.6, 0.14)            # dashed person chip
# collapse -> clarity
place(sfx, whoosh(0.9, True, 400, 6000), T["flush"] - 0.25, 0.0, 0.16)
place(sfx, thump(), T["s4"] - 0.05, 0.0, 0.40)
place(sfx, shimmer(2.4, 659.25), T["s4"], 0.0, 0.30)
for i in range(5):
    place(sfx, soft_click(), T["s4"] + 0.75 + i * 0.32, (-1) ** i * 0.35, 0.16)
# the handoff (climax)
place(sfx, whoosh(0.45, True, 800, 5000), T["s6"] - 0.05, -0.3, 0.07)
place(sfx, chime([659.25, 987.77]), T["s6"] + 0.35, 0.0, 0.30)
place(sfx, soft_click(), T["s6"] + 1.2, -0.3, 0.16)
# many threads, each ends in a handoff
place(sfx, whoosh(0.8, False, 300, 3000), T["s7"] - 0.1, 0.0, 0.07)
for i, pan in enumerate((-0.6, 0.0, 0.6)):
    place(sfx, ping(987.77 + 110 * i, 0.8), T["s7"] + 2.0 + i * 0.35, pan, 0.16)
# recruiter picks up
place(sfx, whoosh(0.7, True, 300, 4000), T["s8"] - 0.45, 0.0, 0.08)
place(sfx, soft_click(), T["s8"] + 3.0, 0.4, 0.15)
# logs pulled into one conversation
for i in range(8):
    place(sfx, tick(2400 + 90 * i), T["s9"] + i * 0.08, (-1) ** i * 0.6, 0.035)
place(sfx, whoosh(1.1, True, 300, 5000), T["s9"] + 1.2, 0.0, 0.09)
# end
place(sfx, thump(2.0), T["end"] + 0.3, 0.0, 0.25)
place(sfx, chime([659.25, 987.77, 1318.5], 0.14, 2.4), T["end"] + 0.8, 0.0, 0.22)


# ---------------- music bed ----------------
def note(f, dur, bright=0.3):
    n = int(dur * SR); t = t_axis(n)
    s = np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * 2 * f * t + 0.3) + 0.5 * bright * np.sin(2 * np.pi * 3 * f * t + 0.7)
    s *= 1 + 0.08 * np.sin(2 * np.pi * 0.35 * t)       # slow movement
    return s * env_adsr(n, min(1.4, dur / 3), 0, 1, min(1.6, dur / 3))


mtx = lambda m: 440 * 2 ** ((m - 69) / 12)
music = np.zeros((N, 2))
# problem half: unresolved, low (A minor colours), with a quiet 16th pulse
problem = [((45, 52, 60, 64), 0.0, 5.2), ((41, 48, 57, 64), 5.0, 5.2), ((43, 50, 59, 62), 10.0, 5.6)]
for chord, t0, d in problem:
    for k, m in enumerate(chord):
        place(music, note(mtx(m), d, 0.18), t0, (-0.4, 0.4, -0.2, 0.2)[k], 0.055)
pulse_t = np.arange(T["s2"], T["flush"], 60 / 112 / 2)
for i, pt in enumerate(pulse_t):
    g = 0.022 + 0.018 * (pt - T["s2"]) / (T["flush"] - T["s2"])
    place(music, tick(1100 if i % 4 else 880, 0.05), pt, (-0.3, 0.3)[i % 2], g)
# resolution half: warm, open, major (C - G/B - Am7 - F - C)
resolve = [((48, 55, 64, 67, 71), 15.9, 5.4), ((47, 55, 62, 67, 74), 21.0, 3.4), ((45, 52, 60, 67, 72), 24.2, 6.4),
           ((41, 53, 60, 65, 69), 30.4, 3.6), ((43, 55, 62, 67, 71), 33.8, 4.6), ((48, 55, 64, 67, 72, 76), 38.2, 5.8)]
for chord, t0, d in resolve:
    for k, m in enumerate(chord):
        place(music, note(mtx(m), d + 0.6, 0.22), t0 - 0.1, ((-0.5, 0.5, -0.25, 0.25, 0.0, 0.1)[k]), 0.05)
# soft arpeggio from the handoff to the end
arp = [72, 76, 79, 83]
for i, at in enumerate(np.arange(T["s6"] + 0.5, T["out"] - 2.0, 60 / 112)):
    place(music, ping(mtx(arp[i % 4]), 0.7) * 0.6, at, (-0.35, 0.35)[i % 2], 0.03)

# fade tails
fade = np.ones(N); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR))
music *= fade[:, None]; sfx *= fade[:, None]


def write(path, x, peak_db=-3.0):
    x = x / max(1e-9, np.max(np.abs(x))) * 10 ** (peak_db / 20)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print("wrote", path)


write(ROOT / "assets/audio/music/music_bed.wav", music, -9.0)
write(ROOT / "assets/audio/sfx/sfx.wav", sfx, -4.0)
