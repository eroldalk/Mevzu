// scripts/weeklyReport.mjs
// Son 7 günün gönderilerini izlenme ve paylaşıma göre karşılaştırır, Telegram'a gönderir.

import { pathToFileURL } from "node:url";
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { sendTelegramMessage } from "./telegramNotify.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";
const METRICS = "views,shares,saved,reach";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const value = (data, name) => data.find((m) => m.name === name)?.values?.[0]?.value || 0;

export async function fetchInsights(mediaId) {
  const url = `${GRAPH}/${mediaId}/insights?metric=${METRICS}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`;
  const json = await (await fetch(url)).json();
  if (json.error) throw new Error(json.error.message);
  return { views: value(json.data, "views"), shares: value(json.data, "shares"), saved: value(json.data, "saved"), reach: value(json.data, "reach") };
}

function bestBy(items, key) {
  const groups = {};
  for (const item of items) {
    const name = item[key] || "bilinmiyor";
    groups[name] ||= { name, views: 0, shares: 0, count: 0 };
    groups[name].views += item.views;
    groups[name].shares += item.shares;
    groups[name].count += 1;
  }
  const ranked = Object.values(groups).sort((a, b) => b.views / b.count - a.views / a.count);
  return ranked[0];
}

const line = (label, best) =>
  best ? `${label}: ${best.name} (ort. ${Math.round(best.views / best.count)} izlenme, ${best.shares} paylaşım)` : `${label}: veri yok`;

export function buildReport(items) {
  if (!items.length) return "📊 Haftalık Mevzu raporu\n\nBu hafta ölçülecek gönderi bulunamadı.";
  const totalViews = items.reduce((sum, item) => sum + item.views, 0);
  const totalShares = items.reduce((sum, item) => sum + item.shares, 0);
  const totalSaved = items.reduce((sum, item) => sum + item.saved, 0);
  const top = [...items].sort((a, b) => b.views - a.views)[0];
  return [
    "📊 Haftalık Mevzu raporu",
    "",
    `Gönderi: ${items.length}`,
    `Toplam: ${totalViews} izlenme, ${totalShares} paylaşım, ${totalSaved} kaydetme`,
    "",
    line("En iyi tema", bestBy(items, "bgId")),
    line("En iyi saat", bestBy(items, "slotId")),
    line("En iyi biçim", bestBy(items, "format")),
    "",
    `En iyi söz (${top.views} izlenme):`,
    top.quote,
  ].join("\n");
}

async function main() {
  const db = getFirestore(initializeApp({ apiKey: "AIzaSyBSpkgsgmaQxStwbXT_Ne3kW98BjJjaNHI", authDomain: "mevzuv1.firebaseapp.com", projectId: "mevzuv1" }));
  const snap = await getDocs(query(collection(db, "videos"), where("published", "==", true)));
  const since = Date.now() - WEEK_MS;
  const recent = snap.docs.map((d) => d.data()).filter((v) => v.format !== "story" && new Date(v.publishedAt || v.renderedAt).getTime() >= since);

  const items = [];
  try {
    for (const video of recent) {
      items.push({ ...video, format: video.format || "reels", ...(await fetchInsights(video.instagramId)) });
    }
  } catch (err) {
    await sendTelegramMessage(`⚠️ Haftalık rapor alınamadı: ${err.message}`);
    throw err;
  }
  await sendTelegramMessage(buildReport(items));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
