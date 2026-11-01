// scripts/downloadPhotos.mjs
// fotograflar/secilen.json listesindeki fotoğrafları fotograflar/havuz klasörüne indirir.
// Çalıştırma: node scripts/downloadPhotos.mjs

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(rootDir, "fotograflar", "havuz");
const listPath = path.join(rootDir, "fotograflar", "secilen.json");
const CONCURRENCY = 4;

const fileNameFor = (photo) => `${String(photo.no).padStart(3, "0")}_${photo.id}.jpg`;

// Liste eskidiyse Pixabay yeni bir görsel adresi verir
async function freshImageUrl(id) {
  const params = new URLSearchParams({ key: process.env.PIXABAY_KEY, id: String(id) });
  const res = await fetch(`https://pixabay.com/api/?${params}`);
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  return (await res.json()).hits[0].largeImageURL;
}

async function fetchImage(url) {
  const res = await fetch(url);
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function download(photo) {
  const target = path.join(dir, fileNameFor(photo));
  const existing = await fs.stat(target).catch(() => null);
  if (existing?.size > 0) return existing.size;

  const buffer = (await fetchImage(photo.image)) || (await fetchImage(await freshImageUrl(photo.id)));
  if (!buffer) throw new Error("görsel alınamadı");
  await fs.writeFile(target, buffer);
  return buffer.length;
}

async function main() {
  await fs.mkdir(dir, { recursive: true });
  const photos = JSON.parse(await fs.readFile(listPath, "utf8"));
  const queue = [...photos];
  const failed = [];
  let totalBytes = 0;
  let done = 0;

  async function worker() {
    for (let photo = queue.shift(); photo; photo = queue.shift()) {
      try {
        const size = await download(photo);
        totalBytes += size;
        done += 1;
      } catch (err) {
        failed.push(`${photo.no}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`İndirilen: ${done}/${photos.length}, toplam ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
  if (failed.length) console.log(`Başarısız: ${failed.join(", ")}`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
