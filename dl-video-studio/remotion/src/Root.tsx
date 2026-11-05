import React from "react";
import { Composition, Folder } from "remotion";
import { IdeaToPlan } from "./IdeaToPlan/IdeaToPlan";
import { ideaToPlanSchema, TOTAL_SECONDS } from "./IdeaToPlan/schema";
import { Decipher } from "./Decipher/Decipher";
import { LyricReel, LYRIC_SECONDS } from "./LyricReel/LyricReel";
import { SiteTour, calculateSiteTourMetadata } from "./SiteTour/SiteTour";
import { siteTourSchema } from "./SiteTour/types";
import { decipherSchema, DECIPHER_SECONDS } from "./Decipher/schema";

const FPS = 30;

// One composition per delivery format. LinkedIn 4:5 and Instagram/Shorts 9:16 are primary.
export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Folder name="LyricReel">
      <Composition id="IdeaSeUdaan-9x16" component={LyricReel} durationInFrames={LYRIC_SECONDS * 30} fps={30} width={1080} height={1920} />
    </Folder>
    <Folder name="SiteTour">
      <Composition
        id="SiteTour-16x9"
        component={SiteTour}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={siteTourSchema}
        calculateMetadata={calculateSiteTourMetadata}
        defaultProps={{
          introTitle: "A first look at our website",
          introSub: "",
          accessTitle: "How to get started",
          maxPages: 6,
          stopsPerPage: 2,
          background: "#182420",
          accent: "#c93a5f",
          sound: "library",
        }}
      />
    </Folder>
    <Folder name="Deciphered-DEMO">
      <Composition
        id="Deciphered-16x9"
        component={Decipher}
        durationInFrames={DECIPHER_SECONDS * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={decipherSchema}
        defaultProps={{
          chaosCaption: "Notes. Voice memos. Open questions.",
          gridCaption: "Deciphered into one plan",
          deliverables: ["User flows", "Wireframes", "UI screens", "Data model", "API plan", "Architecture", "Sprint roadmap", "Cost range", "Risk register", "Test plan", "Tech stack", "Clickable prototype"],
          tagline: "Every idea. One clear plan.",
          endCard: true,
          background: "#040706",
          glow: "#2ee6b8",
          glowSoft: "#0f5c4c",
          warm: "#c93a5f",
          sound: "library",
          sfxVolume: 1,
          musicVolume: 0.8,
          musicStart: 0,
          showSafeArea: false,
        }}
      />
      <Composition
        id="Deciphered-4x5"
        component={Decipher}
        durationInFrames={DECIPHER_SECONDS * FPS}
        fps={FPS}
        width={1080}
        height={1350}
        schema={decipherSchema}
        defaultProps={{
          chaosCaption: "Notes. Voice memos. Open questions.",
          gridCaption: "Deciphered into one plan",
          deliverables: ["User flows", "Wireframes", "UI screens", "Data model", "API plan", "Architecture", "Sprint roadmap", "Cost range", "Risk register", "Test plan", "Tech stack", "Clickable prototype"],
          tagline: "Every idea. One clear plan.",
          endCard: true,
          background: "#040706",
          glow: "#2ee6b8",
          glowSoft: "#0f5c4c",
          warm: "#c93a5f",
          sound: "library",
          sfxVolume: 1,
          musicVolume: 0.8,
          musicStart: 0,
          showSafeArea: false,
        }}
      />
      <Composition
        id="Deciphered-9x16"
        component={Decipher}
        durationInFrames={DECIPHER_SECONDS * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        schema={decipherSchema}
        defaultProps={{
          chaosCaption: "Notes. Voice memos. Open questions.",
          gridCaption: "Deciphered into one plan",
          deliverables: ["User flows", "Wireframes", "UI screens", "Data model", "API plan", "Architecture", "Sprint roadmap", "Cost range", "Risk register", "Test plan", "Tech stack", "Clickable prototype"],
          tagline: "Every idea. One clear plan.",
          endCard: true,
          background: "#040706",
          glow: "#2ee6b8",
          glowSoft: "#0f5c4c",
          warm: "#c93a5f",
          sound: "library",
          sfxVolume: 1,
          musicVolume: 0.8,
          musicStart: 0,
          showSafeArea: false,
        }}
      />
    </Folder>
    <Folder name="IdeaToPlan-DEMO">
      <Composition
        id="IdeaToPlan-4x5"
        component={IdeaToPlan}
        durationInFrames={TOTAL_SECONDS * FPS}
        fps={FPS}
        width={1080}
        height={1350}
        schema={ideaToPlanSchema}
        defaultProps={{
          hookText: "Every product starts with an idea.",
          questionsHeadline: "…and a lot of questions.",
          questions: ["Who is it for?", "What’s in version one?", "What will it cost?"],
          planHeadline: "Discovery turns questions into a plan.",
          planItems: ["User flows", "Key screens", "Technical plan", "Clickable prototype"],
          ctaHeadline: "Start with clarity.",
          ctaButton: "Book a discovery call",
          showLogo: true,
          background: "#f7f3ee",
          backgroundGlow: "#f4d6df",
          ink: "#182420",
          accent: "#c93a5f",
          dark: "#182420",
          showSafeArea: false,
        }}
      />
      <Composition
        id="IdeaToPlan-9x16"
        component={IdeaToPlan}
        durationInFrames={TOTAL_SECONDS * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        schema={ideaToPlanSchema}
        defaultProps={{
          hookText: "Every product starts with an idea.",
          questionsHeadline: "…and a lot of questions.",
          questions: ["Who is it for?", "What’s in version one?", "What will it cost?"],
          planHeadline: "Discovery turns questions into a plan.",
          planItems: ["User flows", "Key screens", "Technical plan", "Clickable prototype"],
          ctaHeadline: "Start with clarity.",
          ctaButton: "Book a discovery call",
          showLogo: true,
          background: "#f7f3ee",
          backgroundGlow: "#f4d6df",
          ink: "#182420",
          accent: "#c93a5f",
          dark: "#182420",
          showSafeArea: false,
        }}
      />
      <Composition
        id="IdeaToPlan-1x1"
        component={IdeaToPlan}
        durationInFrames={TOTAL_SECONDS * FPS}
        fps={FPS}
        width={1080}
        height={1080}
        schema={ideaToPlanSchema}
        defaultProps={{
          hookText: "Every product starts with an idea.",
          questionsHeadline: "…and a lot of questions.",
          questions: ["Who is it for?", "What’s in version one?", "What will it cost?"],
          planHeadline: "Discovery turns questions into a plan.",
          planItems: ["User flows", "Key screens", "Technical plan", "Clickable prototype"],
          ctaHeadline: "Start with clarity.",
          ctaButton: "Book a discovery call",
          showLogo: true,
          background: "#f7f3ee",
          backgroundGlow: "#f4d6df",
          ink: "#182420",
          accent: "#c93a5f",
          dark: "#182420",
          showSafeArea: false,
        }}
      />
      <Composition
        id="IdeaToPlan-16x9"
        component={IdeaToPlan}
        durationInFrames={TOTAL_SECONDS * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={ideaToPlanSchema}
        defaultProps={{
          hookText: "Every product starts with an idea.",
          questionsHeadline: "…and a lot of questions.",
          questions: ["Who is it for?", "What’s in version one?", "What will it cost?"],
          planHeadline: "Discovery turns questions into a plan.",
          planItems: ["User flows", "Key screens", "Technical plan", "Clickable prototype"],
          ctaHeadline: "Start with clarity.",
          ctaButton: "Book a discovery call",
          showLogo: true,
          background: "#f7f3ee",
          backgroundGlow: "#f4d6df",
          ink: "#182420",
          accent: "#c93a5f",
          dark: "#182420",
          showSafeArea: false,
        }}
      />
    </Folder>
    </>
  );
};
