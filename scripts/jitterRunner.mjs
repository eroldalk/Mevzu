// scripts/jitterRunner.mjs
// Anti-Bot Koruma Mekanizması:
// Belirlenen saatte uyanır, 1 ila 5 dakika (60 - 300 saniye) arasında
// rastgele bir süre bekler (jitter), ardından render ve yayınlamayı başlatır.
// Böylece Instagram algoritması hesabın otomatik bot olmadığını anlar.

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 60 ile 240 saniye arasında rastgele bekleme süresi
const minSeconds = 60;
const maxSeconds = 240;
const jitterSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;

console.log("==========================================");
console.log(`🛡️  ANTI-BOT JITTER DEVREDE`);
console.log(`⏳ Rastgele İnsan Davranışı Sapması: ${jitterSeconds} saniye bekleniyor...`);
console.log("==========================================");

setTimeout(() => {
  console.log("🚀 Bekleme tamamlandı, yayın motoru çalıştırılıyor...");
  const scriptPath = path.join(__dirname, "renderAndPublish.mjs");
  
  const child = spawn("node", [scriptPath], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code);
  });
}, jitterSeconds * 1000);
