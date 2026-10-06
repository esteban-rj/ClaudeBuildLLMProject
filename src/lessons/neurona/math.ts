// Matemática real de la neurona: activaciones, datos de ejemplo y precisión.

export type ActName = "escalon" | "sigmoide" | "relu" | "tanh";

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface ActInfo {
  label: string;
  formula: string;
  fn: (z: number) => number;
  /** Rango vertical para dibujarla */
  range: [number, number];
  desc: string;
}

export const ACTS: Record<ActName, ActInfo> = {
  escalon: {
    label: "Escalón",
    formula: "f(z) = 1 si z ≥ 0, si no 0",
    fn: (z) => (z >= 0 ? 1 : 0),
    range: [-0.3, 1.3],
    desc: "Todo o nada, como una neurona biológica que dispara o no. Era la del perceptrón original (1958). Problema: es plana, así que no sirve para aprender con gradientes.",
  },
  sigmoide: {
    label: "Sigmoide",
    formula: "f(z) = 1 / (1 + e^(−z))",
    fn: sigmoid,
    range: [-0.3, 1.3],
    desc: "Un escalón suavizado: aplasta cualquier número entre 0 y 1. Perfecta para leer la salida como una probabilidad («73% seguro de que sí»).",
  },
  relu: {
    label: "ReLU",
    formula: "f(z) = max(0, z)",
    fn: (z) => Math.max(0, z),
    range: [-1, 6.5],
    desc: "Si es negativo, cero; si es positivo, lo deja pasar tal cual. Facilísima de calcular y la favorita de las redes modernas. Los transformers usan primas suyas (GELU, SwiGLU).",
  },
  tanh: {
    label: "Tanh",
    formula: "f(z) = (e^z − e^(−z)) / (e^z + e^(−z))",
    fn: Math.tanh,
    range: [-1.3, 1.3],
    desc: "Como la sigmoide pero centrada en cero: va de −1 a 1. Útil cuando queremos salidas positivas y negativas.",
  },
};

export const ACT_ORDER: ActName[] = ["escalon", "sigmoide", "relu", "tanh"];

/** PRNG determinista (así los puntos no cambian entre renders) */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Pt {
  x: number;
  y: number;
  label: 0 | 1;
}

function gauss(rng: () => number) {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Dos nubes de puntos separables por una recta */
export function makeBlobs(seed: number, c1: [number, number], c0: [number, number], n = 20, sd = 0.7): Pt[] {
  const rng = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: clamp(c1[0] + gauss(rng) * sd, -2.9, 2.9), y: clamp(c1[1] + gauss(rng) * sd, -2.9, 2.9), label: 1 });
    pts.push({ x: clamp(c0[0] + gauss(rng) * sd, -2.9, 2.9), y: clamp(c0[1] + gauss(rng) * sd, -2.9, 2.9), label: 0 });
  }
  return pts;
}

/** XOR: clase 1 en las esquinas donde x e y tienen signo distinto */
export function makeXor(seed: number, perCorner = 8): Pt[] {
  const rng = mulberry32(seed);
  const corners: [number, number][] = [[-1.5, -1.5], [1.5, 1.5], [-1.5, 1.5], [1.5, -1.5]];
  const pts: Pt[] = [];
  for (const [cx, cy] of corners) {
    for (let i = 0; i < perCorner; i++) {
      pts.push({ x: clamp(cx + gauss(rng) * 0.45, -2.9, 2.9), y: clamp(cy + gauss(rng) * 0.45, -2.9, 2.9), label: cx * cy < 0 ? 1 : 0 });
    }
  }
  return pts;
}

export const predict = (p: { x: number; y: number }, w1: number, w2: number, b: number) => sigmoid(w1 * p.x + w2 * p.y + b);

export function accuracy(pts: Pt[], w1: number, w2: number, b: number) {
  let ok = 0;
  for (const p of pts) if ((w1 * p.x + w2 * p.y + b >= 0 ? 1 : 0) === p.label) ok++;
  return ok / pts.length;
}

/** Búsqueda exhaustiva de la mejor recta posible (para demostrar el límite de XOR) */
export function bestLine(pts: Pt[]) {
  let best = { acc: 0, w1: 0, w2: 0, b: 0 };
  for (let a = 0; a < 360; a += 3) {
    const w1 = Math.cos((a * Math.PI) / 180) * 2;
    const w2 = Math.sin((a * Math.PI) / 180) * 2;
    for (let b = -6; b <= 6; b += 0.25) {
      const acc = accuracy(pts, w1, w2, b);
      if (acc > best.acc) best = { acc, w1, w2, b };
    }
  }
  return best;
}
