import React, { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

const CYCLE_DAYS = 60;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

function getCycleStart() {
  try {
    const saved = localStorage.getItem("mevzu_token_cycle_start");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  const now = Date.now();
  try {
    localStorage.setItem("mevzu_token_cycle_start", now.toString());
  } catch {}
  return now;
}

function calculateCountdown(startMs) {
  const now = Date.now();
  const elapsed = now - startMs;

  // 60 gün bittiğinde otomatik olarak sıfırdan tekrar başlasın
  let currentStart = startMs;
  if (elapsed >= CYCLE_MS) {
    const cyclesPassed = Math.floor(elapsed / CYCLE_MS);
    currentStart = startMs + cyclesPassed * CYCLE_MS;
    try {
      localStorage.setItem("mevzu_token_cycle_start", currentStart.toString());
    } catch {}
  }

  const remainingMs = Math.max(0, currentStart + CYCLE_MS - now);
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

  return { days, hours, minutes, seconds, remainingMs };
}

export default function SozHavuzuBattery({
  unused,
  total,
  compact = false,
  onClick,
  style = {},
}) {
  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem("mevzu_quote_stats");
      if (cached) return JSON.parse(cached);
    } catch {}
    return { unused: unused ?? 195, total: total ?? 203 };
  });

  // 60 Günlük Döngü Sayacı
  const [countdown, setCountdown] = useState(() => calculateCountdown(getCycleStart()));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(getCycleStart()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Eğer prop olarak verilmişse onu kullan
  const unusedCount = unused !== undefined ? unused : stats.unused;
  const totalCount = total !== undefined ? total : stats.total;

  // Eğer prop verilmemişse ve cache yoksa Firestore'dan arka planda çek
  useEffect(() => {
    if (unused === undefined || total === undefined) {
      async function fetchStats() {
        try {
          const qSnap = await getDocs(collection(db, "quotes"));
          let u = 0;
          let t = 0;
          qSnap.forEach((d) => {
            t++;
            if (!d.data().used) u++;
          });
          const newStats = { unused: u, total: t };
          setStats(newStats);
          try {
            localStorage.setItem("mevzu_quote_stats", JSON.stringify(newStats));
          } catch {}
        } catch (e) {
          console.warn("Söz havuzu istatistiği alınamadı:", e);
        }
      }
      fetchStats();
    }
  }, [unused, total]);

  const pct = totalCount > 0 ? Math.round((unusedCount / totalCount) * 100) : 0;
  const usedCount = Math.max(0, totalCount - unusedCount);
  const gunlukTahmin = Math.floor(unusedCount / 6); // Günde 6 video yayınlanıyor

  // Renk Kademesi
  const isHigh = pct >= 50;
  const isMedium = pct >= 20 && pct < 50;
  const color = isHigh ? "#10b981" : isMedium ? "#f59e0b" : "#ef4444";
  const glow = isHigh
    ? "rgba(16, 185, 129, 0.25)"
    : isMedium
    ? "rgba(245, 158, 11, 0.25)"
    : "rgba(239, 68, 68, 0.25)";

  // 1. MİNİMAL NAVBAR / HEADER VERSİYONU (Ana Sayfa İçin)
  if (compact) {
    return (
      <div
        onClick={onClick}
        title={`Söz Havuzu: ${unusedCount} hazır / ${totalCount} toplam (${pct}% kapasite) · 60 Günlük Döngü: ${countdown.days}g ${countdown.hours}s kaldı`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(18, 20, 28, 0.8)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${color}35`,
          borderRadius: 20,
          padding: "5px 12px",
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.2s ease",
          boxShadow: `0 2px 10px rgba(0,0,0,0.35), 0 0 10px ${glow}`,
          ...style,
        }}
      >
        {/* Pil İkonu */}
        <div
          style={{
            width: 22,
            height: 12,
            border: `1.5px solid ${color}`,
            borderRadius: 3.5,
            padding: 1.5,
            position: "relative",
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(8, pct)}%`,
              background: `linear-gradient(90deg, ${color}, #6ee7b7)`,
              borderRadius: 1.5,
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {/* Pil Ucu */}
          <div
            style={{
              position: "absolute",
              right: -3,
              top: 2.5,
              width: 2,
              height: 4.5,
              background: color,
              borderRadius: "0 1.5px 1.5px 0",
            }}
          />
        </div>

        {/* Bilgi Metni */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color }}>%{pct}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>
            ({unusedCount})
          </span>
          <span style={{ fontSize: 10, color: "#475569" }}>·</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            ⏱️ {countdown.days}g
          </span>
        </div>
      </div>
    );
  }

  // 2. TAM GENİŞLİKTEKİ DİNAMİK ŞARJ ÇUBUĞU (PostlarPage / İçerik Paneli İçin)
  return (
    <div
      onClick={onClick}
      style={{
        background: "linear-gradient(180deg, rgba(20, 22, 30, 0.95) 0%, rgba(12, 14, 20, 0.98) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: "10px 16px",
        marginTop: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: 7,
        transition: "border-color 0.2s ease",
        ...style,
      }}
    >
      {/* Üst Bilgi Satırı */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {/* Sol Taraf: İkon + Başlık + Detay */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {/* 3D Görünümlü Minik Pil */}
          <div
            style={{
              width: 24,
              height: 13,
              border: `1.8px solid ${color}`,
              borderRadius: 3.5,
              padding: 1.5,
              position: "relative",
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box",
              boxShadow: `0 0 8px ${glow}`,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(6, pct)}%`,
                background: `linear-gradient(90deg, ${color}, #6ee7b7)`,
                borderRadius: 1.5,
                transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            {/* Pil Başlığı */}
            <div
              style={{
                position: "absolute",
                right: -3.5,
                top: 2.5,
                width: 2,
                height: 5,
                background: color,
                borderRadius: "0 1.5px 1.5px 0",
              }}
            />
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.8,
              color: "#f1f5f9",
            }}
          >
            SÖZ HAVUZU ŞARJI
          </span>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
            ({unusedCount} sıradaki · {usedCount} paylaşıldı · {totalCount} toplam)
          </span>
        </div>

        {/* Sağ Taraf: 60 Gün Geri Sayım + Günlük Yakıt + % Yüzde */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* 60 GÜNLÜK OTOMATİK DÖNGÜ GERİ SAYIMI */}
          <div
            title={`60 Günlük Güvenlik / Meta Döngüsü: ${countdown.days} gün ${countdown.hours} sa ${countdown.minutes} dk ${countdown.seconds} sn kaldı. Sıfırlandığında otomatik olarak baştan başlar.`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              padding: "3px 10px",
              borderRadius: 8,
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.12)",
            }}
          >
            <span style={{ fontSize: 11 }}>⏱️</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>
              60G Sayaç:
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#f8fafc",
                fontFamily: "monospace",
                letterSpacing: 0.5,
              }}
            >
              {countdown.days}g {String(countdown.hours).padStart(2, "0")}s {String(countdown.minutes).padStart(2, "0")}d {String(countdown.seconds).padStart(2, "0")}sn
            </span>
          </div>

          {gunlukTahmin > 0 && (
            <span
              style={{
                fontSize: 11,
                background: "rgba(255, 255, 255, 0.04)",
                color: "#94a3b8",
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid rgba(255, 255, 255, 0.06)",
                fontWeight: 500,
              }}
            >
              ⏳ ~{gunlukTahmin} günlük yakıt
            </span>
          )}

          {/* % Yüzde Kutusu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: `rgba(${isHigh ? "16,185,129" : isMedium ? "245,158,11" : "239,68,68"}, 0.14)`,
              border: `1px solid ${color}50`,
              padding: "3px 9px",
              borderRadius: 8,
              boxShadow: `0 0 10px ${glow}`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 900, color, letterSpacing: -0.2 }}>
              %{pct}
            </span>
          </div>
        </div>
      </div>

      {/* Şarj Çubuğu İlerleme Rayı */}
      <div
        style={{
          width: "100%",
          height: 8,
          background: "rgba(0, 0, 0, 0.65)",
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          position: "relative",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.8)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: isHigh
              ? "linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)"
              : isMedium
              ? "linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)"
              : "linear-gradient(90deg, #b91c1c 0%, #ef4444 50%, #f87171 100%)",
            borderRadius: 6,
            boxShadow: `0 0 12px ${glow}`,
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
          }}
        >
          {/* Üst Parlama / Cam Efekti */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "45%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
              borderRadius: "6px 6px 0 0",
            }}
          />
        </div>
      </div>
    </div>
  );
}
