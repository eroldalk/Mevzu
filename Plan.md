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

---

## 🔴 KIRMIZI ÇİZGİ: Dinamik Süre Hesabı (Kelime Sayısına Göre Video Süresi)

> ⚠️ **KRİTİK ALGORİTMA KURALI:**
> Videolar asla sabit 8 saniyeye hapsedilemez! Metin uzunluğuna bakılmaksızın aynı sürenin kullanılması, uzun sözlerde okuma hızını aşırı hızlandırarak izleyicinin videoyu terk etmesine (retention düşüşü) yol açar.

### 📐 Hesaplama Formülü:
* **Ortalama İnsan Okuma Hızı:** `1 Saniye = 2.8 Kelime`
* **Okuma Süresi (Saniye):** `Kelime Sayısı / 2.8`
* **Bekleme & Sindirme Payı (Buffer):** Giriş + Çıkış (Düşünme ve Yazar/Logo algılama payı) = `+2.0 Saniye`
* **Minimum Taban Süre:** `6 Saniye` (Çok kısa 2-3 kelimelik sözler için minimum süre sınırı)
* **Maksimum Tavan Süre:** `16 Saniye` (Aşırı uzun sözlerin Reels izlenme oranını düşürmemesi için tavan sınırı)

```text
Hedef Süre (sn) = Math.min(16, Math.max(6, (Kelime Sayısı / 2.8) + 2.0))
durationInFrames = Math.round(Hedef Süre * 30 FPS)
```

### 📌 Örnek Karşılaştırma Tablosu:
| Söz Tipi | Kelime Sayısı | Eski Sabit Süre | Yeni Dinamik Süre | Kare Sayısı (30 FPS) |
| :--- | :--- | :--- | :--- | :--- |
| **Kısa Söz** (Örn: *"Zaman paradır."*) | 2 - 5 kelime | 8 sn *(Gereksiz uzun)* | **6.0 sn** | 180 Kare |
| **Orta Söz** (Standart 1-2 cümle) | 12 - 18 kelime | 8 sn *(İdeal)* | **7.5 - 8.5 sn** | 225 - 255 Kare |
| **Uzun Söz** (Felsefi / 3 cümle) | 25 - 30 kelime | 8 sn *(Çok hızlı akar!)* | **11.0 - 12.5 sn** | 330 - 375 Kare |
| **Manifesto / Motivasyon** | 38 - 45 kelime | 8 sn *(Okunamaz, çöp olur)* | **14.5 - 16.0 sn** | 435 - 480 Kare |

---

## 🖼️ Pexels CDN & Kalıcı Arka Plan Havuzu Mimarisi

> 📌 **NEDEN PEXELS CDN?**
> Pixabay API'si süreli/imzalı (`pixabay.com/get/...`) geçici URL'ler verir; bu linkler birkaç gün içinde ölerek render ve önizlemede siyah ekrana yol açar.
> **Pexels CDN (`images.pexels.com/photos/...`)** ise kalıcıdır, süresi dolmaz, CORS engeline takılmaz ve yüksek kaliteli 9:16 dikey çekimler sunar.

### 🎯 3 Aşamalı Entegrasyon Planı:

1. **Aşama 1: Kalıcı Doğrulanmış CDN Havuzu (Öncelikli)**
   - Pexels API üzerinden her kategori için (`Doğa & Su`, `Kozmik & Uzay`, `Felsefe & Kültür`, `Şehir & Gece`, `Element & Doğa`) `orientation=portrait` parametresiyle en kaliteli 100-150 dikey görselin kalıcı CDN URL'leri çekilir.
   - Çekilen URL'ler `CinematicBackground.jsx` içine kalıcı preset olarak yazılır.
   - **Faydası:** Sıfır API kotası tüketimi, sıfır ağ gecikmesi, %100 kesintisiz çalışma.

2. **Aşama 2: Canlı Arama / Otomatik Çekim (Opsiyonel)**
   - Stüdyoda arzu edilirse "Pexels'ten Yeni Çek" butonu ile canlı API üzerinden anlık taze görsel çekilebilir (`api.pexels.com/v1/search?orientation=portrait`).

3. **Aşama 3: Sinematik Dikey Video (MP4 Loop) Desteği**
   - Pexels Videos API (`/videos/search`) ile hafif boyutlu dikey loop MP4 videolar (yağan yağmur, dalgalanan deniz, gece gökyüzü) getirilerek fotoğraftan hareketli canlı videoya geçiş sağlanabilir.

---

## 📸 Instagram 1:1 Profil Izgarası & Otomatik Kapak Sistemi (TAMAMLANDI ✅)

> 📌 **AMAÇ:** Instagram profil ızgarasında videoların ilk boş kare yüzünden boş/yazısız çıkmasını önlemek ve tüm metnin 1:1 karede kesintisiz görünmesini sağlamak.

1. **Yazar & Rozet Safe-Zone (`bottom: 480px`):**
   - `MevzuReelsComposition.jsx` içinde alt bölüm 480px güvenli alana çekildi. Böylece 1080x1920 dikey video Instagram profilinde 1:1 kare (1080x1080) kırpıldığında hem söz hem yazar %100 görünür.
2. **Otomatik `renderStill` Kapak Üretimi:**
   - `renderAndPublish.mjs` otomasyonu, video renderından hemen sonra 2.5. saniyeden (`frame: 75`, tüm metnin parladığı kare) yüksek çözünürlüklü `${videoId}_cover.jpg` üretir.
3. **Instagram Reels `thumb_offset: 2500`:**
   - Meta Graph API isteğine `thumb_offset: 2500` eklendi; Instagram Reels otomatik olarak 2.5. saniyedeki tam metinli kareyi kapak seçer.
4. **Web Stüdyosu Canlı 1:1 Izgara Kılavuzu & Kapak İndirici:**
   - Stüdyoya canlı `[ 📱 1:1 Izgara Kılavuzu ]` ve `[ 📸 1:1 Kapak (.jpg) ]` / `[ 9:16 ]` butonları eklendi (`coverExporter.js`).

