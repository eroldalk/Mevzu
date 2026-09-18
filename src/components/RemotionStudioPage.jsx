import React, { useState, useRef, useEffect } from "react";
import { Player } from "@remotion/player";
import { MevzuReelsComposition } from "../remotion/MevzuReelsComposition";
import { NATURE_PRESETS } from "../remotion/CinematicBackground";
import { TEMALAR } from "../utils/tema";
import { getRandomQuote, markQuoteUsed } from "../utils/quotes";
import { generateVideoId } from "../utils/pixabayMusic";
import { getMixkitByCategory, VERIFIED_MIXKIT_TRACKS } from "../utils/mixkitLibrary";
import { generateInstagramCaption } from "../utils/captionGenerator";
import { db } from "../utils/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Video,
  Type,
  Waves,
  Music,
  Download,
  Link2,
  Check,
  Volume2,
  Upload,
  Play,
  Pause,
  Loader2,
  Send,
  FileText,
  Copy,
  CheckCircle,
} from "lucide-react";

export const MUSIC_PRESETS = [
  // ── 🌊 Doğa & Su ──
  { id: "ocean_wave",      name: "🌊 Okyanus & Dalga Sesi",              url: "https://assets.mixkit.co/music/443/443.mp3", tip: "Doğa & Su" },
  { id: "forest_birds",    name: "🌲 Orman & Kuş Sesleri",               url: "https://assets.mixkit.co/music/139/139.mp3", tip: "Doğa & Su" },
  { id: "rain_piano",      name: "🌧️ Yağmur & Melankoli Piyano",         url: "https://assets.mixkit.co/music/522/522.mp3", tip: "Doğa & Su" },
  { id: "nature_chill",    name: "🍃 Doğa Chillout / Huzur",             url: "https://assets.mixkit.co/music/580/580.mp3", tip: "Doğa & Su" },

  // ── 🎻 Felsefe & Derin Zihin ──
  { id: "cinematic_deep",  name: "🎻 Derin Sinematik Keşif",             url: "https://assets.mixkit.co/music/587/587.mp3", tip: "Felsefe" },
  { id: "sad_piano",       name: "🎹 Hüzünlü Solo Piyano",               url: "https://assets.mixkit.co/music/659/659.mp3", tip: "Felsefe" },
  { id: "stoic_strings",   name: "🏛️ Stoacı Antik Yaylılar",             url: "https://assets.mixkit.co/music/614/614.mp3", tip: "Felsefe" },
  { id: "silent_collapse", name: "🌑 Sessiz Çöküş (Dramatik)",           url: "https://assets.mixkit.co/music/671/671.mp3", tip: "Felsefe" },

  // ── 🔥 Motivasyon & Güç ──
  { id: "fire_acoustic",   name: "🔥 Gece Ateşi & Akustik",              url: "https://assets.mixkit.co/music/127/127.mp3", tip: "Motivasyon" },
  { id: "epic_drums",      name: "⚡ Epik Savaş Davulları",               url: "https://assets.mixkit.co/music/676/676.mp3", tip: "Motivasyon" },
  { id: "determined",      name: "🏎️ Kararlı İlerleme (Hırs)",           url: "https://assets.mixkit.co/music/32/32.mp3",  tip: "Motivasyon" },
  { id: "champion_rock",   name: "🏆 Şampiyon Ruhu (Rock)",              url: "https://assets.mixkit.co/music/51/51.mp3",  tip: "Motivasyon" },

  // ── 🪐 Gece, Siber & Kozmik ──
  { id: "cosmic_meditation", name: "🪐 Kozmik & Derin Meditasyon",       url: "https://assets.mixkit.co/music/134/134.mp3", tip: "Kozmik" },
  { id: "lofi_city",       name: "🏙️ Gece Şehir Beats (Lo-Fi)",          url: "https://assets.mixkit.co/music/623/623.mp3", tip: "Kozmik" },
  { id: "synthwave",       name: "🌃 Gece Yarısı Synthwave",             url: "https://assets.mixkit.co/music/132/132.mp3", tip: "Kozmik" },
  { id: "cafe_jazz",       name: "☕ Rahat Kahve & Caz",                 url: "https://assets.mixkit.co/music/493/493.mp3", tip: "Kozmik" },

  // ── 🔇 Instagram Trend ──
  { id: "silent",          name: "🔇 Sessiz (Instagram Trend Sesi İçin)", url: null,                                         tip: "Önerilen" },
];

// Tema Görsel Kategorisi ile Müzik Türü Uyum Matrisi:
// Her temanın görsel atmosferine ve ruh haline %100 uyan 56-58 adet doğrulanmış Mixkit parçası
export const TEMA_MUZIK_UYUM_HARITASI = {
  "Doğa & Su": ["Chillout", "Ambient"],         // ~57 Parça: Okyanus, şelale, göl, sisli çam ormanı, yağmur damlaları
  "Element & Doğa": ["Motivasyon", "Dramatik"], // ~56 Parça: Kamp ateşi, gün batımı & dağ, çöl, fırtına, şimşek
  "Kozmik & Uzay": ["Kozmik", "Ambient"],       // ~58 Parça: Gece dolunayı, kuzey ışıkları, yıldızlararası galaksi
  "Şehir & Gece": ["Kozmik", "Ambient"],        // ~58 Parça: Gece otoyolu, neon yağmurlu şehir
  "Felsefe & Kültür": ["Piyano", "Dramatik"],   // ~56 Parça: Antik mermer heykel, kadim kütüphane
  "Minimalist": ["Piyano", "Dramatik"],         // ~56 Parça: Mat siyah & altın, sade felsefi tasarım
};

export default function RemotionStudioPage({ tema = "dark", onBack }) {
  const T = TEMALAR[tema] || TEMALAR.dark;

  const [quote, setQuote] = useState(
    "Deniz sakin olduğunda, herkes dümenci kesilir. Asıl mesele fırtınada rotayı kaybetmemektir."
  );
  const [author, setAuthor] = useState("Publilius Syrus");
  const [category, setCategory] = useState("DİRENÇ & ZİHİN");
  const [bgStyle, setBgStyle] = useState("ocean");
  const [customBgUrl, setCustomBgUrl] = useState("");
  // URL'den ID oku (örn: /reel_20260915_... veya /20260915_...)
  const getInitialVideoId = () => {
    const pathId = window.location.pathname.replace(/^\/+/, "");
    if (pathId) return pathId;
    const urlParams = new URLSearchParams(window.location.search);
    const qId = urlParams.get("id");
    if (qId) return qId;
    return generateVideoId();
  };

  const [selectedCat, setSelectedCat] = useState("Doğa & Su");
  const [highlightColor, setHighlightColor] = useState("#38bdf8");
  const [animStyle, setAnimStyle] = useState("highlight");
  const [fontFamily, setFontFamily] = useState("'DM Sans', sans-serif");
  const [musicUrl, setMusicUrl] = useState(MUSIC_PRESETS[0].url);
  const [musicId, setMusicId] = useState(MUSIC_PRESETS[0].id);
  const [musicName, setMusicName] = useState(MUSIC_PRESETS[0].name);
  const [customAudioName, setCustomAudioName] = useState("");
  const [videoFileName, setVideoFileName] = useState(getInitialVideoId);
  const [videoId, setVideoId] = useState(getInitialVideoId);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [caption, setCaption] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [currentQuoteObj, setCurrentQuoteObj] = useState(null);
  const fileInputRef = useRef(null);
  const lastMusicUrlRef = useRef("");
  const lastQuoteRef = useRef("");
  const lastBgRef = useRef("");
  const recentBgsRef = useRef([]);
  const recentMusicRef = useRef([]);
  const recentQuotesRef = useRef([]);
  const lastFontRef = useRef("");
  const lastAnimRef = useRef("");

  // URL'deki adresi sayfayı yenilemeden güncelle (örn: /reel_20260915_2322_ORNJ)
  const guncelleUrl = (id) => {
    try {
      const yeniYol = `/${id}`;
      window.history.replaceState({ videoId: id }, "", yeniYol);
    } catch (e) {
      console.warn("URL güncellenemedi:", e);
    }
  };

  // Instagram açıklamasını (soru, yazar, çağrı ve hashtagler) üreten fonksiyon
  const yenidenCaptionUret = async (qText = quote, qAuthor = author, qCat = category) => {
    try {
      setCaptionLoading(true);
      const cap = await generateInstagramCaption({
        quote: qText,
        author: qAuthor,
        category: qCat,
      });
      setCaption(cap);
    } catch (err) {
      console.warn("Açıklama üretme uyarısı:", err);
    } finally {
      setCaptionLoading(false);
    }
  };

  // Kullanıcının kendi MP3 dosyasını yüklemesi
  const handleCustomAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMusicUrl(url);
      setMusicName(file.name);
      setCustomAudioName(file.name);
    }
  };

  // Firestore'dan rastgele söz çek
  const rastgeleSozGetir = async () => {
    try {
      setYukleniyor(true);
      const q = await getRandomQuote();
      if (q && q.quote) {
        const text = (q.quote || "").replace(/\r?\n+/g, " ").trim();
        const aut = q.author || "Mevzu";
        const cat = (q.cat || "FELSEFE").toUpperCase();
        setQuote(text);
        if (q.author) setAuthor(aut);
        if (q.cat) setCategory(cat);
        setCurrentQuoteObj(q);
        yenidenCaptionUret(text, aut, cat);
      }
    } catch (err) {
      console.error("Söz çekilemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  // 7 Font Listesi
  const STUDIO_FONTS = [
    { id: "'DM Sans', sans-serif", label: "Modern Sans" },
    { id: "'Montserrat', sans-serif", label: "🔥 Reels Kalın (Bold)" },
    { id: "'Cinzel', serif", label: "🏛️ Antik Stoacı" },
    { id: "'Playfair Display', serif", label: "✨ Lüks Serif" },
    { id: "'Space Grotesk', sans-serif", label: "🛸 Fütüristik Sans" },
    { id: "'Syne', sans-serif", label: "🎨 Sanatsal Bold" },
    { id: "Georgia, serif", label: "Stoacı Klasik" },
  ];

  // 7 Altyazı Akış Stili
  const STUDIO_ANIM_STYLES = [
    { id: "highlight", label: "✨ Parlayan Vurgu" },
    { id: "viral_pop", label: "🔥 Viral Kutu Pop" },
    { id: "bounce", label: "⚡ Ritmik Zıplama" },
    { id: "neon", label: "🪐 Siber Neon Işık" },
    { id: "typewriter", label: "⌨️ Daktilo Akışı" },
    { id: "zoom", label: "🚀 3D Pop-in" },
    { id: "fade", label: "🌫️ Sinematik Fade" },
  ];

  // ✨ TEK TIKLA BÜTÜN ÖZELLİKLERİ BİRBİRİYLE UYUMLU ŞEKİLDE OLUŞTURAN SİHİRLİ MOTOR
  // 99 TEMA × 170 MÜZİK × 7 FONT × 7 AKIŞ STİLİ = 824,670 EŞSİZ KOMBİNASYON!
  const sihirliUyumluOlustur = async () => {
    try {
      setYukleniyor(true);

      // 1. SÖZ SEÇİMİ (Son 15 sözü eleyerek tekrarı önler)
      let q = await getRandomQuote();
      let attempts = 0;
      while (q && q.quote && recentQuotesRef.current.includes(q.quote) && attempts < 6) {
        q = await getRandomQuote();
        attempts++;
      }

      let quoteText = quote;
      let quoteAuthor = author;
      let quoteCat = category;

      if (q && q.quote) {
        quoteText = (q.quote || "").replace(/\r?\n+/g, " ").trim();
        quoteAuthor = q.author || "Mevzu";
        quoteCat = (q.cat || "FELSEFE").toUpperCase();
        recentQuotesRef.current = [quoteText, ...recentQuotesRef.current.slice(0, 15)];
        lastQuoteRef.current = quoteText;
        setQuote(quoteText);
        setAuthor(quoteAuthor);
        setCategory(quoteCat);
        setCurrentQuoteObj(q);
      }
      yenidenCaptionUret(quoteText, quoteAuthor, quoteCat);

      // 2. TÜM 99 TEMA ARASINDAN SEÇİM (Son 20 temayı eleyerek tam döngü sağlar)
      const tumTemaKeyleri = Object.keys(NATURE_PRESETS); // 99 Tema!
      const temaAdaylari = tumTemaKeyleri.filter((id) => !recentBgsRef.current.includes(id));
      const secilenBg = temaAdaylari.length > 0
        ? temaAdaylari[Math.floor(Math.random() * temaAdaylari.length)]
        : tumTemaKeyleri[Math.floor(Math.random() * tumTemaKeyleri.length)];

      recentBgsRef.current = [secilenBg, ...recentBgsRef.current.slice(0, 20)];
      lastBgRef.current = secilenBg;

      const presetObj = NATURE_PRESETS[secilenBg] || NATURE_PRESETS.ocean;
      // ZIT KONTRAST RENGİ: Her temanın kendine ait zıt kontrast rengi (Mavi okyanusta Altın, Günbatımında Buz Mavisi vb.)
      const secilenRenk = presetObj.contrastAccent || "#f5c542";

      // 3. TEMA İLE %100 UYUMLU MÜZİK SEÇİMİ
      // Seçilen temanın görsel atmosferine göre (Örn: Okyanus -> Chillout/Ambient, Dağ/Ateş -> Motivasyon/Dramatik, Heykel -> Piyano)
      // 170 parçalık havuzdan 56-58'lik tam uyumlu tür kümesi filtrelenir ve son 30 parça elenerek çalınır.
      const uyumluTurler = TEMA_MUZIK_UYUM_HARITASI[presetObj.cat] || ["Ambient", "Chillout", "Piyano", "Dramatik", "Motivasyon", "Kozmik"];
      const kategoriMuzikleri = VERIFIED_MIXKIT_TRACKS.filter((t) => uyumluTurler.includes(t.genre));
      const muzikHavuzu = kategoriMuzikleri.length > 0 ? kategoriMuzikleri : VERIFIED_MIXKIT_TRACKS;

      const muzikAdaylari = muzikHavuzu.filter((t) => !recentMusicRef.current.includes(t.url));
      const secilenTrack = muzikAdaylari.length > 0
        ? muzikAdaylari[Math.floor(Math.random() * muzikAdaylari.length)]
        : muzikHavuzu[Math.floor(Math.random() * muzikHavuzu.length)];

      recentMusicRef.current = [secilenTrack.url, ...recentMusicRef.current.slice(0, 30)];
      lastMusicUrlRef.current = secilenTrack.url;

      // 4. TÜM 7 FONT ARASINDAN SEÇİM (Bir önceki fonttan kesinlikle farklı)
      const fontAdaylari = STUDIO_FONTS.filter((f) => f.id !== lastFontRef.current);
      const secilenFontObj = fontAdaylari[Math.floor(Math.random() * fontAdaylari.length)];
      const secilenFont = secilenFontObj.id;
      lastFontRef.current = secilenFont;

      // 5. TÜM 7 AKIŞ STİLİ ARASINDAN SEÇİM (Bir önceki stilden kesinlikle farklı)
      const animAdaylari = STUDIO_ANIM_STYLES.filter((a) => a.id !== lastAnimRef.current);
      const secilenAnimObj = animAdaylari[Math.floor(Math.random() * animAdaylari.length)];
      const secilenAnim = secilenAnimObj.id;
      lastAnimRef.current = secilenAnim;

      // 6. YENİ EŞSİZ VİDEO ID
      const yeniVideoId = generateVideoId();

      setBgStyle(secilenBg);
      setSelectedCat(presetObj.cat || "Doğa & Su");
      setHighlightColor(secilenRenk);
      setMusicUrl(secilenTrack.url);
      setMusicId(secilenTrack.id);
      setMusicName(secilenTrack.name);
      setFontFamily(secilenFont);
      setAnimStyle(secilenAnim);
      setVideoId(yeniVideoId);
      setVideoFileName(yeniVideoId);
      guncelleUrl(yeniVideoId);
      setCustomBgUrl("");
      setCustomAudioName("");
    } catch (err) {
      console.error("Sihirli uyumlu reel oluşturma hatası:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  // Sadece müzik değiştirmek isteyen kullanıcı için (Mevcut temayla uyumlu 56-58 parça arasından)
  const rastgeleMuzikSec = () => {
    const mevcutPreset = NATURE_PRESETS[bgStyle] || NATURE_PRESETS.ocean;
    const uyumluTurler = TEMA_MUZIK_UYUM_HARITASI[mevcutPreset.cat] || ["Ambient", "Chillout", "Piyano", "Dramatik", "Motivasyon", "Kozmik"];
    const kategoriMuzikleri = VERIFIED_MIXKIT_TRACKS.filter((t) => uyumluTurler.includes(t.genre));
    const muzikHavuzu = kategoriMuzikleri.length > 0 ? kategoriMuzikleri : VERIFIED_MIXKIT_TRACKS;
    const adaylar = muzikHavuzu.filter((t) => !recentMusicRef.current.includes(t.url));
    const track = (adaylar.length > 0 ? adaylar : muzikHavuzu)[
      Math.floor(Math.random() * (adaylar.length || muzikHavuzu.length))
    ];
    if (track) {
      setMusicUrl(track.url);
      setMusicId(track.id);
      setMusicName(track.name);
      recentMusicRef.current = [track.url, ...recentMusicRef.current.slice(0, 30)];
    }
  };

  // Sadece tema değiştirmek isteyen kullanıcı için (99 havuzundan tek tıkla yeni tema ve ona uyumlu müzik)
  const rastgeleTemaSec = () => {
    const tumTemaKeyleri = Object.keys(NATURE_PRESETS);
    const adaylar = tumTemaKeyleri.filter((id) => !recentBgsRef.current.includes(id));
    const secilen = (adaylar.length > 0 ? adaylar : tumTemaKeyleri)[Math.floor(Math.random() * (adaylar.length || tumTemaKeyleri.length))];
    if (secilen) {
      const p = NATURE_PRESETS[secilen];
      setBgStyle(secilen);
      setSelectedCat(p.cat || "Doğa & Su");
      setHighlightColor(p.contrastAccent || "#f5c542");
      recentBgsRef.current = [secilen, ...recentBgsRef.current.slice(0, 20)];

      // Yeni seçilen temanın görseline uyan müzik havuzundan parça seç
      const uyumluTurler = TEMA_MUZIK_UYUM_HARITASI[p.cat] || ["Ambient", "Chillout"];
      const katMuzik = VERIFIED_MIXKIT_TRACKS.filter((t) => uyumluTurler.includes(t.genre));
      const muzikHavuzu = katMuzik.length > 0 ? katMuzik : VERIFIED_MIXKIT_TRACKS;
      const adayMuzikler = muzikHavuzu.filter((t) => !recentMusicRef.current.includes(t.url));
      const trk = (adayMuzikler.length > 0 ? adayMuzikler : muzikHavuzu)[
        Math.floor(Math.random() * (adayMuzikler.length || muzikHavuzu.length))
      ];
      if (trk) {
        setMusicUrl(trk.url);
        setMusicId(trk.id);
        setMusicName(trk.name);
        recentMusicRef.current = [trk.url, ...recentMusicRef.current.slice(0, 30)];
      }
    }
  };

  // Sayfa ilk açıldığında da her seferinde farklı bir söz ve uyumlu ayarlar gelsin
  useEffect(() => {
    sihirliUyumluOlustur();
  }, []);

  const cleanName = videoFileName.trim() || `mevzu_${Date.now()}`;

  // Manuel Yayınla / Instagram Hazırla İşlemi
  const handleManuelYayinla = async () => {
    try {
      setPublishing(true);

      // 1. Sözü kullanıldı olarak damgala ve geçmişe ekle
      if (currentQuoteObj) {
        markQuoteUsed(currentQuoteObj);
        if (currentQuoteObj.id && !currentQuoteObj.id.startsWith("local-")) {
          try {
            await updateDoc(doc(db, "quotes", currentQuoteObj.id), {
              used: true,
              usedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn("Firestore söz güncelleme uyarısı:", e);
          }
        }
      }

      // 2. Firestore'a video kaydı oluştur
      const videoKaydi = {
        videoId: cleanName,
        quoteId: currentQuoteObj?.id || null,
        quote,
        author,
        category,
        caption,
        bgStyle,
        musicUrl,
        musicId,
        musicName,
        fontFamily,
        animStyle,
        highlightColor,
        createdAt: new Date().toISOString(),
        status: "ready_to_publish",
        manualPublish: true,
      };

      try {
        await setDoc(doc(db, "videos", cleanName), videoKaydi);
      } catch (err) {
        console.warn("Firestore video kaydı uyarısı:", err);
      }

      // 3. Açıklamayı panoya kopyala
      if (caption) {
        await navigator.clipboard.writeText(caption);
        setCaptionCopied(true);
        setTimeout(() => setCaptionCopied(false), 3000);
      }

      setPublishedSuccess(true);
      setTimeout(() => setPublishedSuccess(false), 8000);
    } catch (err) {
      console.error("Manuel yayınlama hatası:", err);
    } finally {
      setPublishing(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    background: T.bg2 || "#16171d",
    border: `1px solid ${T.border || "#262832"}`,
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const categories = [
    "Doğa & Su",
    "Element & Doğa",
    "Felsefe & Kültür",
    "Şehir & Gece",
    "Kozmik & Uzay",
    "Minimalist",
  ];

  const filteredPresets = Object.values(NATURE_PRESETS).filter(
    (p) => p.cat === selectedCat
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(56, 189, 248, 0.05) 0%, transparent 70%), ${T.bg || "#0e0f14"}`,
        color: "#f0f0f0",
        fontFamily: "'DM Sans', sans-serif",
        padding: "28px 22px",
        boxSizing: "border-box",
      }}
    >
      {/* Üst Bar */}
      <div
        style={{
          maxWidth: 1260,
          margin: "0 auto 28px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: T.bg3 || "#1f212a",
            border: `1px solid ${T.border || "#2e313e"}`,
            color: "#e0e0e0",
            borderRadius: 10,
            padding: "9px 16px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Geri Dön
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: 4,
              color: "#38bdf8",
            }}
          >
            #MEVZU
          </span>
          <span
            style={{
              fontSize: 11,
              background: "rgba(56, 189, 248, 0.14)",
              color: "#38bdf8",
              padding: "4px 10px",
              borderRadius: 20,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            SESLİ & SİNEMATİK REELS
          </span>
        </div>
      </div>

      {/* Ana Çalışma Alanı (2 Kolon) */}
      <div
        style={{
          maxWidth: 1260,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 36,
          alignItems: "start",
        }}
      >
        {/* Sol Kolon: Remotion Canlı Oynatıcı */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 370,
              aspectRatio: "9/16",
              borderRadius: 26,
              overflow: "hidden",
              boxShadow: "0 25px 65px rgba(0, 0, 0, 0.9), 0 0 50px rgba(56, 189, 248, 0.15)",
              border: `1.5px solid rgba(56, 189, 248, 0.35)`,
            }}
          >
            <Player
              key={musicUrl || "none"}
              component={MevzuReelsComposition}
              inputProps={{
                quote,
                author,
                category,
                highlightColor,
                animStyle,
                fontFamily,
                bgStyle,
                customBgUrl: customBgUrl.trim() || null,
                musicUrl,
                primaryColor: NATURE_PRESETS[bgStyle]?.accent || "#38bdf8",
              }}
              durationInFrames={240}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={30}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls
              autoPlay
              loop
            />
          </div>

          {/* 📱 Instagram Yayına Hazırla & Manuel Yayınla Kartı */}
          <div
            style={{
              width: "100%",
              maxWidth: 370,
              padding: 16,
              borderRadius: 16,
              background: "linear-gradient(180deg, rgba(244, 114, 182, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
              border: "1.5px solid rgba(244, 114, 182, 0.35)",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxSizing: "border-box",
            }}
          >
            {/* Kart Başlığı */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f472b6", display: "flex", alignItems: "center", gap: 7 }}>
                <FileText size={16} /> Instagram Açıklaması & Hashtag
              </span>
              <button
                onClick={() => yenidenCaptionUret()}
                disabled={captionLoading}
                title="Yeni bir soru ve hashtag seti üretir"
                style={{
                  background: "rgba(244, 114, 182, 0.15)",
                  border: "1px solid rgba(244, 114, 182, 0.4)",
                  color: "#f472b6",
                  borderRadius: 7,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Sparkles size={12} className={captionLoading ? "spin" : ""} />
                {captionLoading ? "Üretiliyor..." : "Yenile"}
              </button>
            </div>

            {/* Düzenlenebilir Açıklama Metni */}
            <div style={{ position: "relative" }}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={6}
                placeholder="Instagram açıklaması hazırlanıyor..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0a0b0e",
                  border: "1px solid rgba(244, 114, 182, 0.25)",
                  borderRadius: 10,
                  color: "#f3f4f6",
                  fontSize: 12,
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Butonlar: Kopyala ve Manuel Yayınla */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(caption);
                  setCaptionCopied(true);
                  setTimeout(() => setCaptionCopied(false), 2000);
                }}
                disabled={!caption}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: captionCopied ? "#10b981" : "rgba(255, 255, 255, 0.06)",
                  border: `1px solid ${captionCopied ? "#10b981" : "rgba(255, 255, 255, 0.15)"}`,
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                {captionCopied ? <Check size={14} /> : <Copy size={14} />}
                {captionCopied ? "Kopyalandı!" : "Açıklamayı Al"}
              </button>

              <button
                onClick={handleManuelYayinla}
                disabled={publishing}
                style={{
                  flex: 1.2,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                }}
              >
                {publishing ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                {publishing ? "Kaydediliyor..." : "🚀 Manuel Yayınla"}
              </button>
            </div>

            {/* Başarı Bildirimi */}
            {publishedSuccess && (
              <div
                style={{
                  padding: "9px 11px",
                  borderRadius: 9,
                  background: "rgba(16, 185, 129, 0.16)",
                  border: "1px solid #10b981",
                  color: "#6ee7b7",
                  fontSize: 11,
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                }}
              >
                <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Harika! Video yayına hazırlandı.</strong>
                  <div style={{ color: "#d1fae5", marginTop: 2 }}>
                    • Söz Firestore'da tüketildi (tekrar çıkmaz).
                    <br />• Açıklama ve etiketler panoya kopyalandı!
                    <br />• Video veritabanına kaydedildi.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hızlı İndirme & Render Kartı */}
          <div
            style={{
              width: "100%",
              maxWidth: 370,
              padding: 16,
              borderRadius: 14,
              background: "rgba(56, 189, 248, 0.08)",
              border: `1px solid rgba(56, 189, 248, 0.25)`,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", display: "flex", alignItems: "center", gap: 6 }}>
                <Video size={16} /> 1080×1920 HD MP4 Çıktısı
              </span>
              <span style={{ fontSize: 11, color: "#4ef59a", fontWeight: 700 }}>30 FPS · 8sn</span>
            </div>

            {/* Dosya Adı Belirleme Alanı */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#aaa" }}>
                🏷️ Video Dosya Adı (İstediğin ismi yazabilirsin):
              </label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="text"
                  value={videoFileName}
                  onChange={(e) => setVideoFileName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  placeholder="ornek_video_1"
                  style={{
                    flex: 1,
                    padding: "7px 11px",
                    background: "#0d0e12",
                    border: "1px solid rgba(56, 189, 248, 0.35)",
                    borderRadius: 8,
                    color: "#ffffff",
                    fontSize: 12,
                    fontFamily: "monospace",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700 }}>.mp4</span>
              </div>

              {/* Hızlı İsim Seçenekleri */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[
                  { label: "+1 Sıradaki", act: () => {
                    const match = videoFileName.match(/_(\d+)$/);
                    const nextNum = match ? parseInt(match[1], 10) + 1 : 2;
                    setVideoFileName(`reel_${nextNum}`);
                  }},
                  { label: "test_1", val: "test_1" },
                  { label: "test_2", val: "test_2" },
                  { label: "mevzu_reels", val: "mevzu_reels" },
                  { label: "Tarihli", act: () => {
                    const d = new Date();
                    setVideoFileName(`reel_${d.getDate()}_${d.getMonth()+1}_${d.getHours()}${d.getMinutes()}`);
                  }},
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.act ? item.act : () => setVideoFileName(item.val)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#999",
                      fontSize: 10,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <code
                style={{
                  flex: 1,
                  background: "#08090c",
                  border: "1px solid #222",
                  padding: "9px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#4ef59a",
                  userSelect: "all",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                node scripts/renderCli.mjs {cleanName}.mp4
              </code>
              <button
                onClick={() => {
                  const currentProps = {
                    quote,
                    author,
                    category,
                    bgStyle,
                    musicUrl,
                    animStyle,
                    fontFamily,
                    primaryColor: NATURE_PRESETS[bgStyle]?.accent || "#38bdf8",
                    highlightColor,
                    customBgUrl: customBgUrl.trim() || null,
                  };
                  const propsJson = JSON.stringify(currentProps).replace(/"/g, '\\"');
                  const cmd = `node scripts/renderCli.mjs ${cleanName}.mp4 "${propsJson}"`;
                  navigator.clipboard.writeText(cmd);
                  setKopyalandi(true);
                  setTimeout(() => setKopyalandi(false), 2000);
                }}
                style={{
                  background: kopyalandi ? "#10b981" : "rgba(56, 189, 248, 0.2)",
                  border: `1px solid ${kopyalandi ? "#10b981" : "#38bdf8"}`,
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {kopyalandi ? <Check size={14} /> : <Download size={14} />}
                {kopyalandi ? "Kopyalandı!" : "Kopyala"}
              </button>
            </div>
            
            <div style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 5 }}>
              <span>📁 Çıktı klasörü:</span>
              <code style={{ color: "#38bdf8" }}>Mevzu/output/{cleanName}.mp4</code>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Kontroller */}
        <div
          style={{
            background: T.bg2 || "#16171d",
            border: `1px solid ${T.border || "#262832"}`,
            borderRadius: 20,
            padding: 26,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#38bdf8", display: "flex", alignItems: "center", gap: 8 }}>
              <Waves size={19} /> Arka Plan, Müzik & Tasarım
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {/* ✨ TEK TIKLA SİHİRLİ UYUMLU REEL BUTONU */}
              <button
                onClick={sihirliUyumluOlustur}
                disabled={yukleniyor}
                title="Söze, kategoriye ve anlama en uygun arka plan, müzik, font ve animasyonu tek tıkla otomatik oluşturur."
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: 9,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(236, 72, 153, 0.4)",
                }}
              >
                <Sparkles size={14} />
                {yukleniyor ? "Oluşturuluyor..." : "✨ Sihirli Uyumlu Oluştur"}
              </button>

              <button
                onClick={rastgeleSozGetir}
                disabled={yukleniyor}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(56, 189, 248, 0.14)",
                  border: `1px solid #38bdf8`,
                  color: "#38bdf8",
                  borderRadius: 9,
                  padding: "7px 13px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} className={yukleniyor ? "spin" : ""} />
                {yukleniyor ? "Çekiliyor..." : "Firestore'dan Çek"}
              </button>
            </div>
          </div>

          {/* 1. FON MÜZİĞİ VE SES SEÇİMİ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#a0a0a0", display: "flex", alignItems: "center", gap: 6 }}>
                <Volume2 size={15} color="#38bdf8" /> Fon Müziği / Ses (170 Parça):
              </label>
              <button
                onClick={rastgeleMuzikSec}
                title="170 parçalık doğrulanmış Mixkit havuzundan rastgele farklı bir müzik çalar"
                style={{
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid #38bdf8",
                  color: "#38bdf8",
                  borderRadius: 7,
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                🎲 170'ten Başka Müzik
              </button>
            </div>

            {/* Aktif Çalan Müzik Rozeti */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                fontSize: 12,
                color: "#e0f2fe",
              }}
            >
              <Music size={14} color="#38bdf8" />
              <span style={{ fontWeight: 700, color: "#38bdf8" }}>Çalan:</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {musicName || "170 Müzik Havuzundan Parça"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MUSIC_PRESETS.map((m) => {
                const isActive = musicUrl === m.url;
                return (
                  <button
                    key={m.id || m.name}
                    onClick={() => {
                      setMusicUrl(m.url);
                      setMusicId(m.id || "custom");
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: isActive ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${isActive ? "#38bdf8" : "rgba(255, 255, 255, 0.08)"}`,
                      color: isActive ? "#ffffff" : "#cccccc",
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: isActive ? "#38bdf8" : "#666",
                      }}
                    />
                    {m.name}
                  </button>
                );
              })}
            </div>

            {/* Kendi MP3 Dosyasını Yükleme */}
            <div style={{ marginTop: 4 }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/mp3,audio/wav,audio/mpeg,audio/*"
                onChange={handleCustomAudioUpload}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: customAudioName ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.04)",
                  border: `1px dashed ${customAudioName ? "#38bdf8" : "rgba(255, 255, 255, 0.18)"}`,
                  color: customAudioName ? "#38bdf8" : "#bbb",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Upload size={14} />
                {customAudioName ? `Özel Ses: ${customAudioName.slice(0, 24)}...` : "Cihazından Kendi MP3 Müziğini Yükle"}
              </button>
            </div>
          </div>

          {/* 2. ARKA PLAN KATEGORİLERİ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#a0a0a0", display: "flex", alignItems: "center", gap: 6 }}>
                <Waves size={15} color="#c084fc" /> Arka Plan Teması (99 Sinematik Tema):
              </label>
              <button
                onClick={rastgeleTemaSec}
                title="99 sinematik tema arasından rastgele farklı bir tema seçer"
                style={{
                  background: "rgba(192, 132, 252, 0.15)",
                  border: "1px solid #c084fc",
                  color: "#c084fc",
                  borderRadius: 7,
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                🎲 99'dan Başka Tema
              </button>
            </div>

            {/* Aktif Tema Rozeti */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(192, 132, 252, 0.08)",
                border: "1px solid rgba(192, 132, 252, 0.25)",
                fontSize: 12,
                color: "#f3e8ff",
              }}
            >
              <span style={{ fontWeight: 700, color: "#c084fc" }}>Aktif Tema:</span>
              <span style={{ fontWeight: 600 }}>{NATURE_PRESETS[bgStyle]?.name || bgStyle}</span>
              <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>
                Kategori: {NATURE_PRESETS[bgStyle]?.cat || selectedCat}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: selectedCat === cat ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${selectedCat === cat ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"}`,
                    color: selectedCat === cat ? "#38bdf8" : "#aaaaaa",
                    fontSize: 12,
                    fontWeight: selectedCat === cat ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Seçili Kategorideki Temalar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              {filteredPresets.map((preset) => {
                const isActive = bgStyle === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setBgStyle(preset.id);
                      setHighlightColor(preset.contrastAccent || "#f5c542");
                      setCustomBgUrl("");
                    }}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 9,
                      background: isActive ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${isActive ? preset.accent : "rgba(255, 255, 255, 0.08)"}`,
                      color: isActive ? "#ffffff" : "#cccccc",
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: preset.accent,
                        boxShadow: isActive ? `0 0 8px ${preset.accent}` : "none",
                      }}
                    />
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. ÖZEL GÖRSEL / VİDEO LİNKİ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
              <Link2 size={13} /> Özel Arka Plan URL (İnternetten Doğrudan Görsel/Video Linki):
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/... veya doğrudan video URL"
              value={customBgUrl}
              onChange={(e) => setCustomBgUrl(e.target.value)}
              style={{ ...inputStyle, fontSize: 12, padding: "8px 12px" }}
            />
          </div>

          {/* 4. ALTYAZI AKIŞ STİLİ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#a0a0a0", display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color="#38bdf8" /> Altyazı Akış Stili:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {[
                { id: "highlight", label: "✨ Parlayan Vurgu" },
                { id: "viral_pop", label: "🔥 Viral Kutu Pop" },
                { id: "bounce", label: "⚡ Ritmik Zıplama" },
                { id: "neon", label: "🪐 Siber Neon Işık" },
                { id: "typewriter", label: "⌨️ Daktilo Akışı" },
                { id: "zoom", label: "🚀 3D Pop-in" },
                { id: "fade", label: "🌫️ Sinematik Fade" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAnimStyle(s.id)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 8,
                    background: animStyle === s.id ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${animStyle === s.id ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"}`,
                    color: animStyle === s.id ? "#38bdf8" : "#b0b0b8",
                    fontSize: 12,
                    fontWeight: animStyle === s.id ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. TİPOGRAFİ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#a0a0a0", display: "flex", alignItems: "center", gap: 6 }}>
              <Type size={14} color="#38bdf8" /> Tipografi / Font:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {[
                { id: "'DM Sans', sans-serif", label: "Modern Sans" },
                { id: "'Montserrat', sans-serif", label: "🔥 Reels Kalın (Bold)" },
                { id: "'Cinzel', serif", label: "🏛️ Antik Stoacı" },
                { id: "'Playfair Display', serif", label: "✨ Lüks Serif" },
                { id: "'Space Grotesk', sans-serif", label: "🛸 Fütüristik Sans" },
                { id: "'Syne', sans-serif", label: "🎨 Sanatsal Bold" },
                { id: "Georgia, serif", label: "Stoacı Klasik" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 8,
                    background: fontFamily === f.id ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${fontFamily === f.id ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"}`,
                    color: fontFamily === f.id ? "#38bdf8" : "#b0b0b8",
                    fontSize: 12,
                    fontWeight: fontFamily === f.id ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: f.id,
                    transition: "all 0.15s ease",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. ALINTI SÖZÜ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#a0a0a0" }}>Alıntı Sözü:</label>
            <textarea
              rows={3}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.4 }}
            />
          </div>

          {/* 7. YAZAR & KATEGORİ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#a0a0a0" }}>Yazar:</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#a0a0a0" }}>Kategori:</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
