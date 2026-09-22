import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Trash2,
  ImageOff,
  Video,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ExternalLink,
  Play,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Tag,
  Check,
  X,
  Instagram,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import SozHavuzuBattery from "./SozHavuzuBattery";
import { TEMALAR } from "../utils/tema";
import { NATURE_PRESETS } from "../remotion/naturePresets.js";
import { db } from "../utils/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function PostlarPage({ tema = "dark", onBack, onOpen }) {
  const T = TEMALAR[tema] || TEMALAR.dark;

  // Ana Sekme: "videos" | "quotes" | "downloads"
  const [activeTab, setActiveTab] = useState("quotes"); // Varsayılan Söz Havuzunu aç

  // ── SÖZLER STATE ──
  const [allQuotes, setAllQuotes] = useState([]);
  const [quotesYukleniyor, setQuotesYukleniyor] = useState(false);
  const [quoteFilter, setQuoteFilter] = useState("unused"); // "unused" (Sıradakiler) | "used" | "all"
  const [selectedKategori, setSelectedKategori] = useState("all");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quotePageSize, setQuotePageSize] = useState(25);
  const [quotePage, setQuotePage] = useState(1);

  // ── VİDEOLAR STATE ──
  const [videos, setVideos] = useState([]);
  const [videosYukleniyor, setVideosYukleniyor] = useState(false);
  const [videoFilter, setVideoFilter] = useState("all"); // "all" | "published" | "draft"
  const [videoSearch, setVideoSearch] = useState("");
  const [videoPageSize, setVideoPageSize] = useState(25);
  const [videoPage, setVideoPage] = useState(1);

  // ── YENİ SÖZ EKLEME MODAL STATE ──
  const [modalAcik, setModalAcik] = useState(false);
  const [yeniSoz, setYeniSoz] = useState("");
  const [yeniYazar, setYeniYazar] = useState("");
  const [yeniKategori, setYeniKategori] = useState("FELSEFE");
  const [ekleniyor, setEkleniyor] = useState(false);

  // ── YEREL İNDİRİLEN POSTLAR ──
  const [localPostlar, setLocalPostlar] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mevzu_postlar") || "[]");
    } catch {
      return [];
    }
  });

  // İndirilenler sekmesi her açıldığında yerel depodan en güncel listeyi al
  useEffect(() => {
    if (activeTab === "downloads") {
      try {
        const posts = JSON.parse(localStorage.getItem("mevzu_postlar") || "[]");
        setLocalPostlar(posts);
      } catch (e) {}
    }
  }, [activeTab]);

  // 1. VERİLERİ ÇEK
  const verileriGetir = async () => {
    setQuotesYukleniyor(true);
    setVideosYukleniyor(true);

    try {
      // A) SÖZLERİ ÇEK
      const qSnap = await getDocs(collection(db, "quotes"));
      const qList = [];
      qSnap.forEach((d) => {
        const data = d.data();
        qList.push({
          id: d.id,
          ...data,
          // KRİTİK DÜZELTME: used alanı true değilse (yani undefined veya false ise) kesinlikle used: false yap!
          used: data.used === true,
          cat: (data.cat || data.category || "FELSEFE").toUpperCase(),
        });
      });

      // "atıldıkça yerleri değişecek": Sıradakiler (used: false) en başta, kullanılanlar altta olsun!
      qList.sort((a, b) => {
        if (a.used !== b.used) return a.used ? 1 : -1;
        return 0;
      });

      setAllQuotes(qList);
    } catch (e) {
      console.warn("Sözler çekilemedi:", e);
    } finally {
      setQuotesYukleniyor(false);
    }

    try {
      // B) VİDEOLARI ÇEK
      const vSnap = await getDocs(collection(db, "videos"));
      const vList = [];
      vSnap.forEach((d) => {
        vList.push({ id: d.id, ...d.data() });
      });
      vList.sort(
        (a, b) => new Date(b.renderedAt || b.createdAt || 0) - new Date(a.renderedAt || a.createdAt || 0)
      );
      setVideos(vList);
    } catch (e) {
      console.warn("Videolar çekilemedi:", e);
    } finally {
      setVideosYukleniyor(false);
    }
  };

  useEffect(() => {
    verileriGetir();
  }, []);

  // 2. İSTATİSTİKLER (CANLI SAYAÇ)
  const stats = useMemo(() => {
    const totalQ = allQuotes.length;
    const usedQ = allQuotes.filter((q) => q.used).length;
    const unusedQ = totalQ - usedQ;
    const totalV = videos.length;
    try {
      localStorage.setItem("mevzu_quote_stats", JSON.stringify({ unused: unusedQ, total: totalQ }));
    } catch {}
    return { totalQuotes: totalQ, usedQuotes: usedQ, unusedQuotes: unusedQ, totalVideos: totalV };
  }, [allQuotes, videos]);

  // 3. FİLTRELENMİŞ SÖZLER
  const filteredQuotes = useMemo(() => {
    return allQuotes.filter((q) => {
      // Durum Filtresi
      if (quoteFilter === "unused" && q.used) return false;
      if (quoteFilter === "used" && !q.used) return false;

      // Kategori Filtresi
      if (selectedKategori !== "all" && q.cat !== selectedKategori) return false;

      // Arama Metni
      if (quoteSearch.trim()) {
        const s = quoteSearch.toLowerCase();
        const str = `${q.quote || ""} ${q.author || ""} ${q.cat || ""}`.toLowerCase();
        if (!str.includes(s)) return false;
      }
      return true;
    });
  }, [allQuotes, quoteFilter, selectedKategori, quoteSearch]);

  // Sözler Sayfalama
  const totalQuotePages = Math.max(1, Math.ceil(filteredQuotes.length / quotePageSize));
  const paginatedQuotes = useMemo(() => {
    const start = (quotePage - 1) * quotePageSize;
    return filteredQuotes.slice(start, start + quotePageSize);
  }, [filteredQuotes, quotePage, quotePageSize]);

  // Filtre değişince söz sayfasını 1'e sıfırla
  useEffect(() => {
    setQuotePage(1);
  }, [quoteFilter, selectedKategori, quoteSearch, quotePageSize]);

  // 4. FİLTRELENMİŞ VİDEOLAR
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (videoFilter === "published" && !v.published && !v.instagramId) return false;
      if (videoFilter === "draft" && (v.published || v.instagramId)) return false;
      if (videoSearch.trim()) {
        const s = videoSearch.toLowerCase();
        const str = `${v.quote || ""} ${v.author || ""} ${v.videoId || ""}`.toLowerCase();
        if (!str.includes(s)) return false;
      }
      return true;
    });
  }, [videos, videoFilter, videoSearch]);

  // Videolar Sayfalama
  const totalVideoPages = Math.max(1, Math.ceil(filteredVideos.length / videoPageSize));
  const paginatedVideos = useMemo(() => {
    const start = (videoPage - 1) * videoPageSize;
    return filteredVideos.slice(start, start + videoPageSize);
  }, [filteredVideos, videoPage, videoPageSize]);

  useEffect(() => {
    setVideoPage(1);
  }, [videoFilter, videoSearch, videoPageSize]);

  // 5. YENİ SÖZ EKLE (CREATE)
  const handleYeniSozEkle = async (e) => {
    e.preventDefault();
    if (!yeniSoz.trim()) return;

    try {
      setEkleniyor(true);
      const cat = (yeniKategori || "FELSEFE").toUpperCase();
      const yeniDoc = {
        quote: yeniSoz.trim(),
        author: yeniYazar.trim() || "Mevzu",
        cat,
        used: false,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "quotes"), yeniDoc);
      setAllQuotes([{ id: docRef.id, ...yeniDoc }, ...allQuotes]);
      setYeniSoz("");
      setYeniYazar("");
      setModalAcik(false);
    } catch (err) {
      alert("Söz eklenirken hata: " + err.message);
    } finally {
      setEkleniyor(false);
    }
  };

  // 6. SÖZ DURUMU DEĞİŞTİR (TOGGLE USED)
  const toggleQuoteUsed = async (q) => {
    try {
      const yeniDurum = !q.used;
      await updateDoc(doc(db, "quotes", q.id), {
        used: yeniDurum,
        usedAt: yeniDurum ? new Date().toISOString() : null,
      });

      setAllQuotes((prev) =>
        prev.map((item) =>
          item.id === q.id
            ? { ...item, used: yeniDurum, usedAt: yeniDurum ? new Date().toISOString() : null }
            : item
        )
      );
    } catch (err) {
      alert("Durum güncellenemedi: " + err.message);
    }
  };

  // 7. SÖZ SİL
  const handleQuoteDelete = async (qId) => {
    if (!window.confirm("Bu sözü veritabanından kalıcı olarak silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "quotes", qId));
      setAllQuotes((prev) => prev.filter((q) => q.id !== qId));
    } catch (err) {
      alert("Söz silinemedi: " + err.message);
    }
  };

  // 8. VİDEO SİL
  const handleVideoDelete = async (vId) => {
    if (!window.confirm("Bu video kaydını silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "videos", vId));
      setVideos((prev) => prev.filter((v) => v.id !== vId));
    } catch (err) {
      alert("Video silinemedi: " + err.message);
    }
  };

  // 9. VİDEOYU STÜDYODA AÇ (0ms Gecikmesiz Doğrudan Veri Aktarımı)
  const openInStudio = (v) => {
    try {
      const targetId = v.videoId || v.id;
      // Videonun tüm bilgilerini (söz, yazar, tema, müzik) yerel hafızaya kaydet
      localStorage.setItem("mevzu_active_video", JSON.stringify(v));
      window.history.replaceState({ videoId: targetId }, "", `/${targetId}`);
      if (onOpen) onOpen("remotion");
    } catch (e) {
      console.error(e);
    }
  };

  // 10. SÖZLE DOĞRUDAN REELS ÜRET
  const produceWithQuote = (q) => {
    try {
      localStorage.setItem(
        "mevzu_active_quote",
        JSON.stringify({
          quote: q.quote,
          author: q.author,
          cat: q.cat || "FELSEFE",
          id: q.id,
        })
      );
      if (onOpen) onOpen("remotion");
    } catch (e) {
      console.error(e);
    }
  };

  // 11. YEREL POST İŞLEMLERİ
  const localSil = (id) => {
    const yeni = localPostlar.filter((p) => p.id !== id);
    setLocalPostlar(yeni);
    localStorage.setItem("mevzu_postlar", JSON.stringify(yeni));
  };

  const localIndir = (p) => {
    const link = document.createElement("a");
    link.download = `mevzu-${p.id}.png`;
    link.href = p.img;
    link.click();
  };

  // KATEGORİ LİSTESİ
  const KATEGORILER = useMemo(() => {
    const set = new Set(["FELSEFE", "STOACILIK", "GÜÇ", "STRATEJİ", "ZİHİN", "DİRENÇ", "MOTİVASYON", "TEKNOLOJİ", "KADİM BİLGELİK"]);
    allQuotes.forEach((q) => {
      if (q.cat) set.add(q.cat);
    });
    return Array.from(set);
  }, [allQuotes]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201, 168, 76, 0.08) 0%, transparent 60%), ${T.bg || "#0b0c10"}`,
        color: "#f0f0f0",
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: 60,
      }}
    >
      {/* ── ÜST BAR & CANLI İSTATİSTİK BANDI ── */}
      <div
        style={{
          background: T.bg2 || "#13141a",
          borderBottom: `1px solid ${T.border || "#20222a"}`,
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Sol: Geri Dön & Başlık */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={onBack}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${T.border || "#2a2d38"}`,
                color: "#e2e8f0",
                borderRadius: 10,
                padding: "8px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} /> Geri
            </button>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 4, color: T.gold || "#c9a84c" }}>
                  #MEVZU
                </span>
                <span
                  style={{
                    fontSize: 11,
                    background: "rgba(201, 168, 76, 0.15)",
                    color: T.gold || "#c9a84c",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  İÇERİK & MEDYA PANELİ
                </span>
              </div>
            </div>
          </div>

          {/* Sağ: Canlı İstatistik Bandı & Yenileme */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                background: "rgba(0,0,0,0.45)",
                border: `1px solid ${T.border || "#262935"}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.8,
                color: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "#38bdf8" }}>{stats.totalQuotes} SÖZ</span>
              <span style={{ color: "#475569" }}>·</span>
              <span style={{ color: "#10b981" }}>{stats.usedQuotes} KULLANILDI</span>
              <span style={{ color: "#475569" }}>·</span>
              <span style={{ color: "#f5c542" }}>{stats.unusedQuotes} HAZIR</span>
              <span style={{ color: "#475569" }}>·</span>
              <span style={{ color: "#f472b6" }}>{stats.totalVideos} VİDEO</span>
            </div>

            <button
              onClick={verileriGetir}
              disabled={quotesYukleniyor || videosYukleniyor}
              title="Firebase'den verileri yeniden çek"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${T.border || "#2a2d38"}`,
                color: T.gold || "#c9a84c",
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} className={quotesYukleniyor || videosYukleniyor ? "spin" : ""} />
              Yenile
            </button>
          </div>
        </div>

        {/* ── SEKMELER: [ 📚 Söz Havuzu ] [ 🎬 Atılan Videolar ] [ 🖼️ İndirilenler ] ── */}
        <div
          style={{
            maxWidth: 1300,
            margin: "18px auto 0 auto",
            display: "flex",
            gap: 10,
            borderTop: `1px solid rgba(255,255,255,0.06)`,
            paddingTop: 14,
          }}
        >
          <button
            onClick={() => setActiveTab("quotes")}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: `1.5px solid ${activeTab === "quotes" ? (T.gold || "#c9a84c") : "transparent"}`,
              background: activeTab === "quotes" ? "rgba(201, 168, 76, 0.16)" : "transparent",
              color: activeTab === "quotes" ? (T.gold || "#c9a84c") : "#94a3b8",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            <FileText size={16} />
            Söz Havuzu ({stats.unusedQuotes})
          </button>

          <button
            onClick={() => setActiveTab("videos")}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: `1.5px solid ${activeTab === "videos" ? (T.gold || "#c9a84c") : "transparent"}`,
              background: activeTab === "videos" ? "rgba(201, 168, 76, 0.16)" : "transparent",
              color: activeTab === "videos" ? (T.gold || "#c9a84c") : "#94a3b8",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            <Video size={16} />
            Atılan Videolar ({stats.totalVideos})
          </button>

          <button
            onClick={() => setActiveTab("downloads")}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: `1.5px solid ${activeTab === "downloads" ? (T.gold || "#c9a84c") : "transparent"}`,
              background: activeTab === "downloads" ? "rgba(201, 168, 76, 0.16)" : "transparent",
              color: activeTab === "downloads" ? (T.gold || "#c9a84c") : "#94a3b8",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            <Download size={16} />
            İndirilen Görseller ({localPostlar.length})
          </button>
        </div>

        {/* ── SÖZ HAVUZU DİNAMİK ŞARJ ÇUBUĞU (KAPASİTE BİLGİSİ) ── */}
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <SozHavuzuBattery
            unused={stats.unusedQuotes}
            total={stats.totalQuotes}
          />
        </div>
      </div>

      {/* ── İÇERİK ALANI ── */}
      <div style={{ maxWidth: 1300, margin: "24px auto", padding: "0 20px" }}>
        {/* ════════════════════════════════════════════════════════════
            1. SEKME: SÖZ HAVUZU (TABLO + 25'Lİ SAYFALAMA)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "quotes" && (
          <div>
            {/* Filtre ve Arama Çubuğu */}
            <div
              style={{
                background: T.bg2 || "#13141a",
                border: `1px solid ${T.border || "#262935"}`,
                borderRadius: 14,
                padding: "14px 18px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {/* Canlı Arama Kutusu */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${T.border || "#2a2d38"}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  flex: "1 1 240px",
                  maxWidth: 340,
                }}
              >
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Söz veya yazar ara..."
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: 13,
                    width: "100%",
                  }}
                />
                {quoteSearch && (
                  <button
                    onClick={() => setQuoteSearch("")}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtreler */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Kategori Seçici */}
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 9,
                    background: "rgba(0,0,0,0.4)",
                    border: `1px solid ${T.border || "#2a2d38"}`,
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">Tüm Kategoriler</option>
                  {KATEGORILER.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Durum Hapları: Sıradakiler (Hazır) / Kullanılanlar / Tümü */}
                <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: 3 }}>
                  {[
                    { id: "unused", label: `⏳ Sıradakiler (${stats.unusedQuotes})` },
                    { id: "used", label: `✅ Kullanılanlar (${stats.usedQuotes})` },
                    { id: "all", label: `Tümü (${stats.totalQuotes})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setQuoteFilter(f.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: quoteFilter === f.id ? "rgba(255,255,255,0.14)" : "transparent",
                        color: quoteFilter === f.id ? "#ffffff" : "#94a3b8",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* ➕ Yeni Söz Ekle Butonu */}
                <button
                  onClick={() => setModalAcik(true)}
                  style={{
                    background: "linear-gradient(135deg, #c9a84c 0%, #b8933b 100%)",
                    border: "none",
                    color: "#000000",
                    borderRadius: 9,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: "0 3px 12px rgba(201, 168, 76, 0.35)",
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} /> Yeni Söz Ekle
                </button>
              </div>
            </div>

            {/* TABLO BAŞLIĞI VE SAYFA BOYUTU SEÇİCİ */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 6px",
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              <span>
                Filtrelenen: <strong>{filteredQuotes.length}</strong> söz &nbsp;·&nbsp; Sayfa <strong>{quotePage}</strong> / {totalQuotePages}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Sayfa başı:</span>
                <select
                  value={quotePageSize}
                  onChange={(e) => setQuotePageSize(Number(e.target.value))}
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: `1px solid ${T.border || "#2a2d38"}`,
                    color: T.gold || "#c9a84c",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 12,
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* SÖZ HAVUZU TABLOSU */}
            <div
              style={{
                background: T.bg2 || "#13141a",
                border: `1px solid ${T.border || "#222530"}`,
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr
                      style={{
                        background: "rgba(0,0,0,0.35)",
                        borderBottom: `1px solid ${T.border || "#262935"}`,
                        color: "#94a3b8",
                        fontSize: 11,
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                      }}
                    >
                      <th style={{ padding: "12px 16px", width: 120 }}>Kategori</th>
                      <th style={{ padding: "12px 16px" }}>Söz Metni</th>
                      <th style={{ padding: "12px 16px", width: 160 }}>Yazar</th>
                      <th style={{ padding: "12px 16px", width: 110 }}>Durum</th>
                      <th style={{ padding: "12px 16px", width: 160, textAlign: "right" }}>İşlem</th>
                    </tr>
                  </thead>

                  <tbody>
                    {quotesYukleniyor ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                          <Loader2 size={28} className="spin" style={{ margin: "0 auto 8px auto", color: T.gold }} />
                          <div>Sözler getiriliyor...</div>
                        </td>
                      </tr>
                    ) : paginatedQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                          Bu filtreye uygun söz bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      paginatedQuotes.map((q, idx) => {
                        return (
                          <tr
                            key={q.id}
                            style={{
                              borderBottom: `1px solid rgba(255,255,255,0.04)`,
                              background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                              transition: "background 0.15s",
                            }}
                          >
                            {/* Kategori */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: 0.8,
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background: "rgba(201, 168, 76, 0.12)",
                                  color: T.gold || "#c9a84c",
                                  border: "1px solid rgba(201, 168, 76, 0.25)",
                                  display: "inline-block",
                                }}
                              >
                                {q.cat}
                              </span>
                            </td>

                            {/* Söz Metni */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle", color: q.used ? "#94a3b8" : "#ffffff", fontWeight: 500, lineHeight: 1.5 }}>
                              "{q.quote}"
                            </td>

                            {/* Yazar */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle", fontWeight: 700, color: "#cbd5e1" }}>
                              {q.author || "Bilinmiyor"}
                            </td>

                            {/* Durum */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: q.used ? "#10b981" : "#f5c542",
                                }}
                              >
                                {q.used ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                {q.used ? "Kullanıldı" : "Hazır"}
                              </span>
                            </td>

                            {/* İşlemler */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <button
                                  onClick={() => produceWithQuote(q)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: 7,
                                    background: "rgba(201, 168, 76, 0.18)",
                                    border: "1px solid rgba(201, 168, 76, 0.4)",
                                    color: T.gold || "#c9a84c",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                  title="Bu sözle stüdyoda Reels üret"
                                >
                                  <Sparkles size={11} /> Reels Yap
                                </button>

                                <button
                                  onClick={() => toggleQuoteUsed(q)}
                                  style={{
                                    padding: "5px 7px",
                                    borderRadius: 7,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                  }}
                                  title={q.used ? "Sıraya geri al" : "Kullanıldı işaretle"}
                                >
                                  <RefreshCw size={12} />
                                </button>

                                <button
                                  onClick={() => handleQuoteDelete(q.id)}
                                  style={{
                                    padding: "5px 7px",
                                    borderRadius: 7,
                                    background: "rgba(239, 68, 68, 0.12)",
                                    border: "1px solid rgba(239, 68, 68, 0.25)",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                  }}
                                  title="Sözü sil"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── ALT SAYFALAMA GEZGİNİ ── */}
              {totalQuotePages > 1 && (
                <div
                  style={{
                    padding: "14px 20px",
                    background: "rgba(0,0,0,0.25)",
                    borderTop: `1px solid rgba(255,255,255,0.05)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <button
                    disabled={quotePage <= 1}
                    onClick={() => setQuotePage(quotePage - 1)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: quotePage <= 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: quotePage <= 1 ? "#475569" : "#e2e8f0",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: quotePage <= 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ChevronLeft size={14} /> Önceki
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {Array.from({ length: totalQuotePages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalQuotePages || Math.abs(p - quotePage) <= 2)
                      .map((p, idx, arr) => {
                        const showDots = idx > 0 && p - arr[idx - 1] > 1;
                        const isActive = p === quotePage;
                        return (
                          <React.Fragment key={p}>
                            {showDots && <span style={{ color: "#64748b" }}>...</span>}
                            <button
                              onClick={() => setQuotePage(p)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: `1px solid ${isActive ? (T.gold || "#c9a84c") : "transparent"}`,
                                background: isActive ? "rgba(201, 168, 76, 0.2)" : "rgba(255,255,255,0.04)",
                                color: isActive ? (T.gold || "#c9a84c") : "#94a3b8",
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    disabled={quotePage >= totalQuotePages}
                    onClick={() => setQuotePage(quotePage + 1)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: quotePage >= totalQuotePages ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: quotePage >= totalQuotePages ? "#475569" : "#e2e8f0",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: quotePage >= totalQuotePages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Sonraki <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            2. SEKME: ATILAN VİDEOLAR (TABLO GÖRÜNÜMÜ)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "videos" && (
          <div>
            {/* Filtre ve Arama Çubuğu */}
            <div
              style={{
                background: T.bg2 || "#13141a",
                border: `1px solid ${T.border || "#262935"}`,
                borderRadius: 14,
                padding: "12px 18px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {/* Arama */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${T.border || "#2a2d38"}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  flex: "1 1 240px",
                  maxWidth: 340,
                }}
              >
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Videolarda ara..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: 13,
                    width: "100%",
                  }}
                />
              </div>

              {/* Filtre Butonları */}
              <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: 3 }}>
                {[
                  { id: "all", label: "Tümü" },
                  { id: "published", label: "🟢 Instagram Yayında" },
                  { id: "draft", label: "⚪ Taslak" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setVideoFilter(f.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: videoFilter === f.id ? "rgba(255,255,255,0.14)" : "transparent",
                      color: videoFilter === f.id ? "#ffffff" : "#94a3b8",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLO BAŞLIĞI */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 6px",
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              <span>
                Filtrelenen: <strong>{filteredVideos.length}</strong> video &nbsp;·&nbsp; Sayfa <strong>{videoPage}</strong> / {totalVideoPages}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Sayfa başı:</span>
                <select
                  value={videoPageSize}
                  onChange={(e) => setVideoPageSize(Number(e.target.value))}
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: `1px solid ${T.border || "#2a2d38"}`,
                    color: T.gold || "#c9a84c",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 12,
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* VİDEOLAR TABLOSU */}
            <div
              style={{
                background: T.bg2 || "#13141a",
                border: `1px solid ${T.border || "#222530"}`,
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr
                      style={{
                        background: "rgba(0,0,0,0.35)",
                        borderBottom: `1px solid ${T.border || "#262935"}`,
                        color: "#94a3b8",
                        fontSize: 11,
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                      }}
                    >
                      <th style={{ padding: "12px 14px", width: 130 }}>Tarih & Saat</th>
                      <th style={{ padding: "12px 10px", width: 64 }}>Kapak</th>
                      <th style={{ padding: "12px 14px", width: 120 }}>Kategori</th>
                      <th style={{ padding: "12px 14px" }}>Alıntı & Yazar</th>
                      <th style={{ padding: "12px 14px", width: 130 }}>Bağlı Söz ID</th>
                      <th style={{ padding: "12px 14px", width: 140 }}>Durum</th>
                      <th style={{ padding: "12px 14px", width: 140, textAlign: "right" }}>İşlem</th>
                    </tr>
                  </thead>

                  <tbody>
                    {videosYukleniyor ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                          <Loader2 size={28} className="spin" style={{ margin: "0 auto 8px auto", color: T.gold }} />
                          <div>Videolar getiriliyor...</div>
                        </td>
                      </tr>
                    ) : paginatedVideos.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                          Bu filtreye uygun video bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      paginatedVideos.map((v, idx) => {
                        const hasInsta = !!(v.published || v.instagramId);
                        const dateText = v.renderedAt || v.createdAt
                          ? new Date(v.renderedAt || v.createdAt).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Bilinmiyor";

                        const bgKey = v.bgStyle || v.bgId;
                        const preset = NATURE_PRESETS[bgKey];
                        const previewUrl = v.coverUrl || v.bgUrl || preset?.url || null;

                        return (
                          <tr
                            key={v.id}
                            style={{
                              borderBottom: `1px solid rgba(255,255,255,0.04)`,
                              background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                              transition: "background 0.15s",
                            }}
                          >
                            {/* Tarih & Saat */}
                            <td style={{ padding: "12px 14px", verticalAlign: "middle", color: "#94a3b8", fontSize: 12 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <Clock size={12} /> {dateText}
                              </span>
                            </td>

                            {/* Kapak Önizleme */}
                            <td style={{ padding: "10px 10px", verticalAlign: "middle" }}>
                              <div
                                onClick={() => openInStudio(v)}
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1.5px solid rgba(255,255,255,0.12)",
                                  background: "#12141a",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "relative",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                                }}
                                title={`${preset?.name || "Kapak"} - Stüdyoda Aç`}
                              >
                                {previewUrl ? (
                                  <img
                                    src={previewUrl}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                  />
                                ) : (
                                  <Video size={16} color="#64748b" />
                                )}
                              </div>
                            </td>

                            {/* Kategori */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: 0.8,
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background: "rgba(201, 168, 76, 0.12)",
                                  color: T.gold || "#c9a84c",
                                  border: "1px solid rgba(201, 168, 76, 0.25)",
                                  display: "inline-block",
                                }}
                              >
                                {(v.category || "FELSEFE").toUpperCase()}
                              </span>
                            </td>

                            {/* Alıntı & Yazar */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                              <div style={{ color: "#ffffff", fontWeight: 600, lineHeight: 1.4, marginBottom: 2 }}>
                                "{v.quote || "Alıntı"}"
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
                                — {v.author || "Bilinmiyor"}
                              </div>
                            </td>

                            {/* Bağlı Söz ID */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: 11, color: "#38bdf8" }}>
                              {v.quoteId ? (
                                <span
                                  onClick={() => {
                                    setActiveTab("quotes");
                                    setQuoteSearch(v.author || "");
                                  }}
                                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                                  title="Bu söze git"
                                >
                                  <Tag size={11} /> #{v.quoteId.slice(0, 8)}...
                                </span>
                              ) : (
                                <span style={{ color: "#64748b" }}>—</span>
                              )}
                            </td>

                            {/* Durum */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: 8,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  background: hasInsta ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.06)",
                                  color: hasInsta ? "#10b981" : "#94a3b8",
                                  border: `1px solid ${hasInsta ? "rgba(16, 185, 129, 0.35)" : "rgba(255,255,255,0.12)"}`,
                                }}
                              >
                                <Instagram size={11} />
                                {hasInsta ? "Instagram Yayında" : "Taslak"}
                              </span>
                            </td>

                            {/* İşlemler */}
                            <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <button
                                  onClick={() => openInStudio(v)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: 7,
                                    background: "rgba(56, 189, 248, 0.16)",
                                    border: "1px solid rgba(56, 189, 248, 0.35)",
                                    color: "#38bdf8",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                  title="Bu videoyu stüdyoda aç"
                                >
                                  <Play size={11} fill="#38bdf8" /> Stüdyoda Aç
                                </button>

                                <button
                                  onClick={() => handleVideoDelete(v.id)}
                                  style={{
                                    padding: "5px 7px",
                                    borderRadius: 7,
                                    background: "rgba(239, 68, 68, 0.12)",
                                    border: "1px solid rgba(239, 68, 68, 0.25)",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                  }}
                                  title="Videoyu sil"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ALT SAYFALAMA GEZGİNİ (VİDEOLAR) */}
              {totalVideoPages > 1 && (
                <div
                  style={{
                    padding: "14px 20px",
                    background: "rgba(0,0,0,0.25)",
                    borderTop: `1px solid rgba(255,255,255,0.05)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <button
                    disabled={videoPage <= 1}
                    onClick={() => setVideoPage(videoPage - 1)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: videoPage <= 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: videoPage <= 1 ? "#475569" : "#e2e8f0",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: videoPage <= 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ChevronLeft size={14} /> Önceki
                  </button>

                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    Sayfa {videoPage} / {totalVideoPages}
                  </span>

                  <button
                    disabled={videoPage >= totalVideoPages}
                    onClick={() => setVideoPage(videoPage + 1)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: videoPage >= totalVideoPages ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: videoPage >= totalVideoPages ? "#475569" : "#e2e8f0",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: videoPage >= totalVideoPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Sonraki <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            3. SEKME: İNDİRİLEN GÖRSELLER (LOCALSTORAGE)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "downloads" && (
          <div>
            {localPostlar.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "50vh",
                  gap: 14,
                }}
              >
                <ImageOff size={48} color={T.border} strokeWidth={1.2} />
                <p style={{ fontSize: 14, color: T.faint, margin: 0 }}>Henüz indirilmiş görsel kart yok</p>
                <p style={{ fontSize: 11, color: T.fainter, margin: 0, letterSpacing: 1 }}>
                  Alıntı Kartı Oluştur sayfasından veya Reels Stüdyosu'ndan "Kapak İndir" butonuna bastığında buraya eklenir.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                {localPostlar.map((p) => {
                  const is9x16 = p.aspectRatio === "9:16";
                  return (
                    <div
                      key={p.id}
                      style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        background: T.bg2,
                        border: `1px solid ${T.border}`,
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: is9x16 ? "9/16" : "1/1",
                          background: "#08090d",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={p.img}
                          alt={p.author || "Görsel"}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        {p.aspectRatio && (
                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: "rgba(0,0,0,0.75)",
                              color: is9x16 ? "#38bdf8" : "#f5c542",
                              border: `1px solid ${is9x16 ? "rgba(56,189,248,0.4)" : "rgba(245,197,66,0.4)"}`,
                              letterSpacing: 0.5,
                            }}
                          >
                            {p.aspectRatio} KAPAK
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          padding: "10px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(0,0,0,0.2)",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
                            {p.author || "Mevzu"}
                          </div>
                          <div style={{ fontSize: 10, color: T.faint, letterSpacing: 0.5 }}>
                            {new Date(p.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => localIndir(p)}
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 6,
                              padding: "5px 7px",
                              cursor: "pointer",
                              color: T.gold,
                              display: "flex",
                            }}
                            title="İndir"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => localSil(p.id)}
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.2)",
                              borderRadius: 6,
                              padding: "5px 7px",
                              cursor: "pointer",
                              color: "#ef4444",
                              display: "flex",
                            }}
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ➕ YENİ SÖZ EKLEME MODALI (CRUD - CREATE) ── */}
      {modalAcik && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: T.bg2 || "#14161f",
              border: `1px solid ${T.border || "#2a2d3c"}`,
              borderRadius: 18,
              maxWidth: 550,
              width: "100%",
              padding: 26,
              boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={20} color={T.gold || "#c9a84c"} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#ffffff" }}>
                  Firebase'e Yeni Söz Ekle
                </h3>
              </div>
              <button
                onClick={() => setModalAcik(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleYeniSozEkle} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Söz Metni */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  Söz Metni *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Örn: Sabırlı olan, fırtınanın ortasında bile rotasını kaybetmez..."
                  value={yeniSoz}
                  onChange={(e) => setYeniSoz(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "rgba(0,0,0,0.4)",
                    border: `1px solid ${T.border || "#2c3040"}`,
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: 13,
                    lineHeight: 1.5,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Yazar ve Kategori Satırı */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Yazar Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Marcus Aurelius"
                    value={yeniYazar}
                    onChange={(e) => setYeniYazar(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${T.border || "#2c3040"}`,
                      borderRadius: 10,
                      color: "#ffffff",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Kategori
                  </label>
                  <select
                    value={yeniKategori}
                    onChange={(e) => setYeniKategori(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${T.border || "#2c3040"}`,
                      borderRadius: 10,
                      color: "#ffffff",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    {KATEGORILER.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Butonlar */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalAcik(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${T.border || "#2c3040"}`,
                    color: "#94a3b8",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={ekleniyor}
                  style={{
                    flex: 1.5,
                    padding: "11px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #c9a84c 0%, #b8933b 100%)",
                    border: "none",
                    color: "#000000",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: ekleniyor ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 4px 15px rgba(201, 168, 76, 0.4)",
                  }}
                >
                  {ekleniyor ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  {ekleniyor ? "Kaydediliyor..." : "Firestore'a Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
