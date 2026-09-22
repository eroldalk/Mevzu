// scripts/renderAndPublish.mjs
// %100 Otonom Instagram Reels Üretim ve Yayınlama Motoru
// 1. Firestore'dan kullanılmamış sözü çeker ve 'used: true' damgalar.
// 2. Gemini AI ile söze özel kanca, açıklama ve hashtagleri üretir.
// 3. Pixabay'den kategoriye uygun müzik seçer.
// 4. Remotion ile 1080x1920 (9:16) MP4 videoyu renderlar.
// 5. Firestore'a video kaydı yazar (videoId, musicId, bgId, quoteId).
// 6. Instagram Graph API (Reels Publishing) ile doğrudan yayına alır.

import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, runTransaction, limit } from "firebase/firestore";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, renderStill } from "@remotion/renderer";
import { generateInstagramCaption } from "./generateCaption.mjs";
import { uploadAndPublishReel } from "./test_publish_reel.mjs";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

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
// Günlük 6 Altın Yayın Saati (Türkiye Saati: UTC+3)
const DAILY_SLOTS = [
  { id: "08:30", hour: 8,  minute: 30, name: "Sabah Kahvesi" },
  { id: "11:00", hour: 11, minute: 0,  name: "İş Öncesi Motivasyon" },
  { id: "13:30", hour: 13, minute: 30, name: "Öğle Molası" },
  { id: "16:30", hour: 16, minute: 30, name: "İkindi Molası" },
  { id: "19:30", hour: 19, minute: 30, name: "Akşam Dönüşü" },
  { id: "22:00", hour: 22, minute: 0,  name: "Gece Derin Düşünce" },
];

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

// Yayınlanması gereken ama gecikmiş/atlanmış aktif slotu bul (Asla erken yayın yapmaz!)
async function determineActiveSlot() {
  const { dateStr, hour, minute, currentMinutes } = getTurkeyNow();
  const timeFormatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  console.log(`🕒 Türkiye Saati: ${timeFormatted} (Tarih: ${dateStr})`);

  // Günün ilk yayın saati (08:30) gelmediyse kesinlikle bekle
  const firstSlotMinutes = DAILY_SLOTS[0].hour * 60 + DAILY_SLOTS[0].minute;
  if (currentMinutes < firstSlotMinutes) {
    console.log(`ℹ️  Günün ilk yayın saati (${DAILY_SLOTS[0].id}) henüz gelmedi. Bekleniyor.`);
    return null;
  }

  // Şu anki zamana denk gelen veya zamanı geçmiş aktif slotu tespit et (ASLA ERKEN YAYIN YOK!)
  let candidateSlot = null;
  for (let i = DAILY_SLOTS.length - 1; i >= 0; i--) {
    const s = DAILY_SLOTS[i];
    const sMinutes = s.hour * 60 + s.minute;
    if (currentMinutes >= sMinutes) {
      candidateSlot = s;
      break;
    }
  }

  if (!candidateSlot) {
    console.log("ℹ️  Aktif slot bulunamadı.");
    return null;
  }

  console.log(`🎯 İncelenen Aktif Slot: [${candidateSlot.id}] — ${candidateSlot.name}`);

  // 1. Kontrol: 'videos' koleksiyonunda bu slot bugün yayınlanmış mı?
  const videosRef = collection(db, "videos");
  const qVideos = query(
    videosRef, 
    where("date", "==", dateStr), 
    where("slotId", "==", candidateSlot.id), 
    where("published", "==", true)
  );
  const snapVideos = await getDocs(qVideos);
  if (!snapVideos.empty) {
    console.log(`✅ [${candidateSlot.id}] slotu bugün zaten başarıyla yayınlanmış (videos tablosunda mevcut). İşlem gerekmiyor.`);
    return null;
  }

  // 2. Kontrol: 'slot_locks' koleksiyonunda bu slot yayınlanmış veya işleniyor mu?
  const lockKey = `${dateStr}_${candidateSlot.id.replace(":", "")}`;
  const lockRef = doc(db, "slot_locks", lockKey);
  const snapLock = await getDoc(lockRef);
  if (snapLock.exists()) {
    const lockData = snapLock.data();
    if (lockData.status === "published") {
      console.log(`✅ [${candidateSlot.id}] slotu kilit tablosunda 'published' olarak mühürlü. İşlem gerekmiyor.`);
      return null;
    }
    if (lockData.status === "processing") {
      const nowMs = Date.now();
      const lockedAtMs = lockData.lockedAt ? new Date(lockData.lockedAt).getTime() : 0;
      if (nowMs - lockedAtMs < 20 * 60 * 1000) {
        console.log(`⏳ [${candidateSlot.id}] slotu şu anda başka bir işlem tarafından üretiliyor/yayınlanıyor (Kilit: ${Math.round((nowMs - lockedAtMs) / 1000)} sn önce alındı). Çift çalışmayı önlemek için çıkılıyor.`);
        return null;
      }
    }
  }

  console.log(`🚨 [YAYIN GEREKİYOR] [${candidateSlot.id}] slotu için yayın başlatılacak!`);
  return { slot: candidateSlot, dateStr };
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

// ─── 170 Adet Doğrulanmış Mixkit Müzik Seçici ───────────────────────────
import { getMixkitByCategory } from "../src/utils/mixkitLibrary.js";

function getMusicForCategory(categoryStr = "") {
  const track = getMixkitByCategory(categoryStr);
  return {
    musicId: track.id,
    musicUrl: track.url,
    musicName: track.name,
    source: "mixkit",
  };
}

// 1. Firestore'dan kullanılmamış sıradaki sözü çek (Sadece okur, erken harcamaz!)
async function fetchUnusedQuote() {
  console.log("🔍 Firestore'dan kullanılmamış söz aranıyor...");
  const quotesRef = collection(db, "quotes");
  const q = query(quotesRef, where("used", "!=", true), limit(10));
  const snapshot = await getDocs(q);

  let selectedDoc = null;
  if (!snapshot.empty) {
    const docs = snapshot.docs;
    selectedDoc = docs[Math.floor(Math.random() * docs.length)];
  } else {
    console.log("ℹ️  Kullanılmamış söz kalmadı, genel havuzdan seçiliyor...");
    const allSnapshot = await getDocs(query(quotesRef, limit(20)));
    if (!allSnapshot.empty) {
      selectedDoc = allSnapshot.docs[Math.floor(Math.random() * allSnapshot.docs.length)];
    }
  }

  if (!selectedDoc) {
    return {
      id: null,
      quote: "Gerçek asla yüzeyde bulunmaz. O, derinlere inmenin bir sonucudur.",
      author: "Marcus Aurelius",
      cat: "STOACILIK & ZİHİN",
    };
  }

  const data = selectedDoc.data();
  console.log(`📖 Söz seçildi (henüz harcanmadı): ID [${selectedDoc.id}]`);

  return {
    id: selectedDoc.id,
    quote: data.quote,
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

// 65 Adet Arka Plan Havuzundan Kategoriye Uygun Zengin ve Tekrarsız Seçici
import { NATURE_PRESETS } from "../src/remotion/naturePresets.js";

function getBackgroundForCategory(categoryStr = "") {
  const catUpper = (categoryStr || "").toUpperCase();
  let targetCat = "Felsefe & Kültür";

  if (catUpper.includes("DOĞA") || catUpper.includes("SU") || catUpper.includes("DENİZ") || catUpper.includes("HUZUR")) {
    targetCat = "Doğa & Su";
  } else if (catUpper.includes("MOTİVASYON") || catUpper.includes("GÜÇ") || catUpper.includes("SPOR") || catUpper.includes("DİRENÇ")) {
    targetCat = "Element & Doğa";
  } else if (catUpper.includes("KOZMİK") || catUpper.includes("UZAY") || catUpper.includes("GECE") || catUpper.includes("ŞEHİR")) {
    targetCat = "Kozmik & Uzay";
  }

  const matchingKeys = Object.keys(NATURE_PRESETS).filter(
    (k) => NATURE_PRESETS[k].cat === targetCat
  );
  const candidates = matchingKeys.length > 0 ? matchingKeys : Object.keys(NATURE_PRESETS);
  const selectedKey = candidates[Math.floor(Math.random() * candidates.length)];
  const preset = NATURE_PRESETS[selectedKey] || NATURE_PRESETS.ocean;

  return {
    bgStyle: preset.id,
    primaryColor: preset.accent,
    highlightColor: preset.contrastAccent || "#f5c542",
  };
}

// 2. Remotion ile 1080x1920 MP4 Video Render
async function renderReelsVideo({ quote, author, category, videoId, musicUrl, musicId }) {
  console.log("🎬 Remotion video motoru hazırlanıyor...");
  const entryPoint = path.join(rootDir, "src", "remotion", "index.js");

  const bgConfig = getBackgroundForCategory(category);

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
    animStyle: "viral_pop",
    fontFamily: "'Montserrat', sans-serif",
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MevzuReels",
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

  console.log(`📸 Instagram kapak fotoğrafı oluşturuluyor (Kare 75 - Tüm Metin Görünür): ${coverFileName}`);
  try {
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: coverLocation,
      inputProps: renderProps,
      frame: 75,
      imageFormat: "jpeg",
    });
    console.log(`🎉 Kapak fotoğrafı hazır: ${coverLocation}`);
  } catch (stillErr) {
    console.warn("⚠️ Kapak görseli üretilirken uyarı:", stillErr.message);
  }

  return { outputLocation, fileName, coverLocation, coverFileName, bgId: bgConfig.bgStyle };
}



// --- ANA ÇALIŞTIRMA FONKSİYONU ---
async function main() {
  console.log("==========================================");
  console.log("🚀 #MEVZU OTONOM YAYIN MOTORU BAŞLATILDI");
  console.log("==========================================");

  // 0. Akıllı Slot & Zaman Kontrolü
  // Eğer FORCE_PUBLISH ortam değişkeni verilmişse kontrolü atlar (manuel test modu)
  const isForce = process.env.FORCE_PUBLISH === "true";
  let activeSlotInfo = null;

  if (!isForce) {
    activeSlotInfo = await determineActiveSlot();
    if (!activeSlotInfo) {
      console.log("⏸️  Şu an yayınlanması gereken bir slot bulunmuyor.");
      console.log("✨ Sistem güvenle kapatılıyor. Bir sonraki kontrolde görüşmek üzere!");
      return;
    }
  } else {
    console.log("⚡ [MANUEL ZORLAMA MODU]: Slot kontrolü atlanıyor, direkt yayın yapılacak!");
  }

  const currentSlotId = activeSlotInfo ? activeSlotInfo.slot.id : "MANUAL";
  const currentSlotName = activeSlotInfo ? activeSlotInfo.slot.name : "Manuel Tetikleme";
  const currentDateStr = activeSlotInfo ? activeSlotInfo.dateStr : getTurkeyNow().dateStr;

  console.log(`🎯 Hedef Slot: [${currentSlotId}] — ${currentSlotName}`);

  // 0.1 Atomik Slot Kilidini Al (Eğer manuel değilse)
  if (activeSlotInfo && currentSlotId !== "MANUAL") {
    console.log(`🔒 [KİLİT KONTROLÜ] slot_locks/${currentDateStr}_${currentSlotId.replace(":", "")} kilidi isteniyor...`);
    const lockResult = await acquireSlotLock(currentDateStr, currentSlotId);
    if (!lockResult.acquired) {
      console.log(`⏸️  Slot kilidi alınamadı (Sebep: ${lockResult.reason}). Başka bir işlem devrede veya slot zaten yayınlanmış.`);
      return;
    }
    console.log(`🔑 Slot kilidi başarıyla bu işlem için mühürlendi (Runner: ${lockResult.runnerId}).`);
  }

  // Kritik işlem bloğu: Hata durumunda kilidi serbest bırakır ve bildirim verir
  try {
    // Doğal Algoritma Jitter'ı (5-20 saniye mikro bekleme)
    if (activeSlotInfo) {
      await applyHumanJitter();
    }

    // 1. Benzersiz video ID üret
    const videoId = generateVideoId();
    console.log(`🆔 Video ID: ${videoId}`);

    // 2. Sözü çek (SADECE OKUR, henüz harcamaz!)
    const quoteData = await fetchUnusedQuote(currentSlotId, currentDateStr);
    console.log(`📖 Söz: "${quoteData.quote}" — ${quoteData.author} [${quoteData.cat}]`);

    // 3. Pixabay'den kategoriye uygun müzik seç
    console.log("🎵 Müzik seçiliyor...");
    const musicData = await getMusicForCategory(quoteData.cat);
    console.log(`🎵 Seçilen: ${musicData.musicId} (${musicData.source}) → ${musicData.musicUrl}`);

    // 4. Açıklamayı Gemini AI ile üret (Kategori parantezi olmadan temiz)
    console.log("✍️  Instagram açıklaması üretiliyor...");
    const caption = await generateInstagramCaption({
      quote: quoteData.quote,
      author: quoteData.author,
      category: quoteData.cat,
    });

    console.log("\n--- ÜRETİLEN INSTAGRAM AÇIKLAMASI ---");
    console.log(caption);
    console.log("------------------------------------\n");

    // 5. Videoyu renderla
    const { outputLocation, fileName, bgId, coverFileName } = await renderReelsVideo({
      quote: quoteData.quote,
      author: quoteData.author,
      category: quoteData.cat,
      videoId,
      musicUrl: musicData.musicUrl,
      musicId: musicData.musicId,
    });

    // 6. Firestore'a video kaydı yaz
    try {
      await setDoc(doc(db, "videos", videoId), {
        videoId,
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
      console.log("🚀 Meta Resumable Upload API ile Reels yayına alınıyor...");
      try {
        instagramPostId = await uploadAndPublishReel({
          videoFilePath: outputLocation,
          caption,
          thumbOffset: 2500,
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
        if (currentSlotId !== "MANUAL") {
          await finalizeSlotLockSuccess(currentDateStr, currentSlotId, videoId, instagramPostId);
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

    console.log("==========================================");
    console.log(`✅ TAMAMLANDI → Slot: [${currentSlotId}] | Video: ${videoId}`);
    console.log("==========================================");
  } catch (err) {
    console.error("❌ [AKIŞ HATASI] İşlem sırasında kritik hata:", err.message);
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
