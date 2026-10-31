import { NATURE_PRESETS } from "../remotion/naturePresets.js";
import { VERIFIED_MIXKIT_TRACKS } from "./mixkitLibrary.js";

// Adlar ve sakin atmosfer etiketi kaynak kataloğundan kontrol edildi.
// https://mixkit.co/free-stock-music/mood/serene/
export const HARMONY_TRACKS = [
  { id: "mixkit_19", name: "Special Days", genre: "Classical", url: "https://assets.mixkit.co/music/19/19.mp3" },
  { id: "mixkit_710", name: "Classical 3", genre: "Film Score", url: "https://assets.mixkit.co/music/710/710.mp3" },
  { id: "mixkit_709", name: "Classical 2", genre: "Film Score", url: "https://assets.mixkit.co/music/709/709.mp3" },
  { id: "mixkit_542", name: "A Love Theme", genre: "Film Score", url: "https://assets.mixkit.co/music/542/542.mp3" },
];

// Otomatik seçime giren temalar: koyu, atmosferik fotoğraflar.
// Diğer temalar stüdyoda elle seçilebilir.
export const AUTO_THEMES = ["forest", "sunset", "rain", "sehir_bridge_fog", "sehir_rainy_window", "stormy_sea"];

// Duygu, kütüphanedeki tür etiketlerine göre gruplanır.
const MOOD_GENRES = {
  sakin: ["Ambient", "Chillout"],
  hüzünlü: ["Piyano"],
  umutlu: ["Kozmik", "Chillout"],
  güçlü: ["Motivasyon", "Dramatik"],
};

const MOOD_PATTERNS = [
  ["hüzünlü", /özle|hasret|kırgın|kırıl|gözyaş|yalnız|ayrılık|hüzün|kaybet|veda/],
  ["güçlü", /savaş|zafer|mücadele|direnç|vazgeçme|ayağa|fırtına|güçlü/],
  ["umutlu", /umut|hayır|sabır|sabret|geçer|yarın|güneş|dua|inan/],
];

const normalize = (value) => String(value || "").toLocaleLowerCase("tr-TR");

export function getQuoteMood(quote = "") {
  const text = normalize(quote);
  return MOOD_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] || "sakin";
}

const tracksForMood = (mood) => VERIFIED_MIXKIT_TRACKS.filter((track) => MOOD_GENRES[mood].includes(track.genre));

export function getHarmonyProfile(quote = "", category = "") {
  const text = normalize(quote);
  const mood = getQuoteMood(quote);
  const tracks = tracksForMood(mood);
  // Sözün somut konusu, geniş kategori etiketinden önce gelir.
  if (/topra|tohum|ekin|ekersen|biçer|orman|ağaç|çiçek/.test(text)) {
    return { themes: ["forest"], tracks, mood };
  }
  if (/deniz|okyanus|dalga|liman/.test(text)) {
    return { themes: ["ocean", "stormy_sea"], tracks, mood };
  }
  return { themes: AUTO_THEMES, tracks, mood };
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
    bgStyle, track, mood: profile.mood, primaryColor: preset.accent,
    highlightColor: preset.contrastAccent || "#f5c542",
    fontFamily: "'Playfair Display', serif", animStyle: "instant",
  };
}
