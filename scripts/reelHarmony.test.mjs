import test from "node:test";
import assert from "node:assert/strict";
import { createReelHarmony, getHarmonyProfile, pickHarmonyItem, HARMONY_TRACKS, AUTO_THEMES } from "../src/utils/reelHarmony.js";
import { NATURE_PRESETS } from "../src/remotion/naturePresets.js";

test("toprak sözü, kategori hatalı olsa ve geçmiş dolsa bile müzeye dönmez", () => {
  for (let i = 0; i < 100; i++) {
    const result = createReelHarmony("Toprağa ne ekersen onu biçersin.", "FELSEFE", ["forest"], HARMONY_TRACKS.map(t => t.url));
    assert.equal(result.bgStyle, "forest");
    assert.ok(getHarmonyProfile("Toprağa ne ekersen onu biçersin.").tracks.includes(result.track));
  }
});

test("kategori ve somut konu adayları sınırlar", () => {
  assert.deepEqual(getHarmonyProfile("Deniz sakin.", "FELSEFE").themes, ["ocean", "stormy_sea"]);
  for (const category of ["DOĞA", "FELSEFE", "KOZMİK"]) assert.deepEqual(getHarmonyProfile("", category).themes, AUTO_THEMES);
  for (const category of ["", "FELSEFE", "MOTİVASYON", "KOZMİK", "ŞEHİR", "AŞK"]) {
    const result = createReelHarmony("", category);
    assert.ok(NATURE_PRESETS[result.bgStyle]);
    assert.ok(result.track.url);
  }
});

test("alternatif varsa son kullanılan müzik tekrar seçilmez", () => {
  assert.equal(pickHarmonyItem(["a", "b"], ["a"]), "b");
  assert.equal(pickHarmonyItem(["a"], ["a"]), "a");
});

test("elenen temalar otomatik seçime girmez", () => {
  for (const banned of ["minimal_black_gold", "minimal_dark_tech", "minimal_dark_gradient", "minimal_dark_waves", "dark"]) {
    assert.ok(!AUTO_THEMES.includes(banned));
  }
  for (const id of AUTO_THEMES) assert.ok(NATURE_PRESETS[id], id);
});
