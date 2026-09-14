import React, { useState, useRef } from "react";
import { Player } from "@remotion/player";
import { MevzuReelsComposition } from "../remotion/MevzuReelsComposition";
import { NATURE_PRESETS } from "../remotion/CinematicBackground";
import { TEMALAR } from "../utils/tema";
import { getRandomQuote } from "../utils/quotes";
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
} from "lucide-react";

export const MUSIC_PRESETS = [
  { name: "🌊 Okyanus & Dalga Sesi", url: "https://assets.mixkit.co/music/443/443.mp3", tip: "Doğa & Su" },
  { name: "🌲 Orman & Doğa Esintisi", url: "https://assets.mixkit.co/music/139/139.mp3", tip: "Doğa" },
  { name: "🌧️ Yağmur & Melankoli Piyano", url: "https://assets.mixkit.co/music/522/522.mp3", tip: "Hüzün" },
  { name: "🔥 Gece Ateşi & Akustik", url: "https://assets.mixkit.co/music/127/127.mp3", tip: "Sıcak" },
  { name: "🎻 Derin Sinematik Felsefe", url: "https://assets.mixkit.co/music/587/587.mp3", tip: "Felsefe" },
  { name: "🪐 Kozmik & Derin Meditasyon", url: "https://assets.mixkit.co/music/316/316.mp3", tip: "Kozmik" },
  { name: "🔇 Sessiz (Instagram Trend Sesi İçin)", url: null, tip: "Önerilen" },
];

export default function RemotionStudioPage({ tema = "dark", onBack }) {
  const T = TEMALAR[tema] || TEMALAR.dark;

  const [quote, setQuote] = useState(
    "Deniz sakin olduğunda, herkes dümenci kesilir. Asıl mesele fırtınada rotayı kaybetmemektir."
  );
  const [author, setAuthor] = useState("Publilius Syrus");
  const [category, setCategory] = useState("DİRENÇ & ZİHİN");
  const [bgStyle, setBgStyle] = useState("ocean");
  const [customBgUrl, setCustomBgUrl] = useState("");
  const [selectedCat, setSelectedCat] = useState("Doğa & Su");
  const [highlightColor, setHighlightColor] = useState("#38bdf8");
  const [animStyle, setAnimStyle] = useState("highlight");
  const [fontFamily, setFontFamily] = useState("'DM Sans', sans-serif");
  const [musicUrl, setMusicUrl] = useState(MUSIC_PRESETS[0].url);
  const [customAudioName, setCustomAudioName] = useState("");
  const [videoFileName, setVideoFileName] = useState("reel_1");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const fileInputRef = useRef(null);

  // Kullanıcının kendi MP3 dosyasını yüklemesi
  const handleCustomAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMusicUrl(url);
      setCustomAudioName(file.name);
    }
  };

  // Firestore'dan rastgele söz çek
  const rastgeleSozGetir = async () => {
    try {
      setYukleniyor(true);
      const q = await getRandomQuote();
      if (q && q.quote) {
        setQuote(q.quote);
        if (q.author) setAuthor(q.author);
        if (q.cat) setCategory(q.cat.toUpperCase());
      }
    } catch (err) {
      console.error("Söz çekilemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  const cleanName = videoFileName.trim() || `mevzu_${Date.now()}`;

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
                npx remotion render src/remotion/index.js MevzuReels output/{cleanName}.mp4
              </code>
              <button
                onClick={() => {
                  const cmd = `npx remotion render src/remotion/index.js MevzuReels output/${cleanName}.mp4`;
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#38bdf8", display: "flex", alignItems: "center", gap: 8 }}>
              <Waves size={19} /> Arka Plan, Müzik & Tasarım
            </h3>

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

          {/* 1. FON MÜZİĞİ VE SES SEÇİMİ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#a0a0a0", display: "flex", alignItems: "center", gap: 6 }}>
              <Volume2 size={15} color="#38bdf8" /> Fon Müziği / Ses:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MUSIC_PRESETS.map((m) => {
                const isActive = musicUrl === m.url;
                return (
                  <button
                    key={m.name}
                    onClick={() => setMusicUrl(m.url)}
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
            <label style={{ fontSize: 13, fontWeight: 600, color: "#a0a0a0" }}>
              Arka Plan Teması:
            </label>
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
                      setHighlightColor(preset.accent);
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
