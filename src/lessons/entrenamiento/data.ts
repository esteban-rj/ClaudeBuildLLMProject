// Datos y matemáticas compartidas de la lección "entrenamiento".

export interface Point {
  x: number;
  y: number;
}

/** 12 puntos "medidos" (horas de estudio → nota). Siguen aprox. y ≈ 0.85x + 1.2 con ruido. */
export const POINTS: Point[] = [
  { x: 0.5, y: 1.6 },
  { x: 1.2, y: 2.9 },
  { x: 2.0, y: 2.7 },
  { x: 2.8, y: 4.1 },
  { x: 3.5, y: 3.9 },
  { x: 4.1, y: 5.2 },
  { x: 5.0, y: 5.0 },
  { x: 5.6, y: 6.4 },
  { x: 6.3, y: 6.2 },
  { x: 7.1, y: 7.5 },
  { x: 7.9, y: 7.4 },
  { x: 8.6, y: 8.9 },
];

/** Error cuadrático medio de la recta y = m·x + b sobre un conjunto de puntos */
export function mse(m: number, b: number, pts: Point[] = POINTS) {
  let s = 0;
  for (const p of pts) {
    const e = m * p.x + b - p.y;
    s += e * e;
  }
  return s / pts.length;
}

/** Gradiente del MSE respecto a m y b */
export function mseGrad(m: number, b: number, pts: Point[] = POINTS) {
  let gm = 0;
  let gb = 0;
  for (const p of pts) {
    const e = m * p.x + b - p.y;
    gm += 2 * e * p.x;
    gb += 2 * e;
  }
  return { gm: gm / pts.length, gb: gb / pts.length };
}

/** Solución exacta por mínimos cuadrados (para comparar) */
function leastSquares(pts: Point[]) {
  const n = pts.length;
  const sx = pts.reduce((a, p) => a + p.x, 0);
  const sy = pts.reduce((a, p) => a + p.y, 0);
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  return { m, b, loss: mse(m, b, pts) };
}

export const BEST = leastSquares(POINTS);

export const fmt = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "∞");

// ---------- Paisaje de pérdida 3D ----------
export const LAND = 4.5; // el terreno cubre [-LAND, LAND] en x y z

/** Altura (pérdida) del terreno: un cuenco suave con ondulaciones → varios valles */
export function height(x: number, z: number) {
  return 0.12 * (x * x + z * z) + 0.9 * Math.sin(0.9 * x + 0.5) * Math.cos(0.9 * z);
}

/** Gradiente analítico del terreno */
export function landGrad(x: number, z: number) {
  return {
    gx: 0.24 * x + 0.81 * Math.cos(0.9 * x + 0.5) * Math.cos(0.9 * z),
    gz: 0.24 * z - 0.81 * Math.sin(0.9 * x + 0.5) * Math.sin(0.9 * z),
  };
}

/** Mínimo global aproximado (búsqueda en rejilla) */
export const GLOBAL_MIN = (() => {
  let best = { x: 0, z: 0, h: Infinity };
  for (let x = -LAND; x <= LAND; x += 0.05) {
    for (let z = -LAND; z <= LAND; z += 0.05) {
      const h = height(x, z);
      if (h < best.h) best = { x, z, h };
    }
  }
  return best;
})();
