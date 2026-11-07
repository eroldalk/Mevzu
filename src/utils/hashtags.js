// Hashtag'leri sözün konusuna göre seçer; genel etiketler her gönderide değişir.

const MAX_TAGS = 8;
const GENERAL_COUNT = 3;
const BRAND_TAG = "#mevzu";

// Sözde geçen kelimeye göre konu etiketleri
const TOPIC_TAGS = [
  [/sab[ıi]r|sabre/, ["#sabır", "#sabret"]],
  [/umut|hayır|hayir|dua/, ["#umut", "#hayırlısı"]],
  [/aşk|ask|sev/, ["#aşk", "#sevgi"]],
  [/özle|hasret|veda|ayrıl/, ["#özlem", "#hasret"]],
  [/dost|arkadaş/, ["#dostluk", "#arkadaşlık"]],
  [/kalp|kalbin|gönül/, ["#gönül", "#kalp"]],
  [/yalnız/, ["#yalnızlık"]],
  [/kırgın|kırıl|incin/, ["#kırgınlık"]],
  [/mutlu/, ["#mutluluk"]],
  [/zaman|gün|yarın|ömür/, ["#zaman", "#ömür"]],
  [/hayat|yaşa/, ["#hayat", "#yaşam"]],
  [/başar|hedef|disiplin/, ["#başarı", "#disiplin", "#hedef"]],
  [/güç|cesaret|savaş|mücadele/, ["#güç", "#cesaret"]],
  [/bilge|bilgi|akıl|düşün/, ["#bilgelik", "#düşünce"]],
  [/özgür/, ["#özgürlük"]],
  [/para|zengin|tasarruf|yatırım/, ["#para", "#finans"]],
  [/doğa|toprak|ağaç|deniz|yağmur/, ["#doğa"]],
  [/pişman|hata/, ["#pişmanlık"]],
  [/insan/, ["#insan"]],
];

const GENERAL_TAGS = [
  "#sözler", "#anlamlısözler", "#güzelsözler", "#gününsözü", "#özlüsözler",
  "#alıntı", "#felsefe", "#farkındalık", "#hayatdersleri", "#kendinehatırlat",
];

const toTag = (name) => `#${name.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}]/gu, "")}`;

const shuffle = (items, random) => [...items].sort(() => random() - 0.5);

const tagsIn = (caption = "") => caption.match(/#[\p{L}\p{N}_]+/gu) || [];

export function buildHashtags({ quote = "", author = "", recentCaptions = [], random = Math.random }) {
  const text = quote.toLocaleLowerCase("tr-TR");
  const topicTags = TOPIC_TAGS.filter(([pattern]) => pattern.test(text)).flatMap(([, tags]) => tags);

  const cleanAuthor = author.trim();
  const authorTags = cleanAuthor && cleanAuthor.toLocaleLowerCase("tr-TR") !== "mevzu" ? [toTag(cleanAuthor)] : [];

  // Son gönderide kullanılan genel etiketler bu sefer seçilmez
  const lastTags = new Set(tagsIn(recentCaptions[0]));
  const freshGeneral = GENERAL_TAGS.filter((tag) => !lastTags.has(tag));
  const general = shuffle(freshGeneral.length >= GENERAL_COUNT ? freshGeneral : GENERAL_TAGS, random);

  const room = MAX_TAGS - 1 - authorTags.length;
  const picked = [...new Set([...shuffle(topicTags, random).slice(0, room - GENERAL_COUNT), ...general])].slice(0, room);
  return [...authorTags, ...picked, BRAND_TAG].join(" ");
}
