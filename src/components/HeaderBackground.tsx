"use client";

import dynamic from "next/dynamic";

const PixelBlast = dynamic(() => import("./PixelBlast"), { ssr: false });

/**
 * Compact green PixelBlast strip used as the absolute background of the
 * landing-page header. Tuned for a short horizontal strip: smaller pixels,
 * higher density, sharper edge fade.
 */
export default function HeaderBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <PixelBlast
        variant="square"
        pixelSize={3}
        color="#01B73E"
        patternScale={4.2}
        patternDensity={0.32}
        enableRipples={false}
        speed={0.22}
        edgeFade={0.72}
        noiseAmount={0.02}
        transparent
      />
    </div>
  );
}
