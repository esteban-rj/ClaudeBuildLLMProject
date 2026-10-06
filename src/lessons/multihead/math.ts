// Cálculos reales para la lección de multi-head y posición.
export const softmax = (xs: number[]): number[] => {
  const m = Math.max(...xs);
  const ex = xs.map((x) => Math.exp(x - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
};

export const SENTENCE = ["Ana", "dijo", "que", "ella", "compró", "pan", "."];

export interface HeadDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  desc: string;
  /** logits (puntuaciones Q·K ya escaladas) de la fila i hacia la columna j */
  logit: (i: number, j: number) => number;
}

const SUBJ = 0;
const COREF = 3;
const VERBS = [1, 4];
const N = SENTENCE.length;

export const HEADS: HeadDef[] = [
  {
    id: "prev", name: "Token anterior", emoji: "⬅️", color: "#6A9BCC",
    desc: "Cada palabra mira a la que tiene justo detrás. Útil para frases hechas y gramática local.",
    logit: (i, j) => (j === Math.max(0, i - 1) ? 3.2 : j === i ? 0.4 : -0.5 * Math.abs(i - j)),
  },
  {
    id: "sv", name: "Sujeto-verbo", emoji: "🔗", color: "#D97757",
    desc: "Los verbos buscan a su sujeto: «dijo» mira a «Ana» y «compró» mira a «ella».",
    logit: (i, j) => {
      if (VERBS.includes(i)) {
        const subj = i === 1 ? SUBJ : COREF;
        return j === subj ? 3.4 : j === i ? 0.3 : -0.3;
      }
      if ((i === SUBJ || i === COREF) && VERBS.includes(j)) return j === (i === SUBJ ? 1 : 4) ? 1.8 : 0.2;
      return j === i ? 1.2 : 0;
    },
  },
  {
    id: "coref", name: "Correferencia", emoji: "🪞", color: "#C46686",
    desc: "Los pronombres buscan a quién se refieren: «ella» mira a «Ana». El resto se queda en sí mismo.",
    logit: (i, j) => {
      if (i === COREF) return j === SUBJ ? 3.6 : j === i ? 0.5 : -0.2;
      return j === i ? 2.4 : -0.3;
    },
  },
  {
    id: "start", name: "Inicio / puntuación", emoji: "📍", color: "#788C5D",
    desc: "Casi todos miran al primer token y al punto: son «descansaderos» donde la cabeza deja atención sobrante.",
    logit: (_i, j) => (j === 0 ? 2.6 : j === N - 1 ? 2.0 : 0),
  },
];

export const headMatrix = (h: HeadDef, temp = 1): number[][] =>
  SENTENCE.map((_, i) => softmax(SENTENCE.map((__, j) => h.logit(i, j) / temp)));

// ---------- Posición ----------
/** Codificación sinusoidal del paper original. */
export const pe = (pos: number, dim: number, dModel: number) => {
  const i = Math.floor(dim / 2);
  const angle = pos / Math.pow(10000, (2 * i) / dModel);
  return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
};
export const peVec = (pos: number, dModel: number) => Array.from({ length: dModel }, (_, d) => pe(pos, d, dModel));

export const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

/** Embeddings de juguete (d=4) para la demo de orden. */
export const EMB: Record<string, number[]> = {
  perro: [1.0, 0.2, 0.1, 0.0],
  muerde: [0.1, 1.0, 0.3, 0.2],
  hombre: [0.9, 0.0, 0.2, 0.4],
};

/** Auto-atención sin proyecciones (Q=K=V=x) sobre una frase; devuelve la salida de cada token. */
export function selfAttend(words: string[], withPos: boolean): number[][] {
  const x = words.map((w, p) => EMB[w].map((v, d) => v + (withPos ? 0.6 * pe(p, d, 4) : 0)));
  return x.map((q) => {
    const w = softmax(x.map((k) => dot(q, k) / 2));
    return q.map((_, d) => w.reduce((s, wj, j) => s + wj * x[j][d], 0));
  });
}

/** RoPE en 2D: rotar un vector (x,y) un ángulo. */
export const rot = (v: [number, number], a: number): [number, number] => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
