// scripts/renderAndPublish.mjs
// %100 Otonom Instagram Reels Üretim ve Yayınlama Motoru
// 1. Firestore'dan kullanılmamış sözü çeker ve 'used: true' damgalar.
// 2. Gemini AI ile söze özel kanca, açıklama ve hashtagleri üretir.
// 3. Pixabay'den kategoriye uygun müzik seçer.
// 4. Remotion ile 1080x1920 (9:16) MP4 videoyu renderlar.
// 5. Firestore'a video kaydı yazar (videoId, musicId, bgId, quoteId).
// 6. Instagram Graph API (Reels Publishing) ile doğrudan yayına alır.

import { initializeApp } from "firebase/app";
import { REEL_FPS, getReelSeconds } from "../src/utils/reelDuration.js";
import { pickCta } from "../src/utils/captionGenerator.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, runTransaction, limit } from "firebase/firestore";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, renderStill } from "@remotion/renderer";
import { generateInstagramCaption } from "./generateCaption.mjs";
import { uploadAndPublishReel } from "./test_publish_reel.mjs";
import { planSlot, MAX_DELAY_MINUTES } from "./slotPlanner.mjs";
import { hostImage, publishImage } from "./publishImage.mjs";
import { choosePhoto, loadPool, photoUrl } from "./photoPool.mjs";
import { formatFailure, formatSkipped, formatSuccess, sendTelegramMedia, sendTelegramMessage } from "./telegramNotify.mjs";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

// Söz ilk kareden görünür; kapak için yarım saniyelik sakin kare yeterli
const COVER_FRAME = 15;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBSpkgsgmaQxStwbXT_Ne3kW98BjJjaNHI",
  authDomain: "mevzuv1.firebaseapp.com",
  projectId: "mevzuv1",
  storageBucket: "mevzuv1.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Video ID Üretici ─────────────────────────────────────────────────────
function generateVideoId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `reel_${date}_${time}_${rand}`;
}

// ─── Akıllı Yayın Slotları & Gecikme Takip Motoru ──────────────────────────
// ─── Akıllı Yayın Slotları & Dinamik Ayar Motoru ──────────────────────────
async function getDynamicSlots() {
  try {
    const docRef = doc(db, "settings", "schedule");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.slots) && data.slots.length > 0) {
        console.log(`⚙️  Firestore'dan dinamik yayın saatleri okundu: [${data.slots.join(", ")}]`);
        const toSlot = (s, format) => {
          const [hStr, mStr] = s.split(":");
          const hour = parseInt(hStr, 10);
          const minute = parseInt(mStr || "0", 10);
          return { id: s, hour, minute, format, name: `Planlanan Yayın (${s})` };
        };
        const slots = data.slots.map((s) => toSlot(s, data.slotFormats?.[s] || "reels"));
        if (data.storyEnabled && data.storySlot && !data.slots.includes(data.storySlot)) {
          slots.push(toSlot(data.storySlot, "story"));
        }
        return slots;
      }
    }
  } catch (err) {
    console.warn("⚠️ Dinamik ayarlar okunurken uyarı (varsayılana dönülüyor):", err.message);
  }
  return [{ id: "19:00", hour: 19, minute: 0, name: "Akşam Ana Yayını (19:00)" }];
}

// Türkiye yerel saatini hesapla (UTC+3)
function getTurkeyNow() {
  const now = new Date();
  // UTC milisaniye + 3 saat
  const trTimestamp = now.getTime() + (3 * 60 * 60 * 1000);
  const trDate = new Date(trTimestamp);
  
  const yyyy = trDate.getUTCFullYear();
  const mm = String(trDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(trDate.getUTCDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`; // Örn: "2026-09-20"

  const hour = trDate.getUTCHours();
  const minute = trDate.getUTCMinutes();
  const currentMinutes = hour * 60 + minute;

  return { dateStr, hour, minute, currentMinutes, trDate };
}

// ─── Atomik Slot Kilidi (Çift Çalışmayı & Yarış Durumlarını Kesin Önler) ─────
async function acquireSlotLock(dateStr, slotId) {
  const lockKey = `${dateStr}_${slotId.replace(":", "")}`;
  const lockRef = doc(db, "slot_locks", lockKey);
  const runnerId = process.env.GITHUB_RUN_ID || `local_${Date.now()}`;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const lockDoc = await transaction.get(lockRef);
      const nowMs = Date.now();

      if (lockDoc.exists()) {
        const data = lockDoc.data();

        // 1. Slot bugün zaten başarıyla yayınlandıysa kesinlikle işlem yapma
        if (data.status === "published") {
          return { acquired: false, reason: "already_published" };
        }

        // 2. Başka bir işlem şu an bu slot üzerinde çalışıyorsa
        if (data.status === "processing") {
          const lockedAtMs = data.lockedAt ? new Date(data.lockedAt).getTime() : 0;
          // Kilit 20 dakikadan yeniyse diğer işlem aktiftir, mükerrer yayını önlemek için çekil
          if (nowMs - lockedAtMs < 20 * 60 * 1000) {
            return { acquired: false, reason: "currently_processing", lockedAt: data.lockedAt };
          }
          console.warn(`⚠️ [KİLİT AŞIMI] Önceki kilit 20 dakikadır yanıt vermiyor. Zaman aşımı nedeniyle devralınıyor.`);
        }
      }

      // Kilidi bu çalıştırma için atomik olarak al
      transaction.set(lockRef, {
        slotId,
        date: dateStr,
        status: "processing",
        lockedAt: new Date().toISOString(),
        runnerId,
      });

      return { acquired: true, runnerId };
    });

    return result;
  } catch (err) {
    console.error("❌ Slot kilidi alınırken hata:", err.message);
    return { acquired: false, reason: "error", error: err.message };
  }
}

async function finalizeSlotLockSuccess(dateStr, slotId, videoId, instagramId) {
  try {
    const lockKey = `${dateStr}_${slotId.replace(":", "")}`;
    const lockRef = doc(db, "slot_locks", lockKey);
    await setDoc(lockRef, {
      status: "published",
      publishedAt: new Date().toISOString(),
      videoId,
      instagramId,
    }, { merge: true });
    console.log(`🔒 [SLOT KİLİDİ MÜHÜRLENDİ] slot_locks/${lockKey} 'published' yapıldı.`);
  } catch (err) {
    console.warn("⚠️ Slot kilidi mühürlenirken uyarı:", err.message);
  }
}

async function releaseSlotLockOnFailure(dateStr, slotId, errorMessage) {
  try {
    const lockKey = `${dateStr}_${slotId.replace(":", "")}`;
    const lockRef = doc(db, "slot_locks", lockKey);
    await setDoc(lockRef, {
      status: "failed",
      failedAt: new Date().toISOString(),
      error: errorMessage || "Bilinmeyen hata",
    }, { merge: true });
    console.log(`🔓 [SLOT KİLİDİ SERBEST] Hata nedeniyle kilit 'failed' yapıldı; sonraki cron tekrar deneyebilir.`);
  } catch (err) {
    console.warn("⚠️ Slot kilidi serbest bırakılırken uyarı:", err.message);
  }
}

// Bugünkü slotların durumunu videos ve slot_locks kayıtlarından toplar
async function getSlotStates(dateStr, slots) {
  const states = {};
  const nowMs = Date.now();

  for (const s of slots) {
    const lockKey = `${dateStr}_${s.id.replace(":", "")}`;
    const snapLock = await getDoc(doc(db, "slot_locks", lockKey));
    if (!snapLock.exists()) continue;
    const lockData = snapLock.data();
    if (lockData.status === "processing") {
      // 20 dakikadan eski kilit ölü sayılır; slot yeniden denenebilir
      const lockedAtMs = lockData.lockedAt ? new Date(lockData.lockedAt).getTime() : 0;
      states[s.id] = nowMs - lockedAtMs < 20 * 60 * 1000 ? "processing" : "failed";
    } else {
      states[s.id] = lockData.status;
    }
  }

  const snapVideos = await getDocs(query(
    collection(db, "videos"),
    where("date", "==", dateStr),
    where("published", "==", true)
  ));
  snapVideos.forEach((vDoc) => {
    const { slotId } = vDoc.data();
    if (slotId) states[slotId] = "published";
  });

  return states;
}

async function markSlotSkipped(dateStr, slot, currentMinutes) {
  const lockKey = `${dateStr}_${slot.id.replace(":", "")}`;
  const delayMinutes = currentMinutes - (slot.hour * 60 + slot.minute);
  await setDoc(doc(db, "slot_locks", lockKey), {
    slotId: slot.id,
    date: dateStr,
    status: "skipped",
    skippedAt: new Date().toISOString(),
    delayMinutes,
  }, { merge: true });
  console.warn(`⏭️  [SLOT ATLANDI] [${slot.id}] ${delayMinutes} dk gecikti (sınır: ${MAX_DELAY_MINUTES} dk).`);
  await sendTelegramMessage(formatSkipped({ slotId: slot.id, delayMinutes }));
}

// Yayınlanması gereken en eski slotu bul (Asla erken yayın yapmaz!)
async function determineActiveSlot() {
  const { dateStr, hour, minute, currentMinutes } = getTurkeyNow();
  const timeFormatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  console.log(`🕒 Türkiye Saati: ${timeFormatted} (Tarih: ${dateStr})`);

  const activeSlots = await getDynamicSlots();
  const slotStates = await getSlotStates(dateStr, activeSlots);
  const { slot, skipped, blockedBy } = planSlot({ slots: activeSlots, currentMinutes, slotStates });

  if (blockedBy) {
    console.log(`⏳ [${blockedBy.id}] slotu şu anda işleniyor. Çift çalışmayı önlemek için çıkılıyor.`);
    return null;
  }

  for (const s of skipped) await markSlotSkipped(dateStr, s, currentMinutes);

  if (!slot) {
    console.log("ℹ️  Şu an yayınlanacak slot yok (saati gelmedi veya bugünkü slotlar tamamlandı).");
    return null;
  }

  console.log(`🚨 [YAYIN GEREKİYOR] [${slot.id}] slotu için yayın başlatılacak!`);
  return { slot, dateStr };
}

// Yayınlanan gönderinin Instagram bağlantısını alır
async function fetchPermalink(mediaId) {
  try {
    const url = `https://graph.facebook.com/v21.0/${mediaId}?fields=permalink&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`;
    const json = await (await fetch(url)).json();
    return json.permalink || null;
  } catch (err) {
    console.warn("⚠️ Instagram bağlantısı alınamadı:", err.message);
    return null;
  }
}

// ─── Doğal Algoritma Jitter Motoru (Hafif İnsan Taklidi Gecikme) ───────────
async function applyHumanJitter() {
  if (process.env.FORCE_PUBLISH === "true") {
    console.log("⚡ [MANUEL MOD]: Jitter atlanıyor.");
    return;
  }

  // Instagram bot filtrelerine takılmamak ve trafiği dağıtmak için 5 - 20 saniye arası mikro bekleme
  const waitSeconds = Math.floor(Math.random() * 16) + 5;
  console.log(`⏳ Doğal insan taklidi ve API güvenliği için ${waitSeconds} saniye bekleniyor...`);
  await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
}

// ─── Sözün Konusuna Göre Müzik Seçimi ───────────────────────────
import { createReelHarmony } from "../src/utils/reelHarmony.js";

// Son yayınların tema, müzik ve açıklamaları tekrarı önlemek için okunur
async function fetchRecentMedia() {
  try {
    const snap = await getDocs(query(collection(db, "videos"), where("published", "==", true)));
    const published = snap.docs.map((d) => d.data())
      .sort((a, b) => String(b.renderedAt).localeCompare(String(a.renderedAt)));
    const recent = published.slice(0, 12);
    return {
      photoIds: published.map((v) => v.photoId).filter(Boolean),
      themes: recent.map((v) => v.bgId).filter(Boolean),
      music: recent.map((v) => v.musicUrl).filter(Boolean),
      captions: recent.map((v) => v.caption).filter(Boolean),
    };
  } catch (err) {
    console.warn("⚠️ Son yayınlar okunamadı:", err.message);
    return { photoIds: [], themes: [], music: [], captions: [] };
  }
}

function getMusicForCategory(categoryStr = "", quote = "", recentMusic = []) {
  const { track, mood } = createReelHarmony(quote, categoryStr, [], recentMusic);
  return {
    musicId: track.id,
    musicUrl: track.url,
    musicName: track.name,
    mood,
    source: "mixkit",
  };
}

// 1. Firestore'dan kullanılmamış sıradaki sözü çek (Sadece okur, erken harcamaz!)
async function fetchUnusedQuote() {
  console.log("🔍 Firestore'dan kullanılmamış söz aranıyor...");
  const quotesRef = collection(db, "quotes");
  const videosRef = collection(db, "videos");

  // Kullanıcının sitedeki tercihlerini oku (Kısa söz önceliği)
  let shortQuotesOnly = true;
  try {
    const snap = await getDoc(doc(db, "settings", "schedule"));
    if (snap.exists() && snap.data().shortQuotesOnly !== undefined) {
      shortQuotesOnly = snap.data().shortQuotesOnly;
    }
  } catch (e) {}

  // Geçmişte yayınlanmış tüm videoların sözlerini topla (çifte garanti!)
  const publishedQuoteTexts = new Set();
  try {
    const publishedVideosSnap = await getDocs(query(videosRef, where("published", "==", true)));
    publishedVideosSnap.forEach((vDoc) => {
      const vd = vDoc.data();
      if (vd.quote) {
        publishedQuoteTexts.add(vd.quote.replace(/\s+/g, " ").trim().toLowerCase());
      }
    });
  } catch (err) {
    console.warn("⚠️ Yayınlanmış videolar taranırken uyarı:", err.message);
  }

  const snapshot = await getDocs(quotesRef);
  const unusedDocs = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.used === true) return;
    const cleanQuote = (data.quote || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (publishedQuoteTexts.has(cleanQuote)) return; // Daha önce videoda yayınlanmışsa atla!
    unusedDocs.push(docSnap);
  });

  console.log(`📊 Havuz Durumu: Toplam ${snapshot.size} sözden ${unusedDocs.length} tanesi henüz hiç kullanılmadı.`);

  // Kısa ve vurucu sözler önceliği (3 - 12 kelime arası, dev puntolu, yüksek izlenme)
  let candidateDocs = unusedDocs;
  if (shortQuotesOnly) {
    const shortDocs = unusedDocs.filter((d) => {
      const text = (d.data().quote || "").trim();
      const words = text.split(/\s+/).filter(Boolean);
      return words.length >= 3 && words.length <= 12;
    });
    if (shortDocs.length > 0) {
      console.log(`✨ Kısa ve Vurucu Söz Filtresi devrede: ${shortDocs.length} adet kısa söz bulundu.`);
      candidateDocs = shortDocs;
    }
  }

  let selectedDoc = null;
  if (candidateDocs.length > 0) {
    selectedDoc = candidateDocs[Math.floor(Math.random() * candidateDocs.length)];
  } else if (unusedDocs.length > 0) {
    selectedDoc = unusedDocs[Math.floor(Math.random() * unusedDocs.length)];
  }

  if (!selectedDoc) {
    console.warn("⚠️ Havuzda kullanılmamış söz kalmadı!");
    return {
      id: null,
      quote: "Gerçek asla yüzeyde bulunmaz. O, derinlere inmenin bir sonucudur.",
      author: "Marcus Aurelius",
      cat: "STOACILIK & ZİHİN",
    };
  }

  const data = selectedDoc.data();
  const wordCount = (data.quote || "").trim().split(/\s+/).length;
  console.log(`📖 Söz seçildi (henüz harcanmadı): ID [${selectedDoc.id}] - "${data.quote}" (${wordCount} kelime)`);

  return {
    id: selectedDoc.id,
    quote: data.quote.replace(/\r?\n|\r/g, " ").trim(),
    author: data.author || "Mevzu",
    cat: data.cat ? data.cat.toUpperCase() : "FELSEFE",
  };
}

// Sözü SADECE Instagram yayını başarılı olduktan sonra mühürle!
async function markQuoteAsUsed(quoteId, slotId, dateStr, videoId) {
  if (!quoteId) return;
  try {
    await updateDoc(doc(db, "quotes", quoteId), {
      used: true,
      usedAt: new Date().toISOString(),
      usedSlot: slotId,
      usedDate: dateStr,
      usedInVideoId: videoId,
    });
    console.log(`🔒 [SÖZ MÜHÜRLENDİ] quotes/${quoteId} başarıyla 'used: true' yapıldı.`);
  } catch (err) {
    console.warn("⚠️ Söz durumu güncellenirken uyarı:", err.message);
  }
}

// 2. Remotion ile 1080x1920 MP4 Video Render
async function renderReelsVideo({ quote, author, category, videoId, musicUrl, musicId, recentThemes = [], photo = null }) {
  console.log("🎬 Remotion video motoru hazırlanıyor...");
  const entryPoint = path.join(rootDir, "src", "remotion", "index.js");

  const bgConfig = createReelHarmony(quote, category, recentThemes);

  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  const renderProps = {
    quote,
    author,
    category,
    bgStyle: bgConfig.bgStyle,
    musicUrl,
    primaryColor: bgConfig.primaryColor,
    highlightColor: bgConfig.highlightColor,
    animStyle: bgConfig.animStyle,
    fontFamily: bgConfig.fontFamily,
    photoUrl: photo ? photoUrl(photo) : null,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: photo ? "MevzuNoteReels" : "MevzuReels",
    inputProps: renderProps,
  });

  const outputDir = path.join(rootDir, "output");
  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `${videoId}.mp4`;
  const outputLocation = path.join(outputDir, fileName);

  console.log(`⚡ 1080×1920 30FPS MP4 render başlatılıyor: ${fileName}`);
  console.log(`🎵 Müzik: ${musicId} → ${musicUrl}`);
  console.log(`🎨 Arka Plan: ${bgConfig.bgStyle}`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps: renderProps,
  });

  console.log(`🎉 Video render tamamlandı: ${outputLocation}`);

  // 2.5. Saniyeden (Kare 75) Tam Metinli Instagram Kapak Fotoğrafı Üret
  const coverFileName = `${videoId}_cover.jpg`;
  const coverLocation = path.join(outputDir, coverFileName);

  console.log(`📸 Instagram kapak fotoğrafı oluşturuluyor (Tüm Metin Görünür): ${coverFileName}`);
  try {
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: coverLocation,
      inputProps: renderProps,
      frame: COVER_FRAME,
      imageFormat: "jpeg",
    });
    console.log(`🎉 Kapak fotoğrafı hazır: ${coverLocation}`);
  } catch (stillErr) {
    console.warn("⚠️ Kapak görseli üretilirken uyarı:", stillErr.message);
  }

  return { outputLocation, fileName, coverLocation, coverFileName, bgId: photo ? `foto_${photo.id}` : bgConfig.bgStyle };
}



// Post (1080x1350) ve hikâye (1080x1920) görseli üretir
async function renderImage({ compositionId, quote, author, category, videoId, recentThemes = [], photo = null }) {
  const bgConfig = createReelHarmony(quote, category, recentThemes);
  const serveUrl = await bundle({ entryPoint: path.join(rootDir, "src", "remotion", "index.js"), webpackOverride: (config) => config });
  const inputProps = {
    quote,
    author,
    category,
    bgStyle: bgConfig.bgStyle,
    musicUrl: null,
    primaryColor: bgConfig.primaryColor,
    highlightColor: bgConfig.highlightColor,
    animStyle: bgConfig.animStyle,
    fontFamily: bgConfig.fontFamily,
    photoUrl: photo ? photoUrl(photo) : null,
  };
  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps });
  const outputDir = path.join(rootDir, "output");
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `${videoId}.jpg`;
  const outputLocation = path.join(outputDir, fileName);
  await renderStill({ composition, serveUrl, output: outputLocation, inputProps, frame: 0, imageFormat: "jpeg" });
  return { outputLocation, fileName, coverFileName: fileName, bgId: photo ? `foto_${photo.id}` : bgConfig.bgStyle };
}

async function getCollaborators() {
  try {
    const snap = await getDoc(doc(db, "settings", "schedule"));
    const list = snap.exists() ? snap.data().collaborators : null;
    return Array.isArray(list) ? list.filter(Boolean).slice(0, 3) : [];
  } catch (err) {
    console.warn("⚠️ Ortak hesaplar okunamadı:", err.message);
    return [];
  }
}

// Hikâye, son yayınlanan sözü yeniden kullanır; havuzdan söz harcamaz
async function publishStorySlot(dateStr, slotId) {
  const snap = await getDocs(query(collection(db, "videos"), where("published", "==", true)));
  const latest = snap.docs.map((d) => d.data())
    .filter((v) => v.format !== "story" && v.quote)
    .sort((a, b) => String(b.renderedAt).localeCompare(String(a.renderedAt)))[0];
  if (!latest) throw new Error("Hikâye için yayınlanmış söz bulunamadı.");

  const videoId = generateVideoId();
  const { outputLocation, fileName, bgId } = await renderImage({ compositionId: "MevzuReels", quote: latest.quote, author: latest.author, category: latest.category, videoId });
  const imageUrl = await hostImage(outputLocation);
  const instagramId = await publishImage({ imageUrl, mediaType: "STORIES" });
  const now = new Date().toISOString();
  await setDoc(doc(db, "videos", videoId), { videoId, format: "story", quote: latest.quote, author: latest.author, category: latest.category, slotId, date: dateStr, bgId, fileName, renderedAt: now, publishedAt: now, instagramId, published: true });
  await finalizeSlotLockSuccess(dateStr, slotId, videoId, instagramId);
  await sendTelegramMedia(outputLocation, formatSuccess({ slotId: `${slotId} hikâye`, quote: latest.quote, author: latest.author, permalink: null }), "photo");
}

// --- ANA ÇALIŞTIRMA FONKSİYONU ---
async function main() {
  console.log("==========================================");
  console.log("🚀 #MEVZU OTONOM YAYIN MOTORU BAŞLATILDI");
  console.log("==========================================");

  // 0.0 Telefondan gelen manuel yayın talebi var mı kontrol et
  let manualReqDoc = null;
  try {
    const pendingSnap = await getDoc(doc(db, "manual_publish_queue", "pending"));
    if (pendingSnap.exists() && pendingSnap.data().status === "pending") {
      manualReqDoc = pendingSnap.data();
      console.log(`📲 [MANUEL TALEP TESPİT EDİLDİ] Telefondan talep edilen video yayınlanacak: "${manualReqDoc.quote}"`);
    }
  } catch (e) {}

  // 0. Akıllı Slot & Zaman Kontrolü
  // Eğer FORCE_PUBLISH veya manuel talep varsa slot kontrolünü atlar
  const isForce = process.env.FORCE_PUBLISH === "true" || !!manualReqDoc;
  let activeSlotInfo = null;

  if (!isForce) {
    activeSlotInfo = await determineActiveSlot();
    if (!activeSlotInfo) {
      console.log("⏸️  Şu an yayınlanması gereken bir slot bulunmuyor.");
      console.log("✨ Sistem güvenle kapatılıyor. Bir sonraki kontrolde görüşmek üzere!");
      return;
    }
  } else {
    console.log("⚡ [MANUEL ZORLAMA / TELEFON MODU]: Slot kontrolü atlanıyor, direkt yayın yapılacak!");
  }

  const currentSlotId = manualReqDoc ? "MOBILE_MANUAL" : (activeSlotInfo ? activeSlotInfo.slot.id : "MANUAL");
  const currentSlotName = manualReqDoc ? "Telefondan Manuel İstek" : (activeSlotInfo ? activeSlotInfo.slot.name : "Manuel Tetikleme");
  const currentDateStr = activeSlotInfo ? activeSlotInfo.dateStr : getTurkeyNow().dateStr;

  console.log(`🎯 Hedef Slot: [${currentSlotId}] — ${currentSlotName}`);

  // 0.1 Atomik Slot Kilidini Al (Eğer otomatik slot ise)
  if (activeSlotInfo && currentSlotId !== "MANUAL" && currentSlotId !== "MOBILE_MANUAL") {
    console.log(`🔒 [KİLİT KONTROLÜ] slot_locks/${currentDateStr}_${currentSlotId.replace(":", "")} kilidi isteniyor...`);
    const lockResult = await acquireSlotLock(currentDateStr, currentSlotId);
    if (!lockResult.acquired) {
      console.log(`⏸️  Slot kilidi alınamadı (Sebep: ${lockResult.reason}). Başka bir işlem devrede veya slot zaten yayınlanmış.`);
      return;
    }
    console.log(`🔑 Slot kilidi başarıyla bu işlem için mühürlendi (Runner: ${lockResult.runnerId}).`);
  }

  const format = activeSlotInfo?.slot.format || "reels";
  let renderedMedia = null;
  let renderedCaption = "";

  // Kritik işlem bloğu: Hata durumunda kilidi serbest bırakır ve bildirim verir
  try {
    // Doğal Algoritma Jitter'ı (5-20 saniye mikro bekleme)
    if (activeSlotInfo && !manualReqDoc) {
      await applyHumanJitter();
    }

    // Telegram'a gönder: Instagram'a atılmaz, hazırlanan taslak Telegram'a bildirim olarak gelir
    if (format.startsWith("telegram-")) {
      await promisify(execFile)(process.execPath, [path.join(__dirname, "telegramCommand.mjs")], {
        env: { ...process.env, INPUT_ACTION: "preview", INPUT_FORMAT: format.replace("telegram-", ""), INPUT_TEXT: "", INPUT_SLOT: currentSlotId },
        maxBuffer: 20 * 1024 * 1024,
      });
      await setDoc(doc(db, "slot_locks", `${currentDateStr}_${currentSlotId.replace(":", "")}`), { status: "sent", sentAt: new Date().toISOString() }, { merge: true });
      console.log(`✅ TAMAMLANDI → Telegram'a gönderildi: [${currentSlotId}]`);
      return;
    }

    if (format === "story") {
      await publishStorySlot(currentDateStr, currentSlotId);
      console.log(`✅ TAMAMLANDI → Hikâye: [${currentSlotId}]`);
      return;
    }

    // 1. Benzersiz video ID üret
    const videoId = generateVideoId();
    console.log(`🆔 Video ID: ${videoId}`);

    // 2. Sözü belirle (Telefondan geldiyse o sözü kullan, yoksa havuzdan çek)
    let quoteData = null;
    if (manualReqDoc) {
      quoteData = {
        id: manualReqDoc.quoteId || null,
        quote: manualReqDoc.quote,
        author: manualReqDoc.author || "Mevzu",
        cat: (manualReqDoc.category || "FELSEFE").toUpperCase(),
      };
      console.log(`📲 Telefondan seçilen söz: "${quoteData.quote}" — ${quoteData.author}`);
    } else {
      quoteData = await fetchUnusedQuote(currentSlotId, currentDateStr);
      console.log(`📖 Havuzdan seçilen söz: "${quoteData.quote}" — ${quoteData.author} [${quoteData.cat}]`);
    }

    const recentMedia = await fetchRecentMedia();

    // 3. Söze uygun müzik seç
    console.log("🎵 Müzik seçiliyor...");
    const musicData = format === "post"
      ? { musicId: null, musicUrl: null, mood: null, source: null }
      : manualReqDoc?.musicUrl
      ? { musicId: "custom_mobile", musicUrl: manualReqDoc.musicUrl, source: "mobile" }
      : getMusicForCategory(quoteData.cat, quoteData.quote, recentMedia.music);
    console.log(`🎵 Seçilen: ${musicData.musicId} (${musicData.source}) → ${musicData.musicUrl}`);

    // 4. Açıklamayı Gemini AI ile üret (Kategori parantezi olmadan temiz)
    console.log("✍️  Instagram açıklaması üretiliyor...");
    const caption = await generateInstagramCaption({
      quote: quoteData.quote,
      author: quoteData.author,
      category: quoteData.cat,
      recentCaptions: recentMedia.captions,
    });

    console.log("\n--- ÜRETİLEN INSTAGRAM AÇIKLAMASI ---");
    console.log(caption);
    console.log("------------------------------------\n");

    // 5. Videoyu renderla
    const photo = manualReqDoc ? null : choosePhoto(await loadPool(), recentMedia.photoIds);
    const mediaInput = { quote: quoteData.quote, author: quoteData.author, category: quoteData.cat, videoId, recentThemes: recentMedia.themes, photo };
    const { outputLocation, fileName, bgId, coverFileName } = format === "post"
      ? await renderImage({ ...mediaInput, compositionId: "MevzuNotePost" })
      : await renderReelsVideo({ ...mediaInput, musicUrl: musicData.musicUrl, musicId: musicData.musicId });
    renderedMedia = outputLocation;
    renderedCaption = caption;

    // 6. Firestore'a video kaydı yaz
    try {
      await setDoc(doc(db, "videos", videoId), {
        videoId,
        format,
        photoId:       photo?.id || null,
        caption,
        ctaType:       pickCta(quoteData.quote).type,
        mood:          musicData.mood || null,
        durationSeconds: format === "post" ? null : getReelSeconds(quoteData.quote),
        quoteId:       quoteData.id || null,
        quote:         quoteData.quote,
        author:        quoteData.author,
        category:      quoteData.cat,
        slotId:        currentSlotId,
        slotName:      currentSlotName,
        date:          currentDateStr,
        musicId:       musicData.musicId,
        musicUrl:      musicData.musicUrl,
        musicSource:   musicData.source || "mixkit",
        bgId,
        fileName,
        coverFileName: coverFileName || null,
        renderedAt:    new Date().toISOString(),
        instagramId:   null,   // Yayınlanınca güncellenir
        published:     false,
      });
      console.log(`💾 Firestore video kaydı oluşturuldu: videos/${videoId}`);
    } catch (err) {
      console.warn("Firestore video kaydı yazılamadı:", err.message);
    }

    // 7. Instagram'a gönder
    let instagramPostId = null;
    const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
    const hasToken = process.env.INSTAGRAM_ACCOUNT_ID && process.env.INSTAGRAM_ACCESS_TOKEN;

    if (hasToken) {
      console.log("🚀 Instagram'a yayın başlatılıyor...");
      const collaborators = await getCollaborators();
      try {
        instagramPostId = format === "post"
          ? await publishImage({ imageUrl: await hostImage(outputLocation), caption, collaborators })
          : await uploadAndPublishReel({
          videoFilePath: outputLocation,
          caption,
          collaborators,
          thumbOffset: COVER_FRAME * 1000 / REEL_FPS,
        });
      } catch (uploadErr) {
        console.error("❌ [KRİTİK HATA] Instagram Reels yüklenemedi:", uploadErr.message);
        throw uploadErr; // GitHub Actions'ı kırmızıya düşür, hatayı gizleme!
      }
    } else {
      if (isCi) {
        throw new Error("❌ [KRİTİK HATA] GitHub Actions ortamında INSTAGRAM_ACCOUNT_ID veya INSTAGRAM_ACCESS_TOKEN eksik!");
      }
      console.log("ℹ️  [LOKAL BİLGİ] Instagram tokenları tanımlı değil. Video yerel 'output/' klasörüne kaydedildi.");
    }

    // 8. Yayın BAŞARILI ise Slotu, Videoyu ve Sözü Mühürle!
    if (instagramPostId) {
      try {
        // 1. Videolar koleksiyonunu kalıcı mühürle
        await updateDoc(doc(db, "videos", videoId), {
          instagramId: instagramPostId,
          published:   true,
          publishedAt: new Date().toISOString(),
        });
        console.log(`🔒 [VİDEO MÜHÜRLENDİ] videos/${videoId} güncellendi: slotId=${currentSlotId}, instagramId=${instagramPostId}`);

        // 2. Sözü 'used: true' olarak mühürle (Söz ancak şimdi harcanır!)
        await markQuoteAsUsed(quoteData.id, currentSlotId, currentDateStr, videoId);

        // 3. Atomik slot kilidini 'published' olarak mühürle
        if (currentSlotId !== "MANUAL" && currentSlotId !== "MOBILE_MANUAL") {
          await finalizeSlotLockSuccess(currentDateStr, currentSlotId, videoId, instagramPostId);
        }

        // 4. Eğer telefondan gelen manuel talep ise onu da 'completed' yap
        if (manualReqDoc) {
          try {
            await setDoc(doc(db, "manual_publish_queue", "pending"), {
              status: "completed",
              completedAt: new Date().toISOString(),
              videoId,
              instagramId: instagramPostId,
            }, { merge: true });
            console.log("✅ [MANUEL YAYIN] manual_publish_queue/pending 'completed' olarak mühürlendi.");
          } catch (e) {}
        }
      } catch (err) {
        console.warn("⚠️ Veritabanı mühürleme güncellenirken uyarı:", err.message);
      }
    } else {
      // Instagram'a gönderilmediyse (örn: lokal test) slot kilidini boşuna bloke etme, serbest bırak!
      if (activeSlotInfo && currentSlotId !== "MANUAL") {
        await releaseSlotLockOnFailure(currentDateStr, currentSlotId, "Lokal çalıştırma (Instagram tokenı yok)");
      }
    }

    if (instagramPostId) {
      const permalink = await fetchPermalink(instagramPostId);
      await sendTelegramMedia(outputLocation, formatSuccess({ slotId: currentSlotId, quote: quoteData.quote, author: quoteData.author, permalink }), format === "post" ? "photo" : "video");
    }

    console.log("==========================================");
    console.log(`✅ TAMAMLANDI → Slot: [${currentSlotId}] | Video: ${videoId}`);
    console.log("==========================================");
  } catch (err) {
    console.error("❌ [AKIŞ HATASI] İşlem sırasında kritik hata:", err.message);
    await sendTelegramMessage(formatFailure({ slotId: currentSlotId, message: err.message }));
    // Sistem atamazsa içerik telefona gelir, elle paylaşılabilir
    if (renderedMedia) {
      await sendTelegramMedia(renderedMedia, renderedCaption, format === "post" ? "photo" : "video");
    }
    if (activeSlotInfo && currentSlotId !== "MANUAL") {
      await releaseSlotLockOnFailure(currentDateStr, currentSlotId, err.message);
    }
    throw err; // GitHub Actions'ın kırmızıya düşmesi için yukarı fırlat
  }
}

main().catch((err) => {
  console.error("❌ Hata oluştu:", err);
  process.exit(1);
});
