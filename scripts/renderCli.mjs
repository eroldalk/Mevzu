// scripts/renderCli.mjs
// Remotion Studio'dan kopyalanan parametrelerle 1080x1920 MP4 sesli video render aracı
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const outputFileName = args[0] || `reel_${Date.now()}.mp4`;
  const propsArg = args[1];

  let inputProps = {};
  if (propsArg) {
    try {
      inputProps = JSON.parse(propsArg);
    } catch (e) {
      console.warn("⚠️ Props parse edilemedi, varsayilanlar kullaniliyor.");
    }
  }

  console.log("==========================================");
  console.log("🎬 REMOTION MP4 RENDER MOTORU BAŞLATILDI");
  console.log("==========================================");
  console.log(`📄 Çikti Dosyasi: output/${outputFileName}`);
  if (inputProps.quote) console.log(`📖 Alinti: "${inputProps.quote.slice(0, 45)}..."`);
  if (inputProps.musicUrl) console.log(`🎵 Müzik: ${inputProps.musicUrl}`);
  if (inputProps.bgStyle) console.log(`🎨 Arka Plan: ${inputProps.bgStyle}`);

  const entryPoint = path.join(rootDir, "src", "remotion", "index.js");
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MevzuReels",
    inputProps,
  });

  const outputDir = path.join(rootDir, "output");
  await fs.mkdir(outputDir, { recursive: true });

  const finalName = outputFileName.endsWith(".mp4") ? outputFileName : `${outputFileName}.mp4`;
  const outputLocation = path.join(outputDir, finalName);

  console.log(`⚡ 1080x1920 30FPS MP4 render başliyor... Lütfen bekleyin.`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps,
  });

  console.log("\n==========================================");
  console.log(`🎉 TEBRIKLER! Videonuz tam sesli ve HD olarak hazir:`);
  console.log(`📁 ${outputLocation}`);
  console.log("==========================================\n");
}

main().catch((err) => {
  console.error("❌ Render Hatasi:", err);
  process.exit(1);
});
