// Panelde bugünün yayınlarını gösterir: kayıtlı saatler ve fiilen çıkan gönderiler birlikte listelenir.

export const STATUS_LABELS = {
  published: "Yayınlandı",
  processing: "Hazırlanıyor",
  failed: "Hata, yeniden denenecek",
  skipped: "Atlandı",
  waiting: "Bekliyor",
  late: "Sıradaki uyanışta çıkacak",
};

const FORMAT_LABELS = { reels: "Reels", post: "Post", story: "Hikâye" };

export const getTurkeyDate = (now = Date.now()) => new Date(now + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

const getTurkeyTime = (now) => new Date(now + 3 * 60 * 60 * 1000).toISOString().slice(11, 16);

function toLocalTime(iso) {
  return iso ? getTurkeyTime(new Date(iso).getTime()) : null;
}

export function buildTodayRows({ slots = [], slotFormats = {}, videos = [], lockStatuses = {}, now = Date.now() }) {
  const currentTime = getTurkeyTime(now);
  const published = videos.filter((video) => video.published);
  const ids = [...new Set([...slots, ...published.map((video) => video.slotId).filter(Boolean)])].sort();

  return ids.map((id) => {
    const video = published.find((item) => item.slotId === id);
    const lock = lockStatuses[id];
    let status = "waiting";
    if (video || lock === "published") status = "published";
    else if (lock) status = lock;
    else if (id <= currentTime) status = "late";

    return {
      id,
      status,
      label: STATUS_LABELS[status] || status,
      format: FORMAT_LABELS[video?.format || slotFormats[id] || "reels"],
      quote: video?.quote || null,
      publishedAt: toLocalTime(video?.publishedAt),
    };
  });
}
