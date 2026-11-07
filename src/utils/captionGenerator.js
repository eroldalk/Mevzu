import { buildHashtags } from "./hashtags.js";
// src/utils/captionGenerator.js
// Instagram Reels Açıklama (Caption) & Hashtag Motoru
// Sözü ekrana yazmaz! 4 Parçalı Formül:
// 1. Yazar — Eser / Konu
// 2. Yorum Getiren Düşündürücü Soru
// 3. Kaydet & Yorum Çağrısı (CTA)
// 4. 6-8 Odaklı Viral Hashtag

// Birine söylenecek sözde paylaşım, kendine hatırlatılacak sözde kaydetme istenir
const SEND_PATTERN = /(^|[\s,.!?"“])(seni|sana|birine|dost|arkadaş|özle|sevdi|gönül|kırgın|kırıl|yanında)/;

export function pickCta(quote = "") {
  const text = quote.toLocaleLowerCase("tr-TR");
  return SEND_PATTERN.test(text)
    ? { type: "send", text: "Bunu birine gönder 💌" }
    : { type: "save", text: "Kaydet, sonra lazım olur 📌" };
}

// Kategoriye ve temaya göre düşündürücü soru havuzu (Fallback & Çeşitlilik)
const CATEGORY_QUESTIONS = {
  GÜÇ: [
    "Herkes tarafından sevilmeye çalışmak, bir liderin düşebileceği en büyük tuzak mıdır? Sizce saygı mı yoksa sevgi mi daha kalıcı bir güç sağlar?",
    "Gücü elinde tutan birinin en büyük zaafı sizce nedir? Güven mi, kibir mi?",
    "Sizce insanları yönetmenin en etkili yolu korku mu, saygı mı, yoksa adalet mi?",
  ],
  STRATEJİ: [
    "Hayatta attığınız adımları duygularınızla mı yoksa soğukkanlı bir stratejiyle mi belirlersiniz?",
    "Kazanmak için bazen geri adım atmak bir zayıflık mıdır, yoksa en büyük hamle mi?",
    "Bir kriz anında ilk tepkiniz ne olur: Harekete geçmek mi, bekleyip izlemek mi?",
  ],
  STOACILIK: [
    "Sizi bu hayatta en çok yıpratan şey olayların kendisi mi, yoksa sizin onlara yüklediğiniz anlamlar mı?",
    "Kontrol edemediğiniz şeyleri dert etmeyi bırakabilseydiniz, hayatınızda ilk ne değişirdi?",
    "İnsanların ne düşündüğünü tamamen umursamayı bıraktığınız anı hatırlıyor musunuz?",
  ],
  FELSEFE: [
    "İnsan savaştığı şeye zamanla kendisi de dönüşebilir mi? Bu tuzaktan nasıl korunabiliriz?",
    "Hayatın anlamı aranarak mı bulunur, yoksa eylemlerimizle bizzat biz mi inşa ederiz?",
    "Gerçek özgürlük her istediğini yapabilmek midir, yoksa arzularına esir olmamak mı?",
  ],
  ZİHİN: [
    "Zihninizi en çok yoran şey geçmişin pişmanlığı mı, yoksa geleceğin belirsizliği mi?",
    "Kendi iç sesiniz size bir dost gibi mi yaklaşıyor, yoksa en acımasız eleştirmeniniz mi?",
    "Zor zamanlarda rotanızı korumayı nasıl başarıyorsunuz?",
  ],
  DİRENÇ: [
    "Fırtına dindiğinde geriye kalan sadece karakterinizdir. Sizi en çok güçlendiren kırılma noktanız neydi?",
    "Zorluklar bir insanı yıkar mı, yoksa içindeki gerçek potansiyeli mi ortaya çıkarır?",
    "Herkes vazgeçtiğinde sizi devam ettiren o tek şey nedir?",
  ],
  ZAMAN: [
    "Gününüzün ne kadarını gerçekten kendi hedefleriniz ve ruhunuz için yaşıyorsunuz?",
    "Zamanımızın az olduğunu mu düşünüyorsunuz, yoksa çoğunu boşa harcadığımız gerçeğiyle yüzleşebiliyor muyuz?",
    "Bugün ömrünüzün son günü olsaydı, geride bıraktığınız günden razı olur muydunuz?",
  ],
  FİNANS: [
    "Zenginlik sizce sahip olduğunuz para miktarı mıdır, yoksa satın alma ihtiyacı duymadığınız şeylerin çokluğu mu?",
    "Finansal özgürlüğün önündeki en büyük engel sizce bilgisizlik mi, yoksa sabırsızlık mı?",
    "Bugün kazandığınız para hayatınızı mı inşa ediyor, yoksa sadece faturalarınızı mı ödüyor?",
  ],
};

export async function generateInstagramCaption({
  quote = "",
  author = "Mevzu",
  category = "FELSEFE",
  recentCaptions = [],
}) {
  const cleanAuthor = (author || "Mevzu").trim();
  const cleanCat = (category || "FELSEFE").trim().toUpperCase();

  // 1. YAZAR BİLGİSİ: Söz o esere ait olmayabilir, eser adı yazılmaz
  const authorKey = cleanAuthor.toLowerCase();
  const baslikSatiri = authorKey === "mevzu" ? "" : `${cleanAuthor}.`;
  const cta = pickCta(quote);

  // 2. GEMINI API VARSA (Çok daha kişiselleştirilmiş derin soru üretir)
  const apiKey =
    (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
    "";

  if (apiKey) {
    try {
      const prompt = `Sen viral ve entelektüel bir Instagram Reels içerik stratejistisin.
Şu alıntı için Instagram Reels açıklaması yazacaksın:
Söz: "${quote}"
Yazar: "${cleanAuthor}"
Kategori: "${cleanCat}"

KRİTİK KURALLAR:
1. SÖZÜ AÇIKLAMAYA ASLA YAZMA! Videoda zaten okunuyor.
2. ${baslikSatiri ? `İlk satır yazar bilgisi olsun: "${baslikSatiri}". Eser adı yazma.` : "Yazar satırı yazma."} (Asla kategori adı ekleme).
3. Açıklamada, başta veya sonda ASLA (Sanat), (Gündem), (Felsefe) gibi kategori ibaresi YAZMA!
4. İkinci kısım: İzleyiciyi düşündüren, yorumlarda tartışma başlatacak ÇOK ÇARPICI, derin ve merak uyandırıcı 1-2 cümlelik bir soru sor (Bu soru söze ve kategoriye tam uysun).
5. Üçüncü kısım tam olarak şu satır: "${cta.text}"
6. Dördüncü kısım: 6-8 adet çok odaklı hashtag (Sözle, yazarla ve kategoriyle ilgili, en sonda #mevzu).

7. Soru bu söze özel olsun, şu son açıklamalardaki soruları tekrar etme:
${recentCaptions.slice(0, 10).join("\n---\n") || "(yok)"}

Sadece doğrudan Instagram'a yapıştırılacak nihai metni döndür.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.75,
              maxOutputTokens: 350,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const gen = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (gen && gen.trim()) {
          return gen.trim();
        }
      } else {
        console.warn(`Gemini yanıt vermedi (HTTP ${res.status}), yerel şablona geçiliyor.`);
      }
    } catch (e) {
      console.warn("Gemini API çağrısı yapılamadı, akıllı şablon motoruna geçiliyor:", e.message);
    }
  }

  // 3. AKILLI YEREL ŞABLON MOTORU (FALLBACK / OFFLINE)
  // Sözdeki veya kategorideki anahtar kelimelere göre en uygun soru kümesini bul
  let matchedCatKey = "FELSEFE";
  for (const catKey of Object.keys(CATEGORY_QUESTIONS)) {
    if (cleanCat.includes(catKey) || quote.toUpperCase().includes(catKey)) {
      matchedCatKey = catKey;
      break;
    }
  }

  const anaHavuz = CATEGORY_QUESTIONS[matchedCatKey] || CATEGORY_QUESTIONS.FELSEFE;
  const tazeSorular = anaHavuz.filter((soru) => !recentCaptions.some((caption) => caption.includes(soru)));
  const soruHavuzu = tazeSorular.length ? tazeSorular : anaHavuz;
  const secilenSoru = soruHavuzu[Math.floor(Math.random() * soruHavuzu.length)];

  const allTags = buildHashtags({ quote, author: cleanAuthor, recentCaptions });

  return `${baslikSatiri ? `${baslikSatiri}\n\n` : ""}${secilenSoru}\n\nDüşünceni yorumlarda belirt 👇\n${cta.text}\n.\n.\n${allTags}`;
}
