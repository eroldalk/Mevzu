import test from "node:test";
import assert from "node:assert/strict";
import { buildHashtags } from "../src/utils/hashtags.js";

const tags = (text) => text.split(" ");

test("sözün konusu hashtag'e yansır", () => {
  assert.ok(tags(buildHashtags({ quote: "Sabret, her şeyin bir zamanı var." })).includes("#sabır"));
  assert.ok(tags(buildHashtags({ quote: "Seni çok özledim." })).includes("#özlem"));
});

test("farklı sözler farklı hashtag alır", () => {
  assert.notEqual(buildHashtags({ quote: "Dost acı söyler.", random: () => 0.3 }), buildHashtags({ quote: "Para mutluluk getirmez.", random: () => 0.3 }));
});

test("en fazla 8 etiket, sonda #mevzu", () => {
  const list = tags(buildHashtags({ quote: "Sabır, umut, dostluk ve zaman hayatın aşkıdır.", author: "Mevlana" }));
  assert.ok(list.length <= 8);
  assert.equal(list.at(-1), "#mevzu");
  assert.equal(new Set(list).size, list.length);
});

test("yazar etiketi Türkçe harfleri korur, Mevzu yazılmaz", () => {
  assert.ok(buildHashtags({ quote: "Söz.", author: "Ömer Hayyam" }).startsWith("#ömerhayyam "));
  assert.equal(tags(buildHashtags({ quote: "Söz.", author: "Mevzu" })).filter((t) => t === "#mevzu").length, 1);
});

test("son gönderinin genel etiketleri tekrar seçilmez", () => {
  const last = "Soru?\n.\n#sözler #anlamlısözler #güzelsözler #mevzu";
  for (let i = 0; i < 30; i++) {
    const list = tags(buildHashtags({ quote: "Masa.", recentCaptions: [last] }));
    assert.ok(!list.includes("#sözler") && !list.includes("#anlamlısözler") && !list.includes("#güzelsözler"));
  }
});
