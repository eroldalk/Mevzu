import { continueRender, delayRender } from "remotion";

// Render ortamı index.html'i kullanmaz; yazı tipleri burada yüklenmezse Times'a düşer.
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;700&family=Caveat:wght@700&display=block";
const TURKISH_SAMPLE = "ĞğŞşİıÖöÜüÇç aA";

if (typeof document !== "undefined") {
  const handle = delayRender("Yazı tipleri yükleniyor");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_CSS;
  link.onload = () => {
    Promise.all([
      document.fonts.load(`700 64px "Playfair Display"`, TURKISH_SAMPLE),
      document.fonts.load(`700 64px "DM Sans"`, TURKISH_SAMPLE),
      document.fonts.load(`700 64px "Caveat"`, TURKISH_SAMPLE),
    ]).finally(() => continueRender(handle));
  };
  link.onerror = () => continueRender(handle);
  document.head.appendChild(link);
}
