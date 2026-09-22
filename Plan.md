# #MEVZU — Otonom Reels & Medya Üretim Sistemi Planı

Bu belge, **Mevzu** projesinin tamamlanan özelliklerini, çalışan otonom mimarisini ve sırasıyla hayata geçirilecek gelecek yol haritasını içerir.

---

## 🟢 1. BÖLÜM: TAMAMLANANLAR (%100 ÇALIŞIR DURUMDA ✅)

### 🎬 1. Sinematik Video Render Motoru (Remotion)
- [x] **1080×1920 (9:16) Dikey HD Video:** 30 FPS akıcı Reels formatı.
- [x] **Dinamik Altyazı & Tipografi:** Kelime kelime vurgulanan (`highlight`, `viral_pop`) modern animasyonlar (`AnimatedSubtitles.jsx`).
- [x] **Safe-Zone Optimizasyonu:** Üst marka logosu (`#MEVZU`) ve alt yazar bölümü, Instagram Reels arayüz butonlarının altında kalmayacak şekilde güvenli alana (`bottom: 480px`) yerleştirildi.
- [x] **65+ Zengin Arka Plan Teması:** Okyanus, fırtına, sisli orman, kütüphane, antik Roma, heykeller, kozmik uzay vb. saf JS veri tabanına (`naturePresets.js`) taşındı (Linux uyumlu).
- [x] **170 Doğrulanmış Mixkit Müzik Arşivi:** Kategoriye özel otomatik müzik seçici (`mixkitLibrary.js`).

### ✍️ 2. Yapay Zeka Metin Yazarı (Gemini AI)
- [x] **4 Parçalı Viral Reels Açıklaması Formülü:**
  1. Yazar — Eser / Konu
  2. Yorum getiren düşündürücü soru
  3. Kaydet & Yorum çağrısı (CTA)
  4. 6-8 odaklı viral hashtag (sonu `#mevzu` ile biter).
- [x] Söz metni açıklama kutusunda asla tekrar edilmez (video izlenmesini artırır).

### 📱 3. Meta & Instagram Resmi Graph API Entegrasyonu
- [x] **Bağlı Hesaplar:** Instagram Business Account (`@mevzusozler` / ID: `17841410437073383`) ve Facebook Sayfası (`Mevzu` / ID: `1304935579369418`).
- [x] **Süresiz Belirteç (Never-Expiring Page Token):** Meta App Secret ile 60 günlük token'dan türetilen, süresi **asla dolmayan** resmi sayfa anahtarı alındı ve `.env` ile GitHub Secrets'a işlendi.
- [x] **Resumable Binary Upload API (`rupload.facebook.com`):** Harici bulut depolama (S3/Firebase Storage) maliyeti olmadan, yerel MP4 dosyasını doğrudan Meta sunucularına parça parça aktaran sıfır masraflı hızlı yükleme motoru kuruldu.

### 📸 4. 1:1 Profil Izgarası & Kapak Sistemi
- [x] **Otomatik `thumb_offset: 2500`:** Instagram Reels yüklemesinde videonun tam 2.5. saniyesindeki (tüm sözün, yazarın ve logonun eksiksiz okunduğu) kare otomatik kapak resmi seçilir.
- [x] **`renderStill` Kapak Çıktısı:** Video renderından hemen sonra 75. kareden yüksek çözünürlüklü `${videoId}_cover.jpg` üretilir.
- [x] **Stüdyo 1:1 Kılavuzu & JPG İndirici:** Canlı arayüzde 1:1 ızgara çerçevesi ve tek tıkla kapak görseli indirme (`coverExporter.js`).

### 🚀 5. Web Stüdyosu Canlı Yayın Butonu
- [x] `http://localhost:5174/` adresinde söz, müzik ve arka plan canlı önizlenebilir.
- [x] **"🚀 Manuel Yayınla" Butonu:** Tek tıkla arka planda videoyu renderlar ve 50 saniyede doğrudan `@mevzusozler` hesabında canlıya alır.

### ⏰ 6. GitHub Actions Otonom Bulut Yayın Hattı (Günde 6 Yayın)
- [x] Bilgisayar kapalı olsa bile çalışan otonom Linux sanal sunucusu (`daily-reels.yml`).
- [x] **Günlük 6 Altın Yayın Takvimi:**
  - 🌅 **08:30** — Sabah Kahvesi
  - 🕚 **11:00** — İş Öncesi Motivasyon
  - 🥪 **13:30** — Öğle Molası
  - ☕ **16:30** — İkindi Molası
  - 🌆 **19:30** — Akşam Dönüşü
  - 🌙 **22:00** — Gece Derin Düşünce
- [x] `workflow_dispatch` ile istenildiği an tek tıkla anlık test çalıştırma.
- [x] Üretilen videoları 14 gün boyunca bulutta yedekleme (`Artifacts`).

---

## 🟡 2. BÖLÜM: YAPILACAKLAR (GELECEK YOL HARİTASI 📋)

### 📚 1. Söz Havuzu & "1 Söz 1 Kere Reels Yapılsın" Mimarisi (Öncelikli)
* **Amaç:** Aynı sözün Instagram'a ikinci kez asla atılmaması, sıfır tekrar ve kusursuz stok yönetimi.
* **Uygulama:**
  1. Firestore'daki mevcut 203 sözün `used` durumu taranıp sıfırlanacak.
  2. Üzerine 200-300 adet yeni felsefe, motivasyon ve strateji sözü (Marcus Aurelius, Nietzsche, Sun Tzu, Seneca, Machiavelli, Schopenhauer, Dostoyevski) depolanacak.
  3. Bir söz Reels yapıldığı an Firestore'da:
     - `used: true`
     - `usedAt: ISO Tarih`
     - `usedInVideoId: reel_...` olarak mühürlenecek.
  4. Otomasyon `where("used", "==", false)` ile sadece sıfır kilometredeki sözleri çekecek; kullanılmış hiçbir söze bir daha dokunmayacak.
  5. **Video Deposu (`videos` koleksiyonu):** Üretilen her videonun reçetesi (söz, yazar, müzik, arka plan, Instagram ID, kapak) kalıcı kütüphaneye kaydedilecek.

### 🌐 2. Çapraz Yayın (Cross-Posting): Facebook, X (Twitter) & TikTok
* **Amaç:** Tek bir render ile aynı anda tüm büyük platformlarda organik kitle toplamak.
* **Uygulama:**
  - **Facebook Sayfası Reels:** Aynı video ve açıklama Meta Graph API üzerinden eşzamanlı olarak `Mevzu` Facebook Sayfasına da Reels olarak yüklenecek.
  - **X (Twitter) Bağlantısı:** X API v2 entegre edilerek, video ve/veya sözün görseli düşündürücü soruyla birlikte tweet olarak fırlatılacak.
  - **TikTok:** TikTok Content Posting API entegrasyonu ile video eş zamanlı dikey olarak TikTok'a aktarılacak.

#### 📊 Platform Günlük Paylaşım Limitleri & Güvenlik Analizi (Günde 6 Video Senaryosu)
| Platform | Günlük Resmi API Sınırı | Spam/Gölge Ban Güvenli Sınırı | Bizim Günlük Hedef (6 Video) | Kota / Güvenlik Durumu |
| :--- | :--- | :--- | :--- | :--- |
| **Instagram** | 25 Reels / 24 saat | 8 - 10 Reels / gün | **6 Video** | 🟢 Mükemmel (Sınırın çok altında, organik) |
| **Facebook Sayfa** | 50+ Reels / 24 saat | 15 - 20 Reels / gün | **6 Video** | 🟢 Çok Rahat (Sıfır risk) |
| **X (Twitter)**| 50 Gönderi / gün (Aylık 1500) | 30 - 40 Tweet / gün | **6 Video/Tweet** | 🟢 Kotanın sadece %12'si kullanılır |
| **TikTok** | 10 - 30 Video / gün | 5 - 8 Video / gün | **6 Video** | 🟢 Tam Altın Oran (Algoritma için ideal) |

* **GitHub Actions Süresi:** 1 render (~60 sn) + 4 platforma paralel yükleme (~60 sn) = video başına ~2 dakika. Günde 6 video ayda **~360 dakika** harcar (GitHub'ın 2.000 dakikalık ücretsiz kotasının sadece **%18'i**).

### 📱 3. Hikaye (Story) Paylaşımı
* **Amaç:** Sadece hikayeleri izleyen takipçileri yakalamak ve profile çekmek.
* **Uygulama:**
  - Reels yayına girdikten hemen sonra, söze özel hazırlanan kanca soru ve kapak görseli (`media_type: "STORIES"`) Instagram & Facebook Hikayelerinde paylaşılacak.
  - Takipçiyi ana akıştaki videoya yönlendiren merak uyandırıcı bir köprü olacak.

### 🔴 4. Dinamik Süre Hesabı (Kırmızı Çizgi)
* **Amaç:** Sabit 8 saniye yerine, sözün uzunluğuna ve okuma hızına göre otomatik video süresi.
* **Uygulama:**
  - Formül: `Hedef Süre (sn) = Math.min(16, Math.max(6, (Kelime Sayısı / 2.8) + 2.0))`
  - Kısa sözler 6 sn, standart sözler 8 sn, felsefi uzun sözler 12-14 sn.
  - **Motivasyon Konuşması & Uzun Söz Modu:** 30 saniyelik daha uzun ve derin alıntılar için dinamik kare (`durationInFrames`) genişletmesi.

### 🎨 5. Tasarım & Sinematik Geliştirmeler
* **Uygulama:**
  - Yeni dikey hareketli video (loop) ve atmosferik temalar (yağmurlu kütüphane, şömine ateşi, antik mermer harabeler).
  - Altyazı akış efektlerinde alternatifler (viral pop, daktilo, yumuşak sinematik fade).

### 🔍 6. URL (ID) ile Video Bulma & Geri Çağırma
* **Uygulama:**
  - Tarayıcıya `localhost:5174/reel_[videoId]` yazıldığında veya sitedeki arama kutusuna ID/yazar/kelime girildiğinde;
  - Firestore'daki `videos` deposundan o videonun tüm reçetesi çekilecek ve stüdyoda birebir canlı oynatılacak.

---

## 📊 Mevzu İçerik & Medya Paneli (Postlarım CRUD - TAMAMLANDI ✅)

> 📌 **AMAÇ:** `HomePage.jsx` sol menüsündeki "Postlarım" sayfasını, Firebase `mevzuv1` veritabanını tam yetkiyle (CRUD) yöneten profesyonel bir içerik ve medya merkezine dönüştürmek.

1. **Canlı İstatistik Bandı:**
   - Sayfa başında canlı: `{totalQuotes} SÖZ · {usedQuotes} KULLANILDI · {unusedQuotes} HAZIR · {totalVideos} VİDEO`.
2. **3'lü Modüler Sekme Yapısı:**
   - **`[ 🎬 Atılan Videolar ]`**: Firestore `videos` koleksiyonu, yayınlandı rozeti, söz & yazar bilgisi, `[ Stüdyoda Aç ]` ve `[ Sil ]` aksiyonları.
   - **`[ 📚 Söz Havuzu ]`**: Firestore `quotes` koleksiyonu, canlı kelime & yazar araması, kategori filtresi, `[ Kullanılmamış / Kullanılmış ]` filtre hapları, `[ Bu Sözle Reels Yap ]` ve `[ Sil ]` aksiyonları.
   - **`[ 🖼️ İndirilen Görseller ]`**: Var olan yerel kart indirme arşivi korundu.
3. **Çift Yönlü İlişki (`quoteId` ↔ `videoId`):**
   - Videonun hangi sözden üretildiği, sözün hangi videoda kullanıldığı karşılıklı etiketlerle tıklandığında anında gösterilir.
4. **Site Üzerinden CRUD (Ekle/Sil/Durum Değiştir):**
   - Modal penceresi üzerinden tek tıkla yeni söz ekleme (`addDoc`), söz durumunu sıraya geri alma/kullanıldı yapma (`updateDoc`) ve kalıcı silme (`deleteDoc`).

