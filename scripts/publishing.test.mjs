import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { publishImage } from "./publishImage.mjs";
import { buildReport, fetchInsights } from "./weeklyReport.mjs";

const realFetch = globalThis.fetch;
let bodies;

beforeEach(() => {
  bodies = [];
  process.env.INSTAGRAM_ACCOUNT_ID = "1";
  process.env.INSTAGRAM_ACCESS_TOKEN = "t";
  globalThis.fetch = async (url, init) => {
    if (init?.body) bodies.push(JSON.parse(init.body));
    const json = url.includes("status_code") ? { status_code: "FINISHED" } : { id: "99" };
    return { ok: true, json: async () => json };
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

test("post açıklama ve ortak hesapla gönderilir", async () => {
  const id = await publishImage({ imageUrl: "https://x/a.jpg", caption: "metin", collaborators: ["ortak"] });
  assert.equal(id, "99");
  assert.equal(bodies[0].caption, "metin");
  assert.deepEqual(bodies[0].collaborators, ["ortak"]);
  assert.equal(bodies[0].media_type, undefined);
});

test("ortak hesap yoksa alan gönderilmez", async () => {
  await publishImage({ imageUrl: "https://x/a.jpg", caption: "metin" });
  assert.equal(bodies[0].collaborators, undefined);
});

test("hikâye STORIES olarak gider, açıklama almaz", async () => {
  await publishImage({ imageUrl: "https://x/a.jpg", caption: "metin", mediaType: "STORIES" });
  assert.equal(bodies[0].media_type, "STORIES");
  assert.equal(bodies[0].caption, undefined);
});

test("Instagram hatası yukarı taşınır", async () => {
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: "x" }) });
  await assert.rejects(publishImage({ imageUrl: "https://x/a.jpg" }), /konteyneri/);
});

test("izin hatası rapora taşınır", async () => {
  globalThis.fetch = async () => ({ json: async () => ({ error: { message: "izin yok" } }) });
  await assert.rejects(fetchInsights("1"), /izin yok/);
});

test("rapor en iyi tema, saat, biçim ve sözü gösterir", () => {
  const item = (bgId, slotId, format, views, shares, quote) => ({ bgId, slotId, format, views, shares, saved: 1, quote });
  const report = buildReport([
    item("forest", "12:00", "reels", 1000, 13, "Orman sözü"),
    item("rain", "09:00", "post", 100, 1, "Yağmur sözü"),
  ]);
  assert.ok(report.includes("En iyi tema: forest"));
  assert.ok(report.includes("En iyi saat: 12:00"));
  assert.ok(report.includes("En iyi biçim: reels"));
  assert.ok(report.includes("Orman sözü"));
});

test("boş haftada rapor bozulmaz", () => {
  assert.ok(buildReport([]).includes("bulunamadı"));
});
