import { Globe, Smartphone, Shuffle, Video, Images, LogOut, Sun, Moon, Settings } from "lucide-react";
import { TEMALAR } from "../utils/tema";
import { useIsDesktop } from "../utils/hooks";
import SozHavuzuBattery from "./SozHavuzuBattery";

export default function HomePage({ tema, onToggleTema, onOpen, onCikis }) {
  const T = TEMALAR[tema];
  const isDesktop = useIsDesktop();
  const kullanici = localStorage.getItem("mevzu_user") || "?";
  const isim      = localStorage.getItem("mevzu_isim") || "";
  const soyisim   = localStorage.getItem("mevzu_soyisim") || "";
  const foto      = localStorage.getItem("mevzu_foto") || "";
  const goruntu   = isim ? `${isim} ${soyisim}`.trim() : kullanici;

  const CARDS = [
    { k: "remotion", IC: Video,      t: "Remotion HD Reels", d: "Dinamik Altyazı · 60 FPS", b: "9:16 · Canlı Stüdyo" },
    { k: "reels",    IC: Smartphone, t: "Reels Kart",        d: "Instagram Reels · TikTok",  b: "9:16 · 1080×1920"   },
    { k: "square",   IC: Globe,      t: "Kare Kart",         d: "Twitter · Instagram Post",  b: "1:1 · 1080×1080"    },
    { k: "surpriz",  IC: Shuffle,    t: "Sürpriz Kart",      d: "Otomatik Rastgele Söz",    b: "1:1 · Anında"       },
  ];

  /* ── Desktop ─────────────────────────────────────────────────── */
  if (isDesktop) {
    const sideBtn = (onClick, children, hover) => (
      <button
        onClick={onClick}
        onMouseEnter={e => e.currentTarget.style.borderColor = hover || T.gold}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        style={{
          background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10,
          color: T.muted, fontSize: 12, padding: "10px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit",
          transition: "border-color .2s", width: "100%",
        }}
      >{children}</button>
    );

    return (
      <div style={{
        display: "flex", minHeight: "100vh",
        background: `radial-gradient(ellipse 80% 60% at 70% 40%, rgba(${T.gr},.07) 0%, transparent 65%), ${T.bg}`,
      }}>

        {/* ── Left sidebar ── */}
        <div style={{
          width: 260, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
          padding: "48px 24px",
          background: T.bg2, borderRight: `1px solid ${T.border}`,
          position: "sticky", top: 0, height: "100vh",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
              <span style={{ fontFamily: "Georgia,serif", fontSize: 32, color: T.gold, lineHeight: 1 }}>'</span>
              <span style={{ fontSize: 40, fontWeight: 700, color: T.gold, lineHeight: 1 }}>#</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 7, color: T.gold }}>MEVZU</span>
            <span style={{ fontSize: 7, letterSpacing: 3, color: T.faint, textTransform: "uppercase", marginTop: 2, textAlign: "center" }}>Günün Nabzına Söz</span>
          </div>

          {/* Avatar + isim */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              onClick={() => onOpen("profil")}
              style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: `2px solid ${T.gold}`, background: `rgba(${T.gr},.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {foto
                ? <img src={foto} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 24, fontWeight: 700, color: T.gold }}>{kullanici.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{goruntu}</div>
              {isim && <div style={{ fontSize: 9, color: T.faint, letterSpacing: 1, marginTop: 2 }}>@{kullanici}</div>}
            </div>
          </div>

          {/* Butonlar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            {sideBtn(() => onOpen("ayarlar"),
              <><Settings size={14} color={T.gold} /><span style={{ color: T.gold, fontWeight: 600 }}>Otomasyon Ayarları</span></>
            )}
            {sideBtn(onToggleTema,
              <>{tema === "dark" ? <Sun size={14} color={T.muted} /> : <Moon size={14} color={T.muted} />}
              <span>{tema === "dark" ? "Açık Tema" : "Koyu Tema"}</span></>
            )}
            {sideBtn(() => onOpen("postlar"),
              <><Images size={14} color={T.muted} /><span>Postlarım</span></>
            )}
            {sideBtn(onCikis,
              <><LogOut size={14} color={T.faint} /><span style={{ color: T.faint }}>Çıkış Yap</span></>,
              "#e07070"
            )}
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "50px 60px", gap: 36, position: "relative", minHeight: "100vh",
        }}>
          {/* Üst Navbar / Sağ Köşe: Söz Havuzu Şarjı */}
          <div style={{
            position: "absolute", top: 24, right: 36,
            display: "flex", alignItems: "center", gap: 12
          }}>
            <SozHavuzuBattery compact={true} onClick={() => onOpen("postlar")} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: T.text, margin: 0, letterSpacing: -0.5 }}>Alıntı Kartı Oluştur</h1>
            <p style={{ fontSize: 13, color: T.faint, margin: "10px 0 0", letterSpacing: 1 }}>Format seç ve oluşturmaya başla</p>
          </div>

          {/* 2'ye 2 Düzenli Kart Izgarası */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, width: "100%", maxWidth: 760 }}>
            {CARDS.map((c) => (
              <div
                key={c.k}
                onClick={() => onOpen(c.k)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = T.gold;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 16px 48px rgba(${T.gr},.14)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
                style={{
                  background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 20,
                  padding: "30px 28px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  transition: "all .2s", textAlign: "center",
                }}
              >
                <div style={{ width: 72, height: 72, borderRadius: 18, background: `rgba(${T.gr},.1)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <c.IC size={32} color={T.gold} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{c.t}</span>
                  <span style={{ fontSize: 12, color: T.faint }}>{c.d}</span>
                  <span style={{ fontSize: 8, letterSpacing: 2, textTransform: "uppercase", padding: "3px 12px", borderRadius: 20, background: `rgba(${T.gr},.1)`, color: T.gold, width: "fit-content", margin: "4px auto 0" }}>{c.b}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: T.faint, textAlign: "center", padding: "10px 18px", border: `1px dashed ${T.border}`, borderRadius: 10, maxWidth: 400, lineHeight: 1.8 }}>
            📲 Telefona yüklemek için tarayıcı menüsünden <strong style={{ color: T.muted }}>"Ana Ekrana Ekle"</strong> seçeneğini kullan
          </div>
        </div>
      </div>
    );
  }

  /* ── Mobile ───────────────────────────────────────────────────── */
  const iconBtn = {
    width: 38, height: 38, borderRadius: 10,
    background: T.bg2, border: `1px solid ${T.border}`,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "border-color .2s",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", gap: 28, padding: "80px 20px 40px",
      background: `radial-gradient(ellipse 70% 50% at 50% 10%,rgba(${T.gr},.07) 0%,transparent 65%),${T.bg}`,
      position: "relative",
    }}>

      {/* Mobil Üst Bar (Çakışmasız, Dengeli Flex Navbar) */}
      <div style={{
        position: "absolute", top: 12, left: 0, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 14px", boxSizing: "border-box", zIndex: 50
      }}>
        {/* Sol: Söz Havuzu Şarjı */}
        <SozHavuzuBattery compact={true} onClick={() => onOpen("postlar")} />

        {/* Sağ: İkonlar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => onOpen("ayarlar")} style={iconBtn} title="Otomasyon Ayarları">
            <Settings size={15} color={T.gold} />
          </button>
          <button onClick={onToggleTema} style={iconBtn} title="Tema Değiştir">
            {tema === "dark" ? <Sun size={15} color={T.muted} /> : <Moon size={15} color={T.muted} />}
          </button>
          <button onClick={() => onOpen("postlar")} style={iconBtn} title="Postlarım">
            <Images size={15} color={T.muted} />
          </button>
          <div
            onClick={() => onOpen("profil")}
            title="Profil"
            style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: `2px solid ${T.gold}`, background: `rgba(${T.gr},.12)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            {foto
              ? <img src={foto} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>{kullanici.charAt(0).toUpperCase()}</span>
            }
          </div>
          <button onClick={onCikis} style={iconBtn} title="Çıkış Yap">
            <LogOut size={14} color={T.faint} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
          <span style={{ fontFamily: "Georgia,serif", fontSize: 36, color: T.gold, lineHeight: 1 }}>'</span>
          <span style={{ fontSize: 42, fontWeight: 700, color: T.gold, lineHeight: 1 }}>#</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 7, color: T.gold }}>MEVZU</span>
        <span style={{ fontSize: 8, letterSpacing: 4, color: T.faint, textTransform: "uppercase", marginTop: 2 }}>Günün Nabzına Söz</span>
      </div>

      {/* 2'ye 2 Düzenli Mobil Kart Izgarası */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, width: "100%", maxWidth: 360 }}>
        {CARDS.map((c) => (
          <div key={c.k} onClick={() => onOpen(c.k)}
            style={{
              background: T.bg2,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: "18px 12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 10,
              transition: "all .2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: `rgba(${T.gr},.08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <c.IC size={22} color={T.gold} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{c.t}</span>
              <span style={{ fontSize: 10, color: T.faint, lineHeight: 1.2 }}>{c.d}</span>
              <span style={{ fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 6px", borderRadius: 12, background: `rgba(${T.gr},.1)`, color: T.gold, marginTop: 4, width: "fit-content", margin: "4px auto 0" }}>{c.b}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: T.faint, textAlign: "center", padding: "10px 16px", border: `1px dashed ${T.border}`, borderRadius: 10, maxWidth: 320, lineHeight: 1.6 }}>
        📲 Telefona yüklemek için tarayıcı menüsünden<br />
        <strong style={{ color: T.muted }}>"Ana Ekrana Ekle"</strong> seçeneğini kullan
      </div>
    </div>
  );
}