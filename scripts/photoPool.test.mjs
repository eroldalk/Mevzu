import test from "node:test";
import assert from "node:assert/strict";
import { choosePhoto, photoUrl } from "./photoPool.mjs";

const pool = [{ id: 1, file: "a.jpg" }, { id: 2, file: "b.jpg" }, { id: 3, file: "c.jpg" }];

test("kullanılmış fotoğraf tekrar seçilmez", () => {
  for (let i = 0; i < 50; i++) assert.equal(choosePhoto(pool, [1, 2]).id, 3);
});

test("havuz bitince yeni tur başlar", () => {
  assert.ok(pool.includes(choosePhoto(pool, [3, 2, 1])));
});

test("ikinci turda da aynı tur içinde tekrar olmaz", () => {
  for (let i = 0; i < 50; i++) assert.notEqual(choosePhoto(pool, [2, 3, 2, 1]).id, 2);
});

test("fotoğraf adresi photo-pool dalına gider", () => {
  assert.match(photoUrl(pool[0]), /photo-pool\/photos\/a\.jpg$/);
});
