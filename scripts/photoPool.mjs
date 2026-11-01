// scripts/photoPool.mjs
// Fotoğraf havuzu reponun photo-pool dalındadır; her yayında yalnızca seçilen fotoğraf kullanılır.

const BASE_URL = "https://raw.githubusercontent.com/eroldalk/Mevzu/photo-pool";

export async function loadPool() {
  const res = await fetch(`${BASE_URL}/pool.json`);
  if (!res.ok) throw new Error(`Fotoğraf havuzu okunamadı: ${res.status}`);
  return res.json();
}

export const photoUrl = (photo) => `${BASE_URL}/photos/${photo.file}`;

// usedIds en yeniden eskiye sıralıdır. Havuz bitmeden fotoğraf tekrar etmez, bitince yeni tura geçilir.
export function choosePhoto(pool, usedIds = []) {
  const usedThisRound = new Set(usedIds.slice(0, usedIds.length % pool.length));
  const fresh = pool.filter((photo) => !usedThisRound.has(photo.id));
  return fresh[Math.floor(Math.random() * fresh.length)];
}
