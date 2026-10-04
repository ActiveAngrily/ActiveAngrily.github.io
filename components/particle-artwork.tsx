"use client";

import { memo, useState } from "react";
import { ParticleObject } from "./particle-object";

const settings = {
  count: 10500,
  size: 4.2,
  sizeVariance: 0.8,
  radius: 105,
  strength: 0.1,
  swirl: 0.3,
  spring: 1.1,
  damping: 0.55,
  drift: 0.45,
  scale: 5.3,
  floatIntensity: 0.45,
  rotationIntensity: 0.3,
  floatSpeed: 0.8,
  color: "",
};

export const ParticleArtwork = memo(function ParticleArtwork() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="artwork" role="img" aria-label="An airy blue ribbon knot made of interactive particles">
      {!failed && (
        <ParticleObject
          className="particle-canvas"
          src="/art/blue-ribbon.png"
          {...settings}
          background=""
          fov={45}
          yOffset={-0.3}
          onError={() => setFailed(true)}
        />
      )}
      {failed && <img className="artwork-fallback" src="/art/blue-ribbon.png" alt="" />}
    </div>
  );
});
