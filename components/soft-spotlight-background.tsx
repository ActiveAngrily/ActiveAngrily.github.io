import { InteractiveDots } from "./interactive-dots";

// Adapted from https://opensourceui.in/components/soft-spotlight-background
// Copyright (c) 2026 Bidyut Kundu. MIT license: THIRD_PARTY_NOTICES.md.
const settings = {
  lightX: 50,
  lightY: 50,
  innerStop: 61,
  outerStop: 99,
  coreColor: "#ffffff",
  innerColor: "#f1f7fc",
  baseColor: "#e8eff5",
  edgeColor: "#dbe5ee",
  glowX: 32,
  glowY: 54,
  glowSpread: 69,
  glowOpacity: 82,
  vignetteStart: 32,
  vignetteOpacity: 22,
  textureOpacity: 5,
  textureSize: 8,
};

export function SoftSpotlightBackground() {
  const s = settings;
  return (
    <div className="spotlight" data-slot="soft-spotlight-background" style={{ backgroundColor: s.baseColor }}>
      <div className="spotlight-layers" aria-hidden="true">
        <div style={{ backgroundImage: `radial-gradient(circle at ${s.lightX}% ${s.lightY}%, ${s.coreColor} 0%, ${s.innerColor} ${s.innerStop}%, ${s.baseColor} ${s.outerStop}%, ${s.edgeColor} 100%)` }} />
        <div style={{ backgroundImage: `radial-gradient(circle at ${s.glowX}% ${s.glowY}%, rgba(255,255,255,0.9) 0%, transparent ${s.glowSpread}%)`, opacity: s.glowOpacity / 100 }} />
        <div style={{ backgroundImage: `radial-gradient(circle at center, transparent ${s.vignetteStart}%, rgba(41,37,36,${s.vignetteOpacity / 100}) 100%)` }} />
        <InteractiveDots spacing={s.textureSize} opacity={s.textureOpacity / 100} />
      </div>
    </div>
  );
}
