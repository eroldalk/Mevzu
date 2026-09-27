import { NATURE_PRESETS } from "../remotion/naturePresets.js";

// Adlar ve sakin atmosfer etiketi kaynak kataloğundan kontrol edildi.
// https://mixkit.co/free-stock-music/mood/serene/
export const HARMONY_TRACKS = [
  { id: "mixkit_19", name: "Special Days", genre: "Classical", url: "https://assets.mixkit.co/music/19/19.mp3" },
  { id: "mixkit_710", name: "Classical 3", genre: "Film Score", url: "https://assets.mixkit.co/music/710/710.mp3" },
  { id: "mixkit_709", name: "Classical 2", genre: "Film Score", url: "https://assets.mixkit.co/music/709/709.mp3" },
  { id: "mixkit_542", name: "A Love Theme", genre: "Film Score", url: "https://assets.mixkit.co/music/542/542.mp3" },
];

const normalize = (value) => String(value || "").toLocaleLowerCase("tr-TR");

export function getHarmonyProfile(quote = "", category = "") {
  const text = normalize(quote);
  const cat = normalize(category);
  // Sözün somut konusu, geniş kategori etiketinden önce gelir.
  if (/topra|tohum|ekin|ekersen|biçer|orman|ağaç|çiçek/.test(text)) {
    return { themes: ["forest"], tracks: HARMONY_TRACKS.slice(0, 3) };
  }
  if (/deniz|okyanus|dalga|liman/.test(text)) {
    return { themes: ["ocean", "stormy_sea"], tracks: HARMONY_TRACKS.slice(0, 3) };
  }
  const target = /doğa|huzur|su/.test(cat) ? "Doğa & Su"
    : /kozmik|uzay/.test(cat) ? "Kozmik & Uzay"
    : /gece|şehir/.test(cat) ? "Şehir & Gece"
    : /motivasyon|güç|spor/.test(cat) ? "Element & Doğa"
    : "Minimalist";
  const themes = Object.keys(NATURE_PRESETS).filter((id) => NATURE_PRESETS[id].cat === target);
  return {
    themes: themes.length ? themes : ["forest"],
    tracks: /aşk|sevgi|özlem/.test(cat + " " + text) ? [HARMONY_TRACKS[3]] : HARMONY_TRACKS.slice(0, 3),
  };
}

export function pickHarmonyItem(items, recent = [], key = (item) => item) {
  const fresh = items.filter((item) => !recent.includes(key(item)));
  const pool = fresh.length ? fresh : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function createReelHarmony(quote, category, recentThemes = [], recentMusic = []) {
  const profile = getHarmonyProfile(quote, category);
  const bgStyle = pickHarmonyItem(profile.themes, recentThemes);
  const preset = NATURE_PRESETS[bgStyle];
  const track = pickHarmonyItem(profile.tracks, recentMusic, (item) => item.url);
  return {
    bgStyle, track, primaryColor: preset.accent,
    highlightColor: preset.contrastAccent || "#f5c542",
    fontFamily: "'Playfair Display', serif", animStyle: "highlight",
  };
}
