import React from "react";
import { Composition, Folder } from "remotion";
import { IdeaToPlan } from "./IdeaToPlan/IdeaToPlan";
import { ideaToPlanSchema, TOTAL_SECONDS } from "./IdeaToPlan/schema";

const FPS = 30;

// One composition per delivery format. LinkedIn 4:5 and Instagram/Shorts 9:16 are primary.
export const RemotionRoot: React.FC = () => {
  return (
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
          logoPlaceholder: "[ DL logo — official file needed ]",
          background: "#f7f3ee",
          backgroundGlow: "#f6d9e3",
          ink: "#1b1f2a",
          accent: "#c2416d",
          dark: "#14161d",
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
          logoPlaceholder: "[ DL logo — official file needed ]",
          background: "#f7f3ee",
          backgroundGlow: "#f6d9e3",
          ink: "#1b1f2a",
          accent: "#c2416d",
          dark: "#14161d",
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
          logoPlaceholder: "[ DL logo — official file needed ]",
          background: "#f7f3ee",
          backgroundGlow: "#f6d9e3",
          ink: "#1b1f2a",
          accent: "#c2416d",
          dark: "#14161d",
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
          logoPlaceholder: "[ DL logo — official file needed ]",
          background: "#f7f3ee",
          backgroundGlow: "#f6d9e3",
          ink: "#1b1f2a",
          accent: "#c2416d",
          dark: "#14161d",
          showSafeArea: false,
        }}
      />
    </Folder>
  );
};
