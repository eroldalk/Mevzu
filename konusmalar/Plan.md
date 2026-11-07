# #MEVZU — Tek Merkez: Güncel Durum ve Plan

Güncelleme: 31 Ekim 2026. Projenin güncel bilgisi burada tutulur. Ayrıntılı günlük kayıtlar `konusmalar/` klasöründedir.

## Çalışma kuralları
- Türkçe konuşulur, kısa yazılır.
- Commit, push, canlı ayar değişikliği ve gerçek yayın için her seferinde onay alınır.
- Token ve anahtarlar sohbete yazılmaz, yalnızca `.env` veya GitHub/Cloudflare secret olarak girilir.

## Canlıda çalışanlar
- GitHub Actions ile otomatik yayın: `scripts/renderAndPublish.mjs`, `.github/workflows/daily-reels.yml`
- Slot seçimi: En eski kaçan saat seçilir, 180 dakikayı geçen atlanır, çalışma başına 1 yayın.
- Telegram bildirimleri: Yayın, hata, atlama (`scripts/telegramNotify.mjs`)
- Telegram komutları: Cloudflare Worker `mevzu-telegram.kodbug20.workers.dev`, üretim `telegram-command.yml`
- Komutlar: `/post`, `/reels`, `/post söz | tema`, `/reels söz | tema`, `/temalar`, `/durum`
- Önizleme düğmeleri: Yayınla, Yenile, İptal. Söz yalnızca yayınlanınca harcanır.
- Panel: Yayın saatleri, slot türü, ortak hesaplar, Bugünün Yayınları
- Görsel post, hikâye, ortak gönderi ve haftalık rapor kodu hazır; görsel post canlıda ilk kez denenecek.

## Kayıtlı ayarlar
- Panel saatleri: 09:30 post, 13:30 post, 16:00 post, 20:00 reels
- Kalan söz: 31 Ekim sabahı 113 idi, güncel sayı için `/durum` kullanılır.
- Otomatik temalar: forest, sunset, rain, sehir_bridge_fog, sehir_rainy_window, stormy_sea
- Hesap: Instagram `@mevzusozler`, Telegram `@mevzu_control_bot`, repo `eroldalk/Mevzu`

## Secret listesi (yalnızca adlar)
- GitHub: `INSTAGRAM_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GEMINI_API_KEY` (var mı doğrulanmadı), `PIXABAY_KEY`
- Cloudflare: `TELEGRAM_BOT_TOKEN`, `ALLOWED_USER_ID`, `GITHUB_TOKEN`, `WEBHOOK_SECRET`
- GitHub fine-grained token'ın bitiş tarihi takip edilmeli; süresi dolunca Telegram komutları durur.

## Sıradaki işler
1. Açıklama ve hashtag tekrarını düzeltmek: Telegram komutlarına son açıklamaları bağlamak, hashtag'leri söze göre seçmek, yedek soruları artırmak.
2. Gemini: Anahtarı kontrol etmek, gerekirse `GEMINI_API_KEY` eklemek.
3. Yeni tasarımı bağlamak: `NoteComposition.jsx` otomatik yayınlara ve Telegram komutlarına bağlanacak.
4. Fotoğraf havuzu: `fotograflar/havuz` içindeki 141 fotoğraf `photo-pool` dalına yüklenecek, tekrar etmeyen seçim kurulacak.
5. cron-job.org: Her 30 dakikada bir `daily-reels.yml` tetiklenecek. Bu olmadan günde 4-5 yayın güvenilir çıkmaz.
6. Telefondan fotoğraf ekleme ve konuya göre seçim: `/post söz | türkiye`, `/post söz | 380`
7. Yeni sözler: Kısa, birine söylenmiş gibi, kaydetmeye veya yorum yazmaya teşvik eden sözler. Sözleri proje sahibi bulacak.
8. Sonra: Facebook, X, TikTok, YouTube Shorts; Agent teams.

## Açık kararlar
- İleride havuz 400-500 fotoğrafa çıkarılacak ve fotoğraflar Firebase Storage üzerinden alınacak. Firestore belge sınırı nedeniyle fotoğraf için uygun değil. Storage için Blaze planı gerekip gerekmediği kontrol edilecek.
- Fotoğraf sabit mi kalacak, hafif yakınlaşma mı olacak?
- Fotoğraflar herkese açık dalda tutulacak mı? Pixabay toplu yeniden dağıtımı yasaklıyor, küçük bir lisans riski var.
- Geniş yapılar için yatay fotoğraf ve bulanık arka plan yöntemi kullanılacak mı?
- Firestore yazma kuralları kontrol edilecek; girişsiz okuma açık, yazma da açık olabilir.
- Panel post saatleri yeni tasarım gelene kadar kalacak mı?

## Tasarım kararı
- Görseller Remotion ile üretilir, altında 141 gerçek fotoğraf kullanılır.
- Aydınlık, renkli tarihi eser fotoğrafı; ortada krem el yazısı; köşede küçük `#mevzu`.
- Her yapıdan en fazla 2 fotoğraf. Liste: `fotograflar/secilen.json`, görsel sayfa: `fotograflar/secilen.html`

---

# ARŞİV: Eski Plan

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
   - **`[ 🎬 Atılan Videolar ]`**: Firestore `videos` koleksiyonu tablosu, minyatür kapak görseli sütunu, yayınlandı rozeti, söz & yazar bilgisi, `[ Stüdyoda Aç ]` ve `[ Sil ]` aksiyonları.
   - **`[ 📚 Söz Havuzu ]`**: 25'li sayfalama, canlı arama, kategori filtresi, `[ Sıradakiler (Hazır) / Kullanılanlar ]` sekmeleri, `[ Reels Yap ]` ve `[ Sil ]` aksiyonları.
   - **`[ 🖼️ İndirilen Görseller ]`**: Stüdyodan indirilen 1:1 ve 9:16 kapaklar ile alıntı kartları yerel galeride (`mevzu_postlar`) otomatik listelenir.
3. **Kullanılmış Reels'i Birebir Açma Motoru (0ms Sıfır Gecikme & Kesin Veri):**
   - Tablodan "Stüdyoda Aç" tıklandığında videonun sözü, yazarı, teması (`bgId`), tema kategorisi (`selectedCat`), vurgu rengi (`highlightColor`) ve Mixkit müzik parçası (`musicUrl`, `musicName`) stüdyoya eksiksiz aktarılır ve birebir açılır.
4. **Çift Yönlü İlişki (`quoteId` ↔ `videoId`):**
   - Videonun hangi sözden üretildiği, sözün hangi videoda kullanıldığı karşılıklı etiketlerle tıklandığında anında gösterilir.
5. **Site Üzerinden CRUD (Ekle/Sil/Durum Değiştir):**
   - Modal penceresi üzerinden tek tıkla yeni söz ekleme (`addDoc`), söz durumunu sıraya geri alma/kullanıldı yapma (`updateDoc`) ve kalıcı silme (`deleteDoc`).


---

# ARŞİV: bilgi.txt

Mevzu projesinin baştan sona kapsamlı teknik denetimini yap. Benimle tamamen Türkçe konuş.
26 satıa kadar olan cadex talimatı ama ilk ama analiz yaparak cevap ver 
ŞİMDİLİK HİÇBİR DOSYAYI DEĞİŞTİRME. Paket kurma, commit atma, push yapma veya gerçek Instagram yayını başlatma.

Şu alanları sırayla incele:
1. Proje mimarisi, klasör yapısı ve bağımlılıklar.
2. GitHub Actions: zamanlama, çift çalıştırma, manuel ve otomatik yayın.
3. Firebase: söz havuzu, rezervasyon, videos koleksiyonu, yayın kilitleri ve güvenlik.
4. Instagram API: yükleme, işleme, yayın, doğrulama ve hata yönetimi.
5. Remotion: tipografi, animasyon, arka plan ve dinamik süre.
6. Müzik: kategori seçimi, lisans, ses seviyesi ve geçişler.
7. Mevzu paneli: video arşivi, önizleme, indirme ve sayfalama.
8. Telegram, Pexels ve ilerideki çoklu platform entegrasyonları.
9. Testler, kayıt sistemi, güvenlik, maliyetler ve geri dönüş planı.

Her bulgu için gerçek dosya adını ve satır numarasını belirt.
Mevcut olan, eksik olan ve doğrulanamayan özellikleri ayrı göster.
Önce kritik yayın hatalarını, sonra tasarım ve yeni özellikleri ele al.

Sonuçta:
- Önceliklendirilmiş eksik listesi
- Geliştirme yol haritası
- Canlı sistemi koruma planı
hazırla.

Hiçbir değişiklik yapmadan raporu bana göster ve onayımı bekle.




Sefa, Mevzu'yu sıfırdan yeni bir projeymiş gibi değil, şu ana kadar geliştirdiğimiz sistemin üzerine kurarak değerlendirelim.
Paylaştığın ekranları, Instagram istatistiklerini, anlattığın Firebase yapısını ve önceki kod incelemelerimizi dikkate aldım. Güncel GitHub deposunu yeniden açmayı da denedim ancak şu anda canlı dosyalara erişemedim. Dolayısıyla aşağıdaki çalışma bir mimari denetim ve eksik listesi; en son kod değişikliklerinin tamamını doğruladığım bir rapor değil.
Mevzu'nun mevcut temeli
Yeniden başlamamıza gerek yok
Anlattığın mevcut sürümde Firebase söz havuzu, otomatik video üretimi, kategoriye uygun müzik, Gemini açıklamaları, Instagram yayınlama ve videoları izleyebildiğin yönetim paneli zaten bulunuyor.

Üç temel hedefimiz
Yayınların güvenilir çalışması

Videoların daha fazla izlenmesi

Mevzu'nun telefondan yönetilmesi


Benim için öncelik sırası bu. Yeni özellikler eklerken ilk ikisini bozmamalıyız.





1. Baştan sona eksik ve geliştirme tablomuz
Öncelikleri teknik risk ve şu ana kadarki deneyimimize göre belirledim. Kodda henüz doğrulayamadığım maddeler için kontrol gerekli yazdım.
Bölüm	Mevcut durum	Yapılacak iş	Öncelik
GitHub Actions	Çalışıyor, zamanlama sorunları yaşandı	Gecikme ve kaçırılan yayınları yönetmek	Kritik
Instagram API	Hem başarılı hem düşük erişimli yayınlar var	Yayın doğrulama ve hata incelemesi	Kritik
Firebase	Sözler ve videolar tutuluyor	İşlem kilitleri ve veri tutarlılığını doğrulamak	Kritik
Remotion	Video oluşturuyor	Yeni tipografi ve dinamik süre	Yüksek
Müzik	Kategoriye uygun seçim mevcut	Başlangıç noktası, ses ve geçiş kontrolü	Yüksek
Telegram	Planlandı	Telefonuna otomatik MP4 gönderimi	Yüksek
Pexels	Planlandı	Görsel seçimi ve mevcut arşive dönüş	Orta
Yönetim paneli	İçerik arşivi mevcut	İstatistikler, arama ve sayfalama	Orta
Çoklu platform	Gelecek aşama	Facebook, TikTok ve Story yayınları	Sonra
2. En kritik eksik: yayın motorunun güvenilirliği
Önce çözmemiz gereken senaryolar
Senaryo A — GitHub geç çalışıyor
Yayın saatini kaçırsa bile sonraki çalışmada eksik yayını yakalamalı. GitHub, planlı görevlerin gecikebildiğini ve bazılarının hiç çalışmayabildiğini doğruluyor. 

GitHub Docs




Senaryo B — Instagram videoyu yayınlıyor ama yanıt kayboluyor
Mevzu bunu başarısız zannederek aynı videoyu yeniden göndermemeli. Önce Instagram tarafındaki yayın durumunu araştırmalı.
Senaryo C — İki işlem aynı anda çalışıyor
Manuel ve otomatik yayın aynı içeriği seçememeli. Firestore'un atomik işlemleri bu tür eşzamanlı işlemleri güvenli yönetmek için kullanılabilir. 

firebase.google.com




Senaryo D — İşlem gerçekten başarısız
Başarısız video kaybolmamalı. Aynı iş kontrollü olarak yeniden denenmeli ve tekrar başarısız olursa sana bildirim gönderilmeli.

Hedefimiz yalnızca başarılı yayın sayısını artırmak değil; neyin, ne zaman ve neden başarısız olduğunu görebilmek.
Bunun için her yayında planlanan saat, başlama saati, seçilen söz, video ID, Instagram gönderi ID'si, deneme sayısı ve hata bilgisini kaydetmeliyiz.
3. Tasarım, müzik ve içerik tarafındaki eksikler
Mevzu Reels V2
Sinematik
Felsefe, hayat ve düşünce.
Minimal
Huzur, motivasyon ve kısa sözler.

Bu görseller yeni şablonların arka plan tarzını temsil ediyor.
İstatistiklerinde manuel ve otomatik videoların ortalama izlenme süreleri yaklaşık 2–3 saniye. İncelediğimiz videolardaki geçme oranları da %63 ile %86 arasında değişiyordu.
Bence geliştirmede en fazla üzerinde durmamız gereken ölçüm bu. Videoyu ilk saniyede anlaşılır hâle getirmeliyiz.
Remotion V2'de ilk karede okunabilir büyük yazı, kısa sözlerde daha kısa video ve söz uzunluğuna göre otomatik süre olacak. Müziğin yalnızca kategoriyle değil, sahnenin duygusu ve hareketiyle de uyumlu olması gerekiyor.
Ayrıca Pexels arka planları gelmediğinde şu anki görsel arşivimizin otomatik kullanılmasını sağlayacağız. Mevcut güzel tasarımları atmayacağız.







4. Telegram, yönetim paneli ve istatistikler
Bu üç sistemi birbirine bağlayalım.
İçerik yönetim merkezi
1. Telegram ile telefona teslim
   Video hazır olduğunda MP4 doğrudan Telegram'a gelsin. Başarılı yayınlar ve kritik hatalar da bildirim olarak gönderilsin.
   Telegram'ın standart Bot API'si 50 MB'a kadar video göndermeyi destekliyor. Daha büyük dosyalar için Firebase Storage bağlantısını kullanabiliriz. 
   
   core.telegram.org
2. Mevcut arşivi genişletme
   Atılan videoların içine Instagram istatistiklerini ekleyelim. Sözler ekranında da gerçek Firebase sayfalaması kullanalım: sayfa başına 25 kayıt.
3. Performanstan öğrenme
   Her videonun 24 saat, 72 saat ve 7 gün sonraki izlenme ve etkileşim verileri saklansın.
   Instagram ve Facebook görüntülemeleri birbirine karıştırılmasın. Hangi tasarımın ve müziğin daha fazla izlenme süresi sağladığını görebilelim.

5. Gözden kaçırmamamız gereken teknik konular
Bunlar kullanıcıya hemen görünmeyen ama sistem büyüdükçe önemli hâle gelen işler.
Konu	Kontrol
Güvenlik	Firebase ve Instagram anahtarları, Telegram bot erişimi
Test ortamı	Geliştirmelerin canlı Firebase ve Instagram hesabını etkilememesi
Otomatik testler	Yayın saati, başarısız yükleme, tekrar deneme ve çift çalıştırma
Dosya saklama	Üretilen MP4, kapak ve müziklerin saklama süresi
Yayın kayıtları	Her aşamanın sonucunun anlaşılabilir şekilde kaydedilmesi
Geri dönüş	Yeni sürüm sorun çıkarırsa önceki çalışan sürüme dönme
Maliyet	Pexels istekleri, yapay zekâ kullanımı, depolama ve işlem maliyetleri
Özellikle geliştirme dalında gerçek Instagram'a yayın yapılmaması ve canlı Firebase kayıtlarının yanlışlıkla değiştirilmemesi önemli.
6. Uygulama yol haritamız
Mevzu geliştirme takibi
0/12



Aşama 1 — Sistemi güvenceye alma
[ ] GitHub ve Instagram yayın akışının tam kod denetimi
[ ] Mükerrer yayın ve başarısız işlem senaryoları
[ ] Canlı sistemden ayrılmış güvenli test ortamı


Aşama 2 — Telegram ve tasarım
[ ] MP4 dosyasının doğrudan telefona gönderilmesi
[ ] Remotion V2 tipografi ve dinamik süre
[ ] Müzik geçişleri ve Pexels entegrasyonu


Aşama 3 — Akıllı içerik sistemi
[ ] Arşivde Instagram istatistikleri
[ ] Söz, müzik ve tasarım performansının eşleştirilmesi
[ ] Veriye göre içerik seçim kurallarının geliştirilmesi


Aşama 4 — Yeni platformlar
[ ] Facebook, TikTok ve Story için ayrı yayın akışları
[ ] Platform bazında hata yönetimi
[ ] Birleşik yönetim ve performans paneli

Bu kutular kişisel takip içindir; işaretlemek projede kod değişikliği yapmaz.
7. Şimdi Codex ile gerçek kod denetimini tamamlayalım
Güncel GitHub deposuna canlı erişim denemem başarısız oldu.  Bu nedenle mevcut kodda nelerin tamamlandığını kesin olarak belirlemenin yolu, bilgisayarında açık olan Codex'in dosyaları incelemesi.
Şu talimatı terminalde Codex'e ver:
Codex denetim talimatı
Mevcut Mevzu klasöründe çalışan Codex'e gönderebilirsin.
 Talimatı kopyala
Şu anki kararım: Önce canlı yayın sisteminin güvenilirliğini doğrulayalım. Ardından Telegram ile video teslimi ve Remotion V2'yi geliştirelim. Sunucu değiştirmek, n8n'e geçmek veya yeni platform eklemek şimdilik gerekli değil.
Codex'in hazırladığı denetim raporunu buraya getirirsen hangi dosyada neyi değiştireceğimizi, canlı Instagram otomasyonuna dokunmadan, tek tek netleştirebiliriz.







26 satıa kadar olan cadex talimatı ama ilk ama analiz yaparak cevap ver 
