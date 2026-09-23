import { useState, useEffect } from "react";
import { Settings, Clock, Plus, Trash2, CheckCircle2, Save, Sparkles, AlertCircle, ArrowLeft, RefreshCw, SunMedium } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { TEMALAR } from "../utils/tema";

const DEFAULT_SLOTS = ["19:00"];

export default function SettingsPage({ tema, onBack }) {
  const T = TEMALAR[tema];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);
  const [hata, setHata] = useState(null);

  // Ayarlar State'i
  const [dailyCount, setDailyCount] = useState(1);
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [shortQuotesOnly, setShortQuotesOnly] = useState(true);
  const [storyEnabled, setStoryEnabled] = useState(true);
  const [storySlot, setStorySlot] = useState("08:00");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Firestore'dan kalıcı ayarları yükle
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const docRef = doc(db, "settings", "schedule");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.slots) && data.slots.length > 0) {
            setSlots(data.slots);
            setDailyCount(data.slots.length);
          }
          if (data.shortQuotesOnly !== undefined) {
            setShortQuotesOnly(data.shortQuotesOnly);
          }
          if (data.storyEnabled !== undefined) {
            setStoryEnabled(data.storyEnabled);
          }
          if (data.storySlot) {
            setStorySlot(data.storySlot);
          }
          if (data.updatedAt) {
            setLastUpdated(new Date(data.updatedAt).toLocaleString("tr-TR"));
          }
        }
      } catch (err) {
        console.error("Ayarlar yüklenirken hata:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Adet değiştiğinde slot listesini güncelle
  const handleDailyCountChange = (count) => {
    setDailyCount(count);
    if (count === 1) {
      setSlots((prev) => [prev[0] || "19:00"]);
    } else if (count === 2) {
      setSlots(["13:30", "19:00"]);
    } else if (count === 3) {
      setSlots(["11:00", "16:30", "20:00"]);
    } else if (count === 4) {
      setSlots(["09:30", "13:30", "17:30", "21:00"]);
    }
  };

  // Belirli bir slot saatini güncelle
  const updateSlotTime = (index, value) => {
    const updated = [...slots];
    updated[index] = value;
    setSlots(updated);
  };

  // Yeni slot saati ekle
  const addSlot = () => {
    if (slots.length >= 6) return;
    const newSlots = [...slots, "20:00"];
    setSlots(newSlots);
    setDailyCount(newSlots.length);
  };

  // Slot sil
  const removeSlot = (index) => {
    if (slots.length <= 1) return;
    const newSlots = slots.filter((_, i) => i !== index);
    setSlots(newSlots);
    setDailyCount(newSlots.length);
  };

  // Firestore'a kaydet (1 kere kaydeder, sonsuza kadar çalışır)
  const kaydet = async () => {
    try {
      setSaving(true);
      setHata(null);

      // Sıralı ve benzersiz slotlar
      const cleanSlots = [...new Set(slots)].sort();

      const docRef = doc(db, "settings", "schedule");
      const payload = {
        dailyCount: cleanSlots.length,
        slots: cleanSlots,
        shortQuotesOnly,
        storyEnabled,
        storySlot: storySlot || "08:00",
        updatedAt: new Date().toISOString(),
        updatedBy: localStorage.getItem("mevzu_user") || "admin",
      };

      await setDoc(docRef, payload, { merge: true });
      setLastUpdated(new Date().toLocaleString("tr-TR"));
      setKaydedildi(true);
      setTimeout(() => setKaydedildi(false), 3000);
    } catch (err) {
      console.error("Ayarlar kaydedilirken hata:", err);
      setHata("Kaydedilirken bir hata oluştu: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 60 }}>
      {/* Üst Bar */}
      <div style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", background: T.bg2, borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", color: T.faint, cursor: "pointer",
              display: "flex", alignItems: "center", padding: 4
            }}
          >
            <ArrowLeft size={20} color={T.gold} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Settings size={18} color={T.gold} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: T.gold }}>
              Otomasyon & Yayın Ayarları
            </span>
          </div>
        </div>

        {lastUpdated && (
          <span style={{ fontSize: 11, color: T.faint, display: "none", sm: "block" }}>
            Son kayıt: {lastUpdated}
          </span>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 620, padding: "32px 20px", display: "flex", flexDirection: "column", gap: 24, boxSizing: "border-box" }}>
        
        {/* Bilgilendirme Kartı */}
        <div style={{
          background: `rgba(${T.gr},.06)`, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14
        }}>
          <Sparkles size={22} color={T.gold} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Kalıcı Otomasyon Sistemi</span>
            <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              Buradaki ayarı <strong>1 kez kaydettiğinizde</strong> sistem her gün belirlediğiniz saatte otomatik Reels paylaşır. Her gün ayarlamak zorunda kalmazsınız; ister 10 gün sonra, ister 1 ay sonra gelip tek tıkla değiştirebilirsiniz.
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: T.faint, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <RefreshCw size={18} className="animate-spin" color={T.gold} />
            <span>Kayıtlı ayarlar yükleniyor...</span>
          </div>
        ) : (
          <>
            {/* 1. Günlük Reels Sayısı */}
            <div style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 14
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  Günlük Reels Adedi
                </span>
                <span style={{ fontSize: 11, color: T.faint }}>
                  Algoritma için hesap başlarında günde 1 video en yüksek organik dağılımı sağlar.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[1, 2, 3, 4].map((count) => {
                  const isActive = dailyCount === count;
                  return (
                    <button
                      key={count}
                      onClick={() => handleDailyCountChange(count)}
                      style={{
                        background: isActive ? `rgba(${T.gr},.15)` : T.bg3,
                        border: `1.5px solid ${isActive ? T.gold : T.border}`,
                        borderRadius: 10,
                        padding: "12px 8px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        transition: "all .2s"
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 800, color: isActive ? T.gold : T.text }}>
                        {count} Video
                      </span>
                      <span style={{ fontSize: 9, color: isActive ? T.gold : T.faint }}>
                        {count === 1 ? "Önerilen" : `Günde ${count}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Yayın Saatleri */}
            <div style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                    Yayın Saatleri (Türkiye Saati: UTC+3)
                  </span>
                  <span style={{ fontSize: 11, color: T.faint }}>
                    Videonun Instagram'a canlı atılacağı saatleri özelleştirin
                  </span>
                </div>

                {slots.length < 6 && (
                  <button
                    onClick={addSlot}
                    style={{
                      background: `rgba(${T.gr},.12)`, border: `1px solid ${T.gold}`,
                      color: T.gold, borderRadius: 8, padding: "6px 12px",
                      cursor: "pointer", fontSize: 11, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6
                    }}
                  >
                    <Plus size={14} />
                    <span>Saat Ekle</span>
                  </button>
                )}
              </div>

              {/* Slot Listesi */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {slots.map((slotTime, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10,
                      padding: "10px 14px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Clock size={16} color={T.gold} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                        {idx + 1}. Video Saati:
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Hızlı hazır butonlar */}
                      <div style={{ display: "flex", gap: 6 }}>
                        {["13:30", "19:00", "20:00", "21:30"].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => updateSlotTime(idx, preset)}
                            style={{
                              background: slotTime === preset ? T.gold : "transparent",
                              color: slotTime === preset ? (tema === "dark" ? "#08080a" : "#fff") : T.faint,
                              border: `1px solid ${slotTime === preset ? T.gold : T.border}`,
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: slotTime === preset ? 700 : 500
                            }}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      {/* Özel saat girişi */}
                      <input
                        type="time"
                        value={slotTime}
                        onChange={(e) => updateSlotTime(idx, e.target.value)}
                        style={{
                          background: T.bg2,
                          border: `1px solid ${T.gold}`,
                          borderRadius: 8,
                          color: T.text,
                          padding: "6px 10px",
                          fontSize: 13,
                          fontWeight: 700,
                          outline: "none",
                          fontFamily: "inherit"
                        }}
                      />

                      {slots.length > 1 && (
                        <button
                          onClick={() => removeSlot(idx)}
                          style={{
                            background: "none", border: "none", color: "#e07070",
                            cursor: "pointer", padding: 4, display: "flex", alignItems: "center"
                          }}
                          title="Bu saati kaldır"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Günün Sözü Hikayesi (Instagram Story) */}
            <div style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SunMedium size={20} color={T.gold} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                      Günün Sözü Hikayesi (Instagram Story)
                    </span>
                    <span style={{ fontSize: 11, color: T.faint }}>
                      Her sabah 9:16 dikey formatta günün sözünü doğrudan Hikayelerde yayınlar
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={storyEnabled}
                  onChange={(e) => setStoryEnabled(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: T.gold, cursor: "pointer" }}
                />
              </div>

              {storyEnabled && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10,
                  padding: "10px 14px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Clock size={16} color={T.gold} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                      Hikaye Yayın Saati:
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["08:00", "08:30", "09:00", "10:00"].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setStorySlot(preset)}
                          style={{
                            background: storySlot === preset ? T.gold : "transparent",
                            color: storySlot === preset ? (tema === "dark" ? "#08080a" : "#fff") : T.faint,
                            border: `1px solid ${storySlot === preset ? T.gold : T.border}`,
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 11,
                            cursor: "pointer",
                            fontWeight: storySlot === preset ? 700 : 500
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <input
                      type="time"
                      value={storySlot}
                      onChange={(e) => setStorySlot(e.target.value)}
                      style={{
                        background: T.bg2,
                        border: `1px solid ${T.gold}`,
                        borderRadius: 8,
                        color: T.text,
                        padding: "6px 10px",
                        fontSize: 13,
                        fontWeight: 700,
                        outline: "none",
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Söz Havuzu & Algoritma İpuçları (Kısa Cümle Önceliği) */}
            <div style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "20px", display: "flex", alignItems: "flex-start", gap: 14
            }}>
              <input
                type="checkbox"
                id="shortQuotes"
                checked={shortQuotesOnly}
                onChange={(e) => setShortQuotesOnly(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: T.gold, marginTop: 3, cursor: "pointer" }}
              />
              <label htmlFor="shortQuotes" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  Kısa ve Vurucu Sözler Önceliği (Maksimum 4-10 Kelime)
                </span>
                <span style={{ fontSize: 11, color: T.faint, lineHeight: 1.4 }}>
                  150-160 izlenen Da Vinci ve Picasso gibi kısa sözlere öncelik verir. Ekranda dev yazı puntolarıyla görünür, kaydırma oranını düşürür ve izlenmeleri artırır.
                </span>
              </label>
            </div>

            {/* Hata Bildirimi */}
            {hata && (
              <div style={{
                background: "rgba(224,112,112,.1)", border: "1px solid #e07070",
                borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, color: "#e07070", fontSize: 12
              }}>
                <AlertCircle size={16} />
                <span>{hata}</span>
              </div>
            )}

            {/* Başarı Bildirimi */}
            {kaydedildi && (
              <div style={{
                background: "rgba(78,245,154,.1)", border: "1px solid #4ef59a",
                borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, color: "#4ef59a", fontSize: 12
              }}>
                <CheckCircle2 size={16} />
                <span>Ayarlar başarıyla kaydedildi! Sistem artık bu saatlerde otomatik çalışacaktır.</span>
              </div>
            )}

            {/* Kaydet Butonu */}
            <button
              onClick={kaydet}
              disabled={saving}
              style={{
                background: `linear-gradient(135deg, ${T.gold}, #d4a017)`,
                color: tema === "dark" ? "#08080a" : "#ffffff",
                border: "none",
                borderRadius: 12,
                padding: "16px 24px",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 1,
                cursor: saving ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: `0 4px 20px rgba(${T.gr},.25)`,
                transition: "all .2s"
              }}
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>KAYDEDİLİYOR...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>AYARLARI KAYDET (KALICI YAP)</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
