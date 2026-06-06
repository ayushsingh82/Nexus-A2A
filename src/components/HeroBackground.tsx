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
        pixelSize={4}
        color="#01B73E"
        patternScale={2}
        patternDensity={1.08}
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        speed={0.5}
        edgeFade={0.22}
        transparent
      />
    </div>
  );
}
