import React from "react";
import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { IdeaToPlanProps, SCENES } from "./schema";
import { useLayout } from "./layout";
import { IdeaDot } from "./IdeaDot";
import { HookScene } from "./HookScene";
import { QuestionsScene } from "./QuestionsScene";
import { PlanScene } from "./PlanScene";
import { CtaScene } from "./CtaScene";
import { SafeArea } from "./SafeArea";

/**
 * Original DL sample: an idea attracts questions, the questions collapse into a plan, then a CTA.
 * SYNTHETIC demo content — copy is a placeholder until approved; logo and colours are DL's official ones.
 */
export const IdeaToPlan: React.FC<IdeaToPlanProps> = (props) => {
  const { fps } = useVideoConfig();
  const L = useLayout();
  return (
    <AbsoluteFill
      style={{
        fontFamily: L.font,
        background: `radial-gradient(ellipse 80% 60% at 50% 45%, ${props.backgroundGlow} 0%, ${props.background} 70%)`,
      }}
    >
      <IdeaDot accent={props.accent} />
      <Series>
        <Series.Sequence name="Hook" durationInFrames={SCENES.hook * fps}>
          <HookScene text={props.hookText} ink={props.ink} />
        </Series.Sequence>
        <Series.Sequence name="Questions" durationInFrames={SCENES.questions * fps}>
          <QuestionsScene headline={props.questionsHeadline} questions={props.questions} ink={props.ink} accent={props.accent} />
        </Series.Sequence>
        <Series.Sequence name="Plan" durationInFrames={SCENES.plan * fps}>
          <PlanScene headline={props.planHeadline} items={props.planItems} ink={props.ink} accent={props.accent} />
        </Series.Sequence>
        <Series.Sequence name="CTA" durationInFrames={SCENES.cta * fps}>
          <CtaScene headline={props.ctaHeadline} button={props.ctaButton} showLogo={props.showLogo} dark={props.dark} accent={props.accent} />
        </Series.Sequence>
      </Series>
      {props.showSafeArea ? <SafeArea /> : null}
    </AbsoluteFill>
  );
};
