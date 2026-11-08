// Telegram komutlarını alır, üretim için GitHub Actions'ı başlatır.
// Cloudflare Worker olarak yayınlanır; tek dosyadır, başka dosyaya bağlı değildir.
// Gerekli değişkenler: TELEGRAM_BOT_TOKEN, WEBHOOK_SECRET, ALLOWED_USER_ID, GITHUB_TOKEN

const WORKFLOW_URL = "https://api.github.com/repos/eroldalk/Mevzu/actions/workflows/telegram-command.yml/dispatches";

const HELP = `Komutlar:
/post — Havuzdan söz, otomatik tema
/reels — Aynısı, video olarak
/post söz | seçim — Kendi sözün, istersen bölge veya yapı
/reels söz | seçim — Aynısı, video olarak
/temalar — Bölge, yapı ve tema listesi
/durum — Bugünün yayınları ve kalan söz`;

const THEMES = `Kullanım: /post söz | seçim

Bölgeler: türkiye, italya, yunanistan, mısır, avrupa, asya, amerika

Yapılar: ayasofya, sultanahmet, süleymaniye, selimiye, galata, kız kulesi, efes, bergama, aspendos, nemrut, mardin, safranbolu, kapadokya, kolezyum, pantheon, pompeii, trevi, pisa, venedik, akropolis, delfi, eyfel, zafer takı, notre dame, louvre, big ben, stonehenge, sagrada, neuschwanstein, brandenburg, elhamra, piramit, sfenks, petra, tac mahal, çin seddi, angkor, semerkant, özgürlük, golden gate, machu picchu, moai

Eski temalar: orman, gün batımı, yağmur, şehir, gece, deniz

Seçim yazmazsan fotoğrafı sistem seçer.`;

async function telegram(env, method, body) {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function dispatch(env, inputs) {
  const res = await fetch(WORKFLOW_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "mevzu-telegram-worker",
    },
    body: JSON.stringify({ ref: "main", inputs }),
  });
  return res.ok;
}

async function handleMessage(env, message) {
  const chat_id = message.chat.id;
  const reply = (text) => telegram(env, "sendMessage", { chat_id, text });
  const [, command, rest = ""] = (message.text || "").match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/) || [];

  if (command === "post" || command === "reels") {
    const started = await dispatch(env, { action: "preview", format: command, text: rest.trim() });
    return reply(started ? "⏳ Hazırlanıyor, 2-3 dakika sürer." : "❌ Üretim başlatılamadı.");
  }
  if (command === "durum") {
    const started = await dispatch(env, { action: "status" });
    return reply(started ? "⏳ Durum hazırlanıyor." : "❌ Durum alınamadı.");
  }
  if (command === "temalar") return reply(THEMES);
  return reply(HELP);
}

async function handleCallback(env, query) {
  const [action, draftId] = String(query.data || "").split(":");
  if (!["publish", "refresh", "cancel", "manual"].includes(action) || !draftId) {
    return telegram(env, "answerCallbackQuery", { callback_query_id: query.id, text: "Geçersiz işlem" });
  }

  const started = await dispatch(env, { action, draft_id: draftId });
  const labels = { publish: "Yayınlanıyor", refresh: "Yenileniyor", cancel: "İptal ediliyor", manual: "Kaydediliyor" };
  await telegram(env, "answerCallbackQuery", { callback_query_id: query.id, text: started ? labels[action] : "Başlatılamadı" });
  // İkinci basışı önlemek için düğmeler kaldırılır
  if (started && query.message) {
    await telegram(env, "editMessageReplyMarkup", { chat_id: query.message.chat.id, message_id: query.message.message_id, reply_markup: { inline_keyboard: [] } });
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("ok");
    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
      return new Response("yetkisiz", { status: 401 });
    }

    const update = await request.json();
    const senderId = String(update.message?.from?.id || update.callback_query?.from?.id || "");
    if (senderId === String(env.ALLOWED_USER_ID)) {
      if (update.callback_query) await handleCallback(env, update.callback_query);
      else if (update.message) await handleMessage(env, update.message);
    }
    return new Response("ok");
  },
};
