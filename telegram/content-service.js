import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps } from "firebase/app";
import { collection, doc, getDocs, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { generateInstagramCaption } from "../scripts/generateCaption.mjs";
import { createReelHarmony } from "../src/utils/reelHarmony.js";
import { getItem, readState, saveItem } from "./store.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const firebaseConfig = { apiKey: "AIzaSyBSpkgsgmaQxStwbXT_Ne3kW98BjJjaNHI", authDomain: "mevzuv1.firebaseapp.com", projectId: "mevzuv1", storageBucket: "mevzuv1.firebasestorage.app" };
const app = getApps().find((x) => x.name === "mevzu-telegram") || initializeApp(firebaseConfig, "mevzu-telegram");
const db = getFirestore(app);
let bundlePromise;

function createId() {
  const stamp = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()).replace(/[-: ]/g, "");
  return `tg_${stamp}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
async function selectQuote({ sameQuoteId } = {}) {
  if (sameQuoteId) {
    const previous = await getItem(sameQuoteId);
    if (!previous) throw new Error("Yenilenecek içerik bulunamadı.");
    return { id: previous.quoteId, quote: previous.quote, author: previous.author, cat: previous.category };
  }
  const snapshot = await getDocs(collection(db, "quotes"));
  const recentIds = new Set((await readState()).items.slice(0, 30).map((x) => x.quoteId).filter(Boolean));
  const candidates = [];
  snapshot.forEach((quoteDoc) => {
    const data = quoteDoc.data();
    if (data.used === true || recentIds.has(quoteDoc.id) || !data.quote?.trim()) return;
    candidates.push({ id: quoteDoc.id, quote: data.quote.replace(/\s+/g, " ").trim(), author: data.author || "Mevzu", cat: (data.cat || "FELSEFE").toUpperCase() });
  });
  if (!candidates.length) throw new Error("Mevzu havuzunda uygun, kullanılmamış söz bulunamadı.");
  return candidates[Math.floor(Math.random() * candidates.length)];
}
function analyzeCaption(caption) {
  const hashtags = (caption.match(/#[\p{L}\p{N}_]+/gu) || []).join(" ");
  const lines = caption.replace(/#[\p{L}\p{N}_]+/gu, "").split("\n").map((x) => x.trim()).filter(Boolean);
  return { hashtags, mainIdea: lines.find((x, i) => i > 0 && x.length > 20) || lines[0] || "Mevzu içeriği" };
}
async function renderPost(id, quoteData, harmony) {
  bundlePromise ||= bundle({ entryPoint: path.join(rootDir, "src", "remotion", "index.js"), webpackOverride: (config) => config });
  const serveUrl = await bundlePromise;
  const inputProps = { quote: quoteData.quote, author: quoteData.author, category: quoteData.cat, bgStyle: harmony.bgStyle, musicUrl: harmony.track.url, primaryColor: harmony.primaryColor, highlightColor: harmony.highlightColor, animStyle: harmony.animStyle, fontFamily: harmony.fontFamily };
  const composition = await selectComposition({ serveUrl, id: "MevzuReels", inputProps });
  const outputDir = path.join(rootDir, "output");
  await fs.mkdir(outputDir, { recursive: true });
  const imagePath = path.join(outputDir, `${id}_post.jpg`);
  await renderStill({ composition, serveUrl, output: imagePath, inputProps, frame: 75, imageFormat: "jpeg" });
  return { imagePath };
}
export async function generateContent({ sameQuoteId = null, source = "manual" } = {}) {
  const quoteData = await selectQuote({ sameQuoteId });
  const history = (await readState()).items;
  const harmony = createReelHarmony(quoteData.quote, quoteData.cat, history.slice(0, 12).map((x) => x.background), history.slice(0, 12).map((x) => x.musicUrl));
  const caption = await generateInstagramCaption({ quote: quoteData.quote, author: quoteData.author, category: quoteData.cat });
  const { hashtags, mainIdea } = analyzeCaption(caption);
  const id = createId();
  const { imagePath } = await renderPost(id, quoteData, harmony);
  const now = new Date().toISOString();
  const item = { id, source, status: "pending", quoteId: quoteData.id || null, quote: quoteData.quote, author: quoteData.author, category: quoteData.cat, mainIdea, caption, hashtags, background: harmony.bgStyle, musicUrl: harmony.track.url, musicName: harmony.track.name, imagePath, createdAt: now, updatedAt: now };
  await saveItem(item);
  await setDoc(doc(db, "telegram_posts", id), { ...item, imagePath: path.basename(imagePath), telegramStatus: "pending", published: false });
  return item;
}
export async function approveContent(item) {
  if (item.quoteId) await updateDoc(doc(db, "quotes", item.quoteId), { used: true, usedAt: new Date().toISOString(), usedInVideoId: item.id, telegramStatus: "approved" });
  await updateDoc(doc(db, "telegram_posts", item.id), { telegramStatus: "approved", approvedAt: new Date().toISOString() });
}
export async function rejectContent(item) {
  await updateDoc(doc(db, "telegram_posts", item.id), { telegramStatus: "rejected", rejectedAt: new Date().toISOString() });
}


