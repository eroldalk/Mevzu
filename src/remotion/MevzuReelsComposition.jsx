import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Audio } from "remotion";
import { CinematicBackground, NATURE_PRESETS } from "./CinematicBackground";
import { AnimatedSubtitles } from "./AnimatedSubtitles";

export const MevzuReelsComposition = ({
  quote = "İnsan bir kamıştır, ama düşünen bir kamıştır.",
  author = "Blaise Pascal",
  category = "FELSEFE",
  primaryColor = "#c9a84c",
  highlightColor = "#f5c542",
  fontFamily = "'DM Sans', sans-serif",
  animStyle = "highlight",
  bgStyle = "ocean", // "ocean", "forest", "sunset", "aurora", "rain", "dark"
  customBgUrl = null,
  musicUrl = null,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentPreset = NATURE_PRESETS[bgStyle] || NATURE_PRESETS.ocean;
  const themeAccent = currentPreset.accent || primaryColor;

  // Logo giriş animasyonu
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoY = interpolate(logoSpring, [0, 1], [-25, 0]);

  // Alt yazar & rozet giriş animasyonu
  const footerSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const footerOpacity = interpolate(footerSpring, [0, 1], [0, 1]);
  const footerY = interpolate(footerSpring, [0, 1], [25, 0]);

  // Ritmik ses dalgası çubukları animasyonu
  const bars = [0, 1, 2, 3, 4].map((i) => {
    const val = Math.sin((frame / 8) * Math.PI + i * 1.2);
    return interpolate(val, [-1, 1], [6, 26]);
  });

  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        backgroundColor: "#08080a",
        fontFamily,
        color: "#ffffff",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Canlı Doğa / Deniz Arka Planı (Drone Ken Burns Hareketiyle) */}
      <CinematicBackground
        primaryColor={themeAccent}
        bgStyle={bgStyle}
        customBgUrl={customBgUrl}
      />

      {/* İsteğe bağlı Fon Müziği */}
      {musicUrl && <Audio src={musicUrl} />}

      {/* 2. ÜST BÖLÜM: #MEVZU Marka Logosu (Safe-Zone: 280px) */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: logoOpacity,
          transform: `translateY(${logoY}px)`,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
          <span
            style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: 10,
              color: "#ffffff",
              textTransform: "uppercase",
              textShadow: `0 0 30px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0,0,0,0.9)`,
            }}
          >
            #MEVZU
          </span>
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 48,
              fontWeight: 700,
              color: themeAccent,
              lineHeight: 0.5,
              opacity: 0.95,
              textShadow: `0 0 20px ${themeAccent}`,
            }}
          >
            ”
          </span>
        </div>

        {/* İnce Çizgi */}
        <div
          style={{
            height: 1.5,
            width: 70,
            background: `linear-gradient(90deg, transparent, ${themeAccent}, transparent)`,
          }}
        />
      </div>

      {/* 3. ORTA BÖLÜM: Alıntı ve Dinamik Altyazı (Doğa Üzerinde Parlayan) */}
      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          maxWidth: 980,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* Dekoratif Arka Plan Tırnak İşareti */}
        <div
          style={{
            position: "absolute",
            top: -95,
            fontFamily: "Georgia, serif",
            fontSize: 230,
            fontWeight: 700,
            color: themeAccent,
            opacity: 0.12,
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
            textShadow: `0 0 60px ${themeAccent}`,
          }}
        >
          “
        </div>

        <AnimatedSubtitles
          text={(quote || "").replace(/\r?\n+/g, " ")}
          fontSize={(() => {
            const cleanText = (quote || "").replace(/\r?\n+/g, " ").trim();
            const len = cleanText.length;
            const words = cleanText.split(/\s+/).filter(Boolean).length;
            const isSerif = fontFamily && (fontFamily.includes("Cinzel") || fontFamily.includes("Playfair"));

            let size = 44;
            if (len > 120 || words > 18) {
              size = 32;
            } else if (len > 85 || words > 13) {
              size = 36;
            } else if (len > 55 || words > 8) {
              size = 40;
            } else if (len > 30 || words > 5) {
              size = 44;
            } else {
              size = 46;
            }

            if (isSerif) {
              size = Math.round(size * 0.92);
            }
            return size;
          })()}
          fontFamily={fontFamily}
          highlightColor={highlightColor || themeAccent}
          animStyle={animStyle}
        />
      </div>

      {/* 4. ALT BÖLÜM: Yazar & Kategori Rozeti (Safe-Zone: 480px - Instagram 1:1 Izgara Uyumlu) */}
      <div
        style={{
          position: "absolute",
          bottom: 480,
          left: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: footerOpacity,
          transform: `translateY(${footerY}px)`,
          zIndex: 10,
        }}
      >
        {/* Ritmik Ses Dalgası */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, height: 28 }}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                width: 3.5,
                height: h,
                borderRadius: 2,
                backgroundColor: themeAccent,
                boxShadow: `0 0 10px ${themeAccent}`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>

        {/* Yazar ve Kategori Satırı */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* Yazar Adı */}
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 3.5,
              color: "#ffffff",
              textTransform: "uppercase",
              textShadow: "0 2px 14px rgba(0,0,0,0.8)",
            }}
          >
            {author}
          </span>

          <span style={{ color: themeAccent, fontSize: 16 }}>✦</span>

          {/* Kategori Rozeti */}
          <div
            style={{
              border: `1px solid ${themeAccent}77`,
              background: "rgba(0, 0, 0, 0.45)",
              padding: "7px 22px",
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 2.5,
              color: themeAccent,
              textTransform: "uppercase",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            {category}
          </div>
        </div>

        {/* Küçük Marka Etiketi */}
        <span
          style={{
            fontSize: 12,
            letterSpacing: 4,
            color: "rgba(255, 255, 255, 0.45)",
            textTransform: "uppercase",
            marginTop: 4,
            textShadow: "0 2px 6px rgba(0,0,0,0.8)",
          }}
        >
          @mevzu
        </span>
      </div>
    </div>
  );
};
