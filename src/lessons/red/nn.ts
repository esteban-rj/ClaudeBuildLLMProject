// Mini red neuronal real (MLP) con backprop: tanh en capas ocultas, sigmoide en la salida.
import { mulberry32 } from "../neurona/math";

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface Mlp {
  sizes: number[];
  /** W[l][j][i]: peso de la neurona i de la capa l a la neurona j de la capa l+1 */
  W: number[][][];
  B: number[][];
}

export function createMlp(sizes: number[], seed: number): Mlp {
  const rng = mulberry32(seed);
  const W: number[][][] = [];
  const B: number[][] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const scale = Math.sqrt(2 / (sizes[l] + sizes[l + 1])) * 1.8;
    W.push(Array.from({ length: sizes[l + 1] }, () => Array.from({ length: sizes[l] }, () => (rng() * 2 - 1) * scale)));
    B.push(Array.from({ length: sizes[l + 1] }, () => 0));
  }
  return { sizes, W, B };
}

export const countParams = (sizes: number[]) => sizes.slice(1).reduce((acc, n, l) => acc + sizes[l] * n + n, 0);

/** Devuelve las activaciones de todas las capas (la primera es la entrada) */
export function forward(net: Mlp, x: number[]): number[][] {
  const acts: number[][] = [x];
  const last = net.W.length - 1;
  for (let l = 0; l <= last; l++) {
    const prev = acts[l];
    acts.push(
      net.W[l].map((row, j) => {
        const z = row.reduce((s, w, i) => s + w * prev[i], net.B[l][j]);
        return l === last ? sigmoid(z) : Math.tanh(z);
      }),
    );
  }
  return acts;
}

export const predict = (net: Mlp, x: number[]) => forward(net, x)[net.sizes.length - 1][0];

export interface Sample {
  x: number[];
  y: number;
}

/** Un paso de descenso de gradiente (lote completo) con entropía cruzada. Devuelve la pérdida media. */
export function trainStep(net: Mlp, data: Sample[], lr: number): number {
  const L = net.W.length;
  const gW = net.W.map((m) => m.map((r) => r.map(() => 0)));
  const gB = net.B.map((r) => r.map(() => 0));
  let loss = 0;
  for (const { x, y } of data) {
    const acts = forward(net, x);
    const p = acts[L][0];
    loss += -(y * Math.log(p + 1e-9) + (1 - y) * Math.log(1 - p + 1e-9));
    // delta de la salida (sigmoide + entropía cruzada): p - y
    let delta = [p - y];
    for (let l = L - 1; l >= 0; l--) {
      for (let j = 0; j < net.W[l].length; j++) {
        gB[l][j] += delta[j];
        for (let i = 0; i < net.W[l][j].length; i++) gW[l][j][i] += delta[j] * acts[l][i];
      }
      if (l > 0) {
        const next = acts[l].map((a, i) => {
          let s = 0;
          for (let j = 0; j < net.W[l].length; j++) s += net.W[l][j][i] * delta[j];
          return s * (1 - a * a); // derivada de tanh
        });
        delta = next;
      }
    }
  }
  const n = data.length;
  for (let l = 0; l < L; l++)
    for (let j = 0; j < net.W[l].length; j++) {
      net.B[l][j] -= (lr * gB[l][j]) / n;
      for (let i = 0; i < net.W[l][j].length; i++) net.W[l][j][i] -= (lr * gW[l][j][i]) / n;
    }
  return loss / n;
}

export function accuracyOf(net: Mlp, data: Sample[]) {
  return data.filter((d) => (predict(net, d.x) >= 0.5 ? 1 : 0) === d.y).length / data.length;
}
