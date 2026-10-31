// Sözü anlama göre dengeli satırlara böler ve en iri okunabilir yazı boyutunu seçer.

const MAX_FONT_SIZE = 104;
const MIN_FONT_SIZE = 44;
const MAX_LINES = 8;
const TEXT_WIDTH = 920;
const MAX_TEXT_HEIGHT = 760;
const CHAR_WIDTH_RATIO = 0.52;
const LINE_HEIGHT = 1.22;

// Satır sonunda kalınca okumayı aksatan bağlaç ve edatlar
const WEAK_ENDINGS = new Set(["ve", "ile", "ama", "fakat", "ancak", "ya", "veya", "da", "de", "ki", "bir", "bu", "şu", "o", "en", "çok", "her", "için", "gibi", "kadar", "ne", "hem"]);
const WEAK_PENALTY = 900;
const CLAUSE_BONUS = 500;
const SENTENCE_BONUS = 900;

const normalizeWord = (word) => word.toLocaleLowerCase("tr-TR").replace(/[.,;:!?…"“”'’]/g, "");

function lineCost(words, start, end, target) {
  const text = words.slice(start, end).join(" ");
  let cost = (text.length - target) ** 2;
  const last = words[end - 1];
  if (end < words.length) {
    if (/[.!?…]["”]?$/.test(last)) cost -= SENTENCE_BONUS;
    else if (/[,;:]$/.test(last)) cost -= CLAUSE_BONUS;
    if (WEAK_ENDINGS.has(normalizeWord(last))) cost += WEAK_PENALTY;
  }
  return cost;
}

function splitIntoLines(words, lineCount) {
  const n = words.length;
  const target = words.join(" ").length / lineCount;
  const best = Array.from({ length: lineCount + 1 }, () => Array(n + 1).fill(Infinity));
  const prev = Array.from({ length: lineCount + 1 }, () => Array(n + 1).fill(-1));
  best[0][0] = 0;

  for (let k = 1; k <= lineCount; k += 1) {
    for (let end = k; end <= n; end += 1) {
      for (let start = k - 1; start < end; start += 1) {
        if (best[k - 1][start] === Infinity) continue;
        const cost = best[k - 1][start] + lineCost(words, start, end, target);
        if (cost < best[k][end]) { best[k][end] = cost; prev[k][end] = start; }
      }
    }
  }

  const lines = [];
  let end = n;
  for (let k = lineCount; k >= 1; k -= 1) {
    const start = prev[k][end];
    lines.unshift(words.slice(start, end).join(" "));
    end = start;
  }
  return lines;
}

const fontSizeFor = (lines) => {
  const longest = Math.max(...lines.map((line) => line.length));
  const byWidth = TEXT_WIDTH / (longest * CHAR_WIDTH_RATIO);
  const byHeight = MAX_TEXT_HEIGHT / (lines.length * LINE_HEIGHT);
  return Math.floor(Math.min(MAX_FONT_SIZE, byWidth, byHeight));
};

export function layoutQuote(text = "") {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return { lines: [], fontSize: MAX_FONT_SIZE, lineHeight: LINE_HEIGHT };

  let chosen = null;
  for (let lineCount = 1; lineCount <= Math.min(MAX_LINES, words.length); lineCount += 1) {
    const lines = splitIntoLines(words, lineCount);
    const fontSize = fontSizeFor(lines);
    if (!chosen || fontSize > chosen.fontSize) chosen = { lines, fontSize, lineHeight: LINE_HEIGHT };
  }
  return { ...chosen, fontSize: Math.max(MIN_FONT_SIZE, chosen.fontSize) };
}
