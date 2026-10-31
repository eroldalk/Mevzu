// scripts/telegramNotify.mjs
// GitHub Actions'tan Telegram bildirimi gönderir. Bilgisayar kapalıyken de çalışır.
// Bildirim hatası yayını asla durdurmaz; yalnızca loglanır.

import fs from "node:fs/promises";
import path from "node:path";

const CAPTION_LIMIT = 1000;

const trim = (text, limit) => (text.length <= limit ? text : `${text.slice(0, limit - 1)}…`);

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return token && chatId ? { token, chatId } : null;
}

async function callTelegram(method, body, config) {
  const res = await fetch(`https://api.telegram.org/bot${config.token}/${method}`, { method: "POST", body });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${json.description || res.status}`);
}

export async function sendTelegramMessage(text, replyMarkup = null) {
  const config = getConfig();
  if (!config) return false;
  try {
    const body = new URLSearchParams({ chat_id: config.chatId, text: trim(text, 4000) });
    if (replyMarkup) body.append("reply_markup", JSON.stringify(replyMarkup));
    await callTelegram("sendMessage", body, config);
    return true;
  } catch (err) {
    console.warn("⚠️ Telegram bildirimi gönderilemedi:", err.message);
    return false;
  }
}

// mediaType: "video" | "photo"
export async function sendTelegramMedia(filePath, caption, mediaType = "video", replyMarkup = null) {
  const config = getConfig();
  if (!config) return false;
  try {
    const buffer = await fs.readFile(filePath);
    const body = new FormData();
    body.append("chat_id", config.chatId);
    body.append("caption", trim(caption, CAPTION_LIMIT));
    if (replyMarkup) body.append("reply_markup", JSON.stringify(replyMarkup));
    body.append(mediaType, new Blob([buffer]), path.basename(filePath));
    await callTelegram(mediaType === "video" ? "sendVideo" : "sendPhoto", body, config);
    return true;
  } catch (err) {
    console.warn("⚠️ Telegram medyası gönderilemedi, metin deneniyor:", err.message);
    return sendTelegramMessage(caption, replyMarkup);
  }
}

export const formatSuccess = ({ slotId, quote, author, permalink }) =>
  `✅ Yayınlandı (${slotId})\n\n${quote}\n— ${author}\n\n${permalink || "Instagram bağlantısı alınamadı"}`;

export const formatFailure = ({ slotId, message }) =>
  `⚠️ Yayın hatası (${slotId})\n\n${message}`;

export const formatSkipped = ({ slotId, delayMinutes }) =>
  `⏭️ Slot atlandı (${slotId})\n\n${delayMinutes} dakika gecikti, sonraki slota geçildi.`;
