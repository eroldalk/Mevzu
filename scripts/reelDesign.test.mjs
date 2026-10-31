import test from "node:test";
import assert from "node:assert/strict";
import { layoutQuote } from "../src/utils/quoteLayout.js";
import { getReelSeconds, getReelFrames } from "../src/utils/reelDuration.js";
import { generateInstagramCaption, pickCta } from "../src/utils/captionGenerator.js";
import { createReelHarmony, getQuoteMood, getHarmonyProfile } from "../src/utils/reelHarmony.js";

test("satır sonunda bağlaç kalmaz", () => {
  const { lines } = layoutQuote("Sabır acıdır ve meyvesi tatlıdır ama herkes bekleyemez.");
  for (const line of lines.slice(0, -1)) assert.doesNotMatch(line, /\s(ve|ama)$/);
});

test("virgül ve nokta satır sonu tercih edilir", () => {
  const { lines } = layoutQuote("Olmadıysa üzülme, vardır bir hayır.");
  assert.equal(lines[0], "Olmadıysa üzülme,");
});

test("satırlar dengelidir", () => {
  const { lines } = layoutQuote("Bir insanı tanımak istiyorsan ona güç ver ve zor günlerinde yanında dur.");
  const sizes = lines.map((l) => l.length);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 12, lines.join(" | "));
});

test("kısa söz iri yazılır, uzun söz sığar", () => {
  assert.ok(layoutQuote("Olmadıysa vardır bir hayır.").fontSize >= 90);
  const long = layoutQuote("Deniz sakin olduğunda herkes dümenci kesilir, asıl mesele fırtınada rotayı kaybetmeden limana varabilmektir ve bunu ancak sabreden insan başarabilir.");
  assert.ok(long.fontSize >= 44);
  assert.ok(long.lines.length * long.fontSize * long.lineHeight <= 780);
});

test("hiçbir kelime kaybolmaz", () => {
  const text = "Kaybettiğin kavgaların bile sana öğrettiği bir şey vardır.";
  assert.equal(layoutQuote(text).lines.join(" "), text);
});

test("süre 5-9 saniye arasındadır", () => {
  assert.equal(getReelSeconds("Kısa söz."), 5);
  assert.equal(getReelSeconds("kelime ".repeat(60)), 9);
  assert.equal(getReelFrames("kelime ".repeat(60)), 270);
  const mid = getReelSeconds("kelime ".repeat(10));
  assert.ok(mid > 5 && mid < 9);
});

test("çağrı söze göre seçilir", () => {
  assert.equal(pickCta("Seni özledim demek zor değil.").type, "send");
  assert.equal(pickCta("Sabreden derviş muradına ermiş.").type, "save");
});

test("açıklamada eser adı uydurulmaz", async () => {
  const caption = await generateInstagramCaption({ quote: "Zaman geçer.", author: "Seneca", category: "ZAMAN" });
  assert.ok(caption.startsWith("Seneca.\n"));
  assert.ok(!caption.includes("Yaşamın Kısalığı"));
});

test("Mevzu yazar satırı olarak yazılmaz", async () => {
  const caption = await generateInstagramCaption({ quote: "Olmadıysa vardır bir hayır.", author: "Mevzu" });
  assert.ok(!caption.startsWith("Mevzu"));
  assert.ok(caption.includes("Kaydet, sonra lazım olur"));
});

test("son kullanılan soru tekrar seçilmez", async () => {
  const pool = [
    "Hayatın anlamı aranarak mı bulunur, yoksa eylemlerimizle bizzat biz mi inşa ederiz?",
    "Gerçek özgürlük her istediğini yapabilmek midir, yoksa arzularına esir olmamak mı?",
  ];
  for (let i = 0; i < 30; i++) {
    const caption = await generateInstagramCaption({ quote: "Düşün.", author: "Mevzu", category: "FELSEFE", recentCaptions: pool });
    assert.ok(!pool.some((q) => caption.includes(q)));
  }
});

test("müzik duyguya göre seçilir ve son kullanılan tekrar etmez", () => {
  assert.equal(getQuoteMood("Seni çok özledim."), "hüzünlü");
  assert.equal(getQuoteMood("Olmadıysa vardır bir hayır."), "umutlu");
  assert.equal(getQuoteMood("Masa üstünde kitap."), "sakin");
  const { tracks } = getHarmonyProfile("Seni çok özledim.");
  assert.ok(tracks.length >= 20);
  const recent = tracks.slice(0, tracks.length - 1).map((t) => t.url);
  assert.equal(createReelHarmony("Seni çok özledim.", "", [], recent).track.url, tracks[tracks.length - 1].url);
});
