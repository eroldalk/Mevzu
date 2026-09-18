import React, { useMemo, useState } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Video } from "remotion";

export const NATURE_PRESETS = {
  "ocean": {
    "id": "ocean",
    "name": "🌊 Turkuaz Okyanus",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 22, 38, 0.52)"
  },
  "stormy_sea": {
    "id": "stormy_sea",
    "name": "🌪️ Fırtınalı Gece Denizi",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#67e8f9",
    "contrastAccent": "#facc15",
    "overlay": "rgba(6, 12, 22, 0.58)"
  },
  "forest": {
    "id": "forest",
    "name": "🌲 Sisli Çam Ormanı",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#4ef59a",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 24, 15, 0.52)"
  },
  "waterfall": {
    "id": "waterfall",
    "name": "🏞️ Dağ Şelalesi",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1080&q=80",
    "accent": "#5eead4",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(8, 20, 20, 0.52)"
  },
  "rain": {
    "id": "rain",
    "name": "🌧️ Yağmur Damlaları",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1080&q=80",
    "accent": "#60a5fa",
    "contrastAccent": "#facc15",
    "overlay": "rgba(10, 16, 26, 0.58)"
  },
  "campfire": {
    "id": "campfire",
    "name": "🔥 Gece Kamp Ateşi",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1080&q=80",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(24, 12, 6, 0.54)"
  },
  "sunset": {
    "id": "sunset",
    "name": "🏔️ Altın Gün Batımı & Dağ",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(28, 14, 8, 0.54)"
  },
  "desert": {
    "id": "desert",
    "name": "🏜️ Sonsuz Çöl Kumları",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80",
    "accent": "#fbbf24",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(24, 16, 8, 0.54)"
  },
  "lightning": {
    "id": "lightning",
    "name": "⛈️ Şimşekli Fırtına",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1080&q=80",
    "accent": "#93c5fd",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 10, 24, 0.60)"
  },
  "statue": {
    "id": "statue",
    "name": "🏛️ Antik Mermer Heykel",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1080&q=80",
    "accent": "#e2e8f0",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 10, 12, 0.58)"
  },
  "library": {
    "id": "library",
    "name": "📚 Kadim Kütüphane",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1507842229450-7740e53696c5?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(20, 12, 6, 0.58)"
  },
  "neon_city": {
    "id": "neon_city",
    "name": "🏙️ Yağmurlu Gece Şehri",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f43f5e",
    "contrastAccent": "#facc15",
    "overlay": "rgba(14, 8, 20, 0.56)"
  },
  "highway": {
    "id": "highway",
    "name": "🏎️ Gece Otoyol Sürüşü",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(6, 12, 22, 0.56)"
  },
  "moon": {
    "id": "moon",
    "name": "🌕 Gece Dolunayı",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f8fafc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 10, 16, 0.56)"
  },
  "aurora": {
    "id": "aurora",
    "name": "🌌 Kuzey Işıkları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1080&q=80",
    "accent": "#c084fc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(12, 8, 24, 0.52)"
  },
  "galaxy": {
    "id": "galaxy",
    "name": "🪐 Yıldızlararası Galaksi",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80",
    "accent": "#818cf8",
    "contrastAccent": "#facc15",
    "overlay": "rgba(6, 8, 20, 0.54)"
  },
  "dark": {
    "id": "dark",
    "name": "🖤 Mat Siyah & Altın",
    "cat": "Minimalist",
    "url": null,
    "accent": "#f5c542",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(0, 0, 0, 0.85)"
  },


  "felsefe_colosseum": {
    "id": "felsefe_colosseum",
    "name": "🏛️ Antik Roma Kolezyumu",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(18, 12, 8, 0.58)"
  },
  "felsefe_columns": {
    "id": "felsefe_columns",
    "name": "🏛️ Akropolis Mermer Sütunlar",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1080&q=80",
    "accent": "#e2e8f0",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(14, 14, 18, 0.56)"
  },
  "felsefe_bust": {
    "id": "felsefe_bust",
    "name": "🗿 Stoacı Filozof Büstü",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1080&q=80",
    "accent": "#cbd5e1",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 10, 14, 0.60)"
  },
  "felsefe_art": {
    "id": "felsefe_art",
    "name": "🎨 Klasik Rönesans Sanatı",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=80",
    "accent": "#b45309",
    "contrastAccent": "#fde047",
    "overlay": "rgba(16, 10, 6, 0.58)"
  },
  "felsefe_lib_wood": {
    "id": "felsefe_lib_wood",
    "name": "📖 Kadim Ahşap Kütüphane",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#facc15",
    "overlay": "rgba(20, 12, 6, 0.58)"
  },
  "felsefe_parchment": {
    "id": "felsefe_parchment",
    "name": "📜 Açık Antik Parşömen",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(16, 12, 8, 0.56)"
  },
  "felsefe_dark_statue": {
    "id": "felsefe_dark_statue",
    "name": "🌑 Gölgedeki Heykel",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1608371945786-d47d3cdd31da?auto=format&fit=crop&w=1080&q=80",
    "accent": "#94a3b8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 8, 12, 0.62)"
  },
  "felsefe_ruins": {
    "id": "felsefe_ruins",
    "name": "🏛️ Gün Batımı Antik Harabeler",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(18, 12, 8, 0.56)"
  },
  "felsefe_leather_books": {
    "id": "felsefe_leather_books",
    "name": "📚 Deri Ciltli Bilgelik Kitapları",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(22, 14, 8, 0.58)"
  },
  "felsefe_grand_lib": {
    "id": "felsefe_grand_lib",
    "name": "🏛️ Sonsuz Kütüphane Kubbesi",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1080&q=80",
    "accent": "#b45309",
    "contrastAccent": "#facc15",
    "overlay": "rgba(18, 10, 6, 0.58)"
  },
  "felsefe_museum": {
    "id": "felsefe_museum",
    "name": "🏛️ Kadim Müze Galerisi",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1533158307587-828f0a76ef46?auto=format&fit=crop&w=1080&q=80",
    "accent": "#e2e8f0",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(12, 12, 16, 0.56)"
  },
  "felsefe_time": {
    "id": "felsefe_time",
    "name": "⏳ Zaman & Felsefe",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(16, 12, 8, 0.58)"
  },

  // ── 🪐 Kozmik & Uzay (Dengelenmiş Yeni Koleksiyon) ──
  "kozmik_nebula": {
    "id": "kozmik_nebula",
    "name": "🌌 Derin Uzay Nebulası",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1080&q=80",
    "accent": "#c084fc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(10, 6, 20, 0.54)"
  },
  "kozmik_violet_galaxy": {
    "id": "kozmik_violet_galaxy",
    "name": "🪐 Mor Galaksi & Yıldız Tozu",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1080&q=80",
    "accent": "#a855f7",
    "contrastAccent": "#facc15",
    "overlay": "rgba(12, 6, 24, 0.54)"
  },
  "kozmik_night_stars": {
    "id": "kozmik_night_stars",
    "name": "✨ Kristal Gece Yıldızları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80",
    "accent": "#60a5fa",
    "contrastAccent": "#facc15",
    "overlay": "rgba(6, 10, 22, 0.56)"
  },
  "kozmik_orion": {
    "id": "kozmik_orion",
    "name": "🛸 Orion Gaz Bulutu",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1080&q=80",
    "accent": "#818cf8",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 6, 20, 0.54)"
  },
  "kozmik_mountain_milkyway": {
    "id": "kozmik_mountain_milkyway",
    "name": "🏔️ Dağ Zirvesinde Samanyolu",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(6, 12, 22, 0.56)"
  },
  "kozmik_deep_void": {
    "id": "kozmik_deep_void",
    "name": "🌑 Sonsuz Kozmik Boşluk",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=1080&q=80",
    "accent": "#6366f1",
    "contrastAccent": "#facc15",
    "overlay": "rgba(4, 6, 16, 0.58)"
  },
  "kozmik_earth_orbit": {
    "id": "kozmik_earth_orbit",
    "name": "🌍 Gece Dünya Yörüngesi",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(4, 8, 20, 0.55)"
  },
  "kozmik_desert_sky": {
    "id": "kozmik_desert_sky",
    "name": "🏜️ Çölde Gece Yıldızları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(10, 8, 20, 0.56)"
  },
  "kozmik_mars": {
    "id": "kozmik_mars",
    "name": "🔴 Kızıl Gezegen Ufku",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f97316",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(20, 8, 6, 0.56)"
  },
  "kozmik_cosmic_light": {
    "id": "kozmik_cosmic_light",
    "name": "✨ Kozmik Işık Işıkları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1080&q=80",
    "accent": "#a855f7",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 6, 18, 0.58)"
  },

  // ── 🏙️ Şehir & Gece (Dengelenmiş Yeni Koleksiyon) ──
  "sehir_neon_rain": {
    "id": "sehir_neon_rain",
    "name": "🌧️ Neon Yağmurlu Şehir",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f43f5e",
    "contrastAccent": "#facc15",
    "overlay": "rgba(14, 6, 20, 0.56)"
  },
  "sehir_tokyo": {
    "id": "sehir_tokyo",
    "name": "🏮 Tokyo Gece Caddesi",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1080&q=80",
    "accent": "#06b6d4",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 12, 24, 0.56)"
  },
  "sehir_manhattan": {
    "id": "sehir_manhattan",
    "name": "🏙️ Manhattan Gece Silüeti",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(10, 12, 20, 0.58)"
  },
  "sehir_cyberpunk": {
    "id": "sehir_cyberpunk",
    "name": "⚡ Gece Siber Sokak",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80",
    "accent": "#ec4899",
    "contrastAccent": "#facc15",
    "overlay": "rgba(16, 6, 22, 0.56)"
  },
  "sehir_shibuya": {
    "id": "sehir_shibuya",
    "name": "🚶 Shibuya Gece Akışı",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 12, 24, 0.56)"
  },
  "sehir_bridge_fog": {
    "id": "sehir_bridge_fog",
    "name": "🌉 Sisli Gece Köprüsü",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(12, 10, 16, 0.56)"
  },
  "sehir_rainy_window": {
    "id": "sehir_rainy_window",
    "name": "🪟 Yağmurlu Pencereden Şehir",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1080&q=80",
    "accent": "#60a5fa",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 10, 22, 0.58)"
  },
  "sehir_highway_curves": {
    "id": "sehir_highway_curves",
    "name": "🏎️ Gece Otoyol Işıkları",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&w=1080&q=80",
    "accent": "#ef4444",
    "contrastAccent": "#facc15",
    "overlay": "rgba(14, 8, 16, 0.56)"
  },

  // ── 🖤 Minimalist (Dengelenmiş Yeni Koleksiyon) ──
  "minimal_black_gold": {
    "id": "minimal_black_gold",
    "name": "🖤 Mat Siyah & Altın Damar",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f5c542",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(0, 0, 0, 0.70)"
  },
  "minimal_dark_waves": {
    "id": "minimal_dark_waves",
    "name": "🖤 Koyu Akışkan Dalgalar",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80",
    "accent": "#94a3b8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(0, 0, 0, 0.68)"
  },
  "minimal_dark_tech": {
    "id": "minimal_dark_tech",
    "name": "🖤 Karanlık Geometrik Doku",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80",
    "accent": "#64748b",
    "contrastAccent": "#facc15",
    "overlay": "rgba(0, 0, 0, 0.72)"
  },
  "minimal_dark_gradient": {
    "id": "minimal_dark_gradient",
    "name": "🖤 Sinematik Odak Işığı",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1080&q=80",
    "accent": "#c084fc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(0, 0, 0, 0.65)"
  }
};

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
          background: `linear-gradient(180deg, rgba(0,0,0,0.68) 0%, ${preset.overlay || "rgba(0,0,0,0.48)"} 45%, rgba(0,0,0,0.78) 100%)`,
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
