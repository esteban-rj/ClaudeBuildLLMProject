// Matemáticas del muestreo y un mini modelo de lenguaje (bigramas/trigramas) hecho a mano.

export function softmaxT(logits: number[], T = 1): number[] {
  const t = Math.max(T, 0.01);
  const s = logits.map((l) => l / t);
  const m = Math.max(...s);
  const e = s.map((x) => Math.exp(x - m));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / sum);
}

export function entropyBits(p: number[]): number {
  return -p.reduce((a, x) => (x > 0 ? a + x * Math.log2(x) : a), 0);
}

/** Muestrea un índice según probabilidades (u en [0,1)) */
export function sampleIndex(p: number[], u: number): number {
  let c = 0;
  for (let i = 0; i < p.length; i++) {
    c += p[i];
    if (u < c) return i;
  }
  return p.length - 1;
}

export interface Filtered {
  /** Índices ordenados de mayor a menor probabilidad */
  order: number[];
  status: ("kept" | "k" | "p")[];
  final: number[];
}

/** top-k y luego top-p (nucleus), con renormalización */
export function applyTopKP(probs: number[], k: number, p: number): Filtered {
  const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
  const status: ("kept" | "k" | "p")[] = order.map(() => "kept");
  order.forEach((_, r) => {
    if (r >= k) status[r] = "k";
  });
  const sumK = order.reduce((a, idx, r) => (status[r] === "kept" ? a + probs[idx] : a), 0);
  let cum = 0;
  let reached = false;
  order.forEach((idx, r) => {
    if (status[r] !== "kept") return;
    if (reached) {
      status[r] = "p";
      return;
    }
    cum += probs[idx] / sumK;
    if (cum >= p) reached = true;
  });
  const sumF = order.reduce((a, idx, r) => (status[r] === "kept" ? a + probs[idx] : a), 0);
  const final = probs.map(() => 0);
  order.forEach((idx, r) => {
    if (status[r] === "kept") final[idx] = probs[idx] / sumF;
  });
  return { order, status, final };
}

/* ---------- Mini modelo de lenguaje ---------- */
type Table = Record<string, Record<string, number>>;

const BI: Table = {
  un: { rey: 5, niño: 4, dragón: 3, gato: 3, lobo: 2, pueblo: 2 },
  una: { princesa: 4, casa: 3, niña: 3, bruja: 2 },
  el: { gato: 4, rey: 3, dragón: 2, niño: 3, bosque: 2 },
  la: { princesa: 4, luna: 3, casa: 3, bruja: 2 },
  Érase: { una: 1 },
  vez: { un: 6, una: 4 },
  Mi: { casa: 3, gato: 4, rey: 1 },
  rey: { vivía: 4, era: 3, que: 3, tenía: 2, ".": 1 },
  niño: { vivía: 3, era: 3, que: 3, se: 3, ".": 1 },
  niña: { vivía: 3, era: 3, que: 3, se: 3, ".": 1 },
  dragón: { era: 4, vivía: 3, que: 3, tenía: 2, ".": 1 },
  gato: { era: 4, se: 4, vivía: 2, que: 2, ".": 1 },
  lobo: { era: 3, vivía: 4, que: 3, ".": 1 },
  pueblo: { era: 3, tenía: 3, que: 2, ".": 3 },
  princesa: { vivía: 3, era: 4, que: 3, se: 3, ".": 1 },
  bruja: { vivía: 3, era: 4, que: 3, tenía: 2, ".": 1 },
  casa: { era: 4, tenía: 3, que: 2, ".": 3 },
  luna: { era: 3, tenía: 2, ".": 4, que: 2 },
  bosque: { era: 3, tenía: 3, ".": 4, que: 2 },
  vivía: { en: 6, solo: 2, feliz: 3 },
  era: { muy: 5, un: 2, el: 1, feliz: 2 },
  estaba: { muy: 4, en: 3, triste: 2 },
  tenía: { un: 3, mucho: 3, miedo: 2 },
  mucho: { miedo: 3, frío: 2, ".": 1 },
  miedo: { ".": 5, y: 2, ",": 2 },
  frío: { ".": 5, y: 2 },
  se: { llamaba: 5, fue: 2, comió: 2 },
  llamaba: { Lola: 3, Pedro: 3, Clawd: 1 },
  Lola: { ".": 5, y: 2, ",": 2 },
  Pedro: { ".": 5, y: 2, ",": 2 },
  Clawd: { ".": 5, y: 2 },
  fue: { a: 5 },
  a: { la: 4, el: 3, un: 2 },
  comió: { un: 3, el: 2, la: 1, pizza: 2 },
  pizza: { ".": 5, y: 2 },
  en: { un: 4, el: 3, la: 4, una: 2 },
  muy: { feliz: 4, grande: 3, viejo: 2, valiente: 3, triste: 2 },
  feliz: { ".": 5, y: 3, ",": 1 },
  grande: { ".": 5, y: 3, ",": 1 },
  viejo: { ".": 5, y: 3, ",": 1 },
  valiente: { ".": 5, y: 3, ",": 1 },
  triste: { ".": 5, y: 3, ",": 1 },
  pequeño: { ".": 3, y: 2, feliz: 1 },
  solo: { ".": 4, y: 2, ",": 1 },
  y: { se: 3, muy: 3, era: 2, estaba: 2 },
  ",": { pero: 3, y: 3 },
  pero: { nunca: 3, siempre: 2, era: 2 },
  nunca: { tenía: 3, estaba: 2 },
  siempre: { tenía: 3, estaba: 3 },
  que: { vivía: 4, tenía: 3, era: 2 },
};

const TRI: Table = {
  "una vez": { un: 8, una: 3 },
  "vez un": { rey: 4, niño: 3, dragón: 3, lobo: 2, gato: 2, pueblo: 1 },
  "vez una": { princesa: 4, bruja: 3, niña: 3 },
  "se llamaba": { Lola: 3, Pedro: 3, Clawd: 1 },
  "un pueblo": { pequeño: 4, que: 2, ".": 1, era: 2 },
  "en un": { pueblo: 4, bosque: 3, castillo: 2 },
  "en el": { bosque: 4, pueblo: 3 },
  "en la": { casa: 3, luna: 1, ciudad: 2 },
};
BI.castillo = { era: 3, tenía: 3, ".": 4, que: 2 };
BI.ciudad = { era: 3, tenía: 2, ".": 4 };

export const START_PROMPTS: { label: string; tokens: string[] }[] = [
  { label: "Érase una vez un", tokens: ["Érase", "una", "vez", "un"] },
  { label: "El gato", tokens: ["El", "gato"] },
  { label: "Mi", tokens: ["Mi"] },
];

/** Distribución (conteos) del siguiente token según los dos últimos */
export function nextCounts(tokens: string[]): { words: string[]; counts: number[]; kind: "trigrama" | "bigrama" } {
  const n = tokens.length;
  const last = tokens[n - 1];
  const tri = n >= 2 ? TRI[`${tokens[n - 2]} ${last}`] : undefined;
  const table = tri && Object.keys(tri).length ? tri : BI[last] ?? BI[last.toLowerCase()] ?? { ".": 1 };
  const words = Object.keys(table).sort((a, b) => table[b] - table[a]);
  return { words, counts: words.map((w) => table[w]), kind: tri ? "trigrama" : "bigrama" };
}

export const WORD_COLORS = ["#D97757", "#6A9BCC", "#9DB37E", "#E3C77B", "#C46686", "#A58BD6", "#7FD1C1", "#E8A387", "#8A8A85", "#F0EEE6", "#788C5D", "#b08968"];
