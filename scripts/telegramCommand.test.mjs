import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { draftButtons, findPlacePhotos, parseRequest } from "./telegramRequest.mjs";
import worker from "../cloudflare/telegram-worker.js";

const env = { TELEGRAM_BOT_TOKEN: "t", WEBHOOK_SECRET: "gizli", ALLOWED_USER_ID: "42", GITHUB_TOKEN: "g" };
const realFetch = globalThis.fetch;
let calls;

beforeEach(() => {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
    return { ok: true };
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const send = (update, secret = "gizli") => worker.fetch(new Request("https://w/", {
  method: "POST",
  headers: { "X-Telegram-Bot-Api-Secret-Token": secret },
  body: JSON.stringify(update),
}), env);
const message = (text, id = 42) => ({ message: { text, from: { id }, chat: { id } } });
const dispatches = () => calls.filter((c) => c.url.includes("dispatches"));

test("söz ve tema çözülür", () => {
  assert.deepEqual(parseRequest("Olmadıysa vardır bir hayır. | Orman"), { quote: "Olmadıysa vardır bir hayır.", theme: "forest", unknownTheme: null });
  assert.equal(parseRequest("Söz | gün batımı").theme, "sunset");
});

test("boş metin havuzdan seçim demektir", () => {
  assert.deepEqual(parseRequest(""), { quote: null, theme: null, unknownTheme: null });
});

test("bilinmeyen tema bildirilir", () => {
  assert.equal(parseRequest("Söz | uzay").unknownTheme, "uzay");
});

test("düğmeler Telegram sınırına sığar", () => {
  const id = "tg_20261031203000_ABCD";
  for (const button of draftButtons(id).inline_keyboard.flat()) assert.ok(button.callback_data.length <= 64);
});

test("/post önizleme başlatır", async () => {
  await send(message("/post Söz | orman"));
  assert.deepEqual(dispatches()[0].body, { ref: "main", inputs: { action: "preview", format: "post", text: "Söz | orman" } });
});

test("/reels biçimi doğru gider", async () => {
  await send(message("/reels"));
  assert.equal(dispatches()[0].body.inputs.format, "reels");
});

test("yetkisiz kullanıcı hiçbir şey başlatamaz", async () => {
  await send(message("/post", 7));
  assert.equal(calls.length, 0);
});

test("yanlış gizli anahtar reddedilir", async () => {
  const res = await send(message("/post"), "yanlis");
  assert.equal(res.status, 401);
  assert.equal(calls.length, 0);
});

test("Yayınla düğmesi yayını başlatır ve düğmeleri kaldırır", async () => {
  await send({ callback_query: { id: "1", data: "publish:tg_1", from: { id: 42 }, message: { message_id: 9, chat: { id: 42 } } } });
  assert.deepEqual(dispatches()[0].body.inputs, { action: "publish", draft_id: "tg_1" });
  assert.ok(calls.some((c) => c.url.endsWith("editMessageReplyMarkup")));
});

test("bilinmeyen düğme yayın başlatmaz", async () => {
  await send({ callback_query: { id: "1", data: "sil:tg_1", from: { id: 42 } } });
  assert.equal(dispatches().length, 0);
});

test("/temalar GitHub'ı çalıştırmaz", async () => {
  await send(message("/temalar"));
  assert.equal(dispatches().length, 0);
  assert.ok(calls[0].body.text.includes("orman"));
});

test("ülke adı birden çok yapıyı kapsar", () => {
  const pool = [{ id: 1, place: "ayasofya" }, { id: 2, place: "diger:istanbul historic" }, { id: 3, place: "eyfel" }];
  assert.deepEqual(findPlacePhotos(pool, "Türkiye").map((p) => p.id), [1, 2]);
  assert.deepEqual(findPlacePhotos(pool, "avrupa").map((p) => p.id), [3]);
});

test("sözün ilk harfi büyütülür", () => {
  assert.equal(parseRequest("damlaya damlaya göl olur").quote, "Damlaya damlaya göl olur");
  assert.equal(parseRequest("ince söz").quote, "İnce söz");
});

test("yapı adı havuzda bulunur", () => {
  const pool = [{ id: 1, place: "kolezyum" }, { id: 2, place: "ozgurluk" }, { id: 3, place: "diger:ancient city" }];
  assert.deepEqual(findPlacePhotos(pool, "Kolezyum").map((p) => p.id), [1]);
  assert.deepEqual(findPlacePhotos(pool, "özgürlük heykeli").map((p) => p.id), [2]);
  assert.deepEqual(findPlacePhotos(pool, "ancient"), []);
  assert.deepEqual(findPlacePhotos(pool, "uzay"), []);
});
