"""Original score + sound design for Version A, ducked under the voiceover.

Cue times mirror the T table in index.html (which is locked to vo_master.wav).
    python3 tools/synth_audio.py
Writes assets/audio/music/music_bed.wav and assets/audio/sfx/sfx.wav (48 kHz stereo).
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 45.0
N = int(SR * DUR)
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(11)

T = dict(s2=3.45, cant=6.9, s3=9.3, k4=12.55, flush=14.05, s4=15.0, wand=15.78, s5=18.55, s6=20.35,
         flip=21.7, same=22.6, s7=24.25, hand=26.6, s8=30.6, all=32.7, s9=34.8, logs=36.6, end=38.75,
         mark=41.15, logo=42.0, out=45.0)


def tax(n):
    return np.arange(n) / SR


def adsr(n, a, r):
    e = np.ones(n)
    ai, ri = max(1, int(a * SR)), max(1, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai) ** 2
    e[-ri:] *= np.linspace(1, 0, ri) ** 1.5
    return e


def onepole(x, fc):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def lp_fft(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def place(buf, sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= len(buf) or i < 0:
        return
    sig = sig[: len(buf) - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * l
    buf[i:i + len(sig), 1] += sig * r


def reverb(x, secs=2.2, mix=0.3, seed=3):
    g = np.random.default_rng(seed)
    n = int(secs * SR); t = tax(n)
    out = np.zeros_like(x)
    for ch in range(2):
        ir = g.standard_normal(n) * np.exp(-t * 6.9 / secs)
        ir = lp_fft(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
        L = len(x) + n
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[: len(x)]
        out[:, ch] = y
    return x * (1 - mix) + out * mix * 1.4


mtx = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- instruments ----------------
def pad(f, dur, cutoff=1400, det=0.18):
    n = int(dur * SR); t = tax(n); s = np.zeros(n)
    for d in (-det, 0, det):
        ph = 2 * np.pi * f * (1 + d / 100) * t + d * 7
        s += 2 * ((ph / (2 * np.pi)) % 1) - 1          # saw
    s = lp_fft(s / 3, cutoff)
    s *= 1 + 0.06 * np.sin(2 * np.pi * 0.2 * t)
    return s * adsr(n, min(1.8, dur / 3), min(2.0, dur / 3))


def bell(f, dur=2.2, bright=1.6):
    n = int(dur * SR); t = tax(n)
    mod = np.sin(2 * np.pi * f * 2.0 * t) * bright * np.exp(-t * 3)
    s = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.4)
    return s * adsr(n, 0.004, 0.3)


def pluck(f, dur=1.4):
    n = int(dur * SR); t = tax(n)
    s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3 + 2.5 * k)) / k for k in (1, 2, 3, 4))
    return s * adsr(n, 0.003, 0.2)


def sub(f, dur):
    n = int(dur * SR); t = tax(n)
    return np.sin(2 * np.pi * f * t) * adsr(n, 0.6, 1.2)


def noise_sweep(dur, f0, f1, curve=2.0, rising=True):
    n = int(dur * SR); t = tax(n)
    x = rng.standard_normal(n)
    fc = np.linspace(f0, f1, n)
    y = onepole(x, fc) - onepole(x, fc * 0.2)
    shape = (t / dur) ** curve if rising else (1 - t / dur) ** curve
    return y * shape * 3


def thump(dur=1.8, f0=110, f1=42):
    n = int(dur * SR); t = tax(n)
    f = f1 + (f0 - f1) * np.exp(-t * 10)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6) * adsr(n, 0.003, 0.3)


def tick(f=2200, dur=0.06):
    n = int(dur * SR); t = tax(n)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 70) + 0.35 * rng.standard_normal(n) * np.exp(-t * 170)) * 0.5


def pop(f=600, dur=0.16):
    n = int(dur * SR); t = tax(n)
    fr = f * (1 + 0.6 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 28)


def glitch(dur=0.05):
    n = int(dur * SR)
    return np.sign(np.sin(2 * np.pi * rng.uniform(800, 3000) * tax(n))) * np.exp(-tax(n) * 60) * 0.3


# ---------------- music ----------------
music = np.zeros((N, 2))
# Act 1 (problem): low, unresolved, a soft pulse that tightens
drone = [((33, 45), 0.0, 14.3)]
for notes, t0, d in drone:
    for m in notes:
        place(music, pad(mtx(m), d, 500), t0, 0.0, 0.10)
act1 = [((57, 60, 64), 0.0, 3.6), ((53, 57, 60, 64), 3.45, 3.6), ((55, 59, 62), 6.9, 2.6), ((52, 55, 59, 62), 9.3, 4.9)]
for chord, t0, d in act1:
    for k, m in enumerate(chord):
        place(music, pad(mtx(m), d + 0.4, 900 + 150 * k), t0, (-0.5, 0.5, -0.2, 0.2)[k], 0.05)
bpm = 96; beat = 60 / bpm
for i, bt in enumerate(np.arange(T["s2"], T["flush"], beat / 2)):
    g = 0.025 + 0.03 * (bt - T["s2"]) / (T["flush"] - T["s2"])
    place(music, tick(1300 if i % 2 else 1000, 0.05), bt, (-0.25, 0.25)[i % 2], g)
for bt in np.arange(T["s3"], T["flush"], beat):
    place(music, thump(0.5, 80, 45), bt, 0, 0.10)
# riser into the turn
place(music, noise_sweep(1.2, 300, 9000, 2.6), T["flush"] - 0.6, 0, 0.06)
# Act 2 (resolution): warm, open, major
act2 = [((48, 55, 64, 67, 71), 15.0, 5.35), ((45, 52, 60, 64, 71), 20.35, 3.9), ((41, 53, 57, 64, 69), 24.25, 6.35),
        ((43, 55, 59, 62, 69), 30.6, 4.2), ((48, 55, 64, 67, 72), 34.8, 3.95), ((41, 53, 60, 65, 69), 38.75, 2.4),
        ((48, 55, 64, 67, 72, 76), 41.15, 3.85)]
for chord, t0, d in act2:
    for k, m in enumerate(chord):
        place(music, pad(mtx(m), d + 0.8, 1600 + 220 * k), t0 - 0.15, ((-0.5, 0.5, -0.25, 0.25, 0, 0.1)[k]), 0.045)
    place(music, sub(mtx(chord[0] - 12), d + 0.6), t0 - 0.1, 0, 0.16)
# soft plucked motif from the reveal on (C major pentatonic, deterministic)
motif = [72, 76, 79, 76, 74, 79, 81, 79]
for i, bt in enumerate(np.arange(T["s4"] + 0.75, T["end"] - 0.3, beat)):
    m = motif[i % len(motif)] - (12 if 24.25 <= bt < 30.6 else 0)
    place(music, pluck(mtx(m)), bt, (-0.3, 0.3)[i % 2], 0.045)
# light pulse in act 2
for i, bt in enumerate(np.arange(T["s5"], T["end"], beat / 2)):
    place(music, tick(5200, 0.03), bt, (-0.4, 0.4)[i % 2], 0.012)
music = reverb(music, 2.6, 0.32)

# duck under the voiceover
def read_wav(p):
    with wave.open(str(p)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
        return x.reshape(-1, w.getnchannels()), w.getframerate()

vo, vsr = read_wav(ROOT / "assets/audio/vo/vo_master.wav")
assert vsr == SR
v = np.abs(vo.mean(1)); v = np.pad(v, (0, max(0, N - len(v))))[:N]
win = int(0.05 * SR)
env = np.sqrt(np.convolve(v ** 2, np.ones(win) / win, "same"))
env = env / (env.max() + 1e-9)
att, rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
sm = np.empty_like(env); acc = 0.0
for i, e in enumerate(env):
    acc = (att if e > acc else rel) * acc + (1 - (att if e > acc else rel)) * e
    sm[i] = acc
duck = 1 - 0.6 * np.clip(sm / 0.25, 0, 1)            # about -8 dB under speech
music *= duck[:, None]

# ---------------- sfx ----------------
sfx = np.zeros((N, 2))
place(sfx, bell(mtx(88), 1.6, 0.8), 0.05, 0.0, 0.10)                    # notification
place(sfx, noise_sweep(0.6, 200, 1500, 1.2, False), 1.75, 0, 0.05)       # focus pull
for c in range(3):
    for r in range(8):
        place(sfx, tick(1800 + 110 * r + 260 * c), T["s2"] + 0.15 + c * 0.95 + r * 0.09, -0.5 + 0.5 * c, 0.035)
place(sfx, noise_sweep(0.7, 300, 3000, 2.0), T["cant"] - 0.6, 0, 0.06)
for i in range(14):
    place(sfx, glitch(), T["cant"] + 0.4 + i * 0.1, (-1) ** i * 0.4, 0.08)
place(sfx, noise_sweep(0.8, 200, 2400, 1.8), T["s3"] - 0.4, 0, 0.05)
place(sfx, pop(380), T["s3"] + 0.5, -0.6, 0.12)
n = int(1.3 * SR); tt = tax(n)
glide = np.sin(2 * np.pi * np.cumsum(np.linspace(300, 520, n)) / SR) * adsr(n, 0.2, 0.3) * 0.5
place(sfx, glide, T["s3"] + 1.0, -0.2, 0.06)
place(sfx, thump(1.2, 140, 70), T["s3"] + 2.4, 0, 0.18)                  # the question mark
place(sfx, pop(300), T["k4"] + 0.1, 0.6, 0.10)
place(sfx, noise_sweep(0.6, 6000, 400, 1.5, True)[::-1].copy(), T["flush"], 0, 0.08)   # suck-in
place(sfx, bell(mtx(96), 1.8, 2.0), T["flush"] + 0.55, 0, 0.10)          # flare shing
place(sfx, thump(2.2, 120, 38), T["s4"], 0, 0.34)                        # impact into the reveal
place(sfx, noise_sweep(1.0, 300, 4000, 2.2), T["wand"] - 0.7, 0, 0.05)   # layers merge
for dt in (0, 0.55, 0.8, 1.35, 1.6):
    place(sfx, pop(700 if dt in (0, 0.8, 1.6) else 520), T["s5"] - 0.9 + dt, 0.0, 0.10)
place(sfx, noise_sweep(0.5, 800, 4000, 1.5), T["s6"] + 0.3, -0.3, 0.035)
place(sfx, pop(600), T["flip"] - 0.35, 0, 0.10)
for k, m in enumerate((76, 83)):                                          # the handoff chime
    place(sfx, bell(mtx(m), 2.2, 1.1), T["flip"] + 0.02 + k * 0.17, (-0.15, 0.15)[k], 0.13)
place(sfx, pop(520), T["same"], -0.3, 0.10)
place(sfx, noise_sweep(0.8, 3000, 300, 1.4, False), T["s7"] - 0.15, 0, 0.05)
for i in range(3):
    place(sfx, bell(mtx(71 + 2 * i), 1.6, 0.9), T["hand"] + i * 0.22, (-0.6, 0, 0.6)[i], 0.08)
place(sfx, noise_sweep(0.7, 300, 4000, 2.2), T["s8"] - 0.6, 0, 0.05)
place(sfx, bell(mtx(84), 1.4, 0.6), T["all"], -0.6, 0.06)
place(sfx, pop(520), T["all"] + 1.5, 0.4, 0.09)
for i in range(8):
    place(sfx, tick(2300 + 90 * i), T["logs"] - 0.4 + i * 0.07, (-1) ** i * 0.6, 0.03)
place(sfx, noise_sweep(1.1, 300, 5000, 2.2), T["logs"] + 0.5, 0, 0.06)
place(sfx, thump(2.4, 110, 40), T["end"] + 0.2, 0, 0.18)
place(sfx, noise_sweep(0.5, 4000, 400, 1.5, False), T["mark"] - 0.6, 0, 0.04)
place(sfx, thump(1.4, 160, 60), T["mark"] + 0.55, 0, 0.26)               # D locks into L
place(sfx, bell(mtx(84), 2.4, 1.4), T["mark"] + 0.55, 0, 0.09)
place(sfx, noise_sweep(0.9, 500, 6000, 2.0), T["logo"] + 0.1, 0, 0.04)
for k, m in enumerate((79, 84, 88)):
    place(sfx, bell(mtx(m), 2.6, 0.9), T["logo"] + 0.6 + k * 0.12, (-0.3, 0, 0.3)[k], 0.06)
sfx = reverb(sfx, 1.6, 0.22, seed=5)

fade = np.ones(N); fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR))
music *= fade[:, None]; sfx *= fade[:, None]


def write(path, x, peak_db):
    x = x / max(1e-9, np.max(np.abs(x))) * 10 ** (peak_db / 20)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print("wrote", path)


write(ROOT / "assets/audio/music/music_bed.wav", music, -10.0)
write(ROOT / "assets/audio/sfx/sfx.wav", sfx, -8.0)
