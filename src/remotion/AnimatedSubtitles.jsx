import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const AnimatedSubtitles = ({
  text = "",
  fontSize = 54,
  fontFamily = "'DM Sans', sans-serif",
  highlightColor = "#f5c542",
  animStyle = "highlight", // "highlight", "viral_pop", "bounce", "neon", "typewriter", "zoom", "fade"
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Kelimelere ayır
  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords === 0) return null;

  // 1. Genel Cümle Giriş Efekti (Container Entrance):
  // Video açıldığında cümlenin tamamı 0-20. kareler arasında yumuşakça belirir (fade & float).
  // Böylece 1. kelime pat diye belirip titremez, her şey akıcı başlar.
  const containerSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  const containerOpacity = interpolate(containerSpring, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const containerTranslateY = interpolate(containerSpring, [0, 1], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. Zamanlama Hesabı:
  // Cümle 24. karede tam yerleşir, kelime akışı 24. kareden itibaren başlar.
  const startDelay = 24;
  const availableFrames = Math.max(45, durationInFrames - startDelay - 30);
  const framesPerWord = availableFrames / totalWords;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px 14px",
        width: "100%",
        maxWidth: 920,
        padding: "0 24px",
        textAlign: "center",
        lineHeight: 1.45,
        wordBreak: "break-word",
        overflowWrap: "break-word",
        opacity: containerOpacity,
        transform: `translateY(${containerTranslateY}px)`,
      }}
    >
      {words.map((word, index) => {
        const wordStart = startDelay + index * framesPerWord;
        const wordEnd = wordStart + framesPerWord;

        const isPast = frame >= wordEnd;
        const isActive = frame >= wordStart && frame < wordEnd;
        const isFuture = frame < wordStart;

        // Kelime İlerleme Yayı (Tamamen Clamped - Titreme ve negatif sapma imkansız)
        const wordProgress = Math.max(0, frame - wordStart);
        const wordSpring = spring({
          frame: wordProgress,
          fps,
          config: { damping: 18, stiffness: 160, mass: 0.7 },
        });

        // ==========================================
        // 1. HIGHLIGHT (Klasik Altın Karaoke)
        // ==========================================
        if (animStyle === "highlight") {
          const scale = isActive
            ? interpolate(wordSpring, [0, 1], [1, 1.10], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;

          const color = isPast
            ? "#ffffff"
            : isActive
            ? highlightColor
            : "rgba(255, 255, 255, 0.45)";

          const textShadow = isActive
            ? `0 2px 10px rgba(0,0,0,0.95), 0 0 26px ${highlightColor}, 0 0 50px ${highlightColor}aa`
            : "0 2px 10px rgba(0,0,0,0.95), 0 4px 20px rgba(0,0,0,0.85)";

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: isActive ? 800 : 500,
                letterSpacing: "-0.01em",
                color,
                textShadow,
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                willChange: "transform, color",
              }}
            >
              {word}
            </span>
          );
        }

        // ==========================================
        // 2. VIRAL POP (Instagram/Reels Trend Kutulu Vurgu)
        // Sarı/Cyan kutularda siyah yazı, karanlıkta altın kutu ile %100 okunurluk
        // ==========================================
        if (animStyle === "viral_pop") {
          const popScale = isActive
            ? interpolate(wordSpring, [0, 1], [1, 1.14], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;

          const isBrightBg = ["#facc15", "#f5c542", "#fbbf24", "#38bdf8", "#5eead4", "#4ef59a", "#ffffff"].includes(highlightColor);
          const activeTextColor = isBrightBg ? "#08080a" : "#ffffff";

          const popColor = isActive
            ? activeTextColor
            : isPast
            ? "#ffffff"
            : "rgba(255, 255, 255, 0.48)";

          const popBg = isActive ? highlightColor : "transparent";

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: isActive ? 900 : 600,
                color: popColor,
                backgroundColor: popBg,
                padding: "3px 12px",
                borderRadius: 10,
                transform: `scale(${popScale})`,
                transformOrigin: "center center",
                boxShadow: isActive ? `0 6px 28px ${highlightColor}aa, 0 3px 12px rgba(0,0,0,0.9)` : "none",
                textShadow: isActive
                  ? isBrightBg ? "none" : `0 2px 10px rgba(0,0,0,0.95)`
                  : `0 2px 10px rgba(0,0,0,0.95), 0 4px 20px rgba(0,0,0,0.85)`,
                willChange: "transform, background-color",
              }}
            >
              {word}
            </span>
          );
        }

        // ==========================================
        // 3. BOUNCE (Ritmik Yumuşak Zıplama)
        // ==========================================
        if (animStyle === "bounce") {
          const bounceProgress = isActive ? (frame - wordStart) / framesPerWord : 0;
          const bounceY = isActive ? Math.sin(bounceProgress * Math.PI) * -12 : 0;
          const scale = isActive
            ? interpolate(wordSpring, [0, 1], [1, 1.12], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? highlightColor : isPast ? "#ffffff" : "rgba(255,255,255,0.45)",
                transform: `translateY(${bounceY}px) scale(${scale})`,
                transformOrigin: "center center",
                textShadow: isActive
                  ? `0 2px 10px rgba(0,0,0,0.95), 0 0 25px ${highlightColor}`
                  : "0 2px 10px rgba(0,0,0,0.95), 0 4px 20px rgba(0,0,0,0.85)",
              }}
            >
              {word}
            </span>
          );
        }

        // ==========================================
        // 4. NEON GLOW (Siber / Canlı Parıltı)
        // ==========================================
        if (animStyle === "neon") {
          const glowIntensity = isActive
            ? `0 2px 10px rgba(0,0,0,0.95), 0 0 12px #ffffff, 0 0 28px ${highlightColor}, 0 0 55px ${highlightColor}`
            : `0 2px 10px rgba(0,0,0,0.95), 0 4px 18px rgba(0,0,0,0.8)`;

          const scale = isActive
            ? interpolate(wordSpring, [0, 1], [1, 1.1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? "#ffffff" : isPast ? "#ffffff" : "rgba(255,255,255,0.45)",
                textShadow: glowIntensity,
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              {word}
            </span>
          );
        }

        // ==========================================
        // 5. TYPEWRITER (Adım Adım Belirme)
        // ==========================================
        if (animStyle === "typewriter") {
          if (isFuture) {
            // Görünmez ama yer tutar ki satır zıplamasın
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

          const opacity = interpolate(wordSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(wordSpring, [0, 1], [8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

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

        // ==========================================
        // 6. ZOOM (3D Büyüyerek Giriş)
        // ==========================================
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

          const scale = interpolate(wordSpring, [0, 1], [0.35, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const opacity = interpolate(wordSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

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
                transformOrigin: "center center",
                textShadow: isActive ? `0 0 25px ${highlightColor}` : "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {word}
            </span>
          );
        }

        // ==========================================
        // 7. FADE (Sinematik Yumuşak Kararma/Aydınlanma)
        // ==========================================
        if (animStyle === "fade") {
          const fadeOpacity = isFuture
            ? 0.25
            : interpolate(wordSpring, [0, 1], [0.25, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

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

        // Varsayılan Güvenli Fallback
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
