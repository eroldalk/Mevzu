import cron from "node-cron";
import { loadSettings } from "./config.js";
import { runGenerationJob } from "./job-runner.js";
const tasks = [];
export function startScheduler(bot) {
  const settings = loadSettings();
  if (!settings.enabled) return [];
  for (const time of settings.schedule) {
    const [hour, minute] = time.split(":").map(Number);
    tasks.push(cron.schedule(`${minute} ${hour} * * *`, () => runGenerationJob(bot, { source: `schedule:${time}` }).catch((error) => console.error(`[Telegram] ${time} üretimi başarısız:`, error.message)), { timezone: settings.timezone, noOverlap: true }));
  }
  return tasks;
}
export function stopScheduler() { tasks.splice(0).forEach((task) => task.stop()); }
export function getNextSchedule() {
  const settings = loadSettings();
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: settings.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  return settings.schedule.find((time) => time > now) || `${settings.schedule[0]} (yarın)`;
}
