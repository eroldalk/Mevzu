import React from "react";
import { Composition } from "remotion";
import "./loadFonts";
import { MevzuReelsComposition } from "./MevzuReelsComposition";
import { getReelFrames } from "../utils/reelDuration";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MevzuReels"
        component={MevzuReelsComposition}
        durationInFrames={240}
        calculateMetadata={({ props }) => ({ durationInFrames: getReelFrames(props.quote) })}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          quote: "Deniz sakin olduğunda, herkes dümenci kesilir. Asıl mesele fırtınada rotayı kaybetmemektir.",
          author: "Publilius Syrus",
          category: "DİRENÇ & ZİHİN",
          primaryColor: "#38bdf8",
          highlightColor: "#38bdf8",
          bgStyle: "ocean",
          musicUrl: "https://assets.mixkit.co/music/443/443.mp3",
          animStyle: "highlight",
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
      <Composition
        id="MevzuPost"
        component={MevzuReelsComposition}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={{ quote: "Olmadıysa vardır bir hayır.", author: "Mevzu", category: "UMUT", bgStyle: "forest", animStyle: "instant", fontFamily: "'Playfair Display', serif" }}
      />
    </>
  );
};
