// scripts/renderAndPublish.mjs
// %100 Otonom Instagram Reels Üretim ve Yayınlama Motoru
// 1. Firestore'dan kullanılmamış sözü çeker ve 'used: true' damgalar.
// 2. Gemini AI ile söze özel kanca, açıklama ve hashtagleri üretir.
// 3. Pixabay'den kategoriye uygun müzik seçer.
// 4. Remotion ile 1080x1920 (9:16) MP4 videoyu renderlar.
// 5. Firestore'a video kaydı yazar (videoId, musicId, bgId, quoteId).
// 6. Instagram Graph API (Reels Publishing) ile doğrudan yayına alır.

import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, limit } from "firebase/firestore";
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

// Yayınlanması gereken ama gecikmiş/atlanmış ilk slotu bul
async function determineActiveSlot() {
  const { dateStr, hour, minute, currentMinutes } = getTurkeyNow();
  console.log(`🕒 Türkiye Saati: ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} (Tarih: ${dateStr})`);

  // Zamanı gelmiş, 7 dakika yaklaşmış veya geçmiş olan slotları filtrele (Erken Tolerans Penceresi)
  const eligibleSlots = DAILY_SLOTS.filter(s => {
    const slotMinutes = s.hour * 60 + s.minute;
    // Slota 7 dakika kalmışsa veya saat geçmişse aktif kabul et (Örn: 13:30 için 13:23'ten itibaren geçerli)
    return currentMinutes >= (slotMinutes - 7);
  });

  if (eligibleSlots.length === 0) {
    console.log("ℹ️  Günün ilk yayın saati (08:30) henüz gelmedi. Bekleniyor.");
    return null;
  }

  // Firestore'dan doğrudan BUGÜNÜN yayınlanmış videolarını çek (Tarih bazlı güvenli filtre)
  const videosRef = collection(db, "videos");
  const q = query(videosRef, where("date", "==", dateStr), where("published", "==", true));
  const snap = await getDocs(q);
  
  const publishedSlotIds = new Set();
  snap.forEach(d => {
    const data = d.data();
    if (data.slotId) {
      publishedSlotIds.add(data.slotId);
    }
  });

  console.log(`📊 Bugün 'videos' deposuna kaydedilen slotlar: [${Array.from(publishedSlotIds).join(", ") || "Henüz yok"}]`);

  // Zamanı geçmiş ama henüz yayınlanmamış İLK slotu bul (Eksik/Geciken slot)
  for (const slot of eligibleSlots) {
    if (!publishedSlotIds.has(slot.id)) {
      console.log(`🚨 [YAYIN GEREKİYOR] Zamanı geçmiş/gelmiş eksik slot tespit edildi: ${slot.id} (${slot.name})`);
      return { slot, dateStr, isCatchUp: true };
    }
  }

  console.log("✅ Bu saate kadar planlanan tüm yayınlar zaten başarıyla yapılmış. İşlem gerekmiyor.");
  return null;
}

// ─── Doğal Algoritma Jitter Motoru (İnsan Taklidi Gecikme) ──────────────────
async function applyHumanJitter(slot) {
  if (process.env.FORCE_PUBLISH === "true") {
    console.log("⚡ [MANUEL MOD]: Jitter atlanıyor, anında yayınlanacak.");
    return;
  }

  const { currentMinutes } = getTurkeyNow();
  const slotMinutes = slot.hour * 60 + slot.minute;

  // Hedef dakika penceresi: Slotun 5 dakika öncesi ile 4 dakika sonrası arası (Örn: 13:25 - 13:34)
  // [-5, +4] aralığında rastgele bir ofset seç
  const randomOffset = Math.floor(Math.random() * (4 - (-5) + 1)) + (-5);
  const targetMinuteOfDay = slotMinutes + randomOffset;
  
  // Hedefe kalan dakika farkını hesapla
  const diffMinutes = targetMinuteOfDay - currentMinutes;

  if (diffMinutes <= 0) {
    console.log(`⚡ Zaman zaten hedefe ulaştı/geçti (${slot.id} slotu). Jitter beklemesi yapmadan anında başlanıyor.`);
    return;
  }

  // Kalan dakikayı saniyeye çevirip ilave rastgele saniyeler ekle (0 - 45 sn)
  const waitSeconds = Math.min(diffMinutes * 60 + Math.floor(Math.random() * 45), 600);
  const mins = Math.floor(waitSeconds / 60);
  const secs = waitSeconds % 60;

  const targetHour = Math.floor(targetMinuteOfDay / 60);
  const targetMin = targetMinuteOfDay % 60;
  const targetTimeFormatted = `${String(targetHour).padStart(2, "0")}:${String(targetMin).padStart(2, "0")}`;

  console.log("--------------------------------------------------");
  console.log(`🎲 [DOĞAL JITTER]: Instagram spam koruması için insan taklidi devrede!`);
  console.log(`🕒 Hedef Slot: [${slot.id}] | Bugünkü Doğal Yayın Saati: ${targetTimeFormatted}`);
  console.log(`⏳ Kalan bekleme: ${mins} dakika ${secs} saniye...`);
  console.log("--------------------------------------------------");

  await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
  console.log(`🚀 [${targetTimeFormatted}] Geldi! Video üretimi ve canlı yayın başlatılıyor...`);
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

  // 0. Akıllı Slot & Gecikme Kontrolü
  // Eğer FORCE_PUBLISH ortam değişkeni verilmişse kontrolü atlar (manuel test modu)
  const isForce = process.env.FORCE_PUBLISH === "true";
  let activeSlotInfo = null;

  if (!isForce) {
    activeSlotInfo = await determineActiveSlot();
    if (!activeSlotInfo) {
      console.log("⏸️  Şu an yayınlanması gereken gecikmiş veya aktif bir slot bulunmuyor.");
      console.log("✨ Sistem güvenle kapatılıyor. Bir sonraki tetiklemede görüşmek üzere!");
      return;
    }
  } else {
    console.log("⚡ [MANUEL ZORLAMA MODU]: Slot kontrolü atlanıyor, direkt yayın yapılacak!");
  }

  const currentSlotId = activeSlotInfo ? activeSlotInfo.slot.id : "MANUAL";
  const currentSlotName = activeSlotInfo ? activeSlotInfo.slot.name : "Manuel Tetikleme";
  const currentDateStr = activeSlotInfo ? activeSlotInfo.dateStr : getTurkeyNow().dateStr;

  console.log(`🎯 Hedef Slot: [${currentSlotId}] — ${currentSlotName}`);

  // Doğal Algoritma Jitter'ı (Her gün farklı dakikada yayınlanması için rastgele bekleme)
  if (activeSlotInfo) {
    await applyHumanJitter(activeSlotInfo.slot);
  }

  // 1. Benzersiz video ID üret
  const videoId = generateVideoId();
  console.log(`🆔 Video ID: ${videoId}`);

  // 2. Sözü çek
  const quoteData = await fetchUnusedQuote(currentSlotId, currentDateStr);
  console.log(`📖 Söz: "${quoteData.quote}" — ${quoteData.author} [${quoteData.cat}]`);

  // 3. Pixabay'den kategoriye uygun müzik seç
  console.log("🎵 Pixabay'den müzik seçiliyor...");
  const musicData = await getMusicForCategory(quoteData.cat);
  console.log(`🎵 Seçilen: ${musicData.musicId} (${musicData.source}) → ${musicData.musicUrl}`);

  // 4. Açıklamayı Gemini AI ile üret
  console.log("✍️  Gemini AI ile Instagram açıklaması üretiliyor...");
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
    } catch (err) {
      console.warn("⚠️ Veritabanı mühürleme güncellenirken uyarı:", err.message);
    }
  }

  console.log("==========================================");
  console.log(`✅ TAMAMLANDI → Slot: [${currentSlotId}] | Video: ${videoId}`);
  console.log("==========================================");
}

main().catch((err) => {
  console.error("❌ Hata oluştu:", err);
  process.exit(1);
});
