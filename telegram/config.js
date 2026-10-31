import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export function loadSettings() {
  const raw = fs.readFileSync(path.join(moduleDir, "settings.json"), "utf8").replace(/^\uFEFF/, "");
  const settings = JSON.parse(raw);
  if (!Array.isArray(settings.schedule) || settings.schedule.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) throw new Error("Telegram saat ayarı geçersiz.");
  return settings;
}
export const getAllowedUserId = () => String(process.env.TELEGRAM_ALLOWED_USER_ID || "").trim();
export const getConfiguredChatId = () => String(process.env.TELEGRAM_CHANNEL_ID || "").trim();
