// Matemática real de la self-attention con vectores pequeños (d = 4).
// Todo se calcula aquí: nada de números inventados en la UI.

export type Vec = number[];
export type Mat = number[][];

export const TOKENS = ["El", "gato", "no", "cruzó", "la", "calle", "porque", "estaba", "cansado"];

/** Significado (aproximado) de cada dimensión del embedding de juguete */
export const DIMS = ["ser vivo", "lugar/objeto", "acción/estado", "palabra funcional"];

/** Embeddings de entrada X (N × 4). Cada fila es un token. */
export const X: Mat = [
  [0.1, 0.1, 0.0, 1.0], // El
  [1.0, 0.1, 0.1, 0.1], // gato
  [0.0, 0.0, 0.4, 0.9], // no
  [0.2, 0.3, 1.0, 0.1], // cruzó
  [0.0, 0.2, 0.0, 1.0], // la
  [0.1, 1.0, 0.1, 0.1], // calle
  [0.0, 0.0, 0.2, 1.0], // porque
  [0.1, 0.0, 0.9, 0.3], // estaba
  [0.2, 0.0, 0.8, 0.1], // cansado
];

/**
 * W_Q: convierte "lo que soy" en "lo que busco".
 * Un verbo/estado (dim 2) busca un ser vivo (sujeto) → columna 0.
 */
export const WQ: Mat = [
  [0.0, 0.2, 1.2, 0.0],
  [0.0, 0.0, 0.8, 0.0],
  [3.4, 0.5, 0.0, 0.0],
  [0.4, 0.4, 0.4, 0.6],
];

/** W_K: convierte "lo que soy" en "la etiqueta que anuncio". */
export const WK: Mat = [
  [2.0, 0.0, 0.2, 0.0],
  [0.0, 2.0, 0.0, 0.0],
  [0.0, 0.0, 2.0, 0.0],
  [0.0, 0.0, 0.0, 1.2],
];

/** W_V: convierte "lo que soy" en "la información que entrego". */
export const WV: Mat = [
  [1.0, 0.0, 0.3, 0.0],
  [0.0, 1.0, 0.0, 0.2],
  [0.2, 0.0, 1.0, 0.0],
  [0.0, 0.1, 0.0, 0.5],
];

export const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);

/** Vector fila × matriz: (1×d)·(d×d) */
export const vecMat = (v: Vec, m: Mat): Vec => m[0].map((_, j) => v.reduce((s, vi, i) => s + vi * m[i][j], 0));

export const matMul = (a: Mat, b: Mat): Mat => a.map((row) => vecMat(row, b));

export function softmax(xs: number[]): number[] {
  const finite = xs.filter((x) => Number.isFinite(x));
  const max = finite.length ? Math.max(...finite) : 0;
  const ex = xs.map((x) => (Number.isFinite(x) ? Math.exp(x - max) : 0));
  const sum = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / sum);
}

export const Q = matMul(X, WQ);
export const K = matMul(X, WK);
export const V = matMul(X, WV);
export const DK = 4;

export interface RowCalc {
  raw: number[]; // q·k
  scaled: number[]; // q·k / (√d_k · T)
  weights: number[]; // softmax
  out: Vec; // Σ w_j v_j
}

/** Calcula la atención del token i contra todos. temp=1 es la atención estándar. */
export function attendRow(i: number, temp = 1, causal = false): RowCalc {
  const raw = K.map((k) => dot(Q[i], k));
  const scaled = raw.map((r, j) => (causal && j > i ? -Infinity : r / (Math.sqrt(DK) * temp)));
  const weights = softmax(scaled);
  const out = V[0].map((_, d) => weights.reduce((s, w, j) => s + w * V[j][d], 0));
  return { raw, scaled, weights, out };
}

export function attentionMatrix(causal = false, temp = 1): Mat {
  return TOKENS.map((_, i) => attendRow(i, temp, causal).weights);
}

export const fmt = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "−∞");
