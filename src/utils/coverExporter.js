// src/utils/coverExporter.js
// Instagram Reels & Profil Izgarası (1:1 & 9:16) Uyumlu Yüksek Çözünürlüklü Kapak Fotoğrafı Üretici

/**
 * Metni verilen genişliğe göre satırlara böler
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Görseli yükler (CORS destekli)
 */
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Instagram için yüksek çözünürlüklü kapak fotoğrafı üretir ve indirir
 */
export async function downloadInstagramCover({
  quote = "",
  author = "Mevzu",
  category = "FELSEFE",
  bgUrl = null,
  primaryColor = "#38bdf8",
  highlightColor = "#f5c542",
  fontFamily = "'DM Sans', sans-serif",
  fileName = "instagram_cover",
  aspectRatio = "9:16", // "9:16" veya "1:1"
}) {
  const width = 1080;
  const height = aspectRatio === "1:1" ? 1080 : 1920;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 1. Arka Plan
  ctx.fillStyle = "#060709";
  ctx.fillRect(0, 0, width, height);

  const bgImg = await loadImage(bgUrl);
  if (bgImg) {
    // Görseli cover şeklinde canvas'a yerleştir
    const imgRatio = bgImg.width / bgImg.height;
    const canvasRatio = width / height;
    let renderW, renderH, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      renderH = height;
      renderW = height * imgRatio;
      offsetX = (width - renderW) / 2;
      offsetY = 0;
    } else {
      renderW = width;
      renderH = width / imgRatio;
      offsetX = 0;
      offsetY = (height - renderH) / 2;
    }

    ctx.save();
    ctx.filter = "brightness(0.96) saturate(1.18)";
    ctx.drawImage(bgImg, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  } else {
    // Fallback gradient
    const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width / 1.2);
    grad.addColorStop(0, "#181510");
    grad.addColorStop(1, "#0a0a0c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Karartma Katmanı (Sinematik Overlay)
  const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
  overlayGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
  overlayGrad.addColorStop(0.48, "rgba(0, 0, 0, 0.52)");
  overlayGrad.addColorStop(1, "rgba(0, 0, 0, 0.82)");
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, width, height);

  // Ortadaki renkli ambient glow
  const ambientGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 450);
  ambientGrad.addColorStop(0, `${primaryColor}22`);
  ambientGrad.addColorStop(1, "transparent");
  ctx.fillStyle = ambientGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Marka Logosu (#MEVZU)
  const logoY = aspectRatio === "1:1" ? 130 : 310;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 36px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.letterSpacing = "8px";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 25;
  ctx.fillText("#MEVZU", width / 2, logoY);

  // Altın kesme işareti ”
  ctx.fillStyle = primaryColor;
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText("”", width / 2 + 105, logoY - 8);

  // İnce çizgi
  const lineGrad = ctx.createLinearGradient(width / 2 - 40, logoY + 16, width / 2 + 40, logoY + 16);
  lineGrad.addColorStop(0, "transparent");
  lineGrad.addColorStop(0.5, primaryColor);
  lineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 40, logoY + 16);
  ctx.lineTo(width / 2 + 40, logoY + 16);
  ctx.stroke();
  ctx.restore();

  // 4. Dekoratif Büyük Tırnak “
  const quoteCenterY = aspectRatio === "1:1" ? height * 0.48 : height * 0.47;
  ctx.save();
  ctx.fillStyle = primaryColor;
  ctx.globalAlpha = 0.14;
  ctx.font = "bold 220px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("“", width / 2, quoteCenterY - 110);
  ctx.restore();

  // 5. Söz Metni (Tüm Yazı Görünür ve Okunabilir)
  const cleanQuote = (quote || "").replace(/\r?\n+/g, " ").trim();
  const wordCount = cleanQuote.split(/\s+/).filter(Boolean).length;
  let fontSize = 42;
  if (wordCount > 25) fontSize = 32;
  else if (wordCount > 16) fontSize = 36;
  else if (wordCount > 9) fontSize = 40;

  ctx.save();
  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 4;

  const maxTextWidth = width * 0.82;
  const lines = wrapText(ctx, cleanQuote, maxTextWidth);
  const lineHeight = fontSize * 1.55;
  const totalTextH = lines.length * lineHeight;
  const startY = quoteCenterY - totalTextH / 2 + lineHeight / 2;

  lines.forEach((l, idx) => {
    // Son satırdaki kelimelere veya anahtar kelimeye vurgu rengi
    ctx.fillStyle = idx === lines.length - 1 && lines.length > 1 ? highlightColor : "#ffffff";
    ctx.fillText(l, width / 2, startY + idx * lineHeight);
  });
  ctx.restore();

  // 6. Yazar ve Kategori Rozeti (Safe-Zone İçinde)
  const footerY = aspectRatio === "1:1" ? height - 140 : height - 470;
  ctx.save();
  ctx.textAlign = "center";

  // Yazar Adı
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 24px ${fontFamily}`;
  ctx.letterSpacing = "3px";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 15;
  ctx.fillText((author || "MEVZU").toUpperCase(), width / 2, footerY);

  // Kategori Rozeti
  const catText = (category || "FELSEFE").toUpperCase();
  ctx.font = `700 13px ${fontFamily}`;
  const catMetrics = ctx.measureText(catText);
  const badgeW = catMetrics.width + 24;
  const badgeH = 26;
  const badgeX = width / 2 - badgeW / 2;
  const badgeY = footerY + 22;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = primaryColor;
  ctx.fillText(catText, width / 2, badgeY + 18);
  ctx.restore();

  // 7. JPEG Olarak İndir & Yerel Galeriye (mevzu_postlar) Kaydet
  const finalFileName = `${fileName}_cover_${aspectRatio.replace(":", "x")}.jpg`;

  try {
    const thumb = document.createElement("canvas");
    const thumbW = 360;
    const thumbH = aspectRatio === "1:1" ? 360 : 640;
    thumb.width = thumbW;
    thumb.height = thumbH;
    const tCtx = thumb.getContext("2d");
    tCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
    const thumbData = thumb.toDataURL("image/jpeg", 0.78);

    const mevcutlar = JSON.parse(localStorage.getItem("mevzu_postlar") || "[]");
    const yeniPost = {
      id: Date.now(),
      img: thumbData,
      date: new Date().toISOString(),
      aspectRatio,
      quote: cleanQuote,
      author: author || "Mevzu",
      category: catText,
      type: "cover",
    };
    const guncel = [yeniPost, ...mevcutlar].slice(0, 40);
    localStorage.setItem("mevzu_postlar", JSON.stringify(guncel));
  } catch (saveErr) {
    console.warn("Kapak yerel hafızaya kaydedilemedi:", saveErr);
  }

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    "image/jpeg",
    0.95
  );
}
