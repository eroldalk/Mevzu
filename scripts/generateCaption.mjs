// scripts/generateCaption.mjs
// Söze ve yazara özel dinamik Instagram Reels açıklaması ve hashtag üreteci.
// Gemini API anahtarı (GEMINI_API_KEY) varsa en güncel yapay zekayı kullanır,
// yoksa zeki şablon motoruyla kanca + alt metin + CTA + hashtag üretir.

export async function generateInstagramCaption({
  quote,
  author = "Mevzu",
  category = "FELSEFE",
}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    try {
      const prompt = `Sen viral Instagram Reels içerik stratejistisin.
Aşağıdaki alıntı için Instagram Reels paylaşım açıklaması yaz:
Söz: "${quote}"
Yazar: "${author}"
Kategori: "${category}"

Kurallar:
1. İlk satır: İzleyiciyi durduran ÇARPICI bir kanca (Hook) (örn: "Çoğu insanın hayatının sonuna kadar göremediği o gerçek...", "Zihnini serbest bırak...")
2. İkinci kısım: Sözün felsefi ve psikolojik derinliğini anlatan 1-2 vurucu cümle.
3. Üçüncü kısım: Etkileşim ve kaydetme çağrısı (CTA) (örn: "Kendine hatırlatmak için kaydet 📌 ve bunu duyması gereken bir dostuna gönder.")
4. Dördüncü kısım: 6-8 adet odaklı, niş Türkçe ve global hashtag (#stoacilik #felsefe vb.)

Format:
Doğrudan kopyalanıp Instagram'a yapıştırılacak metni ver. Başlık veya açıklama koyma.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.trim()) {
          return generated.trim();
        }
      }
    } catch (err) {
      console.warn("Gemini API çağrısı başarısız oldu, yerel şablona geçiliyor:", err.message);
    }
  }

  // --- Zeki Yerel Şablon Motoru (Fallback) ---
  const hooks = [
    "Çoğu insanın hayatın sonunda fark ettiği o gerçek...",
    "Herkesin bildiği ama çok az kişinin uygulayabildiği kural...",
    "Zihnin fırtınalı olduğunda bu gerçeği hatırla:",
    "Günün en derin hatırlatması seninle:",
    "Kendine dürüst olmanın ilk adımı:",
  ];

  const ctas = [
    "Kendine hatırlatmak için kaydet 📌 ve bir dostuna gönder.",
    "Bunu görmesi gereken birine gönder veya sonra okumak için kaydet.",
    "Bu düşünce sana ne hissettirdi? Yorumlarda buluşalım 👇",
    "Fikrini yoruma bırak ve derin düşünen dostlarına ilet 💭",
  ];

  const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
  const randomCta = ctas[Math.floor(Math.random() * ctas.length)];

  // Kategoriye göre niş hashtagler
  const baseTags = ["#mevzu", "#gününnabzı", "#felsefe", "#zihinyapısı", "#derindüşünce"];
  const catTags = {
    STOACILIK: ["#stoacılık", "#marcusAurelius", "#seneca", "#epiktetos", "#içhuzur"],
    FELSEFE: ["#felsefe", "#düşünce", "#nietzsche", "#farkındalık", "#anlam"],
    FİNANS: ["#finans", "#vizyon", "#başarı", "#yatırım", "#hedef", "#disiplin"],
    ZİHİN: ["#psikoloji", "#kişiselgelişim", "#motivasyon", "#farkındalık"],
  };

  const selectedCatTags = catTags[category?.toUpperCase()] || ["#kişiselgelişim", "#özdisiplin", "#bilgelik"];
  const allTags = Array.from(new Set([...selectedCatTags, ...baseTags])).slice(0, 8).join(" ");

  return `${randomHook}

"${quote}"
— ${author}

${randomCta}
.
.
${allTags}`;
}
