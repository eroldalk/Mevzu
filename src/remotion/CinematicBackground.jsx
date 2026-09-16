import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Img, Video } from "remotion";

export const NATURE_PRESETS = {
  "ocean": {
    "id": "ocean",
    "name": "🌊 Turkuaz Okyanus",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 22, 38, 0.52)"
  },
  "stormy_sea": {
    "id": "stormy_sea",
    "name": "🌪️ Fırtınalı Gece Denizi",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#67e8f9",
    "contrastAccent": "#facc15",
    "overlay": "rgba(6, 12, 22, 0.58)"
  },
  "forest": {
    "id": "forest",
    "name": "🌲 Sisli Çam Ormanı",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#4ef59a",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 24, 15, 0.52)"
  },
  "waterfall": {
    "id": "waterfall",
    "name": "🏞️ Dağ Şelalesi",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1080&q=80",
    "accent": "#5eead4",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(8, 20, 20, 0.52)"
  },
  "rain": {
    "id": "rain",
    "name": "🌧️ Yağmur Damlaları",
    "cat": "Doğa & Su",
    "url": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1080&q=80",
    "accent": "#60a5fa",
    "contrastAccent": "#facc15",
    "overlay": "rgba(10, 16, 26, 0.58)"
  },
  "campfire": {
    "id": "campfire",
    "name": "🔥 Gece Kamp Ateşi",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1080&q=80",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(24, 12, 6, 0.54)"
  },
  "sunset": {
    "id": "sunset",
    "name": "🏔️ Altın Gün Batımı & Dağ",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(28, 14, 8, 0.54)"
  },
  "desert": {
    "id": "desert",
    "name": "🏜️ Sonsuz Çöl Kumları",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80",
    "accent": "#fbbf24",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(24, 16, 8, 0.54)"
  },
  "lightning": {
    "id": "lightning",
    "name": "⛈️ Şimşekli Fırtına",
    "cat": "Element & Doğa",
    "url": "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1080&q=80",
    "accent": "#93c5fd",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 10, 24, 0.60)"
  },
  "statue": {
    "id": "statue",
    "name": "🏛️ Antik Mermer Heykel",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1080&q=80",
    "accent": "#e2e8f0",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 10, 12, 0.58)"
  },
  "library": {
    "id": "library",
    "name": "📚 Kadim Kütüphane",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1507842229450-7740e53696c5?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(20, 12, 6, 0.58)"
  },
  "neon_city": {
    "id": "neon_city",
    "name": "🏙️ Yağmurlu Gece Şehri",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f43f5e",
    "contrastAccent": "#facc15",
    "overlay": "rgba(14, 8, 20, 0.56)"
  },
  "highway": {
    "id": "highway",
    "name": "🏎️ Gece Otoyol Sürüşü",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(6, 12, 22, 0.56)"
  },
  "moon": {
    "id": "moon",
    "name": "🌕 Gece Dolunayı",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f8fafc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 10, 16, 0.56)"
  },
  "aurora": {
    "id": "aurora",
    "name": "🌌 Kuzey Işıkları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1080&q=80",
    "accent": "#c084fc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(12, 8, 24, 0.52)"
  },
  "galaxy": {
    "id": "galaxy",
    "name": "🪐 Yıldızlararası Galaksi",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80",
    "accent": "#818cf8",
    "contrastAccent": "#facc15",
    "overlay": "rgba(6, 8, 20, 0.54)"
  },
  "dark": {
    "id": "dark",
    "name": "🖤 Mat Siyah & Altın",
    "cat": "Minimalist",
    "url": null,
    "accent": "#f5c542",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(0, 0, 0, 0.85)"
  },
  "ocean_1": {
    "id": "ocean_1",
    "name": "🌊 BEACH",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gb4643be9ca397033c76a91184da48a3c124f3bda1cc02f84b80d571820b6cf5f40b86d994f8674a343c0924b95480bd2644cad66db61695dcce25b69b749dd8e_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "ocean_2": {
    "id": "ocean_2",
    "name": "🌊 BEACH",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g95feac63e1a96a9fd7988358093076e1aec42efd1d0b2e8993945451bac8a94c4696597af655d767477b6b337768bf11_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "ocean_3": {
    "id": "ocean_3",
    "name": "🌊 SEA",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gf40dc00a32d55a3efee7e2bd37cb9b5ae61ef366a91efd3393b6ee35dda29bc132f7e8b89633b68c9dbc7d458f8726f5ff22c2f61b9414e40c461a4b2faa9314_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "ocean_4": {
    "id": "ocean_4",
    "name": "🌊 OCEAN",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g2771dab93c0bd97ae9f6d4a007c6ceea4308eff8746eec4dfe50cb6d8527c341bd360c204ad4ddd418a8d6461e31c8eaffd91794b2456c22ed59a5a75772e98d_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "ocean_5": {
    "id": "ocean_5",
    "name": "🌊 LIGHTHOUSE",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g842af7ff109171f1cd7a6dca149d6a5b2e5ea2e2ab6be5b1e9a1f4dd4fe660a69c795e3f1ff66e6eaf2018da3d8af514aba452b5f3d0f6206bae53cfaf999e4e_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "ocean_6": {
    "id": "ocean_6",
    "name": "🌊 WATER",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gbd5c1075f851b34ddcfdcdd4ed95f49c477e10b656495d2625a7f1dfccbba7ee4d409cf855fea2304b00be7aee1a3be55a1230f2894131189e8bcafa1ef7e784_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "forest_1": {
    "id": "forest_1",
    "name": "🌊 MOUNTAIN",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/ge09989c2ab22fefc131e66c447a100675dbb18bf36b02a8f380c4451eeab2682f79905beda1004bd81bf6c839de82ad8b1916ebef9cfdd4ff65394f064d971ea_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "forest_2": {
    "id": "forest_2",
    "name": "🌊 TRAVEL",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g0c28d503f6f4a527391d5824b268cb230f33e6279c6c7609a770f6c0399b8559e4d393f7bdb9c125f4f29e12827887e39e504a15214d139bad4357daa9e26276_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "forest_3": {
    "id": "forest_3",
    "name": "🌊 POND",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g859932362985443681b0c50beb9d56ce24061cfe55dbf03f63ad1ab474ce6be8d3076dea74138343482b559d91cbf793_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "forest_4": {
    "id": "forest_4",
    "name": "🌊 WOOD",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g73a65b73d43675dde36b858700295ed89a4167ad1b52a883e80837bbe2bc5c5e88cba3d63f16bde2605b8f7e0df5b8c60b58e7f267d90af5f9134708f871537a_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "forest_5": {
    "id": "forest_5",
    "name": "🌊 WOOD",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gc28da29f5eed814a81edcfbf60922a8898561c841c81292aa6ec9914cf4c1e3b7c700f8814978acd8413a205011ab89a462dc0dc5b2645774071ab8f4536504a_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "forest_6": {
    "id": "forest_6",
    "name": "🌊 TREES",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g99cd76d56ff97713482fce4e08a2bfecaae8f9f9f4260f36274999ca14b34d8cb3bbb58dc2d98af23623805ccb9d91afc880efa33da271ea39771ee1c46b6de8_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "water_1": {
    "id": "water_1",
    "name": "🌊 WATERFALL",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g0cd9ac07d31b730a39e11cd472ff1ccc8096c8f45f2b7d10f225b65e1fd67d0b28e201bef58e72b5d14d0e703f1687e465d881283d795ec345b1e6f52f06aea2_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "water_2": {
    "id": "water_2",
    "name": "🌊 WATERFALL",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gceed7776025146d62b31a4829133d748c52e8eba7351233737263f6a557b91c0818d38866b73c666476df89a453d26f8e8c2fc99ecc57612cc43d4d3de8a19f8_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "water_3": {
    "id": "water_3",
    "name": "🌊 STREAM",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g7f09db26ba696d8534bf6d6766119f0186177768aff75814299bcdae7631da41989cbf8b05f83a9e8ee3b0e584a0b881a41dbcffa3a37548606bb1e44010bcd7_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "water_4": {
    "id": "water_4",
    "name": "🌊 WATERFALL",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gbd7a91aace0fac5745b0ad5faad5dd71843a943ce1b5f02a57774b08c1859f55d1a60eff89a3aa197002bcff90d8f4cdb9c171529c327131613072af850b8d0e_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "water_5": {
    "id": "water_5",
    "name": "🌊 WATERFALL",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gcded88bc456718186c9b06a90aeac38fc34bedf563f96834176376bbce042835121569fc15d9630c95e64b15b8fa4e22548e7ac181353698f691a605d6b9865f_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "water_6": {
    "id": "water_6",
    "name": "🌊 WATERFALLS",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g8ba19e72f4c1dd8c9a8b07db69e4b9c698ec40312b6544f9a75dba0fcb4efa2b3bf695d5c6000e6ec9c3a8a430fb719b683b0458e53649c7d28e53b364abc174_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "rain_1": {
    "id": "rain_1",
    "name": "🌊 RAILING",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gbd9af174ec43689fb8dbcd5491c967ffc071cd3b54c8547ddbcb2679092f749ba22791378c30845d8efd1f4a0bf5647f187331d808014db5bc7c116281cb2125_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "rain_2": {
    "id": "rain_2",
    "name": "🌊 FLOWER",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/gd091888d1d384d9975c0a8a0b24a0bbe1a1d0cf1fff30fbccb6201e40fb6dfe28277e43d1e4ad8efedd5e8dd31347774235617f1a1f9e4a04aa824b3efb42309_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "rain_3": {
    "id": "rain_3",
    "name": "🌊 DRIP",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g5fb64f5e870d7c031b4270240a6533ce9c197f8497c7cd5cb1512f896aa89486f914a21b7e4be35fd163e19a195b7f2cf41683703758830e3b54ef926a4cd939_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "rain_4": {
    "id": "rain_4",
    "name": "🌊 BIRD",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g9baf6e9338fb69cbe2997ea3426ba10b49fef172dc5a3ac4a6504c2b330e0b2a42dfce92af112dce966b78cca81ea7a6a1ff10ff97e3dd1afa6aa98be698e799_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "rain_5": {
    "id": "rain_5",
    "name": "🌊 RAINING",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g54e2219512b956135442d60f5bd373958552abaf08c1e7e7718fa4c825f54b0968a407303971d86975d6b8e845fd22707690e05ba1e9fbec089b55eac08c31d1_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "rain_6": {
    "id": "rain_6",
    "name": "🌊 MALE",
    "cat": "Doğa & Su",
    "url": "https://pixabay.com/get/g7bc0ad0d3096812f544e05ac732b58ca61f26b0e25c542400ea68cddaf0265d3946bce14b5a20071e37a2fbbec62e623398e3000cce8bc2ff533df78c50768bb_1280.jpg",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 20, 32, 0.55)"
  },
  "mountain_1": {
    "id": "mountain_1",
    "name": "🏔️ SKY",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g5a44dafe4492e7a005926a9cfc180dbb1a4ffb94f9d4dd37cea697eb6aaaa39084f3115e00a0f8a151a539464bb1227f7bf6578b7a39da5bdf89db45a3e8ff85_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "mountain_2": {
    "id": "mountain_2",
    "name": "🏔️ NATURE",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g29a8549030bc95a0680a6704dc721c0b4640f1312a2b639e55c5061fef12cce28648ad07920424e2cda1a98a42a061bdec012903bd55f9dc59dde46b06c15487_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "mountain_3": {
    "id": "mountain_3",
    "name": "🏔️ MOUNTAINS",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g8c211c76ebae3c9eac40b85221bd6d9a3f9fdba5bde97e82eeb9d1aa8e141d404e037d497ce2b7c3f6bf3f0c449c8ff6f0864fc02bebd48187b40525b9b4fe96_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "mountain_4": {
    "id": "mountain_4",
    "name": "🏔️ ROAD",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g121218ceaae4aeb57f0357b0c49d8f9a2096b9941ee411cff8a52792241972136c5cd2c889a1031e6081d6ceb6a6acb68082078ade8eee4f46a0b90064bf1254_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "mountain_5": {
    "id": "mountain_5",
    "name": "🏔️ CLIFF",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g4a535ea894a5660408c3a08a34479d4ec587a75735ca93a773f3951b8e1ab6cad78e66974704837c70f10184de2274823f0ab147a8ec62f63af5eba58995d600_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "mountain_6": {
    "id": "mountain_6",
    "name": "🏔️ MOUNTAINS",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/gd2cc780c697d08973e30dffe5c5b597b230ac18eac18596bd4d2ee39e4aad9b03dc02b8b8dd7345a704ba235927e49ce7309de74cfa3957527c576c0515ad3a6_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "fire_1": {
    "id": "fire_1",
    "name": "🏔️ BONFIRE",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g2f667b8bfda913d47ea012fff23d3e86a84bdb3b06bac359844ad62856c2e23c0a1a605a5619f49de957165a90662efc5fbb9cef3c8b2b0bdc00bc0dc1c6128e_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "fire_2": {
    "id": "fire_2",
    "name": "🏔️ FIRE",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g873675f1f5f7313a0f9f020cab3089959f7a8e962e61598a0a6515a50ea80ddec75cbce87ecee0852d71f987a569549a6f2ec5607ea0004a97a0a7b73b2880dd_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "fire_3": {
    "id": "fire_3",
    "name": "🏔️ FLAMES",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g03266766fca64d7ab85467e749f7f2a003c4c72aab0990204d78ca4e8538a764df4b1d2c7742d689096a8bfec32531b5df76674ca20800ed16e71552b07e3078_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "fire_4": {
    "id": "fire_4",
    "name": "🏔️ FIRE",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g138725cc5e80de9fa73e1aa20535d3ee31a143a061efeb8f472cca07a8ed2281a3c2be82e384712e83c8964659aa030bda5b85f7258982773c407e4d163d21f5_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "fire_5": {
    "id": "fire_5",
    "name": "🏔️ FIRE",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g962665e59228f163b08dae76cd983a78aff109d15462038e6fb65f46ca25dd3221baaff5a87ec2db3b408e70fbffc9d53a8a2625d93c0041fa8d6c4619909b9f_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "fire_6": {
    "id": "fire_6",
    "name": "🏔️ FIRE",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g6519b0766e6b50c9978bffae22e1efa819b77427fe9ff97d696fdc198f33a33abda5d8692cf04be430ec2ed14ece1874efa4f402723d1724a19967e7412131aa_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "desert_1": {
    "id": "desert_1",
    "name": "🏔️ DESERT",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/ga9a6ec3ed15c6694323f22d74907686a4bd1ce7007bc1bbc2299f76977f40679131ac759612af933f2b3d8e74815ad6cce2a947194584ee38d45e7fee4a1242e_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "desert_2": {
    "id": "desert_2",
    "name": "🏔️ NAMIBIA",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/ga19049462b879fb8c3d6876a1457a83e8e6e7ed65170a9f21e9abcddfbb512248b01876bcaecfcaa1b691156b48f5c53a312f82e5755b267fa2736ff213dbd0f_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "desert_3": {
    "id": "desert_3",
    "name": "🏔️ NAMIBIA",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g23183c9f8af205ac134ddc13b8575c5e506a1f33c9ae65d99dc5b620db1b9054aafa9b4ac878c3b925590ed4e64d4ba4ada640ea5a2249d6420546affcd4c7d7_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "desert_4": {
    "id": "desert_4",
    "name": "🏔️ DESERT",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/ga2f153ea24abfd00651f56574235251c512971a0215bffe6a9340660239a68a7046aa2f0edb95d0124f439223f32b6e82acb1075ac4e273e1bb3bc2ac423c560_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "desert_5": {
    "id": "desert_5",
    "name": "🏔️ SAND",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g09dae65002d7e9296a4aad29216e8ac78f40e8f05e448c8e0778b876042930f78915cf2b3925b0ef636d99041ae60dd994ba5255cc5ca9dcb1165a698e158d8e_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "desert_6": {
    "id": "desert_6",
    "name": "🏔️ SAND",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g1cdeeb415c43c0f74dfebd3f47f103549daa40f6f6e7e414b8b764ca7a444801ca71f4f026ff333f8730e04a4be41956ca3658a7100414b3cd92b79f9260730b_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "storm_1": {
    "id": "storm_1",
    "name": "🏔️ LIGHTNING",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/gbd8845e5e0db90dd5773141e4319b78cdebc2ba2233c2e978bab80cc469ecbd3d0ed3ed676ebe86312cbe3091275fa701c707687dec3bd3750c24fd6cc638e5f_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "storm_2": {
    "id": "storm_2",
    "name": "🏔️ LIGHTNING",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g6c9e34829c2d1b054edd0ad75bc2aa6dfa7cc5392d5ab15a99a93ffaed3f64a1c35446798733c91f1e4f3f4b59e8b283db2e529c891ac24eb0507a6ac19b34d1_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "storm_3": {
    "id": "storm_3",
    "name": "🏔️ STORM",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g09bcbdbc1ff34d9739a9ea241627a56f939daf5d55b89c891852a0f5f2a7f3523d8cc6d8270ef4332970c908ef7a412f5f964d08e9a6ffe95741382d0828a2db_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "storm_4": {
    "id": "storm_4",
    "name": "🏔️ LAKE",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g6efd696143368aa34c5064d71f45b29cdc7c60fae8b4f9f6adf1b3ad0af7309c2b6fd502a1eaf4fa76208d7ba0e86dcd33f582610c85000759d26a67be8d1fea_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "storm_5": {
    "id": "storm_5",
    "name": "🏔️ LIGHTNING",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/g9ed9ce331f46f8295d0961ad8ea3f11fd816e4cf52ade65ca6cfa6c08955822085f2998e3eccc2734c7945ba489bbb909680d29108e3cf5f932a9ce589c0a27f_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },
  "storm_6": {
    "id": "storm_6",
    "name": "🏔️ COLORADO",
    "cat": "Element & Doğa",
    "url": "https://pixabay.com/get/gefbb01aa96995aceea4ec6929f68635b05c742ac297be2b0e02e1cf1d9a2c2f0d85cdbc0ca5d12db190fdcd5d609f53f9639a09d9c8de73ac906a644123f23e0_1280.jpg",
    "accent": "#fb923c",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(22, 12, 8, 0.55)"
  },

  // ── 🏛️ Felsefe & Kültür (Dengelenmiş Yeni Koleksiyon) ──
  "felsefe_colosseum": {
    "id": "felsefe_colosseum",
    "name": "🏛️ Antik Roma Kolezyumu",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(18, 12, 8, 0.58)"
  },
  "felsefe_columns": {
    "id": "felsefe_columns",
    "name": "🏛️ Akropolis Mermer Sütunlar",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1080&q=80",
    "accent": "#e2e8f0",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(14, 14, 18, 0.56)"
  },
  "felsefe_bust": {
    "id": "felsefe_bust",
    "name": "🗿 Stoacı Filozof Büstü",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1080&q=80",
    "accent": "#cbd5e1",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 10, 14, 0.60)"
  },
  "felsefe_art": {
    "id": "felsefe_art",
    "name": "🎨 Klasik Rönesans Sanatı",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=80",
    "accent": "#b45309",
    "contrastAccent": "#fde047",
    "overlay": "rgba(16, 10, 6, 0.58)"
  },
  "felsefe_lib_wood": {
    "id": "felsefe_lib_wood",
    "name": "📖 Kadim Ahşap Kütüphane",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#facc15",
    "overlay": "rgba(20, 12, 6, 0.58)"
  },
  "felsefe_parchment": {
    "id": "felsefe_parchment",
    "name": "📜 Açık Antik Parşömen",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(16, 12, 8, 0.56)"
  },
  "felsefe_dark_statue": {
    "id": "felsefe_dark_statue",
    "name": "🌑 Gölgedeki Heykel",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1608371945786-d47d3cdd31da?auto=format&fit=crop&w=1080&q=80",
    "accent": "#94a3b8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(8, 8, 12, 0.62)"
  },
  "felsefe_ruins": {
    "id": "felsefe_ruins",
    "name": "🏛️ Gün Batımı Antik Harabeler",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(18, 12, 8, 0.56)"
  },
  "felsefe_leather_books": {
    "id": "felsefe_leather_books",
    "name": "📚 Deri Ciltli Bilgelik Kitapları",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#fbbf24",
    "overlay": "rgba(22, 14, 8, 0.58)"
  },
  "felsefe_grand_lib": {
    "id": "felsefe_grand_lib",
    "name": "🏛️ Sonsuz Kütüphane Kubbesi",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1080&q=80",
    "accent": "#b45309",
    "contrastAccent": "#facc15",
    "overlay": "rgba(18, 10, 6, 0.58)"
  },
  "felsefe_museum": {
    "id": "felsefe_museum",
    "name": "🏛️ Kadim Müze Galerisi",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1533158307587-828f0a76ef46?auto=format&fit=crop&w=1080&q=80",
    "accent": "#e2e8f0",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(12, 12, 16, 0.56)"
  },
  "felsefe_time": {
    "id": "felsefe_time",
    "name": "⏳ Zaman & Felsefe",
    "cat": "Felsefe & Kültür",
    "url": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1080&q=80",
    "accent": "#d97706",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(16, 12, 8, 0.58)"
  },

  // ── 🪐 Kozmik & Uzay (Dengelenmiş Yeni Koleksiyon) ──
  "kozmik_nebula": {
    "id": "kozmik_nebula",
    "name": "🌌 Derin Uzay Nebulası",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1080&q=80",
    "accent": "#c084fc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(10, 6, 20, 0.54)"
  },
  "kozmik_violet_galaxy": {
    "id": "kozmik_violet_galaxy",
    "name": "🪐 Mor Galaksi & Yıldız Tozu",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1080&q=80",
    "accent": "#a855f7",
    "contrastAccent": "#facc15",
    "overlay": "rgba(12, 6, 24, 0.54)"
  },
  "kozmik_night_stars": {
    "id": "kozmik_night_stars",
    "name": "✨ Kristal Gece Yıldızları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80",
    "accent": "#60a5fa",
    "contrastAccent": "#facc15",
    "overlay": "rgba(6, 10, 22, 0.56)"
  },
  "kozmik_orion": {
    "id": "kozmik_orion",
    "name": "🛸 Orion Gaz Bulutu",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1080&q=80",
    "accent": "#818cf8",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 6, 20, 0.54)"
  },
  "kozmik_mountain_milkyway": {
    "id": "kozmik_mountain_milkyway",
    "name": "🏔️ Dağ Zirvesinde Samanyolu",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(6, 12, 22, 0.56)"
  },
  "kozmik_deep_void": {
    "id": "kozmik_deep_void",
    "name": "🌑 Sonsuz Kozmik Boşluk",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=1080&q=80",
    "accent": "#6366f1",
    "contrastAccent": "#facc15",
    "overlay": "rgba(4, 6, 16, 0.58)"
  },
  "kozmik_earth_orbit": {
    "id": "kozmik_earth_orbit",
    "name": "🌍 Gece Dünya Yörüngesi",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(4, 8, 20, 0.55)"
  },
  "kozmik_desert_sky": {
    "id": "kozmik_desert_sky",
    "name": "🏜️ Çölde Gece Yıldızları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(10, 8, 20, 0.56)"
  },
  "kozmik_mars": {
    "id": "kozmik_mars",
    "name": "🔴 Kızıl Gezegen Ufku",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f97316",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(20, 8, 6, 0.56)"
  },
  "kozmik_cosmic_light": {
    "id": "kozmik_cosmic_light",
    "name": "✨ Kozmik Işık Işıkları",
    "cat": "Kozmik & Uzay",
    "url": "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1080&q=80",
    "accent": "#a855f7",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 6, 18, 0.58)"
  },

  // ── 🏙️ Şehir & Gece (Dengelenmiş Yeni Koleksiyon) ──
  "sehir_neon_rain": {
    "id": "sehir_neon_rain",
    "name": "🌧️ Neon Yağmurlu Şehir",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f43f5e",
    "contrastAccent": "#facc15",
    "overlay": "rgba(14, 6, 20, 0.56)"
  },
  "sehir_tokyo": {
    "id": "sehir_tokyo",
    "name": "🏮 Tokyo Gece Caddesi",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1080&q=80",
    "accent": "#06b6d4",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 12, 24, 0.56)"
  },
  "sehir_manhattan": {
    "id": "sehir_manhattan",
    "name": "🏙️ Manhattan Gece Silüeti",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(10, 12, 20, 0.58)"
  },
  "sehir_cyberpunk": {
    "id": "sehir_cyberpunk",
    "name": "⚡ Gece Siber Sokak",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80",
    "accent": "#ec4899",
    "contrastAccent": "#facc15",
    "overlay": "rgba(16, 6, 22, 0.56)"
  },
  "sehir_shibuya": {
    "id": "sehir_shibuya",
    "name": "🚶 Shibuya Gece Akışı",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1080&q=80",
    "accent": "#38bdf8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(10, 12, 24, 0.56)"
  },
  "sehir_bridge_fog": {
    "id": "sehir_bridge_fog",
    "name": "🌉 Sisli Gece Köprüsü",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f59e0b",
    "contrastAccent": "#38bdf8",
    "overlay": "rgba(12, 10, 16, 0.56)"
  },
  "sehir_rainy_window": {
    "id": "sehir_rainy_window",
    "name": "🪟 Yağmurlu Pencereden Şehir",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1080&q=80",
    "accent": "#60a5fa",
    "contrastAccent": "#facc15",
    "overlay": "rgba(8, 10, 22, 0.58)"
  },
  "sehir_highway_curves": {
    "id": "sehir_highway_curves",
    "name": "🏎️ Gece Otoyol Işıkları",
    "cat": "Şehir & Gece",
    "url": "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&w=1080&q=80",
    "accent": "#ef4444",
    "contrastAccent": "#facc15",
    "overlay": "rgba(14, 8, 16, 0.56)"
  },

  // ── 🖤 Minimalist (Dengelenmiş Yeni Koleksiyon) ──
  "minimal_black_gold": {
    "id": "minimal_black_gold",
    "name": "🖤 Mat Siyah & Altın Damar",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1080&q=80",
    "accent": "#f5c542",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(0, 0, 0, 0.70)"
  },
  "minimal_dark_waves": {
    "id": "minimal_dark_waves",
    "name": "🖤 Koyu Akışkan Dalgalar",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80",
    "accent": "#94a3b8",
    "contrastAccent": "#f5c542",
    "overlay": "rgba(0, 0, 0, 0.68)"
  },
  "minimal_dark_tech": {
    "id": "minimal_dark_tech",
    "name": "🖤 Karanlık Geometrik Doku",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80",
    "accent": "#64748b",
    "contrastAccent": "#facc15",
    "overlay": "rgba(0, 0, 0, 0.72)"
  },
  "minimal_dark_gradient": {
    "id": "minimal_dark_gradient",
    "name": "🖤 Sinematik Odak Işığı",
    "cat": "Minimalist",
    "url": "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1080&q=80",
    "accent": "#c084fc",
    "contrastAccent": "#facc15",
    "overlay": "rgba(0, 0, 0, 0.65)"
  }
};

export const CinematicBackground = ({
  primaryColor = "#c9a84c",
  bgStyle = "ocean",
  customBgUrl = null,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const preset = NATURE_PRESETS[bgStyle] || NATURE_PRESETS.ocean;
  const bgMedia = customBgUrl || preset.url;
  const accentColor = preset.accent || primaryColor;

  const isVideo =
    typeof bgMedia === "string" &&
    (bgMedia.startsWith("blob:") ||
      bgMedia.startsWith("data:video") ||
      /\.(mp4|webm|mov)(\?.*)?$/i.test(bgMedia));

  const scale = isVideo
    ? 1
    : interpolate(frame, [0, durationInFrames], [1, 1.13]);
  const translateY = isVideo
    ? 0
    : interpolate(frame, [0, durationInFrames], [0, -38]);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 35; i++) {
      arr.push({
        x: (i * 137.5) % 100,
        yInit: (i * 83.3) % 100,
        size: (i % 4) * 1.5 + 2.2,
        speed: 0.16 + (i % 5) * 0.08,
        opacityBase: 0.22 + (i % 6) * 0.1,
      });
    }
    return arr;
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        width: 1080,
        height: 1920,
        backgroundColor: "#060709",
        overflow: "hidden",
      }}
    >
      {bgMedia ? (
        <div
          style={{
            position: "absolute",
            inset: isVideo ? 0 : -45,
            transform: isVideo ? "none" : `scale(${scale}) translateY(${translateY}px)`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          {isVideo ? (
            <Video
              src={bgMedia}
              loop
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.96) saturate(1.15)",
              }}
            />
          ) : (
            <Img
              src={bgMedia}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.96) saturate(1.18)",
              }}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 45%, #181510 0%, #0a0a0c 85%)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.68) 0%, ${preset.overlay || "rgba(0,0,0,0.48)"} 45%, rgba(0,0,0,0.78) 100%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          width: 850,
          height: 850,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${accentColor}1c 0%, transparent 70%)`,
          filter: "blur(75px)",
          pointerEvents: "none",
        }}
      />

      {particles.map((p, idx) => {
        const currentY = (p.yInit - frame * p.speed + 200) % 110;
        const currentOpacity = interpolate(
          Math.sin((frame + idx * 12) * 0.05),
          [-1, 1],
          [p.opacityBase * 0.3, p.opacityBase * 1.5]
        );

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${currentY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: accentColor,
              opacity: Math.max(0, currentOpacity),
              boxShadow: `0 0 ${p.size * 3}px ${accentColor}`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 170px rgba(0,0,0,0.85)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
