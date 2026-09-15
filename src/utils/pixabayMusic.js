// src/utils/pixabayMusic.js
// Pixabay Music API entegrasyonu
// Her söz kategorisine uygun müzik otomatik seçilir + videoId üretilir

const PIXABAY_KEY = import.meta.env?.VITE_PIXABAY_KEY || "57607620-a96fd236274d037082c9140ee";
const BASE_URL = "https://pixabay.com/api/music/";

// ¦¦¦ Kategori › Pixabay arama eþlemesi ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
export const CATEGORY_MUSIC_MAP = {
  // Kozmik & Uzay
  "KOZMÝK":      { q: "space ambient meditation",   category: "ambient" },
  "UZAY":        { q: "cosmic deep space",           category: "ambient" },
  "GECE":        { q: "night calm atmospheric",      category: "ambient" },

  // Felsefe & Zihin
  "FELSEFE":     { q: "cinematic emotional piano",   category: "classical" },
  "STOACÝLIK":   { q: "ancient epic orchestral",     category: "classical" },
  "ZÝHÝN":       { q: "meditation focus calm",       category: "ambient"  },
  "PSÝKOLOJÝ":   { q: "calm peaceful meditation",    category: "ambient"  },
  "BÝLGELÝK":    { q: "piano emotional cinematic",   category: "classical"},

  // Motivasyon & Güç
  "MOTÝVASYON":  { q: "uplifting powerful motivational", category: "electronic" },
  "GÜÇ":         { q: "epic powerful dramatic",      category: "classical" },
  "DÝRENÇ":      { q: "powerful inspiring",          category: "rock"      },
  "BAÞARI":      { q: "victory triumph uplifting",   category: "electronic"},

  // Doða
  "DOÐA":        { q: "nature peaceful forest",      category: "ambient"  },
  "SU":          { q: "ocean waves relaxing",        category: "ambient"  },
  "DENÝZ":       { q: "ocean sea waves calm",        category: "ambient"  },

  // Ekonomi & Finans
  "EKONOMÝ":     { q: "corporate professional",      category: "electronic"},
  "FÝNANS":      { q: "business corporate modern",   category: "electronic"},

  // Spor
  "SPOR":        { q: "energetic sport training",    category: "rock"     },

  // Sanat & Kültür
  "SANAT":       { q: "artistic creative jazz",      category: "jazz"     },
  "KÜLTÜR":      { q: "world culture instrumental",  category: "classical"},
  "EDEBÝYAT":    { q: "cinematic storytelling",      category: "classical"},

  // Þehir & Gece
  "ÞEHÝR":       { q: "lofi city night",             category: "hip-hop"  },
  "GECE HAYATI": { q: "night jazz lounge",           category: "jazz"     },

  // Varsayýlan
  "DEFAULT":     { q: "cinematic ambient beautiful", category: "ambient"  },
};

// ¦¦¦ Pixabay'den müzik çek ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
export async function fetchPixabayMusic({ q, category, perPage = 15 }) {
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q,
    category,
    per_page: perPage,
    order: "popular",
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Pixabay API hatasý: ${res.status}`);
  const data = await res.json();
  return data.hits || [];
}

// ¦¦¦ Kategoriye göre rastgele müzik seç ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
export async function getMusicForCategory(categoryStr = "") {
  const catUpper = (categoryStr || "").toUpperCase();

  // En iyi eþleþen kategori anahtarýný bul
  const matchedKey = Object.keys(CATEGORY_MUSIC_MAP).find((k) =>
    catUpper.includes(k)
  ) || "DEFAULT";

  const { q, category } = CATEGORY_MUSIC_MAP[matchedKey];

  try {
    const tracks = await fetchPixabayMusic({ q, category });
    if (!tracks.length) throw new Error("Parça bulunamadý");

    // Rastgele bir parça seç
    const track = tracks[Math.floor(Math.random() * tracks.length)];

    return {
      musicId:   `pixabay_${track.id}`,
      musicName: track.title || q,
      musicUrl:  track.audio?.["128"] || track.audio?.["32"] || track.url || null,
      genre:     category,
      source:    "pixabay",
    };
  } catch (err) {
    console.warn("Pixabay müzik alýnamadý, Mixkit fallback:", err.message);
    // Fallback: Mixkit yedek listesi
    return MIXKIT_FALLBACK[matchedKey] || MIXKIT_FALLBACK.DEFAULT;
  }
}

// ¦¦¦ Mixkit Yedek (Pixabay çalýþmazsa) ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
const MIXKIT_FALLBACK = {
  "KOZMÝK":    { musicId: "mixkit_134",  musicUrl: "https://assets.mixkit.co/music/134/134.mp3", genre: "ambient",    source: "mixkit" },
  "FELSEFE":   { musicId: "mixkit_587",  musicUrl: "https://assets.mixkit.co/music/587/587.mp3", genre: "cinematic",  source: "mixkit" },
  "MOTÝVASYON":{ musicId: "mixkit_32",   musicUrl: "https://assets.mixkit.co/music/32/32.mp3",   genre: "motivation", source: "mixkit" },
  "DOÐA":      { musicId: "mixkit_443",  musicUrl: "https://assets.mixkit.co/music/443/443.mp3", genre: "nature",     source: "mixkit" },
  "DEFAULT":   { musicId: "mixkit_587",  musicUrl: "https://assets.mixkit.co/music/587/587.mp3", genre: "cinematic",  source: "mixkit" },
};

// ¦¦¦ Video ID üretici ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
export function generateVideoId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");   // 20260915
  const time = now.toTimeString().slice(0, 5).replace(":", "");    // 2247
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase(); // A3F7
  return `reel_${date}_${time}_${rand}`;
}
