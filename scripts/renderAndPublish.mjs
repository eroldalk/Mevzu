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

// 1. Firestore'dan kullanılmamış sıradaki sözü çek
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
  try {
    await updateDoc(doc(db, "quotes", selectedDoc.id), {
      used: true,
      usedAt: new Date().toISOString(),
    });
    console.log(`✅ Söz damgalandı: ID [${selectedDoc.id}]`);
  } catch (err) {
    console.warn("Söz durumu güncellenirken uyarı:", err.message);
  }

  return {
    id: selectedDoc.id,
    quote: data.quote,
    author: data.author || "Mevzu",
    cat: data.cat ? data.cat.toUpperCase() : "FELSEFE",
  };
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
  console.log("🚀 #MEVZU OTOMASYON MOTORU BAŞLATILDI");
  console.log("==========================================");

  // 1. Benzersiz video ID üret
  const videoId = generateVideoId();
  console.log(`🆔 Video ID: ${videoId}`);

  // 2. Sözü çek
  const quoteData = await fetchUnusedQuote();
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

  // 7. Instagram'a gönder (Token varsa)
  let instagramPostId = null;
  const hasToken = process.env.INSTAGRAM_ACCOUNT_ID && process.env.INSTAGRAM_ACCESS_TOKEN;
  if (hasToken) {
    try {
      console.log("🚀 Meta Resumable Upload API ile Reels yayına alınıyor...");
      instagramPostId = await uploadAndPublishReel({
        videoFilePath: outputLocation,
        caption,
        thumbOffset: 2500,
      });
    } catch (uploadErr) {
      console.error("❌ Instagram Reels yükleme hatası:", uploadErr.message);
    }
  } else {
    console.log("ℹ️  [BİLGİ] INSTAGRAM_ACCOUNT_ID veya INSTAGRAM_ACCESS_TOKEN tanımlı değil.");
    console.log("    Video yerel 'output/' klasörüne kaydedildi.");
  }

  // Instagram ID'si varsa Firestore kaydını güncelle
  if (instagramPostId) {
    try {
      await updateDoc(doc(db, "videos", videoId), {
        instagramId: instagramPostId,
        published:   true,
        publishedAt: new Date().toISOString(),
      });
      console.log(`📸 Firestore güncellendi: instagramId=${instagramPostId}`);
    } catch (err) {
      console.warn("Instagram ID güncellenemedi:", err.message);
    }
  }

  console.log("==========================================");
  console.log(`✅ TAMAMLANDI → ${videoId}`);
  console.log("==========================================");
}

main().catch((err) => {
  console.error("❌ Hata oluştu:", err);
  process.exit(1);
});
