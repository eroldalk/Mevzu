// src/utils/captionGenerator.js
// Instagram Reels Açıklama (Caption) & Hashtag Motoru
// Sözü ekrana yazmaz! 4 Parçalı Formül:
// 1. Yazar — Eser / Konu
// 2. Yorum Getiren Düşündürücü Soru
// 3. Kaydet & Yorum Çağrısı (CTA)
// 4. 6-8 Odaklı Viral Hashtag

// Bilinen yazar - eser eşleşmeleri tablosu
const KNOWN_AUTHORS_WORKS = {
  "niccolò machiavelli": "Prens",
  "machiavelli": "Prens",
  "marcus aurelius": "Kendime Düşünceler",
  "seneca": "Yaşamın Kısalığı Üzerine",
  "epiktetos": "El Kitabı (Enkheiridion)",
  "friedrich nietzsche": "İyinin ve Kötünün Ötesinde",
  "nietzsche": "Böyle Buyurdu Zerdüşt",
  "arthur schopenhauer": "Yaşam Bilgeliği Üzerine",
  "schopenhauer": "İsteme ve Tasarım Olarak Dünya",
  "platon": "Devlet",
  "aristoteles": "Nikomakhos'a Etik",
  "sun tzu": "Savaş Sanatı",
  "montaigne": "Denemeler",
  "lao tzu": "Tao Te Ching",
  "mevlana": "Mesnevi",
  "rumi": "Mesnevi",
  "fyodor dostoyevski": "Karamazov Kardeşler",
  "dostoyevski": "Yeraltından Notlar",
  "franz kafka": "Dönüşüm",
  "albert camus": "Yabancı",
  "emil cioran": "Çürümenin Kitabı",
  "publilius syrus": "Özdeyişler",
  "ömer hayyam": "Rubailer",
};

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

// Kategoriye ve yazara özel hashtag haritası
const AUTHOR_HASHTAGS = {
  "niccolò machiavelli": ["#machiavelli", "#prens", "#güç", "#strateji", "#liderlik"],
  "machiavelli": ["#machiavelli", "#prens", "#güç", "#strateji", "#liderlik"],
  "marcus aurelius": ["#marcusaurelius", "#kendimedüşünceler", "#stoacılık", "#içhuzur"],
  "seneca": ["#seneca", "#yaşamınkısalığı", "#stoacılık", "#zaman"],
  "epiktetos": ["#epiktetos", "#stoa", "#özgürlük", "#zihingücü"],
  "nietzsche": ["#nietzsche", "#felsefe", "#böylebuyurduzerdüşt", "#güçistenci"],
  "schopenhauer": ["#schopenhauer", "#pesimizm", "#yaşambilgeliği", "#derindüşünce"],
  "sun tzu": ["#suntzu", "#savaşsanatı", "#strateji", "#zafer"],
};

const CATEGORY_HASHTAGS = {
  GÜÇ: ["#liderlik", "#güç", "#strateji", "#psikoloji", "#etki"],
  STRATEJİ: ["#strateji", "#vizyon", "#başarı", "#karar", "#hedef"],
  STOACILIK: ["#stoacılık", "#stoic", "#içhuzur", "#disiplin", "#bilgelik"],
  FELSEFE: ["#felsefe", "#düşünce", "#farkındalık", "#anlam", "#sorgulama"],
  ZİHİN: ["#psikoloji", "#zihinyapısı", "#kişiselgelişim", "#farkındalık"],
  DİRENÇ: ["#motivasyon", "#direnç", "#güçlüol", "#vazgeçme", "#azim"],
  ZAMAN: ["#zaman", "#zamanidare", "#yaşam", "#farkındalık"],
  FİNANS: ["#finans", "#vizyon", "#yatırım", "#başarı", "#finansalözgürlük"],
};

export async function generateInstagramCaption({
  quote = "",
  author = "Mevzu",
  category = "FELSEFE",
}) {
  const cleanAuthor = (author || "Mevzu").trim();
  const cleanCat = (category || "FELSEFE").trim().toUpperCase();

  // 1. YAZAR & ESER BİLGİSİ
  const authorKey = cleanAuthor.toLowerCase();
  const knownWork = KNOWN_AUTHORS_WORKS[authorKey];
  const baslikSatiri = knownWork
    ? `${cleanAuthor} — ${knownWork} (${cleanCat}).`
    : `${cleanAuthor} (${cleanCat}).`;

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
2. İlk satır yazar ve eser bilgisi olsun: "${baslikSatiri}"
3. İkinci kısım: İzleyiciyi düşündüren, yorumlarda tartışma başlatacak ÇOK ÇARPICI, derin ve merak uyandırıcı 1-2 cümlelik bir soru sor (Bu soru söze ve kategoriye tam uysun).
4. Üçüncü kısım: "Düşünceni yorumlarda belirt 👇\\nKendine hatırlatmak için kaydetmeyi unutma 📌"
5. Dördüncü kısım: 6-8 adet çok odaklı hashtag (Sözle, yazarla ve kategoriyle ilgili, en sonda #mevzu).

Sadece doğrudan Instagram'a yapıştırılacak nihai metni döndür.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

  const soruHavuzu = CATEGORY_QUESTIONS[matchedCatKey] || CATEGORY_QUESTIONS.FELSEFE;
  const secilenSoru = soruHavuzu[Math.floor(Math.random() * soruHavuzu.length)];

  // Hashtag kümesini oluştur
  const yazarTags = AUTHOR_HASHTAGS[authorKey] || [`#${authorKey.replace(/[^a-z0-9]/g, "")}`];
  const catTags = CATEGORY_HASHTAGS[matchedCatKey] || ["#felsefe", "#düşünce", "#farkındalık"];
  const allTags = Array.from(new Set([...yazarTags, ...catTags, "#felsefe", "#mevzu"]))
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");

  return `${baslikSatiri}

${secilenSoru}

Düşünceni yorumlarda belirt 👇
Kendine hatırlatmak için kaydet 📌
.
.
${allTags}`;
}
