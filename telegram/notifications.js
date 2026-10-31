import { Input, Markup } from "telegraf";
export const keyboard = (id) => Markup.inlineKeyboard([
  [Markup.button.callback("✅ ONAYLA", `approve:${id}`), Markup.button.callback("🔄 YENİLE", `refresh:${id}`)],
  [Markup.button.callback("🆕 YENİ POST", `new:${id}`), Markup.button.callback("❌ REDDET", `reject:${id}`)],
  [Markup.button.callback("ℹ️ DETAY", `detail:${id}`)],
]);
const trim = (text, limit) => text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
export function formatTime(value) {
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}
export async function sendContent(bot, chatId, item) {
  const photoCaption = trim(`🖼️ ${item.quote}\n— ${item.author}\n\n🕒 ${formatTime(item.createdAt)}`, 1000);
  await bot.telegram.sendPhoto(chatId, Input.fromLocalFile(item.imagePath), { caption: photoCaption });
  const details = trim(`📝 Ana fikir\n${item.mainIdea}\n\n📣 Instagram açıklaması\n${item.caption}\n\n#️⃣ Hashtagler\n${item.hashtags || "Açıklama içinde"}\n\n🎨 Arka plan: ${item.background}\n🕒 Üretim: ${formatTime(item.createdAt)}\n🆔 ${item.id}`, 4000);
  await bot.telegram.sendMessage(chatId, details, keyboard(item.id));
}
export async function sendError(bot, chatId, { stage, error, attempt, maxRetries }) {
  await bot.telegram.sendMessage(chatId, `⚠️ Mevzu Hatası\n\nSaat: ${formatTime(new Date())}\nAşama: ${stage}\nHata: ${trim(error.message || String(error), 800)}\nTekrar deneme: ${attempt}/${maxRetries}`);
}
