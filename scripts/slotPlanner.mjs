// scripts/slotPlanner.mjs
// Yayın slotu seçim mantığı. Veritabanına dokunmaz; bu sayede tek başına test edilir.

export const MAX_DELAY_MINUTES = 180;
export const EARLY_TOLERANCE_MINUTES = 3;

const toMinutes = (slot) => slot.hour * 60 + slot.minute;

// slotStates: { "09:00": "published" | "skipped" | "processing" | "failed" }
// Dönen değer: { slot, skipped, blockedBy }
// - slot: şimdi yayınlanacak slot (yoksa null)
// - skipped: bu çalışmada süresi dolduğu tespit edilen slotlar
// - blockedBy: işlenmekte olan slot (varsa yayın başlatılmaz)
export function planSlot({ slots, currentMinutes, slotStates = {}, maxDelay = MAX_DELAY_MINUTES }) {
  const due = [...slots]
    .sort((a, b) => toMinutes(a) - toMinutes(b))
    .filter((s) => currentMinutes + EARLY_TOLERANCE_MINUTES >= toMinutes(s));

  const blockedBy = due.find((s) => slotStates[s.id] === "processing") || null;
  if (blockedBy) return { slot: null, skipped: [], blockedBy };

  const skipped = [];
  for (const s of due) {
    const state = slotStates[s.id];
    if (state === "published" || state === "skipped") continue;
    if (currentMinutes - toMinutes(s) > maxDelay) {
      skipped.push(s);
      continue;
    }
    return { slot: s, skipped, blockedBy: null };
  }
  return { slot: null, skipped, blockedBy: null };
}
