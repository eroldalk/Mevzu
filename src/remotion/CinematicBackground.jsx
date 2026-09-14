import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Img, Video } from "remotion";

export const NATURE_PRESETS = {
  // ── 🌊 Doğa & Su ───────────────────────────────────
  ocean: {
    id: "ocean",
    name: "🌊 Turkuaz Okyanus",
    cat: "Doğa & Su",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1080&q=80",
    accent: "#38bdf8",
    overlay: "rgba(8, 22, 38, 0.44)",
  },
  stormy_sea: {
    id: "stormy_sea",
    name: "🌪️ Fırtınalı Gece Denizi",
    cat: "Doğa & Su",
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=80",
    accent: "#67e8f9",
    overlay: "rgba(6, 12, 22, 0.52)",
  },
  forest: {
    id: "forest",
    name: "🌲 Sisli Çam Ormanı",
    cat: "Doğa & Su",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=80",
    accent: "#4ef59a",
    overlay: "rgba(10, 24, 15, 0.46)",
  },
  waterfall: {
    id: "waterfall",
    name: "🏞️ Dağ Şelalesi",
    cat: "Doğa & Su",
    url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1080&q=80",
    accent: "#5eead4",
    overlay: "rgba(8, 20, 20, 0.46)",
  },
  rain: {
    id: "rain",
    name: "🌧️ Yağmur Damlaları",
    cat: "Doğa & Su",
    url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1080&q=80",
    accent: "#60a5fa",
    overlay: "rgba(10, 16, 26, 0.52)",
  },

  // ── 🔥 Element & Manzara ─────────────────────
  campfire: {
    id: "campfire",
    name: "🔥 Gece Kamp Ateşi",
    cat: "Element & Doğa",
    url: "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1080&q=80",
    accent: "#fb923c",
    overlay: "rgba(24, 12, 6, 0.45)",
  },
  sunset: {
    id: "sunset",
    name: "🏔️ Altın Gün Batımı & Dağ",
    cat: "Element & Doğa",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80",
    accent: "#f59e0b",
    overlay: "rgba(28, 14, 8, 0.44)",
  },
  desert: {
    id: "desert",
    name: "🏜️ Sonsuz Çöl Kumları",
    cat: "Element & Doğa",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80",
    accent: "#fbbf24",
    overlay: "rgba(24, 16, 8, 0.45)",
  },
  lightning: {
    id: "lightning",
    name: "⛈️ Şimşekli Fırtına",
    cat: "Element & Doğa",
    url: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1080&q=80",
    accent: "#93c5fd",
    overlay: "rgba(8, 10, 24, 0.54)",
  },

  // ── 🏛️ Antik Felsefe & Kültür ─────────────────────
  statue: {
    id: "statue",
    name: "🏛️ Antik Mermer Heykel",
    cat: "Felsefe & Kültür",
    url: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1080&q=80",
    accent: "#e2e8f0",
    overlay: "rgba(10, 10, 12, 0.52)",
  },
  library: {
    id: "library",
    name: "📚 Kadim Kütüphane",
    cat: "Felsefe & Kültür",
    url: "https://images.unsplash.com/photo-1507842229450-7740e53696c5?auto=format&fit=crop&w=1080&q=80",
    accent: "#d97706",
    overlay: "rgba(20, 12, 6, 0.52)",
  },

  // ── 🏙️ Sinematik Gece Şehri ────────────────────────
  neon_city: {
    id: "neon_city",
    name: "🏙️ Yağmurlu Gece Şehri",
    cat: "Şehir & Gece",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1080&q=80",
    accent: "#f43f5e",
    overlay: "rgba(14, 8, 20, 0.50)",
  },
  highway: {
    id: "highway",
    name: "🏎️ Gece Otoyol Sürüşü",
    cat: "Şehir & Gece",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=80",
    accent: "#38bdf8",
    overlay: "rgba(6, 12, 22, 0.48)",
  },

  // ── 🌕 Kozmik & Uzay ──────────────────────────────
  moon: {
    id: "moon",
    name: "🌕 Gece Dolunayı",
    cat: "Kozmik & Uzay",
    url: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=1080&q=80",
    accent: "#f8fafc",
    overlay: "rgba(8, 10, 16, 0.50)",
  },
  aurora: {
    id: "aurora",
    name: "🌌 Kuzey Işıkları",
    cat: "Kozmik & Uzay",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1080&q=80",
    accent: "#c084fc",
    overlay: "rgba(12, 8, 24, 0.44)",
  },
  galaxy: {
    id: "galaxy",
    name: "🪐 Yıldızlararası Galaksi",
    cat: "Kozmik & Uzay",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80",
    accent: "#818cf8",
    overlay: "rgba(6, 8, 20, 0.48)",
  },

  // ── 🖤 Minimalist ──────────────────────────────────
  dark: {
    id: "dark",
    name: "🖤 Mat Siyah & Altın",
    cat: "Minimalist",
    url: null,
    accent: "#f5c542",
    overlay: "rgba(0, 0, 0, 0.8)",
  },
};

export const CinematicBackground = ({
  primaryColor = "#c9a84c",
  bgStyle = "ocean",
  customBgUrl = null,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const preset = NATURE_PRESETS[bgStyle] || NATURE_PRESETS.ocean;
  const bgMedia = customBgUrl || preset.url;
  const accentColor = preset.accent || primaryColor;

  // Medyanın video olup olmadığını algıla
  const isVideo =
    typeof bgMedia === "string" &&
    (bgMedia.startsWith("blob:") ||
      bgMedia.startsWith("data:video") ||
      /\.(mp4|webm|mov)(\?.*)?$/i.test(bgMedia));

  // Drone / Sinematik Kamera Hareketi (Görseller için Ken Burns)
  const scale = isVideo
    ? 1
    : interpolate(frame, [0, durationInFrames], [1, 1.13]);
  const translateY = isVideo
    ? 0
    : interpolate(frame, [0, durationInFrames], [0, -38]);

  // Sabit atmosfer parçacıkları
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
      {/* 1. Canlı Video veya Görsel Katmanı */}
      {bgMedia ? (
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
            <Img
              src={bgMedia}
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

      {/* 2. Sinematik Karartma & Renk Filtresi */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.68) 0%, ${preset.overlay || "rgba(0,0,0,0.48)"} 45%, rgba(0,0,0,0.78) 100%)`,
        }}
      />

      {/* 3. Atmosferik Işık Aurası */}
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

      {/* 4. Süzülen Parçacıklar */}
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

      {/* 5. Sinematik Kenar Karartması */}
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
