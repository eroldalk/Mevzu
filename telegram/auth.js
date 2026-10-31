import { getAllowedUserId, getConfiguredChatId } from "./config.js";
export async function requireAuthorization(ctx, next) {
  const explicitUserId = getAllowedUserId();
  const configuredChatId = getConfiguredChatId();
  const fromId = String(ctx.from?.id || "");
  const chatId = String(ctx.chat?.id || "");
  const explicitMatch = Boolean(explicitUserId && fromId === explicitUserId);
  const privateChatFallback = Boolean(!explicitUserId && configuredChatId && ctx.chat?.type === "private" && chatId === configuredChatId && fromId === chatId);
  if (explicitMatch || privateChatFallback) return next();
  const ownId = fromId || "bilinmiyor";
  return ctx.reply(`⛔ Yönetim komutları yetkisiz kullanıcılara kapalıdır.\n\nTelegram kullanıcı ID'niz: ${ownId}\n.env dosyasına TELEGRAM_ALLOWED_USER_ID=${ownId} ekleyip botu yeniden başlatın.`);
}
