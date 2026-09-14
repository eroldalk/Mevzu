# Remotion Entegrasyonu ve Otomatik Video Üretim / Yayınlama Sistemi Planı

Bu plan, **Erol-Mevzu** projesine **Remotion** video motorunu entegre etmeyi, yüksek kaliteli (1080×1920) dinamik altyazılı video şablonu oluşturmayı ve n8n gibi araçlara ihtiyaç duymadan belirli saatlerde otomatik video üretip yayınlamaya hazır hale getiren bir otomasyon hattı kurmayı hedefler.

---

## 📱 Hedeflenen Video Görsel Tasarımı (Mockup)

Remotion ile kare kare oluşturulacak dikey video şablonunun hedef görsel düzeni:

![Remotion ile Üretilecek 9:16 Reels Video Şablonu Mockup'ı](C:\Users\Lenovo\.gemini\antigravity\brain\d3c6e3fa-ffc1-417c-998d-6c56d103dda6\reels_video_mockup_1789322780308.jpg)

### 🎨 Görsel Tasarım Bileşenleri:
1. **Üst Marka / Logo Bölümü:** `#MEVZU”` altın sarısı ve minimalist tipografi.
2. **Merkezi Dinamik Altyazı (Dynamic Highlight Captions):**
   * Söz ekrana gelirken okunan/vurgulanan kelimeler dinamik olarak altın sarısı renkle yanar (`highlight`), kelime kelime akış sağlanır.
   * Yüksek çözünürlüklü modern tipografi.
3. **Alt Yazar & Kategori Rozeti:** Yazar ismi ve kategori rozeti (`GÜNDEM`, `FİNANS`, `ZİHİN` vb.).
4. **Sinematik Arka Plan:** Derin mat siyah üzerine hafif altın ışıltılı dalga ve parçacık animasyonu (Remotion `interpolate` ve `spring` ile 60 FPS akıcı hareket).

---

## 📋 Yapılacak Adımlar

### 1. Remotion Paketlerinin Kurulumu & Yapılandırma
* `remotion`, `@remotion/player`, `@remotion/cli` ve `@remotion/renderer` bağımlılıklarının eklenmesi.
* Remotion giriş noktası ve konfigürasyon dosyalarının oluşturulması (`src/remotion/Root.jsx` ve `src/remotion/index.js`).

### 2. Video Şablonu ve Dinamik Altyazı Bileşenleri
* `Root.jsx`: `MevzuReels` Composition kaydı (1080×1920, 30 FPS).
* `MevzuReelsComposition.jsx`: Mockup'taki `#MEVZU` logosu, kategori, alıntı ve yazar bileşeni.
* `AnimatedSubtitles.jsx`: Sözün kelime kelime vurgulanarak (TikTok/Reels tarzı highlight) ekrana gelmesi.
* `CinematicBackground.jsx`: Sinematik yumuşak gradient ve partikül akışları.

### 3. Web Arayüzü Entegrasyonu
* `SurprizPage.jsx` veya `ReelsPage.jsx` içerisine `@remotion/player` eklenerek canlı oynatma ve timeline kontrolü sağlanması.

### 4. Otomasyon Scripti & Zamanlayıcı (n8n'siz)
* `scripts/renderAutomatedVideo.mjs`: Firestore'dan söz çekip doğrudan 1080x1920 MP4 üreten otomasyon scripti.
* `scripts/scheduler.mjs` & GitHub Actions cron iş akışı: Saate göre tetikleme.
