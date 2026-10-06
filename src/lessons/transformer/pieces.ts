// Definición de las piezas del transformer (decoder-only, estilo GPT con pre-LayerNorm)
export type Kind = "embed" | "pos" | "ln" | "mha" | "add" | "ffn" | "unembed" | "softmax";

export interface Piece {
  kind: Kind;
  name: string;
  short: string;
  color: string;
  /** Altura de la pieza en la torre 3D */
  h: number;
  /** Explicación cuando el usuario la coloca bien */
  explain: string;
  /** Pista cuando esta es la pieza que toca y el usuario se equivoca */
  hint: string;
  /** Lo que ocurre con la frase cuando pasa por aquí (modo "Encender") */
  flow: string;
}

export const PIECES: Piece[] = [
  {
    kind: "embed", name: "Embedding de tokens", short: "Embedding", color: "#E3C77B", h: 0.45,
    explain: "¡Embedding! Cada token se cambia por un vector de números. En GPT-2 small, 768 números por token.",
    hint: "Lo primero es convertir las palabras en números. ¿Qué pieza hace eso?",
    flow: "6 tokens → 6 vectores de 768 números cada uno (una fila de la tabla de embeddings por token).",
  },
  {
    kind: "pos", name: "Codificación posicional", short: "Posición", color: "#6A9BCC", h: 0.35,
    explain: "Codificación posicional: le sumamos a cada vector una marca de su posición, porque la atención por sí sola no sabe el orden.",
    hint: "Ya tenemos vectores, pero el modelo no sabe en qué orden van las palabras…",
    flow: "A cada vector se le suma su posición (0, 1, 2… 5). Ahora «gato» en la posición 1 no es igual que en la 4.",
  },
  {
    kind: "ln", name: "LayerNorm", short: "LayerNorm", color: "#9DB37E", h: 0.18,
    explain: "LayerNorm: reescala cada vector para que tenga media 0 y varianza 1. Mantiene los números tranquilos y el entrenamiento estable.",
    hint: "Antes de la atención conviene normalizar los vectores para que no se descontrolen.",
    flow: "Cada vector se normaliza: media 0, varianza 1 (y luego un ajuste aprendido).",
  },
  {
    kind: "mha", name: "Multi-Head Attention", short: "Atención", color: "#D97757", h: 0.9,
    explain: "¡Multi-Head Attention, el corazón! Cada token mira a los anteriores y recoge información de ellos, con varias cabezas en paralelo.",
    hint: "Ahora toca que los tokens se miren entre sí. ¡La pieza estrella!",
    flow: "Los tokens se miran: «la» presta mucha atención a «sentó» y «en». 12 cabezas trabajan en paralelo.",
  },
  {
    kind: "add", name: "Suma residual", short: "Suma +", color: "#F0EEE6", h: 0.35,
    explain: "Suma residual: el resultado de la atención se suma al carril central. Es un atajo que conserva la información original.",
    hint: "Tras la atención, hay que sumar su resultado al carril principal…",
    flow: "x = x + Atención(LN(x)). Lo nuevo se suma al carril residual, sin borrar lo anterior.",
  },
  {
    kind: "ln", name: "LayerNorm", short: "LayerNorm", color: "#9DB37E", h: 0.18,
    explain: "Otra LayerNorm: en los transformers modernos (pre-LN) cada subcapa lleva la suya delante.",
    hint: "Antes de la segunda subcapa, otra vez normalizamos.",
    flow: "Normalizamos otra vez antes de la red feed-forward.",
  },
  {
    kind: "ffn", name: "Feed-Forward (MLP)", short: "MLP", color: "#C46686", h: 0.8,
    explain: "Feed-Forward: una red neuronal que procesa cada token por separado. Se expande a 4 veces el tamaño y vuelve. ¡Aquí se guarda mucho conocimiento!",
    hint: "Toca la red que procesa cada token por su cuenta y piensa sobre él.",
    flow: "Cada vector pasa por un MLP: 768 → 3072 → 768. Aquí el modelo «recuerda» que en las alfombras uno se sienta.",
  },
  {
    kind: "add", name: "Suma residual", short: "Suma +", color: "#F0EEE6", h: 0.35,
    explain: "Otra suma residual: el resultado del MLP vuelve al carril central. ¡Bloque transformer completo!",
    hint: "Volvemos a sumar al carril residual.",
    flow: "x = x + MLP(LN(x)). Fin del bloque (en GPT-2 small, este bloque se repite 12 veces).",
  },
  {
    kind: "unembed", name: "Unembedding (Linear)", short: "Unembedding", color: "#A58BD6", h: 0.5,
    explain: "Unembedding: una capa lineal convierte el vector final en una puntuación, un logit, para cada token del vocabulario. ¡50.257 en GPT-2!",
    hint: "El bloque terminó; ahora hay que convertir el vector en puntuaciones para cada palabra del vocabulario.",
    flow: "El vector del último token («la») se multiplica por una matriz 768 × 50.257 → un logit por palabra.",
  },
  {
    kind: "softmax", name: "Softmax", short: "Softmax", color: "#7FD1C1", h: 0.7,
    explain: "Softmax: convierte los logits en probabilidades que suman 1. ¡Torre terminada!",
    hint: "Última pieza: convertir las puntuaciones en probabilidades.",
    flow: "softmax(logits) → probabilidades que suman 1. ¡Ya tenemos la predicción!",
  },
];

export const GAP = 0.2;
/** El carril residual va por delante de la torre */
export const RAIL_Z = 1.75;

export interface Slot {
  x: number;
  y: number;
  z: number;
}

export function computeSlots(): { slots: Slot[]; height: number } {
  let base = 0;
  const slots = PIECES.map((p) => {
    const s = { x: 0, y: base + p.h / 2, z: p.kind === "add" ? RAIL_Z : 0 };
    base += p.h + GAP;
    return s;
  });
  return { slots, height: base - GAP };
}

export const SLOTS = computeSlots();

/** PRNG determinista para barajar sin Math.random en render */
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

export function shuffled(n: number, seed: number): number[] {
  const rnd = mulberry32(seed);
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Evita que salga ya ordenado
  if (arr[0] === 0 && arr[1] === 1) [arr[0], arr[n - 1]] = [arr[n - 1], arr[0]];
  return arr;
}

export function softmax(logits: number[], T = 1): number[] {
  const scaled = logits.map((l) => l / T);
  const m = Math.max(...scaled);
  const e = scaled.map((l) => Math.exp(l - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

export interface Phrase {
  tokens: string[];
  candidates: string[];
  logits: number[];
  /** Puntuaciones de atención del último token hacia cada token (antes de softmax) */
  attn: number[];
}

export const PHRASES: Phrase[] = [
  {
    tokens: ["El", "gato", "se", "sentó", "en", "la"],
    candidates: ["alfombra", "silla", "cama", "ventana", "mesa", "puerta", "calle", "luna"],
    logits: [3.85, 3.1, 2.8, 2.3, 2.0, 1.5, 1.0, 0.3],
    attn: [0.1, 1.5, 0.4, 2.1, 1.7, 0.9],
  },
  {
    tokens: ["Érase", "una", "vez", "un"],
    candidates: ["rey", "niño", "dragón", "pequeño", "hombre", "lobo", "castillo", "robot"],
    logits: [3.5, 3.1, 2.7, 2.4, 2.1, 1.7, 0.6, 0.2],
    attn: [1.9, 0.8, 1.4, 1.0],
  },
  {
    tokens: ["Me", "gusta", "la", "pizza", "con"],
    candidates: ["queso", "piña", "jamón", "amigos", "champiñones", "anchoas", "ketchup", "miedo"],
    logits: [3.7, 3.0, 2.7, 2.4, 2.2, 1.6, 0.9, -0.5],
    attn: [0.3, 1.2, 0.2, 2.4, 1.1],
  },
];
