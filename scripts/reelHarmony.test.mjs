import test from "node:test";
import assert from "node:assert/strict";
import { createReelHarmony, getHarmonyProfile, pickHarmonyItem, HARMONY_TRACKS } from "../src/utils/reelHarmony.js";
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
  for (const id of getHarmonyProfile("", "DOĞA").themes) assert.equal(NATURE_PRESETS[id].cat, "Doğa & Su");
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
