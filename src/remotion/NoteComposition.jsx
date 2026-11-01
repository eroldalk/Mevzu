import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { layoutQuote } from "../utils/quoteLayout";

const NOTE_FONT = "'Caveat', cursive";
const DEFAULT_COLOR = "#FFF3D6";
const FONT_SCALE = 1.04;
const TILT_DEGREES = -3;
const MUSIC_VOLUME = 0.6;
const MUSIC_START_SECONDS = 6;

// Aydınlık fotoğraf üstünde el yazısı not görünümü
export const NoteComposition = ({ quote = "", photoUrl = "", textColor = DEFAULT_COLOR, musicUrl = null }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, height } = useVideoConfig();
  const { lines, fontSize, lineHeight } = layoutQuote(quote);
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames)], [1, 1.06]);

  const musicVolume = (f) => interpolate(
    f,
    [0, 0.5 * fps, durationInFrames - fps, durationInFrames],
    [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#2a2622", overflow: "hidden" }}>
      {musicUrl && <Audio src={musicUrl} volume={musicVolume} startFrom={MUSIC_START_SECONDS * fps} />}
      <Img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />

      {/* Yazı okunsun diye ortada yumuşak gölge; fotoğrafın geneli aydınlık kalır */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 42% at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 100%)" }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
        <div style={{
          fontFamily: NOTE_FONT,
          fontWeight: 700,
          fontSize: Math.round(fontSize * FONT_SCALE),
          lineHeight: lineHeight * 0.92,
          color: textColor,
          textAlign: "center",
          transform: `rotate(${TILT_DEGREES}deg)`,
          textShadow: "0 2px 6px rgba(0,0,0,0.85), 0 4px 24px rgba(0,0,0,0.65)",
        }}>
          {lines.map((line) => <div key={line} style={{ whiteSpace: "nowrap" }}>{line}</div>)}
        </div>
      </AbsoluteFill>

      <div style={{
        position: "absolute",
        right: height > 1350 ? 150 : 44,
        bottom: height > 1350 ? 420 : 40,
        fontFamily: NOTE_FONT,
        fontWeight: 700,
        fontSize: 38,
        color: textColor,
        opacity: 0.9,
        textShadow: "0 2px 8px rgba(0,0,0,0.7)",
      }}>
        #mevzu
      </div>
    </AbsoluteFill>
  );
};
