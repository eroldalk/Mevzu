import { Markup } from "telegraf";
import { approveContent, rejectContent } from "./content-service.js";
import { loadSettings } from "./config.js";
import { isJobRunning, runGenerationJob } from "./job-runner.js";
import { formatTime, sendContent } from "./notifications.js";
import { getNextSchedule } from "./scheduler.js";
import { getItem, getLastItem, patchItem, readState, setTargetChatId } from "./store.js";

function launchJob(ctx, options) {
  ctx.reply("İstek alındı. Görsel post tamamlanınca buraya gönderilecek.");
  runGenerationJob(ctx.telegram, { chatId: ctx.chat.id, ...options }).catch((error) => ctx.reply(`❌ Üretim tamamlanamadı: ${error.message}`));
}
export function registerCommands(bot) {
  bot.start(async (ctx) => { await setTargetChatId(ctx.chat.id); await ctx.reply("✅ Mevzu bot aktif. Görsel post planı ve yönetim komutları hazır."); });
  bot.command("durum", async (ctx) => {
    const state = await readState(); const last = state.items[0];
    await ctx.reply(`🤖 Sistem: ${isJobRunning() ? "Post üretiyor" : "Çalışıyor"}\nSon üretim: ${last ? formatTime(last.createdAt) : "Henüz yok"}\nSon durum: ${last?.status || "—"}\nSonraki otomatik saat: ${getNextSchedule()}\nSaat dilimi: ${loadSettings().timezone}`);
  });
  bot.command("post", (ctx) => launchJob(ctx, { source: "command:post" }));
  bot.command("yeni", (ctx) => launchJob(ctx, { source: "command:new" }));
  bot.command("yenile", async (ctx) => { const last = await getLastItem(); if (!last) return ctx.reply("Yenilenecek post yok."); launchJob(ctx, { sameQuoteId: last.id, source: "command:refresh" }); });
  bot.command("son", async (ctx) => { const item = await getLastItem(); return item ? sendContent(ctx, ctx.chat.id, item) : ctx.reply("Henüz üretilmiş post yok."); });
  bot.command("bekleyen", async (ctx) => {
    const pending = (await readState()).items.filter((x) => x.status === "pending");
    return pending.length ? ctx.reply(pending.slice(0, 20).map((x) => `• ${x.id} — ${x.author}\n${x.quote}`).join("\n\n")) : ctx.reply("Bekleyen post yok.");
  });
  bot.command("istatistik", async (ctx) => {
    const items = (await readState()).items; const count = (status) => items.filter((x) => x.status === status).length;
    return ctx.reply(`📊 Mevzu İstatistikleri\n\nToplam: ${items.length}\nBekleyen: ${count("pending")}\nOnaylanan: ${count("approved")}\nReddedilen: ${count("rejected")}`);
  });
  bot.action(/^approve:(.+)$/, async (ctx) => {
    const item = await getItem(ctx.match[1]); if (!item) return ctx.answerCbQuery("Post bulunamadı.");
    if (item.status !== "approved") { await approveContent(item); await patchItem(item.id, { status: "approved", approvedAt: new Date().toISOString() }); }
    await ctx.answerCbQuery("Onaylandı");
    return ctx.editMessageReplyMarkup({ inline_keyboard: [[Markup.button.callback("✅ ONAYLANDI", `detail:${item.id}`)]] });
  });
  bot.action(/^reject:(.+)$/, async (ctx) => {
    const item = await getItem(ctx.match[1]); if (!item) return ctx.answerCbQuery("Post bulunamadı.");
    if (item.status !== "rejected") { await rejectContent(item); await patchItem(item.id, { status: "rejected", rejectedAt: new Date().toISOString() }); }
    await ctx.answerCbQuery("Reddedildi");
    return ctx.editMessageReplyMarkup({ inline_keyboard: [[Markup.button.callback("❌ REDDEDİLDİ", `detail:${item.id}`)]] });
  });
  bot.action(/^refresh:(.+)$/, async (ctx) => { await ctx.answerCbQuery("Yeni varyasyon hazırlanıyor"); launchJob(ctx, { sameQuoteId: ctx.match[1], source: `button:refresh:${ctx.match[1]}` }); });
  bot.action(/^new:(.+)$/, async (ctx) => { await ctx.answerCbQuery("Yeni Mevzu hazırlanıyor"); launchJob(ctx, { source: `button:new:${ctx.match[1]}` }); });
  bot.action(/^detail:(.+)$/, async (ctx) => {
    const item = await getItem(ctx.match[1]); if (!item) return ctx.answerCbQuery("Post bulunamadı."); await ctx.answerCbQuery();
    return ctx.reply(`ℹ️ Post Detayı\n\nSöz kaynağı: ${item.author}\nKategori: ${item.category}\nTema: ${item.background}\nAçıklama: ${item.caption}\nHashtag: ${item.hashtags || "—"}\nDosya: ${item.imagePath}\nÜretim: ${formatTime(item.createdAt)}\nDurum: ${item.status}\nID: ${item.id}`);
  });
}
