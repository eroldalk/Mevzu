import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const AnimatedSubtitles = ({
  text = "",
  fontSize = 54,
  fontFamily = "'DM Sans', sans-serif",
  highlightColor = "#f5c542",
  animStyle = "highlight", // "highlight", "typewriter", "zoom", "fade"
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Kelimelere ayır
  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords === 0) return null;

  // Başlangıç ve bitiş aralığı
  const startDelay = 18;
  const availableFrames = Math.max(30, durationInFrames - startDelay - 35);
  const framesPerWord = availableFrames / totalWords;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "14px 20px",
        width: "100%",
        maxWidth: 960,
        padding: "0 30px",
        textAlign: "center",
        lineHeight: 1.52,
      }}
    >
      {words.map((word, index) => {
        const wordStart = startDelay + index * framesPerWord;
        const wordEnd = wordStart + framesPerWord;

        const isPast = frame >= wordEnd;
        const isActive = frame >= wordStart && frame < wordEnd;
        const isFuture = frame < wordStart;

        // Yay (Spring) Fiziği
        const wordSpring = spring({
          frame: Math.max(0, frame - wordStart),
          fps,
          config: { damping: 13, stiffness: 220, mass: 0.5 },
        });

        // 1. HIGHLIGHT (Altın Karaoke)
        if (animStyle === "highlight") {
          const scale = isActive ? interpolate(wordSpring, [0, 1], [1, 1.12]) : 1;
          const color = isPast
            ? "rgba(255, 255, 255, 0.95)"
            : isActive
            ? highlightColor
            : "rgba(255, 255, 255, 0.28)";

          const textShadow = isActive
            ? `0 0 28px rgba(245, 197, 66, 0.8), 0 0 50px rgba(245, 197, 66, 0.4)`
            : "none";

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "-0.01em",
                color,
                textShadow,
                transform: `scale(${scale})`,
                transition: "color 0.15s ease, transform 0.1s ease",
              }}
            >
              {word}
            </span>
          );
        }

        // 2. TYPEWRITER (Daktilo / Adım Adım Belirme)
        if (animStyle === "typewriter") {
          if (isFuture) return null; // Gelecek kelimeler henüz görünmez
          const opacity = interpolate(wordSpring, [0, 1], [0, 1]);
          const translateY = interpolate(wordSpring, [0, 1], [8, 0]);

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: 600,
                color: isActive ? highlightColor : "#ffffff",
                opacity,
                transform: `translateY(${translateY}px)`,
                textShadow: isActive ? `0 0 20px ${highlightColor}` : "none",
              }}
            >
              {word}
            </span>
          );
        }

        // 3. ZOOM (3D Pop-in Yaylanma)
        if (animStyle === "zoom") {
          if (isFuture) {
            return (
              <span
                key={index}
                style={{
                  display: "inline-block",
                  fontFamily,
                  fontSize,
                  color: "transparent",
                  userSelect: "none",
                }}
              >
                {word}
              </span>
            );
          }

          const scale = interpolate(wordSpring, [0, 1], [0.3, 1]);
          const opacity = interpolate(wordSpring, [0, 1], [0, 1]);

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: 600,
                color: isActive ? highlightColor : "#ffffff",
                opacity,
                transform: `scale(${scale})`,
                textShadow: isActive ? `0 0 25px ${highlightColor}` : "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {word}
            </span>
          );
        }

        // 4. FADE (Sinematik Yumuşak Akış)
        if (animStyle === "fade") {
          const fadeOpacity = isFuture
            ? 0.2
            : interpolate(wordSpring, [0, 1], [0.2, 1]);

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: 500,
                color: isActive ? highlightColor : "rgba(255,255,255,0.9)",
                opacity: fadeOpacity,
                textShadow: isActive ? `0 0 20px ${highlightColor}` : "none",
              }}
            >
              {word}
            </span>
          );
        }

        // 5. VIRAL POP (Instagram/TikTok Trend Tekil Parlama & Büyüme)
        if (animStyle === "viral_pop") {
          const popScale = isActive
            ? interpolate(wordSpring, [0, 1], [0.9, 1.25])
            : 1;
          const popColor = isActive ? "#ffffff" : isPast ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)";
          const popBg = isActive ? highlightColor : "transparent";

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: isActive ? 900 : 700,
                color: popColor,
                backgroundColor: popBg,
                padding: isActive ? "2px 14px" : "2px 4px",
                borderRadius: 12,
                transform: `scale(${popScale})`,
                boxShadow: isActive ? `0 8px 30px ${highlightColor}` : "none",
                transition: "all 0.1s ease",
              }}
            >
              {word}
            </span>
          );
        }

        // 6. BOUNCE (Zıplayan / Ritmik Yaylanma)
        if (animStyle === "bounce") {
          const bounceY = isActive ? Math.sin((frame - wordStart) * 0.4) * -14 : 0;
          const scale = isActive ? 1.15 : 1;

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? highlightColor : isPast ? "#ffffff" : "rgba(255,255,255,0.35)",
                transform: `translateY(${bounceY}px) scale(${scale})`,
                textShadow: isActive ? `0 0 25px ${highlightColor}` : "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              {word}
            </span>
          );
        }

        // 7. NEON GLOW (Siber / Cyberpunk Parlayan Işık)
        if (animStyle === "neon") {
          const glowIntensity = isActive
            ? `0 0 10px #ffffff, 0 0 25px ${highlightColor}, 0 0 50px ${highlightColor}`
            : isPast
            ? `0 0 8px rgba(255,255,255,0.3)`
            : "none";

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? "#ffffff" : isPast ? "#e0e0e0" : "rgba(255,255,255,0.25)",
                textShadow: glowIntensity,
                transform: isActive ? "scale(1.12)" : "scale(1)",
              }}
            >
              {word}
            </span>
          );
        }

        // Default Fallback
        return (
          <span
            key={index}
            style={{
              display: "inline-block",
              fontFamily,
              fontSize,
              fontWeight: 600,
              color: isActive ? highlightColor : "#ffffff",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
