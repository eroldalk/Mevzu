import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const storePath = path.join(dataDir, "state.json");
let queue = Promise.resolve();
export async function readState() {
  try { return JSON.parse(await fs.readFile(storePath, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return { targetChatId: null, items: [], lastError: null }; throw error; }
}
export async function updateState(mutator) {
  queue = queue.then(async () => {
    const state = await readState();
    const updated = (await mutator(state)) || state;
    await fs.mkdir(dataDir, { recursive: true });
    const temp = `${storePath}.tmp`;
    await fs.writeFile(temp, JSON.stringify(updated, null, 2), "utf8");
    await fs.rename(temp, storePath);
    return updated;
  });
  return queue;
}
export async function saveItem(item) { await updateState((s) => { s.items.unshift(item); s.items = s.items.slice(0, 500); return s; }); return item; }
export async function patchItem(id, patch) { let found; await updateState((s) => { found = s.items.find((x) => x.id === id); if (found) Object.assign(found, patch, { updatedAt: new Date().toISOString() }); return s; }); return found; }
export async function getItem(id) { return (await readState()).items.find((x) => x.id === id) || null; }
export async function getLastItem() { return (await readState()).items[0] || null; }
export async function setTargetChatId(id) { await updateState((s) => { s.targetChatId = String(id); return s; }); }
export async function setLastError(error) { await updateState((s) => { s.lastError = error; return s; }); }
