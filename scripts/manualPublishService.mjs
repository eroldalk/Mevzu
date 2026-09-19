// scripts/manualPublishService.mjs
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { uploadAndPublishReel } from "./test_publish_reel.mjs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc } from "firebase/firestore";

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

// Cached bundle promise to avoid re-bundling webpack on every click
let cachedBundlePromise = null;
function getWebpackBundle() {
  if (!cachedBundlePromise) {
    const entryPoint = path.join(rootDir, "src", "remotion", "index.js");
    cachedBundlePromise = bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });
  }
  return cachedBundlePromise;
}

export async function manualRenderAndPublish(params, onProgress = () => {}) {
  const {
    quote = "İnsan bir kamıştır, ama düşünen bir kamıştır.",
    author = "Blaise Pascal",
    category = "FELSEFE",
    bgStyle = "ocean",
    musicUrl = null,
    primaryColor = "#c9a84c",
    highlightColor = "#f5c542",
    animStyle = "highlight",
    fontFamily = "'DM Sans', sans-serif",
    caption = "",
    quoteId = null,
  } = params;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 5).replace(":", "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const videoId = `reel_${dateStr}_${timeStr}_${rand}`;

  onProgress({ step: "bundling", message: "🎬 Remotion motoru hazırlanıyor..." });
  const bundleLocation = await getWebpackBundle();

  const renderProps = {
    quote,
    author,
    category,
    bgStyle,
    musicUrl,
    primaryColor,
    highlightColor,
    animStyle,
    fontFamily,
  };

  onProgress({ step: "selecting_comp", message: "📐 Kompozisyon seçiliyor..." });
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MevzuReels",
    inputProps: renderProps,
  });

  const outputDir = path.join(rootDir, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `${videoId}.mp4`;
  const outputLocation = path.join(outputDir, fileName);

  onProgress({ step: "rendering", message: `⚡ 1080×1920 MP4 renderlanıyor (${fileName})...` });
  console.log(`[Manuel Yayın] Render başlatıldı: ${outputLocation}`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps: renderProps,
  });

  console.log(`[Manuel Yayın] Render bitti: ${outputLocation}`);

  // 📸 2.5. Saniyeden (Kare 75) Tam Metinli Instagram Kapak Fotoğrafı Üret
  const coverFileName = `${videoId}_cover.jpg`;
  const coverLocation = path.join(outputDir, coverFileName);
  try {
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: coverLocation,
      inputProps: renderProps,
      frame: 75,
      imageFormat: "jpeg",
    });
    console.log(`[Manuel Yayın] Kapak görseli oluşturuldu: ${coverLocation}`);
  } catch (stillErr) {
    console.warn("[Manuel Yayın] Kapak üretme uyarısı:", stillErr.message);
  }

  onProgress({ step: "uploading", message: "🚀 Instagram Meta sunucularına yükleniyor..." });

  // Instagram Graph API ile Resumable Reels yükle (thumb_offset: 2500 ile kapak zorunlu tam yazılı kare olur!)
  const instagramPostId = await uploadAndPublishReel({
    videoFilePath: outputLocation,
    caption: caption || `${quote} — ${author}\n\n#mevzu`,
    thumbOffset: 2500,
  });

  onProgress({ step: "updating_db", message: "💾 Veritabanı ve arşiv güncelleniyor..." });

  // Firestore video kaydı
  try {
    await setDoc(doc(db, "videos", videoId), {
      videoId,
      quoteId: quoteId || null,
      quote,
      author,
      category,
      bgStyle,
      musicUrl,
      fileName,
      coverFileName,
      caption,
      renderedAt: new Date().toISOString(),
      instagramId: instagramPostId,
      published: true,
      publishedAt: new Date().toISOString(),
      manualPublish: true,
    });

    if (quoteId && !quoteId.startsWith("local-")) {
      await updateDoc(doc(db, "quotes", quoteId), {
        used: true,
        usedAt: new Date().toISOString(),
      });
    }
  } catch (dbErr) {
    console.warn("[Manuel Yayın] Firestore güncelleme uyarısı:", dbErr.message);
  }

  return {
    success: true,
    videoId,
    instagramId: instagramPostId,
    permalink: "https://www.instagram.com/mevzusozler/",
    fileName,
  };
}
