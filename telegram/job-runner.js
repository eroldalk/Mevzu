import { generateContent } from "./content-service.js";
import { getConfiguredChatId, loadSettings } from "./config.js";
import { sendContent, sendError } from "./notifications.js";
import { readState, setLastError } from "./store.js";
let runningJob = null;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function resolveChatId(explicit) {
  if (explicit) return String(explicit);
  const saved = (await readState()).targetChatId;
  return saved || getConfiguredChatId();
}
export const isJobRunning = () => Boolean(runningJob);
export async function runGenerationJob(bot, { chatId, sameQuoteId = null, source = "manual" } = {}) {
  if (runningJob) throw new Error("Başka bir içerik üretimi halen devam ediyor.");
  const target = await resolveChatId(chatId);
  if (!target) throw new Error("Hedef sohbet ayarlı değil. Yetkili hesapla /start gönderin.");
  const settings = loadSettings();
  const telegramClient = bot.telegram || bot;
  runningJob = (async () => {
    let lastError;
    for (let attempt = 1; attempt <= settings.maxRetries; attempt += 1) {
      try {
        if (attempt === 1) await telegramClient.sendMessage(target, "⏳ Mevzu görsel postu üretiliyor…");
        const item = await generateContent({ sameQuoteId, source });
        await sendContent({ telegram: telegramClient }, target, item);
        await telegramClient.sendMessage(target, "✅ İçerik başarıyla üretildi.");
        await setLastError(null);
        return item;
      } catch (error) {
        lastError = error;
        await setLastError({ message: error.message, stage: "Görsel post üretimi", at: new Date().toISOString() });
        try { await sendError({ telegram: telegramClient }, target, { stage: "Görsel post üretimi", error, attempt, maxRetries: settings.maxRetries }); } catch {}
        if (attempt < settings.maxRetries) await delay(settings.retryDelaySeconds * 1000);
      }
    }
    throw lastError;
  })();
  try { return await runningJob; } finally { runningJob = null; }
}
