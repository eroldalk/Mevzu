// scripts/renderAndPublish.mjs
// %100 Otonom Instagram Reels Üretim ve Yayınlama Motoru
// 1. Firestore'dan kullanılmamış sözü çeker ve 'used: true' damgalar.
// 2. Gemini AI ile söze özel kanca, açıklama ve hashtagleri üretir.
// 3. Remotion ile 1080x1920 (9:16) MP4 videoyu renderlar.
// 4. Instagram Graph API (Reels Publishing) ile doğrudan yayına alır.

import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, limit } from "firebase/firestore";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { generateInstagramCaption } from "./generateCaption.mjs";
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

// 1. Firestore'dan kullanılmamış sıradaki sözü çek
async function fetchUnusedQuote() {
  console.log("🔍 Firestore'dan kullanılmamış söz aranıyor...");
  const quotesRef = collection(db, "quotes");
  
  // used == false olanları çek
  const q = query(quotesRef, where("used", "!=", true), limit(10));
  const snapshot = await getDocs(q);

  let selectedDoc = null;
  if (!snapshot.empty) {
    const docs = snapshot.docs;
    selectedDoc = docs[Math.floor(Math.random() * docs.length)];
  } else {
    // Tüm sözler kullanıldıysa veya filtre uyuşmadıysa rastgele bir söz seç
    console.log("ℹ️  Kullanılmamış söz kalmadı veya bulunamadı, genel havuzdan seçiliyor...");
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
  // Sözü anında 'used: true' olarak damgala (bir daha asla kullanılmasın)
  try {
    await updateDoc(doc(db, "quotes", selectedDoc.id), {
      used: true,
      usedAt: new Date().toISOString(),
    });
    console.log(`✅ Söz kullanıldı olarak damgalandı: ID [${selectedDoc.id}]`);
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

// 2. Remotion ile 1080x1920 MP4 Video Render
async function renderReelsVideo({ quote, author, category }) {
  console.log("🎬 Remotion video motoru hazırlanıyor...");
  const entryPoint = path.join(rootDir, "src", "remotion", "index.js");

  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MevzuReels",
    inputProps: {
      quote,
      author,
      category,
      primaryColor: "#c9a84c",
      highlightColor: "#f5c542",
    },
  });

  const outputDir = path.join(rootDir, "output");
  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `reels_${Date.now()}.mp4`;
  const outputLocation = path.join(outputDir, fileName);

  console.log(`⚡ 1080×1920 30FPS MP4 render başlatılıyor: ${fileName}`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps: {
      quote,
      author,
      category,
      primaryColor: "#c9a84c",
      highlightColor: "#f5c542",
    },
  });

  console.log(`🎉 Video render tamamlandı: ${outputLocation}`);
  return { outputLocation, fileName };
}

// 3. Instagram Graph API ile Reels Yayınlama
async function publishToInstagramReels({ videoPublicUrl, caption }) {
  const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!instagramAccountId || !accessToken) {
    console.log("ℹ️  [BİLGİ] INSTAGRAM_ACCOUNT_ID veya INSTAGRAM_ACCESS_TOKEN tanımlı değil.");
    console.log("    Video ve açıklama yerel 'output/' klasörüne kaydedildi.");
    console.log("    Token tanımlandığında Instagram'a doğrudan otomatik yüklenecektir.");
    return false;
  }

  console.log("🚀 Instagram Graph API ile Reels yükleme başlatılıyor...");

  // Adım A: Media Container Oluştur
  const containerRes = await fetch(
    `https://graph.facebook.com/v20.0/${instagramAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoPublicUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  const containerData = await containerRes.json();
  if (!containerRes.ok || !containerData.id) {
    throw new Error(`Media Container oluşturulamadı: ${JSON.stringify(containerData)}`);
  }

  const creationId = containerData.id;
  console.log(`📦 Media container oluşturuldu: ID [${creationId}]. İşlenmesi bekleniyor...`);

  // Adım B: Video işlenme durumunu bekle
  let isReady = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const statusRes = await fetch(
      `https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    console.log(`⏳ Video durumu: ${statusData.status_code || "BEKLENİYOR"}`);

    if (statusData.status_code === "FINISHED") {
      isReady = true;
      break;
    } else if (statusData.status_code === "ERROR") {
      throw new Error(`Instagram video işleme hatası: ${JSON.stringify(statusData)}`);
    }
  }

  if (!isReady) {
    throw new Error("Video işleme zaman aşımına uğradı.");
  }

  // Adım C: Reels'ı Canlıya Al (Publish)
  console.log("🌟 Video hazır! Reels yayına alınıyor...");
  const publishRes = await fetch(
    `https://graph.facebook.com/v20.0/${instagramAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Yayınlama başarısız: ${JSON.stringify(publishData)}`);
  }

  console.log(`🔥 TEBRİKLER! Reels Instagram'da canlı yayında! Gönderi ID: ${publishData.id}`);
  return true;
}

// --- ANA ÇALIŞTIRMA FONKSİYONU ---
async function main() {
  console.log("==========================================");
  console.log("🚀 #MEVZU OTOMASYON MOTORU BAŞLATILDI");
  console.log("==========================================");

  // 1. Sözü çek
  const quoteData = await fetchUnusedQuote();
  console.log(`📖 Seçilen Söz: "${quoteData.quote}" — ${quoteData.author}`);

  // 2. Açıklamayı Gemini AI ile üret
  console.log("✍️  Gemini AI ile Instagram açıklaması üretiliyor...");
  const caption = await generateInstagramCaption({
    quote: quoteData.quote,
    author: quoteData.author,
    category: quoteData.cat,
  });

  console.log("\n--- ÜRETİLEN INSTAGRAM AÇIKLAMASI ---");
  console.log(caption);
  console.log("------------------------------------\n");

  // 3. Videoyu renderla
  const { outputLocation, fileName } = await renderReelsVideo({
    quote: quoteData.quote,
    author: quoteData.author,
    category: quoteData.cat,
  });

  // 4. Instagram'a gönder (Token varsa)
  await publishToInstagramReels({
    videoPublicUrl: process.env.VIDEO_PUBLIC_URL || null,
    caption,
  });

  console.log("==========================================");
  console.log("✅ İŞLEM BAŞARIYLA TAMAMLANDI");
  console.log("==========================================");
}

main().catch((err) => {
  console.error("❌ Hata oluştu:", err);
  process.exit(1);
});
