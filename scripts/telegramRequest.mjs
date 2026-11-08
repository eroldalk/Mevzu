// Telegram komutundaki "söz | tema" metnini çözer.

const THEME_ALIASES = {
  orman: "forest",
  "gün batımı": "sunset",
  günbatımı: "sunset",
  yağmur: "rain",
  şehir: "sehir_bridge_fog",
  gece: "sehir_rainy_window",
  deniz: "stormy_sea",
};

const capitalize = (text) => (text ? text[0].toLocaleUpperCase("tr-TR") + text.slice(1) : text);

const asciiName = (text = "") => text
  .toLocaleLowerCase("tr-TR")
  .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
  .replace(/\s+/g, " ")
  .trim();

// Ülke ve bölge adları birden çok yapıyı kapsar
const PLACE_GROUPS = {
  turkiye: /ayasofya|sultanahmet|suleymaniye|selimiye|galata|kiz kulesi|efes|bergama|aspendos|side|nemrut|mardin|safranbolu|kapadokya|turkey|istanbul|topkapi|ottoman|pamukkale/,
  italya: /kolezyum|roma forumu|pantheon|pompeii|trevi|pisa|venedik|st peter/,
  yunanistan: /akropolis|atina|delfi|greek/,
  misir: /piramit|sfenks|luxor karnak/,
  avrupa: /eyfel|zafer taki|notre dame|louvre|big ben|stonehenge|sagrada|neuschwanstein|brandenburg|segovia|elhamra|kurtuba/,
  asya: /tac mahal|cin seddi|angkor|semerkant|buhara|petronas/,
  amerika: /ozgurluk|brooklyn|golden gate|kurtarici isa|machu picchu|chichen/,
};

// "kolezyum", "Özgürlük Heykeli", "Türkiye" gibi adları havuzdaki yapılarla eşleştirir
export function findPlacePhotos(pool, name) {
  const wanted = asciiName(name);
  if (!wanted) return [];
  const group = PLACE_GROUPS[wanted];
  if (group) return pool.filter((photo) => group.test(asciiName(photo.place)));
  return pool.filter((photo) => {
    const place = asciiName(photo.place);
    return !place.startsWith("diger:") && (place.includes(wanted) || wanted.includes(place));
  });
}

export function parseRequest(text = "") {
  const [quotePart = "", themePart = ""] = text.split("|").map((part) => part.trim());
  const themeName = themePart.toLocaleLowerCase("tr-TR");
  const theme = THEME_ALIASES[themeName] || null;
  return {
    quote: capitalize(quotePart) || null,
    theme,
    unknownTheme: themeName && !theme ? themePart : null,
  };
}

export const draftButtons = (id) => ({
  inline_keyboard: [
    [{ text: "✅ Yayınla", callback_data: `publish:${id}` }, { text: "📲 Elle paylaştım", callback_data: `manual:${id}` }],
    [{ text: "🔄 Yenile", callback_data: `refresh:${id}` }, { text: "❌ İptal", callback_data: `cancel:${id}` }],
  ],
});
