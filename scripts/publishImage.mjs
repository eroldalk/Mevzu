// scripts/publishImage.mjs
// Görsel post ve hikâye yayını. Instagram herkese açık image_url ister;
// görseller reponun post-images dalına yüklenir, raw adresi ücretsiz kullanılır.

import fs from "node:fs/promises";
import path from "node:path";

const GRAPH = "https://graph.facebook.com/v21.0";
const GITHUB = "https://api.github.com";
const IMAGE_BRANCH = "post-images";
const POLL_ATTEMPTS = 12;
const POLL_DELAY_MS = 5000;

async function github(pathname, options = {}) {
  return fetch(`${GITHUB}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
  });
}

async function ensureImageBranch(repo) {
  const existing = await github(`/repos/${repo}/git/ref/heads/${IMAGE_BRANCH}`);
  if (existing.ok) return;
  const main = await (await github(`/repos/${repo}/git/ref/heads/main`)).json();
  const created = await github(`/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${IMAGE_BRANCH}`, sha: main.object.sha }),
  });
  if (!created.ok) throw new Error(`Görsel dalı açılamadı: ${created.status}`);
}

export async function hostImage(filePath) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !process.env.GITHUB_TOKEN) throw new Error("GITHUB_REPOSITORY veya GITHUB_TOKEN eksik.");

  await ensureImageBranch(repo);
  const name = `images/${path.basename(filePath)}`;
  const content = (await fs.readFile(filePath)).toString("base64");
  const res = await github(`/repos/${repo}/contents/${name}`, {
    method: "PUT",
    body: JSON.stringify({ message: `görsel: ${path.basename(filePath)}`, content, branch: IMAGE_BRANCH }),
  });
  if (!res.ok) throw new Error(`Görsel yüklenemedi: ${res.status}`);
  return `https://raw.githubusercontent.com/${repo}/${IMAGE_BRANCH}/${name}`;
}

// mediaType: "IMAGE" (post) | "STORIES"
export async function publishImage({ imageUrl, caption, mediaType = "IMAGE", collaborators = [], pollDelayMs = POLL_DELAY_MS }) {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  const params = { image_url: imageUrl, access_token: accessToken };
  if (mediaType === "STORIES") params.media_type = "STORIES";
  else params.caption = caption || "#mevzu";
  if (mediaType === "IMAGE" && collaborators.length) params.collaborators = collaborators;

  const initRes = await fetch(`${GRAPH}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const init = await initRes.json();
  if (!initRes.ok || !init.id) throw new Error(`Görsel konteyneri oluşturulamadı: ${JSON.stringify(init)}`);

  let ready = false;
  for (let i = 0; i < POLL_ATTEMPTS && !ready; i += 1) {
    const poll = await (await fetch(`${GRAPH}/${init.id}?fields=status_code&access_token=${accessToken}`)).json();
    if (poll.status_code === "ERROR") throw new Error(`Instagram görseli işleyemedi: ${JSON.stringify(poll)}`);
    ready = poll.status_code === "FINISHED";
    if (!ready) await new Promise((r) => setTimeout(r, pollDelayMs));
  }
  if (!ready) throw new Error("Instagram görsel işleme süresi doldu.");

  const pubRes = await fetch(`${GRAPH}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: init.id, access_token: accessToken }),
  });
  const pub = await pubRes.json();
  if (!pubRes.ok || !pub.id) throw new Error(`Görsel yayınlanamadı: ${JSON.stringify(pub)}`);
  return pub.id;
}
