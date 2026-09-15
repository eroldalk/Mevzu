import React from "react";
import { Composition } from "remotion";
import { MevzuReelsComposition } from "./MevzuReelsComposition";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MevzuReels"
        component={MevzuReelsComposition}
        durationInFrames={240} // 8 saniye @ 30 FPS (Keşfet döngüsü için ideal süre)
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
    </>
  );
};
