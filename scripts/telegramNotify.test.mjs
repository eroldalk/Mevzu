import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { formatFailure, formatSkipped, formatSuccess, sendTelegramMedia, sendTelegramMessage } from "./telegramNotify.mjs";

const realFetch = globalThis.fetch;
let calls;

beforeEach(() => {
  calls = [];
  process.env.TELEGRAM_BOT_TOKEN = "t";
  process.env.TELEGRAM_CHAT_ID = "1";
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return { json: async () => ({ ok: true }) }; };
});
afterEach(() => { globalThis.fetch = realFetch; });

test("ayar yoksa sessizce geçer", async () => {
  delete process.env.TELEGRAM_CHAT_ID;
  assert.equal(await sendTelegramMessage("x"), false);
  assert.equal(calls.length, 0);
});

test("mesaj gönderir", async () => {
  assert.equal(await sendTelegramMessage("merhaba"), true);
  assert.match(calls[0].url, /bott\/sendMessage$/);
});

test("Telegram hatası yayını durdurmaz", async () => {
  globalThis.fetch = async () => ({ json: async () => ({ ok: false, description: "chat not found" }) });
  assert.equal(await sendTelegramMessage("x"), false);
});

test("video gönderilemezse metne düşer", async () => {
  assert.equal(await sendTelegramMedia("yok.mp4", "yedek"), true);
  assert.match(calls[0].url, /sendMessage$/);
});

test("video dosyası sendVideo ile gider", async () => {
  const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "mevzu-")), "a.mp4");
  await fs.writeFile(file, "x");
  await sendTelegramMedia(file, "açıklama");
  assert.match(calls[0].url, /sendVideo$/);
});

test("bildirim metinleri gerekli bilgileri içerir", () => {
  const ok = formatSuccess({ slotId: "12:00", quote: "Söz", author: "Yazar", permalink: "https://ig/x" });
  assert.ok(ok.includes("12:00") && ok.includes("Söz") && ok.includes("https://ig/x"));
  assert.ok(formatFailure({ slotId: "12:00", message: "patladı" }).includes("patladı"));
  assert.ok(formatSkipped({ slotId: "09:00", delayMinutes: 200 }).includes("200"));
});
