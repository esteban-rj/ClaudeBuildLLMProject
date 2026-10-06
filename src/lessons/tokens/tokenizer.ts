// BPE (Byte-Pair Encoding) real y pequeño, entrenado al cargar sobre un corpus en español.

export type Pair = [string, string];

export interface BpeStep {
  pair: Pair;
  count: number;
  top: { pair: Pair; count: number }[];
  words: { syms: string[]; count: number }[];
}

type Word = { syms: string[]; count: number };

function countPairs(words: Word[]) {
  const m = new Map<string, { pair: Pair; count: number }>();
  for (const w of words) {
    for (let i = 0; i < w.syms.length - 1; i++) {
      const key = w.syms[i] + "\u0000" + w.syms[i + 1];
      const e = m.get(key);
      if (e) e.count += w.count;
      else m.set(key, { pair: [w.syms[i], w.syms[i + 1]], count: w.count });
    }
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

function applyMerge(syms: string[], pair: Pair) {
  const out: string[] = [];
  for (let i = 0; i < syms.length; i++) {
    if (i < syms.length - 1 && syms[i] === pair[0] && syms[i + 1] === pair[1]) {
      out.push(pair[0] + pair[1]);
      i++;
    } else out.push(syms[i]);
  }
  return out;
}

/** Entrena BPE: repite "fusionar el par de símbolos más frecuente" */
export function trainBPE(counts: [string, number][], nMerges: number) {
  let words: Word[] = counts.map(([w, count]) => ({ syms: Array.from(w), count }));
  const merges: Pair[] = [];
  const steps: BpeStep[] = [];
  for (let k = 0; k < nMerges; k++) {
    const pairs = countPairs(words);
    if (!pairs.length || pairs[0].count < 2) break;
    const best = pairs[0];
    words = words.map((w) => ({ ...w, syms: applyMerge(w.syms, best.pair) }));
    merges.push(best.pair);
    steps.push({ pair: best.pair, count: best.count, top: pairs.slice(0, 5), words });
  }
  return { merges, steps };
}

/** Pre-tokenización: cada palabra (o signo) lleva "▁" si iba precedida de espacio */
export function pretokenize(text: string): string[] {
  const parts = text.match(/\s*[\p{L}\p{N}]+|\s*[^\p{L}\p{N}\s]/gu) ?? [];
  return parts.map((p) => (/^\s/.test(p) ? "▁" + p.trimStart() : p));
}

const CORPUS = `
el gato come pescado y el perro come carne en la casa
el gato duerme y el perro corre en el parque
mi gato es negro y mi perro es blanco, el gato maúlla
hola, ¿cómo estás? hola, ¿qué tal? hola amigo
la inteligencia es genial, la vida es genial, qué día tan genial
los gatos y los perros juegan en el jardín con la pelota
la niña lee un libro en la biblioteca y el niño juega en la calle
mi mamá cocina una sopa deliciosa para toda la familia
el rey y la reina viven en un castillo muy grande
hoy hace mucho calor en la ciudad y vamos a la playa
ayer comimos pizza con queso y bebimos agua fresca
el profesor explica la lección y los alumnos escuchan con atención
cuando llueve me gusta leer un libro y tomar un chocolate caliente
la inteligencia artificial aprende de los datos con redes neuronales
el modelo predice la siguiente palabra y construye la frase completa
estamos aprendiendo a entrenar un transformer paso a paso
nunca es tarde para empezar a estudiar matemáticas y programación
el pájaro canta en la mañana y el caballo corre por el campo
la vaca come hierba y el pez nada en el río
me encanta viajar a España, México, Francia, Chile y Perú
la comida italiana es famosa por la pasta, la pizza y el queso
realmente creo que la educación es importante para todos
rápidamente el programador escribió una función para resolver el problema
la información se transforma en números y los números en significado
la tokenización divide el texto en pedazos pequeños llamados tokens
el entrenamiento mejora el modelo con cada ejemplo y cada época
los estudiantes estudian durante las vacaciones porque quieren aprender más
tenemos que organizar la presentación de la conversación con los compañeros
mañana vamos a comer en el restaurante con los amigos de la escuela
la canción habla de una relación entre la luna y el mar
`;

const BASE_EXTRA = "abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ0123456789,.;:¿?¡!()-\"'";

const trainWords = (() => {
  const freq = new Map<string, number>();
  for (const line of CORPUS.split("\n")) {
    for (const w of pretokenize(line)) freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()];
})();

const N_MERGES = 160;
const trained = trainBPE(trainWords, N_MERGES);

const baseChars = (() => {
  const s = new Set<string>(["▁"]);
  for (const c of BASE_EXTRA) s.add(c);
  for (const [w] of trainWords) for (const c of w) s.add(c);
  return [...s];
})();

/** Vocabulario: caracteres base + un token por cada fusión aprendida */
export const VOCAB: string[] = [...baseChars, ...trained.merges.map(([a, b]) => a + b)];
const ID = new Map(VOCAB.map((t, i) => [t, i]));
export const MERGES = trained.merges;
export const VOCAB_SIZE = VOCAB.length;

export interface Tok {
  text: string;
  id: number;
  /** true si el carácter no estaba en el vocabulario (se codifica por código Unicode) */
  fallback: boolean;
}

export const FALLBACK_BASE = 100000;

function encodeWord(word: string): Tok[] {
  let syms = Array.from(word);
  for (const m of MERGES) {
    if (syms.length < 2) break;
    syms = applyMerge(syms, m);
  }
  return syms.map((s) => {
    const id = ID.get(s);
    return id !== undefined
      ? { text: s, id, fallback: false }
      : { text: s, id: FALLBACK_BASE + (s.codePointAt(0) ?? 0), fallback: true };
  });
}

export function tokenize(text: string): Tok[] {
  return pretokenize(text).flatMap(encodeWord);
}

export const showTok = (t: string) => t.replace(/▁/g, "·");

export const TOKEN_COLORS = ["#D97757", "#6A9BCC", "#788C5D", "#C46686", "#E3C77B", "#9B87C9"];
