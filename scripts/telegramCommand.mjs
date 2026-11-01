// scripts/telegramCommand.mjs
// Telegram komutlarını GitHub Actions'ta çalıştırır: önizleme, yayın, yenileme, iptal, durum.
// Söz yalnızca yayınlanınca harcanır.

import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getDocs, getFirestore, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { generateInstagramCaption, pickCta } from "../src/utils/captionGenerator.js";
import { NATURE_PRESETS } from "../src/remotion/naturePresets.js";
import { createReelHarmony } from "../src/utils/reelHarmony.js";
import { getReelSeconds, REEL_FPS } from "../src/utils/reelDuration.js";
import { buildTodayRows, getTurkeyDate } from "../src/utils/todaySlots.js";
import { hostImage, publishImage } from "./publishImage.mjs";
import { sendTelegramMedia, sendTelegramMessage } from "./telegramNotify.mjs";
import { draftButtons, findPlacePhotos, parseRequest } from "./telegramRequest.mjs";
import { choosePhoto, loadPool, photoUrl } from "./photoPool.mjs";
import { uploadAndPublishReel } from "./test_publish_reel.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COVER_FRAME = 15;
const db = getFirestore(initializeApp({ apiKey: "AIzaSyBSpkgsgmaQxStwbXT_Ne3kW98BjJjaNHI", authDomain: "mevzuv1.firebaseapp.com", projectId: "mevzuv1" }));

const createId = () => `tg_${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const mediaType = (format) => (format === "post" ? "photo" : "video");

async function pickUnusedQuote() {
  const snap = await getDocs(collection(db, "quotes"));
  const pool = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((q) => q.used !== true && q.quote?.trim());
  if (!pool.length) throw new Error("Havuzda kullanılmamış söz kalmadı.");
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return { id: picked.id, quote: picked.quote.replace(/\s+/g, " ").trim(), author: picked.author || "Mevzu", cat: (picked.cat || "FELSEFE").toUpperCase() };
}

// Yayınların tekrarını önlemek için son açıklamalar ve kullanılan fotoğraflar okunur
async function loadPublishedHistory() {
  const snap = await getDocs(query(collection(db, "videos"), where("published", "==", true)));
  const published = snap.docs.map((d) => d.data()).sort((a, b) => String(b.renderedAt).localeCompare(String(a.renderedAt)));
  return {
    captions: published.map((v) => v.caption).filter(Boolean).slice(0, 12),
    photoIds: published.map((v) => v.photoId).filter(Boolean),
  };
}

function buildProps({ quote, author, cat, theme, photo }) {
  const harmony = createReelHarmony(quote, cat);
  const bgStyle = theme || harmony.bgStyle;
  const preset = NATURE_PRESETS[bgStyle];
  return {
    quote,
    author,
    category: cat,
    bgStyle,
    musicUrl: harmony.track.url,
    primaryColor: preset.accent,
    highlightColor: preset.contrastAccent || harmony.highlightColor,
    animStyle: harmony.animStyle,
    fontFamily: harmony.fontFamily,
    photoUrl: photo ? photoUrl(photo) : null,
    photoId: photo?.id || null,
    mood: harmony.mood,
    musicName: harmony.track.name,
  };
}

async function renderDraft(id, format, props) {
  const serveUrl = await bundle({ entryPoint: path.join(rootDir, "src", "remotion", "index.js"), webpackOverride: (config) => config });
  const outputDir = path.join(rootDir, "output");
  await fs.mkdir(outputDir, { recursive: true });

  if (format === "post") {
    const inputProps = { ...props, musicUrl: null };
    const composition = await selectComposition({ serveUrl, id: props.photoUrl ? "MevzuNotePost" : "MevzuPost", inputProps });
    const output = path.join(outputDir, `${id}.jpg`);
    await renderStill({ composition, serveUrl, output, inputProps, frame: 0, imageFormat: "jpeg" });
    return output;
  }

  const composition = await selectComposition({ serveUrl, id: props.photoUrl ? "MevzuNoteReels" : "MevzuReels", inputProps: props });
  const outputLocation = path.join(outputDir, `${id}.mp4`);
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation, inputProps: props });
  return outputLocation;
}

async function loadDraft(draftId) {
  const snap = await getDoc(doc(db, "telegram_posts", draftId));
  if (!snap.exists()) throw new Error("Taslak bulunamadı.");
  return snap.data();
}

async function preview({ format, text, draftId }) {
  const source = draftId ? await loadDraft(draftId) : null;
  const request = source ? { quote: null, theme: null, unknownTheme: null } : parseRequest(text);
  const pool = await loadPool();
  const placePhotos = request.unknownTheme ? findPlacePhotos(pool, request.unknownTheme) : [];
  if (request.unknownTheme && !placePhotos.length) {
    await sendTelegramMessage(`❌ "${request.unknownTheme}" adında tema veya yapı yok. /temalar ile listeye bak.`);
    return;
  }

  const finalFormat = source?.format || format;
  const quoteData = source
    ? { id: source.quoteId, quote: source.quote, author: source.author, cat: source.category }
    : request.quote
    ? { id: null, quote: request.quote, author: "Mevzu", cat: "MEVZU" }
    : await pickUnusedQuote();

  const history = await loadPublishedHistory();
  const photo = request.theme ? null : choosePhoto(placePhotos.length ? placePhotos : pool, history.photoIds);
  const props = buildProps({ ...quoteData, theme: request.theme, photo });
  const caption = await generateInstagramCaption({ quote: quoteData.quote, author: quoteData.author, category: quoteData.cat, recentCaptions: history.captions });
  const id = createId();
  const output = await renderDraft(id, finalFormat, props);

  await setDoc(doc(db, "telegram_posts", id), {
    id,
    format: finalFormat,
    quoteId: quoteData.id || null,
    quote: quoteData.quote,
    author: quoteData.author,
    category: quoteData.cat,
    caption,
    props,
    telegramStatus: "pending",
    published: false,
    createdAt: new Date().toISOString(),
  });
  if (draftId) await updateDoc(doc(db, "telegram_posts", draftId), { telegramStatus: "replaced" });

  await sendTelegramMedia(output, `Önizleme\n\n${caption}`, mediaType(finalFormat), draftButtons(id));
}

// Çift basışta ikinci yayın başlamasın diye taslak atomik olarak kilitlenir
async function claimDraft(draftId) {
  return runTransaction(db, async (transaction) => {
    const ref = doc(db, "telegram_posts", draftId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Taslak bulunamadı.");
    const draft = snap.data();
    if (draft.telegramStatus !== "pending") return null;
    transaction.update(ref, { telegramStatus: "publishing" });
    return draft;
  });
}

async function getCollaborators() {
  const snap = await getDoc(doc(db, "settings", "schedule"));
  const list = snap.exists() ? snap.data().collaborators : null;
  return Array.isArray(list) ? list.filter(Boolean).slice(0, 3) : [];
}

async function publish(draftId) {
  const draft = await claimDraft(draftId);
  if (!draft) {
    await sendTelegramMessage("ℹ️ Bu taslak zaten işlendi.");
    return;
  }

  try {
    if (draft.quoteId) {
      const quoteSnap = await getDoc(doc(db, "quotes", draft.quoteId));
      if (quoteSnap.data()?.used === true) throw new Error("Bu söz başka bir yayında kullanılmış.");
    }

    const output = await renderDraft(draft.id, draft.format, draft.props);
    const collaborators = await getCollaborators();
    const instagramId = draft.format === "post"
      ? await publishImage({ imageUrl: await hostImage(output), caption: draft.caption, collaborators })
      : await uploadAndPublishReel({ videoFilePath: output, caption: draft.caption, thumbOffset: COVER_FRAME * 1000 / REEL_FPS, collaborators });

    const now = new Date().toISOString();
    await setDoc(doc(db, "videos", draft.id), {
      videoId: draft.id,
      format: draft.format,
      caption: draft.caption,
      ctaType: pickCta(draft.quote).type,
      mood: draft.props.mood,
      durationSeconds: draft.format === "post" ? null : getReelSeconds(draft.quote),
      quoteId: draft.quoteId,
      quote: draft.quote,
      author: draft.author,
      category: draft.category,
      slotId: "TELEGRAM",
      slotName: "Telegram Komutu",
      date: getTurkeyDate(),
      musicUrl: draft.format === "post" ? null : draft.props.musicUrl,
      musicName: draft.format === "post" ? null : draft.props.musicName,
      bgId: draft.props.photoId ? `foto_${draft.props.photoId}` : draft.props.bgStyle,
      photoId: draft.props.photoId || null,
      fileName: path.basename(output),
      renderedAt: now,
      publishedAt: now,
      instagramId,
      published: true,
    });
    if (draft.quoteId) {
      await updateDoc(doc(db, "quotes", draft.quoteId), { used: true, usedAt: now, usedInVideoId: draft.id });
    }
    await updateDoc(doc(db, "telegram_posts", draft.id), { telegramStatus: "published", published: true, publishedAt: now, instagramId });

    const media = await (await fetch(`https://graph.facebook.com/v21.0/${instagramId}?fields=permalink&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`)).json();
    await sendTelegramMessage(`✅ Yayınlandı\n\n${draft.quote}\n\n${media.permalink || "Instagram bağlantısı alınamadı"}`);
  } catch (err) {
    await updateDoc(doc(db, "telegram_posts", draft.id), { telegramStatus: "pending" });
    await sendTelegramMessage(`❌ Yayınlanamadı: ${err.message}`);
    throw err;
  }
}

async function cancel(draftId) {
  await updateDoc(doc(db, "telegram_posts", draftId), { telegramStatus: "rejected" });
  await sendTelegramMessage("❌ Taslak iptal edildi, söz harcanmadı.");
}

async function status() {
  const today = getTurkeyDate();
  const settings = (await getDoc(doc(db, "settings", "schedule"))).data() || {};
  const videos = (await getDocs(query(collection(db, "videos"), where("date", "==", today)))).docs.map((d) => d.data());
  const slots = settings.slots || [];
  const locks = await Promise.all(slots.map((id) => getDoc(doc(db, "slot_locks", `${today}_${id.replace(":", "")}`))));
  const lockStatuses = Object.fromEntries(slots.map((id, i) => [id, locks[i].exists() ? locks[i].data().status : undefined]));
  const rows = buildTodayRows({ slots, slotFormats: settings.slotFormats, videos, lockStatuses });
  const quotes = await getDocs(collection(db, "quotes"));
  const remaining = quotes.docs.filter((d) => d.data().used !== true).length;
  const lines = rows.map((row) => `${row.id} · ${row.format} · ${row.label}${row.publishedAt ? ` (${row.publishedAt})` : ""}`);
  await sendTelegramMessage(`📅 Bugünün yayınları\n\n${lines.join("\n") || "Kayıtlı saat yok"}\n\nKalan söz: ${remaining}`);
}

async function main() {
  const { INPUT_ACTION: action, INPUT_FORMAT: format, INPUT_TEXT: text, INPUT_DRAFT_ID: draftId } = process.env;
  if (action === "preview") return preview({ format: format === "post" ? "post" : "reels", text: text || "" });
  if (action === "refresh") return preview({ draftId });
  if (action === "publish") return publish(draftId);
  if (action === "cancel") return cancel(draftId);
  if (action === "status") return status();
  throw new Error(`Bilinmeyen işlem: ${action}`);
}

main().then(() => process.exit(0)).catch(async (err) => {
  console.error(err);
  if (process.env.INPUT_ACTION !== "publish") await sendTelegramMessage(`❌ İşlem tamamlanamadı: ${err.message}`);
  process.exit(1);
});
