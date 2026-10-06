// Embeddings de juguete en 3D con estructura semántica coherente.

export type V3 = [number, number, number];

export interface Word {
  w: string;
  cluster: string;
  v: V3;
}

export const CLUSTERS: Record<string, { label: string; color: string }> = {
  animales: { label: "Animales", color: "#D97757" },
  comida: { label: "Comida", color: "#E3C77B" },
  paises: { label: "Países", color: "#6A9BCC" },
  verbos: { label: "Verbos", color: "#788C5D" },
  colores: { label: "Colores", color: "#C46686" },
  personas: { label: "Personas y realeza", color: "#9B87C9" },
};

// PRNG determinista (mulberry32)
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const plus = (a: V3, b: V3): V3 => add(a, b);

const R = rng(7);
const jit = (s: number): V3 => [(R() - 0.5) * 2 * s, (R() - 0.5) * 2 * s, (R() - 0.5) * 2 * s];

const groups: [string, V3, string[]][] = [
  ["animales", [4, 3, 1], ["perro", "gato", "caballo", "vaca", "pájaro", "pez"]],
  ["comida", [-4, 2, 3], ["pan", "queso", "manzana", "pizza", "arroz", "sopa"]],
  ["paises", [1, -4, 4], ["España", "México", "Francia", "Chile", "Perú", "Italia"]],
  ["verbos", [3, -3, -4], ["correr", "saltar", "comer", "dormir", "hablar", "jugar"]],
  ["colores", [-3, -4, -2], ["rojo", "azul", "verde", "amarillo"]],
];

// Personas: centro + género (g) + realeza (r) + juventud (y). Las diferencias son vectores consistentes.
const P: V3 = [-4, 1, -4];
const G: V3 = [0, 0, 1.3];
const ROY: V3 = [-1, 2.2, 0.4];
const YOU: V3 = [1.6, -1.4, 0];
const J = 0.1;

const person = (name: string, g: number, roy: number, you: number): Word => ({
  w: name,
  cluster: "personas",
  v: add(add(add(add(P, G, g), ROY, roy), YOU, you), jit(J)),
});

export const WORDS: Word[] = [
  ...groups.flatMap(([cluster, c, ws]) => ws.map((w) => ({ w, cluster, v: add(c, jit(0.9)) }))),
  person("hombre", 1, 0, 0),
  person("mujer", -1, 0, 0),
  person("niño", 1, 0, 1),
  person("niña", -1, 0, 1),
  person("rey", 1, 1, 0),
  person("reina", -1, 1, 0),
  person("príncipe", 1, 1, 0.8),
  person("princesa", -1, 1, 0.8),
];

export const byWord = (w: string) => WORDS.find((x) => x.w === w)!;

export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a: V3) => Math.sqrt(dot(a, a));
export const cosine = (a: V3, b: V3) => dot(a, b) / (norm(a) * norm(b) || 1);

/** Palabras más cercanas por similitud coseno */
export function nearest(v: V3, k = 5, exclude: string[] = []) {
  return WORDS.filter((x) => !exclude.includes(x.w))
    .map((x) => ({ w: x.w, cos: cosine(v, x.v) }))
    .sort((a, b) => b.cos - a.cos)
    .slice(0, k);
}

export const ANALOGIES: { a: string; b: string; c: string; expect: string }[] = [
  { a: "rey", b: "hombre", c: "mujer", expect: "reina" },
  { a: "reina", b: "mujer", c: "hombre", expect: "rey" },
  { a: "príncipe", b: "hombre", c: "mujer", expect: "princesa" },
  { a: "niño", b: "hombre", c: "mujer", expect: "niña" },
];
