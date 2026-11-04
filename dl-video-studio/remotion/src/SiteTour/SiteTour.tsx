import React from "react";
import {
  AbsoluteFill, CalculateMetadataFunction, Easing, Html5Audio, Img, Sequence, getStaticFiles, interpolate, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { buildTour, ctaFor, host, Key } from "./build";
import { SiteTourProps, Tour } from "./types";

const FPS = 30;
const SEG = { intro: 3.5, entry: 3.4, mobile: 4, access: 6.5, end: 3.5 };
const VIEW = { w: 1440, h: 900 };
const BAR = 52;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.65, 0, 0.35, 1);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const FONT = '"Helvetica Neue", "Segoe UI", Arial, sans-serif';

/** Loads the real capture (public/site/tour.json) and sizes the video to the tour it produces. */
export const calculateSiteTourMetadata: CalculateMetadataFunction<SiteTourProps> = async ({ props }) => {
  let tour: Tour | null = null;
  try {
    const res = await fetch(staticFile("site/tour.json"));
    if (res.ok) tour = (await res.json()) as Tour;
  } catch {
    tour = null;
  }
  if (!tour) return { durationInFrames: 10 * FPS, props: { ...props, tour: null } };
  const { duration } = buildTour(tour, props.maxPages, props.stopsPerPage);
  const total = SEG.intro + SEG.entry + duration + SEG.mobile + SEG.access + SEG.end;
  return { durationInFrames: Math.round(total * FPS), props: { ...props, tour } };
};

/** Interpolates the camera between keyframes; page switches are discrete (with a cross-fade). */
const sample = (keys: Key[], t: number) => {
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const p = b.t > a.t ? EASE(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)))) : 1;
  const mix = (x: number, y: number) => x + (y - x) * p;
  const samePage = a.page === b.page;
  return {
    page: b.page !== a.page && p >= 1 ? b.page : a.page,
    scroll: samePage ? mix(a.scroll, b.scroll) : a.scroll,
    zoom: samePage ? mix(a.zoom, b.zoom) : a.zoom,
    focusY: mix(a.focusY, b.focusY),
    cx: mix(a.cx, b.cx), cy: mix(a.cy, b.cy),
    hoverIdx: b.hoverIdx !== undefined ? b.hoverIdx : a.hoverIdx,
  };
};
/** Latest caption at or before t, plus when it started (for its entrance animation). */
const captionAt = (keys: Key[], t: number) => {
  let cap: { title: string; sub?: string; since: number } | null = null;
  for (const k of keys) {
    if (k.t > t) break;
    if (k.caption === undefined && k.sub === undefined) { cap = null; continue; }
    if (!cap || cap.title !== k.caption) cap = { title: k.caption ?? "", sub: k.sub, since: k.t };
  }
  return cap;
};

export const SiteTour: React.FC<SiteTourProps> = (props) => {
  const { tour } = props;
  if (!tour) return <NoCapture bg={props.background} />;
  return <Tour_ {...props} tour={tour} />;
};

const Tour_: React.FC<SiteTourProps & { tour: Tour }> = ({ tour, background, accent, introTitle, introSub, accessTitle, maxPages, stopsPerPage, sound }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / FPS;
  const { keys, duration, pages } = React.useMemo(() => buildTour(tour, maxPages, stopsPerPage), [tour, maxPages, stopsPerPage]);
  const T = {
    entry: SEG.intro, tour: SEG.intro + SEG.entry, mobile: SEG.intro + SEG.entry + duration,
    access: SEG.intro + SEG.entry + duration + SEG.mobile, end: SEG.intro + SEG.entry + duration + SEG.mobile + SEG.access,
  };
  const tt = Math.max(0, Math.min(duration, t - T.tour));
  const cam = sample(keys, tt);
  const siteHost = host(tour.site);
  const cta = ctaFor(tour);

  // Browser window placement: flies in during entry, slides left for the mobile beat, dims for the access panel.
  const winW = VIEW.w;
  const winH = VIEW.h + BAR;
  const baseX = (width - winW) / 2;
  const baseY = (height - winH) / 2;
  const entryP = interpolate(t, [T.entry, T.entry + 1.2], [0, 1], { ...clamp, easing: OUT });
  const mobileP = interpolate(t, [T.mobile, T.mobile + 0.9], [0, 1], { ...clamp, easing: EASE }) * interpolate(t, [T.access, T.access + 0.6], [1, 0.4], clamp);
  const winScale = interpolate(entryP, [0, 1], [0.82, 1]) * interpolate(mobileP, [0, 1], [1, 0.74]);
  const winX = baseX - mobileP * 260;
  const showWindow = t >= T.entry && t < T.end + 0.4;

  // Current page + transition state.
  const curPage = pages[cam.page];
  const switchKey = keys.find((k, i) => i > 0 && k.page !== keys[i - 1].page && Math.abs(tt - k.t) < 0.6 && tt >= k.t);
  const sinceSwitch = switchKey ? tt - switchKey.t : 9;
  const prevPage = switchKey ? pages[keys[keys.indexOf(switchKey) - 1].page] : null;
  const fadeIn = interpolate(sinceSwitch, [0, 0.35], [0, 1], clamp);

  // Address bar: typed during entry, then follows the page URL.
  const typedHost = siteHost.slice(0, Math.round(interpolate(t, [T.entry + 0.9, T.entry + 2.0], [0, siteHost.length], clamp)));
  const urlText = t < T.tour ? typedHost : host(curPage.url);
  const loading = t < T.tour ? interpolate(t, [T.entry + 2.1, T.entry + 2.8], [0, 1], clamp) : interpolate(sinceSwitch, [0, 0.5], [0, 1], clamp);
  const contentReveal = interpolate(t, [T.entry + 2.5, T.entry + 3.2], [0, 1], { ...clamp, easing: OUT });

  const clickKey = keys.find((k) => k.click && tt >= k.t && tt - k.t < 0.45);
  const cap = t >= T.tour && t < T.mobile ? captionAt(keys, tt) : null;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 40%, #22352e 0%, ${background} 70%)`, fontFamily: FONT, overflow: "hidden" }}>
      <GridBackdrop accent={accent} t={t} />
      {t < T.entry + 0.6 ? <Intro t={t} end={T.entry} title={introTitle} sub={introSub || siteHost} accent={accent} /> : null}

      {showWindow ? (
        <div style={{
          position: "absolute", left: winX, top: baseY, width: winW, height: winH, borderRadius: 14, overflow: "hidden",
          background: "#fff", boxShadow: `0 40px 120px #000a, 0 0 0 1px #ffffff22`,
          transform: `perspective(2200px) rotateX(${(1 - entryP) * 24}deg) translateY(${(1 - entryP) * 160}px) scale(${winScale})`,
          transformOrigin: "50% 60%", opacity: entryP,
          filter: t >= T.access ? `brightness(${interpolate(t, [T.access, T.access + 0.6], [1, 0.45], clamp)})` : undefined,
        }}>
          <ChromeBar url={urlText} loading={loading} accent={accent} typing={t < T.entry + 2.1 && t > T.entry + 0.8} t={t} />
          <div style={{ position: "absolute", top: BAR, left: 0, width: VIEW.w, height: VIEW.h, overflow: "hidden", background: "#fff" }}>
            <div style={{ position: "absolute", inset: 0, opacity: contentReveal, scale: String(interpolate(contentReveal, [0, 1], [1.03, 1])), filter: `blur(${(1 - contentReveal) * 8}px)` }}>
              {prevPage && fadeIn < 1 ? <PageView page={prevPage} scroll={0} zoom={1} focusY={450} opacity={1} /> : null}
              <PageView page={curPage} scroll={cam.scroll} zoom={cam.zoom} focusY={cam.focusY} opacity={prevPage ? fadeIn : 1}
                hover={cam.hoverIdx !== undefined && cam.hoverIdx >= 0 && cam.scroll < 40 ? pages[0].nav[cam.hoverIdx] : null} accent={accent} />
            </div>
            {t >= T.tour && t < T.mobile + 0.5 ? (
              <Cursor x={cam.cx} y={cam.cy} click={clickKey ? tt - clickKey.t : null} accent={accent} />
            ) : null}
          </div>
        </div>
      ) : null}

      {cap ? <Caption title={cap.title} sub={cap.sub} since={tt - cap.since} accent={accent} /> : null}
      {t >= T.mobile - 0.2 && t < T.end ? <PhoneBeat t={t - T.mobile} img={tour.mobile} host={siteHost} accent={accent} out={interpolate(t, [T.access, T.access + 0.5], [1, 0], clamp)} /> : null}
      {t >= T.access && t < T.end + 0.3 ? <AccessPanel t={t - T.access} title={accessTitle} host={siteHost} nav={pages[0].nav.map((n) => n.text)} cta={cta} accent={accent} /> : null}
      {t >= T.end - 0.4 ? <EndCard t={t - T.end} host={siteHost} /> : null}
      {sound === "library" ? <TourSound keys={keys} tourStart={T.tour} entry={T.entry} end={T.end} /> : null}
    </AbsoluteFill>
  );
};

const PageView: React.FC<{ page: { image: string; height: number; fold: string; headerSticky: boolean; headerHeight: number }; scroll: number; zoom: number; focusY: number; opacity: number; hover?: { x: number; y: number; w: number; h: number } | null; accent?: string }> = ({ page, scroll, zoom, focusY, opacity, hover, accent }) => (
  <div style={{ position: "absolute", inset: 0, opacity, transform: `scale(${zoom})`, transformOrigin: `50% ${focusY}px` }}>
    <Img src={staticFile(page.image)} style={{ position: "absolute", left: 0, top: -scroll, width: VIEW.w, height: page.height }} />
    {page.headerSticky && scroll > 2 && page.headerHeight > 0 ? (
      <div style={{ position: "absolute", left: 0, top: 0, width: VIEW.w, height: page.headerHeight, overflow: "hidden" }}>
        <Img src={staticFile(page.fold)} style={{ width: VIEW.w, display: "block" }} />
      </div>
    ) : null}
    {hover ? <div style={{ position: "absolute", left: hover.x - 8, top: hover.y - 6, width: hover.w + 16, height: hover.h + 12, borderRadius: 10, background: `${accent}22`, boxShadow: `0 0 0 2px ${accent}` }} /> : null}
  </div>
);

const ChromeBar: React.FC<{ url: string; loading: number; accent: string; typing: boolean; t: number }> = ({ url, loading, accent, typing, t }) => (
  <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: BAR, background: "#eef0ef", borderBottom: "1px solid #d9dddb", display: "flex", alignItems: "center", gap: 14, padding: "0 18px" }}>
    <div style={{ display: "flex", gap: 8 }}>{["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />)}</div>
    <div style={{ flex: 1, height: 32, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, color: "#1d2a25", fontSize: 17, boxShadow: "inset 0 0 0 1px #d6dad8" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b6b64" strokeWidth="2.5"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      <span>{url}{typing && Math.floor(t * 2) % 2 === 0 ? "|" : ""}</span>
    </div>
    {loading > 0 && loading < 1 ? <div style={{ position: "absolute", left: 0, bottom: -1, height: 3, width: `${loading * 100}%`, background: accent }} /> : null}
  </div>
);

const Cursor: React.FC<{ x: number; y: number; click: number | null; accent: string }> = ({ x, y, click, accent }) => (
  <>
    {click !== null ? (
      <div style={{ position: "absolute", left: x, top: y, width: 70, height: 70, translate: "-50% -50%", borderRadius: "50%", border: `3px solid ${accent}`,
        scale: String(interpolate(click, [0, 0.45], [0.2, 1.2], clamp)), opacity: interpolate(click, [0, 0.45], [1, 0], clamp) }} />
    ) : null}
    <svg width="34" height="34" viewBox="0 0 24 24" style={{ position: "absolute", left: x - 4, top: y - 2, filter: "drop-shadow(0 3px 6px #0006)", scale: click !== null && click < 0.15 ? "0.85" : "1" }}>
      <path d="M4 2l15 11-7 1.2 4 7.3-3 1.5-4-7.4L4 20z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  </>
);

const Caption: React.FC<{ title: string; sub?: string; since: number; accent: string }> = ({ title, sub, since, accent }) => {
  const p = interpolate(since, [0, 0.45], [0, 1], { ...clamp, easing: OUT });
  return (
    <div style={{
      position: "absolute", left: 90, bottom: 70, maxWidth: 820, padding: "18px 26px 18px 22px", borderRadius: 14,
      background: "#101a16e8", color: "#fff", boxShadow: "0 20px 60px #0008", borderLeft: `6px solid ${accent}`,
      opacity: p, translate: `${(1 - p) * -30}px 0px`,
    }}>
      {sub ? <div style={{ fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9fb4ab", marginBottom: 6 }}>{sub}</div> : null}
      <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.15 }}>{title.length > 90 ? `${title.slice(0, 88)}…` : title}</div>
    </div>
  );
};

const GridBackdrop: React.FC<{ accent: string; t: number }> = ({ accent, t }) => (
  <AbsoluteFill style={{ backgroundImage: "linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)", backgroundSize: "64px 64px", backgroundPosition: `${t * 6}px ${t * 4}px` }}>
    <div style={{ position: "absolute", left: "8%", top: "12%", width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${accent}2e, transparent 70%)`, filter: "blur(20px)", translate: `${Math.sin(t * 0.3) * 40}px ${Math.cos(t * 0.25) * 30}px` }} />
  </AbsoluteFill>
);

const Intro: React.FC<{ t: number; end: number; title: string; sub: string; accent: string }> = ({ t, end, title, sub, accent }) => {
  const out = interpolate(t, [end - 0.3, end + 0.4], [1, 0], clamp);
  const mark = interpolate(t, [0.2, 1.0], [0, 1], { ...clamp, easing: OUT });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out, gap: 34 }}>
      <Img src={staticFile("brand/dl-mark-on-dark.png")} style={{ width: 170, height: 170, opacity: mark, scale: String(interpolate(mark, [0, 1], [0.85, 1])), boxShadow: `0 0 60px ${accent}44` }} />
      <div style={{ color: "#fff", fontSize: 64, fontWeight: 700, letterSpacing: "-0.01em", opacity: interpolate(t, [0.7, 1.3], [0, 1], clamp), translate: `0px ${interpolate(t, [0.7, 1.4], [20, 0], { ...clamp, easing: OUT })}px` }}>{title}</div>
      <div style={{ color: accent, fontSize: 30, fontWeight: 600, letterSpacing: "0.08em", opacity: interpolate(t, [1.2, 1.8], [0, 1], clamp) }}>{sub}</div>
    </AbsoluteFill>
  );
};

const PhoneBeat: React.FC<{ t: number; img: string; host: string; accent: string; out: number }> = ({ t, img, host: h, accent, out }) => {
  const p = interpolate(t, [0.2, 1.1], [0, 1], { ...clamp, easing: OUT });
  return (
    <>
      <div style={{
        position: "absolute", right: 150, top: 120, width: 390, height: 844, borderRadius: 54, background: "#0c0f0e", padding: 14,
        boxShadow: "0 40px 120px #000c, 0 0 0 2px #ffffff22", translate: `${(1 - p) * 500}px 0px`, opacity: out, rotate: `${(1 - p) * 6}deg`,
      }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: "#fff" }}>
          <Img src={staticFile(img)} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
      <AbsoluteFill style={{ opacity: p * out }}>
        <Caption title="Works just as well on your phone" sub={h} since={t - 0.4} accent={accent} />
      </AbsoluteFill>
    </>
  );
};

const AccessPanel: React.FC<{ t: number; title: string; host: string; nav: string[]; cta: string | null; accent: string }> = ({ t, title, host: h, nav, cta, accent }) => {
  const uniq = [...new Set(nav.map((n) => n.trim()).filter(Boolean))].slice(0, 6);
  const steps: [string, string][] = [
    ["Open your browser and go to", h],
    ["Explore the main menu", uniq.join(" · ")],
    ...(cta ? [[`When you're ready, press`, `“${cta}”`] as [string, string]] : []),
  ];
  const p = interpolate(t, [0.3, 1.0], [0, 1], { ...clamp, easing: OUT });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: interpolate(t, [SEG.access - 0.3, SEG.access + 0.2], [1, 0], clamp) }}>
      <div style={{ width: 1080, padding: "56px 64px", borderRadius: 28, background: "#101a16f2", boxShadow: "0 40px 140px #000c", border: "1px solid #ffffff1a", opacity: p, scale: String(interpolate(p, [0, 1], [0.95, 1])) }}>
        <div style={{ color: accent, fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>For first-time visitors</div>
        <div style={{ color: "#fff", fontSize: 58, fontWeight: 700, margin: "10px 0 34px" }}>{title}</div>
        {steps.map(([a, b], i) => {
          const q = interpolate(t, [1.0 + i * 0.6, 1.5 + i * 0.6], [0, 1], { ...clamp, easing: OUT });
          return (
            <div key={a} style={{ display: "flex", gap: 26, alignItems: "flex-start", marginTop: 22, opacity: q, translate: `${(1 - q) * 30}px 0px` }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: accent, color: "#fff", fontSize: 26, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ color: "#a9bcb4", fontSize: 24 }}>{a}</div>
                <div style={{ color: "#fff", fontSize: 34, fontWeight: 700, marginTop: 4 }}>{b}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ t: number; host: string }> = ({ t, host: h }) => (
  <AbsoluteFill style={{ background: "#fff", alignItems: "center", justifyContent: "center", gap: 40, opacity: interpolate(t, [-0.4, 0.1], [0, 1], clamp) }}>
    <Img src={staticFile("brand/dl-lockup-on-light.webp")} style={{ width: 1100, opacity: interpolate(t, [0.2, 0.9], [0, 1], clamp), scale: String(interpolate(t, [0.2, 3.5], [0.97, 1], { ...clamp, easing: OUT })) }} />
    <div style={{ color: "#182420", fontSize: 40, fontWeight: 700, letterSpacing: "0.04em", opacity: interpolate(t, [0.8, 1.4], [0, 1], clamp) }}>{h}</div>
  </AbsoluteFill>
);

const NoCapture: React.FC<{ bg: string }> = ({ bg }) => (
  <AbsoluteFill style={{ background: bg, color: "#fff", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 36, textAlign: "center", padding: 120 }}>
    No website capture yet. Run: node scripts/capture-site.mjs https://www.decipheringlogic.com
  </AbsoluteFill>
);

/** Optional library UI sounds (same public/sfx/ files as Deciphered); silent if the files aren't present. */
const TourSound: React.FC<{ keys: Key[]; tourStart: number; entry: number; end: number }> = ({ keys, tourStart, entry, end }) => {
  const find = (id: string) => getStaticFiles().find((f) => f.name.startsWith(`sfx/${id}.`))?.name ?? null;
  const click = find("98871");
  const swipe = find("75548");
  const whoosh = find("93801");
  const logo = find("110689");
  const at = (s: number) => Math.round(s * FPS);
  return (
    <>
      {whoosh ? <Sequence from={at(entry)} durationInFrames={at(2)} layout="none"><Html5Audio src={staticFile(whoosh)} volume={0.5} /></Sequence> : null}
      {click ? keys.filter((k) => k.click).map((k) => <Sequence key={`c${k.t}`} from={at(tourStart + k.t - 0.05)} durationInFrames={at(0.6)} layout="none"><Html5Audio src={staticFile(click)} volume={0.45} /></Sequence>) : null}
      {swipe ? keys.filter((k, i) => i > 0 && k.page !== keys[i - 1].page).map((k) => <Sequence key={`s${k.t}`} from={at(tourStart + k.t - 0.1)} durationInFrames={at(1.5)} layout="none"><Html5Audio src={staticFile(swipe)} volume={0.35} /></Sequence>) : null}
      {logo ? <Sequence from={at(end - 0.1)} layout="none"><Html5Audio src={staticFile(logo)} volume={0.6} /></Sequence> : null}
    </>
  );
};
