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

export function parseRequest(text = "") {
  const [quotePart = "", themePart = ""] = text.split("|").map((part) => part.trim());
  const themeName = themePart.toLocaleLowerCase("tr-TR");
  const theme = THEME_ALIASES[themeName] || null;
  return {
    quote: quotePart || null,
    theme,
    unknownTheme: themeName && !theme ? themePart : null,
  };
}

export const draftButtons = (id) => ({
  inline_keyboard: [
    [{ text: "✅ Yayınla", callback_data: `publish:${id}` }],
    [{ text: "🔄 Yenile", callback_data: `refresh:${id}` }, { text: "❌ İptal", callback_data: `cancel:${id}` }],
  ],
});
