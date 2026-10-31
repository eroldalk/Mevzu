// Söz uzunluğuna göre video süresi: en az 5, en fazla 9 saniye.

export const REEL_FPS = 30;
export const MIN_SECONDS = 5;
export const MAX_SECONDS = 9;
const WORDS_PER_SECOND = 2.8;
const BUFFER_SECONDS = 3;

export function getReelSeconds(quote = "") {
  const words = quote.trim().split(/\s+/).filter(Boolean).length;
  const seconds = words / WORDS_PER_SECOND + BUFFER_SECONDS;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(seconds * 2) / 2));
}

export const getReelFrames = (quote = "") => Math.round(getReelSeconds(quote) * REEL_FPS);
