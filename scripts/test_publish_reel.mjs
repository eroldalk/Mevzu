// scripts/test_publish_reel.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function getCredentials() {
  const envPath = path.join(rootDir, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const [k, ...v] = line.split("=");
      if (k && v.length) {
        process.env[k.trim()] = v.join("=").trim();
      }
    });
  }
  return {
    accountId: process.env.INSTAGRAM_ACCOUNT_ID,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  };
}

export async function uploadAndPublishReel({ videoFilePath, caption, thumbOffset = 2500 }) {
  const { accountId, accessToken } = getCredentials();
  if (!accountId || !accessToken) {
    throw new Error("INSTAGRAM_ACCOUNT_ID veya INSTAGRAM_ACCESS_TOKEN bulunamadı!");
  }
  console.log(`🎬 Video hazırlanıyor: ${videoFilePath}`);
  if (!fs.existsSync(videoFilePath)) {
    throw new Error(`Video dosyası bulunamadı: ${videoFilePath}`);
  }

  const fileStats = fs.statSync(videoFilePath);
  const fileSize = fileStats.size;
  console.log(`📦 Dosya boyutu: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

  // 1. Resumable Media Container Oluştur
  console.log("📡 1/4: Meta'dan yükleme oturumu (Media Container) isteniyor...");
  const initRes = await fetch(`https://graph.facebook.com/v21.0/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_type: "resumable",
      media_type: "REELS",
      caption: caption || "#mevzu",
      thumb_offset: thumbOffset, // 2.5 saniye (2500ms) - tüm yazının eksiksiz göründüğü an kapak olur!
      access_token: accessToken,
    }),
  });

  const initData = await initRes.json();
  if (!initRes.ok || !initData.id || !initData.uri) {
    throw new Error(`Konteyner oluşturulamadı: ${JSON.stringify(initData)}`);
  }

  const containerId = initData.id;
  const uploadUri = initData.uri;
  console.log(`✅ Oturum açıldı! Konteyner ID: ${containerId}`);

  // 2. Video dosyasını binary olarak Meta'ya yükle
  console.log("⬆️  2/4: Video Meta rupload sunucularına doğrudan yükleniyor...");
  const videoBuffer = fs.readFileSync(videoFilePath);

  const uploadRes = await fetch(uploadUri, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${accessToken}`,
      offset: "0",
      file_size: fileSize.toString(),
      "Content-Type": "application/octet-stream",
    },
    body: videoBuffer,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || uploadData.success === false) {
    throw new Error(`Video yükleme başarısız: ${JSON.stringify(uploadData)}`);
  }
  console.log("✅ Video başarıyla Meta'ya yüklendi!");

  // 3. Videonun Instagram sunucusunda işlenmesini bekle
  console.log("⏳ 3/4: Instagram videoyu işliyor (FINISHED bekleniyor)...");
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5000)); // 5 sn bekle
    const pollRes = await fetch(
      `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const pollData = await pollRes.json();
    const status = pollData.status_code || "BEKLENIYOR";
    console.log(`   [${i + 1}/30] Durum: ${status}`);

    if (status === "FINISHED") {
      ready = true;
      break;
    }
    if (status === "ERROR") {
      throw new Error(`Instagram video işleme hatası: ${JSON.stringify(pollData)}`);
    }
  }

  if (!ready) {
    throw new Error("Instagram video işleme süresi zaman aşımına uğradı.");
  }

  // 4. Reels'ı Canlıya Al (Publish)
  console.log("🚀 4/4: Video hazır! Reels Instagram'da canlıya alınıyor...");
  const pubRes = await fetch(`https://graph.facebook.com/v21.0/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  });

  const pubData = await pubRes.json();
  if (!pubRes.ok || !pubData.id) {
    throw new Error(`Yayınlama başarısız oldu: ${JSON.stringify(pubData)}`);
  }

  console.log("🎉🎉🎉 TEBRİKLER! REELS BAŞARIYLA YAYINLANDI! 🎉🎉🎉");
  console.log(`📌 Gönderi ID: ${pubData.id}`);
  console.log(`🔗 Instagram: https://www.instagram.com/mevzusozler/`);
  return pubData.id;
}

// Test amaçlı doğrudan çalıştırıldığında:
const sampleVideo = path.join(rootDir, "output", "reel_20260916_2303_M4L0.mp4");
const sampleCaption = `Niccolò Machiavelli — Prens.

Bir insanı tanımak mı istiyorsun, yoksa ona güç verdiğinde neye dönüşeceğini izlemek mi?

Düşünceni yorumlarda belirt 👇
Kendine hatırlatmak için kaydet 📌
.
.
#machiavelli #güç #strateji #insandoğası #felsefe #gerçekler #mevzu`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  uploadAndPublishReel({
    videoFilePath: sampleVideo,
    caption: sampleCaption,
  }).catch((err) => {
    console.error("❌ Yayınlama hatası:", err);
  });
}
