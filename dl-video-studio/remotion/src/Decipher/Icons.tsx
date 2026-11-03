import React from "react";

export type IconName =
  | "note" | "wave" | "chat" | "sketch" | "question" | "chart" | "check" | "flow" | "screen"
  | "db" | "code" | "map" | "coin" | "shield" | "layers" | "spark" | "people" | "deck";

const P: Record<IconName, React.ReactNode> = {
  note: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  wave: <path d="M2 12h2l2-5 3 10 3-14 3 16 3-10 2 3h2" />,
  chat: <path d="M4 5h16v10H9l-5 4z" />,
  sketch: <path d="M3 17c3-6 5 2 8-4s5 3 10-6M4 21h16" />,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  check: <><path d="M4 7l2 2 3-3M4 14l2 2 3-3" /><path d="M12 8h8M12 15h8" /></>,
  flow: <><rect x="2" y="3" width="7" height="5" rx="1" /><rect x="15" y="10" width="7" height="5" rx="1" /><rect x="2" y="16" width="7" height="5" rx="1" /><path d="M9 5.5h3v13H9M12 12.5h3" /></>,
  screen: <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M9 6h6M9 10h6M9 14h3" /></>,
  db: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  code: <path d="M8 6l-6 6 6 6M16 6l6 6-6 6M14 4l-4 16" />,
  map: <><path d="M3 18c4-1 5-8 9-8s5 6 9 5" /><circle cx="5" cy="17" r="2" /><circle cx="12" cy="10" r="2" /><circle cx="20" cy="15" r="2" /></>,
  coin: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  shield: <><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /><path d="M12 8v5M12 16h.01" /></>,
  layers: <path d="M12 2l10 5-10 5L2 7zM2 12l10 5 10-5M2 17l10 5 10-5" />,
  spark: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" /></>,
  people: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 20c0-2.5 1.5-4.5 4-4.5s4 2 4 4.5" /></>,
  deck: <><rect x="2" y="4" width="20" height="13" rx="1.5" /><path d="M12 17v4M8 21h8M6 13l4-4 3 3 5-5" /></>,
};

export const Icon: React.FC<{ name: IconName; size: number; color: string; stroke?: number }> = ({ name, size, color, stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {P[name]}
  </svg>
);

/** Picks an icon for a free-text deliverable label so edited labels still get a sensible icon. */
export const iconFor = (label: string): IconName => {
  const l = label.toLowerCase();
  const rules: [RegExp, IconName][] = [
    [/flow|journey/, "flow"], [/wire|screen|ui|design/, "screen"], [/data|model|schema/, "db"], [/api|stack|code|tech/, "code"],
    [/architect|layer|system/, "layers"], [/road|sprint|plan|timeline/, "map"], [/cost|budget|price/, "coin"], [/risk|security/, "shield"],
    [/test|qa|check/, "check"], [/proto|idea|concept/, "spark"], [/user|persona|research/, "people"], [/metric|kpi|chart/, "chart"],
  ];
  return rules.find(([re]) => re.test(l))?.[1] ?? "note";
};
