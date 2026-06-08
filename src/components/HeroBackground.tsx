"use client";

import dynamic from "next/dynamic";

const PixelBlast = dynamic(() => import("./PixelBlast"), { ssr: false });

export default function HeroBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <PixelBlast
        variant="square"
        pixelSize={6}
        color="#01B73E"
        patternScale={3.2}
        patternDensity={0.52}
        enableRipples
        rippleSpeed={0.28}
        rippleThickness={0.08}
        rippleIntensityScale={0.85}
        speed={0.32}
        edgeFade={0.48}
        noiseAmount={0.04}
        transparent
      />
    </div>
  );
}
