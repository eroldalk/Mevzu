import test from "node:test";
import assert from "node:assert/strict";
import { planSlot } from "./slotPlanner.mjs";

const slot = (id) => {
  const [hour, minute] = id.split(":").map(Number);
  return { id, hour, minute };
};
const at = (id) => { const s = slot(id); return s.hour * 60 + s.minute; };
const FIVE = ["09:00", "12:00", "15:00", "18:00", "21:00"].map(slot);

function simulateDay(wakes, slots = FIVE) {
  const slotStates = {};
  const published = [];
  for (const wake of wakes) {
    const { slot: chosen, skipped } = planSlot({ slots, currentMinutes: at(wake), slotStates });
    skipped.forEach((s) => { slotStates[s.id] = "skipped"; });
    if (chosen) { slotStates[chosen.id] = "published"; published.push(chosen.id); }
  }
  return { published, slotStates };
}

test("geç uyanınca kaçan en eski slot seçilir", () => {
  const { slot: chosen, skipped } = planSlot({ slots: [slot("11:00"), slot("08:30")].reverse(), currentMinutes: at("11:29") });
  assert.equal(chosen.id, "08:30");
  assert.deepEqual(skipped, []);
});

test("3 saati geçen slot atlanır, sıradaki seçilir", () => {
  const { slot: chosen, skipped } = planSlot({ slots: [slot("08:30"), slot("11:00")], currentMinutes: at("12:13") });
  assert.equal(chosen.id, "11:00");
  assert.deepEqual(skipped.map((s) => s.id), ["08:30"]);
});

test("tam 180 dakika gecikme hâlâ yayınlanır", () => {
  assert.equal(planSlot({ slots: [slot("09:00")], currentMinutes: at("12:00") }).slot.id, "09:00");
  assert.equal(planSlot({ slots: [slot("09:00")], currentMinutes: at("12:01") }).slot, null);
});

test("erken yayın olmaz, yalnızca 3 dakika tolerans vardır", () => {
  assert.equal(planSlot({ slots: FIVE, currentMinutes: at("08:56") }).slot, null);
  assert.equal(planSlot({ slots: FIVE, currentMinutes: at("08:57") }).slot.id, "09:00");
});

test("yayınlanmış slot tekrar seçilmez", () => {
  const { slot: chosen } = planSlot({ slots: FIVE, currentMinutes: at("12:05"), slotStates: { "09:00": "published" } });
  assert.equal(chosen.id, "12:00");
  assert.equal(planSlot({ slots: FIVE, currentMinutes: at("12:05"), slotStates: { "09:00": "published", "12:00": "published" } }).slot, null);
});

test("atlanmış slot tekrar bildirilmez", () => {
  const { skipped } = planSlot({ slots: FIVE, currentMinutes: at("13:00"), slotStates: { "09:00": "skipped", "12:00": "published" } });
  assert.deepEqual(skipped, []);
});

test("işlenen slot varken ikinci yayın başlamaz", () => {
  const { slot: chosen, blockedBy } = planSlot({ slots: FIVE, currentMinutes: at("15:05"), slotStates: { "12:00": "failed", "15:00": "processing" } });
  assert.equal(chosen, null);
  assert.equal(blockedBy.id, "15:00");
});

test("başarısız slot süresi dolana kadar yeniden denenir", () => {
  assert.equal(planSlot({ slots: FIVE, currentMinutes: at("09:30"), slotStates: { "09:00": "failed" } }).slot.id, "09:00");
});

test("her 30 dakikada uyanınca 5 slotun tamamı yayınlanır", () => {
  const wakes = [];
  for (let m = 8 * 60; m < 24 * 60; m += 30) wakes.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  assert.deepEqual(simulateDay(wakes).published, ["09:00", "12:00", "15:00", "18:00", "21:00"]);
});

test("her çalışma en fazla 1 yayın yapar: 4 uyanışta en fazla 4 yayın çıkar", () => {
  const { published } = simulateDay(["12:13", "16:26", "19:46", "22:10"]);
  assert.ok(published.length <= 4);
});

test("gün içine dağılan 5 uyanışta 5 yayın çıkar", () => {
  assert.equal(simulateDay(["09:10", "12:40", "15:20", "18:30", "21:15"]).published.length, 5);
});

test("Telegram'a gönderilen slot tekrar seçilmez", () => {
  assert.equal(planSlot({ slots: FIVE, currentMinutes: at("09:30"), slotStates: { "09:00": "sent" } }).slot, null);
});
