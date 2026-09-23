import React, { useMemo, useState } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Video } from "remotion";

import { NATURE_PRESETS } from "./naturePresets.js";
export { NATURE_PRESETS };

export const CinematicBackground = ({
  primaryColor = "#c9a84c",
  bgStyle = "ocean",
  customBgUrl = null,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const [imgError, setImgError] = useState(false);

  const preset = NATURE_PRESETS[bgStyle] || NATURE_PRESETS.ocean;
  const bgMedia = customBgUrl || preset.url;
  const accentColor = preset.accent || primaryColor;

  const isVideo =
    typeof bgMedia === "string" &&
    (bgMedia.startsWith("blob:") ||
      bgMedia.startsWith("data:video") ||
      /\.(mp4|webm|mov)(\?.*)?$/i.test(bgMedia));

  const scale = isVideo
    ? 1
    : interpolate(frame, [0, durationInFrames], [1, 1.13]);
  const translateY = isVideo
    ? 0
    : interpolate(frame, [0, durationInFrames], [0, -38]);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 35; i++) {
      arr.push({
        x: (i * 137.5) % 100,
        yInit: (i * 83.3) % 100,
        size: (i % 4) * 1.5 + 2.2,
        speed: 0.16 + (i % 5) * 0.08,
        opacityBase: 0.22 + (i % 6) * 0.1,
      });
    }
    return arr;
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        width: 1080,
        height: 1920,
        backgroundColor: "#060709",
        overflow: "hidden",
      }}
    >
      {bgMedia && !imgError ? (
        <div
          style={{
            position: "absolute",
            inset: isVideo ? 0 : -45,
            transform: isVideo ? "none" : `scale(${scale}) translateY(${translateY}px)`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          {isVideo ? (
            <Video
              src={bgMedia}
              loop
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.96) saturate(1.15)",
              }}
            />
          ) : (
            <img
              src={bgMedia}
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.96) saturate(1.18)",
              }}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 45%, #181510 0%, #0a0a0c 85%)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.58) 45%, rgba(0,0,0,0.85) 100%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          width: 850,
          height: 850,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${accentColor}1c 0%, transparent 70%)`,
          filter: "blur(75px)",
          pointerEvents: "none",
        }}
      />

      {particles.map((p, idx) => {
        const currentY = (p.yInit - frame * p.speed + 200) % 110;
        const currentOpacity = interpolate(
          Math.sin((frame + idx * 12) * 0.05),
          [-1, 1],
          [p.opacityBase * 0.3, p.opacityBase * 1.5]
        );

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${currentY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: accentColor,
              opacity: Math.max(0, currentOpacity),
              boxShadow: `0 0 ${p.size * 3}px ${accentColor}`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 170px rgba(0,0,0,0.85)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
