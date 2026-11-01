// scripts/collectPhotos.mjs
// Pixabay'den insansız, dikey tarihi eser fotoğraflarını toplar; fotograflar/adaylar.html sayfasına dizer.
// Çalıştırma: node scripts/collectPhotos.mjs

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = 300;
const PER_QUERY = 40;

// Tek bir görsel dünya: gün ışığında tarihi eserler
const QUERIES = [
  "ancient ruins", "roman columns", "ancient temple", "greek temple", "ancient amphitheater",
  "marble statue", "ancient sculpture", "stone arch ruins", "ephesus", "hagia sophia",
  "ottoman mosque", "blue mosque", "historic castle", "old fortress", "cappadocia",
  "stone bridge old", "ancient city", "colosseum", "acropolis", "historic monument",
];

const PEOPLE_TAGS = /\b(person|people|woman|women|man|men|girl|boy|child|children|kid|couple|tourist|tourists|crowd|portrait|model|human|lady|bride|groom|family|pedestrian|walking|musician|female|male)\b/i;

export const hasPeople = (tags = "") => PEOPLE_TAGS.test(tags);

async function search(query, apiKey) {
  const params = new URLSearchParams({ key: apiKey, q: query, image_type: "photo", orientation: "vertical", safesearch: "true", order: "popular", min_width: "1080", per_page: String(PER_QUERY) });
  const res = await fetch(`https://pixabay.com/api/?${params}`);
  if (!res.ok) throw new Error(`Pixabay hatası (${res.status}): ${query}`);
  return (await res.json()).hits;
}

const escapeHtml = (text = "") => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function renderCard(photo, index) {
  return `<figure><a href="${photo.pageURL}" target="_blank" rel="noopener"><img loading="lazy" src="${photo.webformatURL}" alt="${escapeHtml(photo.tags)}"></a><figcaption>${index + 1}. ${escapeHtml(photo.user)}</figcaption></figure>`;
}

function renderPage(photos) {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mevzu Fotoğraf Adayları</title>
<style>:root{color-scheme:light dark}body{margin:0;padding:24px 16px;font-family:system-ui,sans-serif;background:#f4f1ea;color:#222}@media(prefers-color-scheme:dark){body{background:#151515;color:#eee}}h1{font-size:22px;margin:0 0 16px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}figure{margin:0}img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:8px;display:block}figcaption{font-size:12px;padding:4px 2px}</style>
</head><body><h1>Mevzu fotoğraf adayları (${photos.length})</h1><div class="g">
${photos.map(renderCard).join("\n")}
</div></body></html>
`;
}

async function main() {
  const apiKey = process.env.PIXABAY_KEY;
  if (!apiKey) throw new Error(".env içinde PIXABAY_KEY yok.");

  const found = new Map();
  for (const query of QUERIES) {
    for (const photo of await search(query, apiKey)) {
      if (!hasPeople(photo.tags) && !found.has(photo.id)) found.set(photo.id, { ...photo, query });
    }
    console.log(`${query}: toplam ${found.size}`);
  }

  // Aramalar sırayla karıştırılır; liste tek konuya yığılmaz
  const buckets = QUERIES.map((query) => [...found.values()].filter((photo) => photo.query === query));
  const photos = [];
  while (photos.length < TARGET && buckets.some((bucket) => bucket.length)) {
    for (const bucket of buckets) {
      if (bucket.length && photos.length < TARGET) photos.push(bucket.shift());
    }
  }

  const dir = path.join(rootDir, "fotograflar");
  await fs.mkdir(dir, { recursive: true });
  const records = photos.map((p, i) => ({ no: i + 1, id: p.id, url: p.pageURL, image: p.largeImageURL, photographer: p.user, query: p.query, tags: p.tags }));
  await fs.writeFile(path.join(dir, "adaylar.json"), JSON.stringify(records, null, 2));
  await fs.writeFile(path.join(dir, "adaylar.html"), renderPage(photos));
  console.log(`Bitti: ${photos.length} aday, fotograflar/adaylar.html`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
