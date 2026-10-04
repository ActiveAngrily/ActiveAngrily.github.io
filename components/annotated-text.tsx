import { useId, type ReactNode } from "react";

// Adapted from Opensource UI's Annotated Text (MIT).
// Copyright (c) 2026 Bidyut Kundu. See THIRD_PARTY_NOTICES.md.
export function AnnotatedText({ children, variant = "wavy" }: {
  children: ReactNode;
  variant?: "wavy" | "underline" | "arrow" | "highlight";
}) {
  const filterId = useId();
  const paths = variant === "wavy"
    ? ["M2,6 Q5.5,3 9,6 T17,6 T25,6 T33,6 T41,6 T49,6 T57,6 T65,6 T73,6 T81,6 T89,6 T97,6 T105,6 T113,6 T121,6 T129,6 T137,6"]
    : variant === "arrow"
      ? ["M3,7 C45,3 105,4 140,8", "M132,3 L142,8 L131,13"]
      : ["M3,6 C40,3 100,3 137,5"];
  return (
    <span className={`annotated-text annotation-${variant}`}>
      <span className="annotation-label">{children}</span>
      <svg viewBox={variant === "highlight" ? "0 0 170 26" : variant === "arrow" ? "0 0 150 18" : "0 0 140 14"} preserveAspectRatio="none" fill="none" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={2} seed={11} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={1.5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {variant === "highlight" ? <path d="M4,17 C2,11 5,7 12,6 C45,2 95,2 138,4 C152,5 164,7 166,13 C167,18 163,21 155,22 C112,24 60,24 16,22 C8,21.5 4,20 4,17 Z" fill="currentColor" filter={`url(#${filterId})`} /> : paths.map((path) => <path key={path} d={path} stroke="currentColor" strokeWidth={variant === "wavy" ? 2.2 : 2.4} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${filterId})`} />)}
      </svg>
    </span>
  );
}
