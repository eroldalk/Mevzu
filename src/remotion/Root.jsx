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
          quote: "Gerçek asla yüzeyde bulunmaz. O, derinlere inmenin bir sonucudur.",
          author: "Marcus Aurelius",
          category: "STOACILIK & ZİHİN",
          primaryColor: "#c9a84c",
          highlightColor: "#f5c542",
        }}
      />
    </>
  );
};
