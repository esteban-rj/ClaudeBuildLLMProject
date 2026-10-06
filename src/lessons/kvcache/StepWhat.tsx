"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import type { Mesh, MeshStandardMaterial } from "three";
import { Button, Card, Formula, PALETTE, Stage } from "@/components/ui";
import { say, setContext } from "./clawd";

const D = 4;
const CONTEXT = ["El", "gato", "negro", "se", "subió", "al"];

// Vectores pequeños fijos (como si salieran de las matrices W_K, W_V de una capa)
const K: number[][] = [
  [0.1, 0.2, -0.1, 0.0],
  [1.2, 0.1, 0.4, -0.3],
  [0.3, 1.0, -0.2, 0.1],
  [0.0, -0.2, 0.1, 0.3],
  [0.6, -0.1, 1.1, 0.2],
  [0.2, 0.1, 0.3, 0.9],
];
const V: number[][] = [
  [0.0, 0.1, 0.0, 0.1],
  [0.9, 0.2, 0.1, 0.0],
  [0.1, 0.8, 0.0, 0.2],
  [0.0, 0.0, 0.3, 0.1],
  [0.2, 0.1, 0.9, 0.0],
  [0.1, 0.0, 0.2, 0.7],
];

const CANDIDATES: { word: string; q: number[]; why: string }[] = [
  { word: "tejado", q: [0.4, 0.1, 1.2, 1.4], why: "pregunta «¿adónde se subió?» → mira a «subió» y «al»" },
  { word: "maullaba", q: [1.6, 0.5, 0.1, 0.0], why: "pregunta «¿quién hace el sonido?» → mira a «gato»" },
  { word: "brillante", q: [0.2, 1.7, 0.0, 0.2], why: "pregunta «¿de qué color/cómo?» → mira a «negro»" },
];

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
function softmax(xs: number[]) {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}
const fmt = (v: number) => (v >= 0 ? " " : "") + v.toFixed(2);

function AttentionRow() {
  const [ci, setCi] = useState(0);
  const { cand, scores, w, out, best } = useMemo(() => {
    const cand = CANDIDATES[ci];
    const scores = K.map((k) => dot(cand.q, k) / Math.sqrt(D));
    const w = softmax(scores);
    const out = Array.from({ length: D }, (_, j) => V.reduce((s, v, i) => s + w[i] * v[j], 0));
    return { cand, scores, w, out, best: w.indexOf(Math.max(...w)) };
  }, [ci]);

  useEffect(() => {
    setContext(
      `Paso 2 (qué se guarda). Contexto cacheado: "${CONTEXT.join(" ")}". Token nuevo: "${cand.word}" con Q=[${cand.q.join(", ")}]. ` +
        `Pesos de atención (softmax de q·k/√${D}): ${CONTEXT.map((t, i) => `${t}=${w[i].toFixed(2)}`).join(", ")}. Salida = Σ w·V = [${out.map((v) => v.toFixed(2)).join(", ")}].`,
    );
  }, [cand, w, out]);

  return (
    <Card title="La Query nueva mira a todas las Keys guardadas">
      <p className="mb-3">
        El token nuevo trae su propia <b className="text-clay">Query (Q)</b>. La compara con las <b className="text-sky">K</b> de todos los anteriores (que ya están en caché), hace softmax y
        mezcla sus <b className="text-olive">V</b>. Elige qué palabra se está generando:
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {CANDIDATES.map((c, i) => (
          <Button key={c.word} variant={i === ci ? "primary" : "ghost"} onClick={() => setCi(i)}>
            …al <b>{c.word}</b>
          </Button>
        ))}
      </div>
      <p className="mb-2 text-xs text-ivory/60">Q de «{cand.word}» = [{cand.q.join(", ")}] — {cand.why}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] font-mono text-xs">
          <thead className="text-ivory/50">
            <tr>
              <th className="py-1 text-left">token</th>
              <th className="text-left text-sky">K (caché)</th>
              <th className="text-left text-olive">V (caché)</th>
              <th className="text-right">q·k/√4</th>
              <th className="pl-3 text-left">peso</th>
            </tr>
          </thead>
          <tbody>
            {CONTEXT.map((t, i) => (
              <tr key={t} className={i === best ? "text-ivory" : "text-ivory/70"}>
                <td className="py-1">{t}</td>
                <td className="whitespace-pre text-sky/80">[{K[i].map(fmt).join(",")}]</td>
                <td className="whitespace-pre text-olive/90">[{V[i].map(fmt).join(",")}]</td>
                <td className="text-right">{scores[i].toFixed(2)}</td>
                <td className="pl-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded bg-clay transition-all duration-500" style={{ width: `${Math.max(2, w[i] * 110)}px` }} />
                    <span>{(w[i] * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Formula>salida = Σ peso·V = [{out.map((v) => v.toFixed(2)).join(", ")}]</Formula>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-night/50 p-3 text-xs">
          <b className="text-ivory">¿Por qué no guardamos las Q antiguas?</b> La Q de «gato» solo sirvió para calcular la salida de «gato», y eso ya se hizo en su momento. Ningún token
          futuro vuelve a usarla: los tokens nuevos usan <i>su propia</i> Q contra las K y V de los demás.
        </div>
        <CausalTriangle n={CONTEXT.length + 1} />
      </div>
    </Card>
  );
}

/** Matriz de atención causal: solo la última fila es trabajo nuevo */
function CausalTriangle({ n }: { n: number }) {
  return (
    <div className="rounded-xl bg-night/50 p-3 text-xs">
      <div className="mb-2 text-ivory/70">Matriz de atención (filas = Queries, columnas = Keys)</div>
      <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${n}, 14px)` }}>
        {Array.from({ length: n * n }, (_, k) => {
          const r = Math.floor(k / n);
          const c = k % n;
          const visible = c <= r;
          const last = r === n - 1;
          return <div key={k} className="h-[14px] rounded-[3px]" style={{ background: !visible ? "transparent" : last ? PALETTE.clay : "rgba(240,238,230,0.12)" }} />;
        })}
      </div>
      <p className="mt-2 text-ivory/60">
        Las filas grises ya se calcularon en pasos anteriores. En cada paso solo hace falta <span className="text-clay">la última fila</span>: una Q nueva contra todas las K.
      </p>
    </div>
  );
}

/* ---------------- Escena 3D: cajones K y V por capa ---------------- */

const LAYERS = 4;
const MAX_T = 12;
const GAP = 0.55;

function Drawer({ position, color, born }: { position: [number, number, number]; color: string; born: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const age = clock.elapsedTime - born;
    const s = born < 0 ? 1 : Math.min(1, Math.max(0.001, age / 0.45));
    const e = 1 - Math.pow(1 - s, 3);
    m.scale.set(e, e, e);
    const mat = m.material as MeshStandardMaterial;
    mat.emissiveIntensity = born < 0 ? 0.15 : Math.max(0.15, 1.2 - age);
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.42, 0.26, 0.42]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.5} />
    </mesh>
  );
}

function QueryGhost({ x, born }: { x: number; born: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const age = clock.elapsedTime - born;
    const mat = m.material as MeshStandardMaterial;
    mat.opacity = Math.max(0, 0.9 - age * 0.45);
    m.position.y = (LAYERS * GAP) / 2 + age * 0.4;
    m.visible = mat.opacity > 0.01;
  });
  return (
    <mesh ref={ref} position={[x, 0, 0]}>
      <boxGeometry args={[0.42, LAYERS * GAP, 0.42]} />
      <meshStandardMaterial color={PALETTE.clay} emissive={PALETTE.clay} emissiveIntensity={0.6} transparent opacity={0.9} />
    </mesh>
  );
}

/** Guarda el instante de nacimiento de cada token en la escena (clock de R3F) */
function Stack({ tokens, births }: { tokens: number; births: number[] }) {
  const x0 = -((MAX_T - 1) * 0.5) / 2;
  const lastBirth = births[tokens - 1] ?? -1;
  return (
    <group>
      {Array.from({ length: tokens }, (_, t) =>
        Array.from({ length: LAYERS }, (_, l) => {
          const x = x0 + t * 0.5;
          const y = l * GAP;
          return (
            <group key={`${t}-${l}`}>
              <Drawer position={[x, y, -0.3]} color={PALETTE.sky} born={births[t] ?? -1} />
              <Drawer position={[x, y, 0.3]} color={PALETTE.olive} born={births[t] ?? -1} />
            </group>
          );
        }),
      )}
      {lastBirth >= 0 && <QueryGhost key={tokens} x={x0 + (tokens - 1) * 0.5} born={lastBirth} />}
      {Array.from({ length: LAYERS }, (_, l) => (
        <Html key={l} position={[x0 - 0.7, l * GAP, 0]} center>
          <div className="whitespace-nowrap text-[10px] text-ivory/70">capa {l + 1}</div>
        </Html>
      ))}
      <Html position={[x0 - 0.5, -0.45, -0.3]} center>
        <div className="text-[10px] font-bold text-sky">K</div>
      </Html>
      <Html position={[x0 - 0.5, -0.45, 0.3]} center>
        <div className="text-[10px] font-bold text-olive">V</div>
      </Html>
    </group>
  );
}

function ClockReader({ onReady }: { onReady: (getTime: () => number) => void }) {
  const done = useRef(false);
  useFrame(({ clock }) => {
    if (done.current) return;
    done.current = true;
    onReady(() => clock.elapsedTime);
  });
  return null;
}

function KVStack3D() {
  const [tokens, setTokens] = useState(3);
  const [births, setBirths] = useState<number[]>([-1, -1, -1]);
  const getTime = useRef<() => number>(() => 0);
  const said = useRef(false);

  const add = () => {
    if (tokens >= MAX_T) return;
    const t = getTime.current();
    setBirths((b) => [...b, t]);
    setTokens((v) => v + 1);
    if (!said.current) {
      said.current = true;
      say("¿Ves? La Q naranja aparece, se usa para mirar todos los cajones… y se evapora. Solo se quedan los cajones nuevos de K y V en cada capa.", "explaining");
    }
  };
  const reset = () => {
    setTokens(3);
    setBirths([-1, -1, -1]);
  };

  const entries = 2 * LAYERS * tokens;
  useEffect(() => {
    setContext(`Paso 2, escena 3D: la caché tiene ${tokens} tokens × ${LAYERS} capas × 2 (K y V) = ${entries} vectores guardados.`);
  }, [tokens, entries]);

  const handleReady = useCallback((fn: () => number) => {
    getTime.current = fn;
  }, []);

  return (
    <Card
      title="La caché por dentro (3D)"
      actions={
        <div className="flex gap-2">
          <Button onClick={add} disabled={tokens >= MAX_T}>
            + token
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reiniciar
          </Button>
        </div>
      }
    >
      <Stage height={340}>
        <Canvas camera={{ position: [3.5, 3.2, 6.5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[4, 6, 5]} intensity={1.2} />
          <ClockReader onReady={handleReady} />
          <group position={[0, -0.8, 0]}>
            <Stack tokens={tokens} births={births} />
          </group>
          <OrbitControls enablePan={false} minDistance={4} maxDistance={14} />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-night/70 px-2 py-1 text-[11px] text-ivory/80">
          <span className="text-sky">■ K</span> · <span className="text-olive">■ V</span> · <span className="text-clay">■ Q (temporal)</span>
        </div>
      </Stage>
      <Formula>
        {tokens} tokens × {LAYERS} capas × 2 (K y V) = {entries} vectores en caché
      </Formula>
      <p className="text-xs text-ivory/60">Arrastra para girar. Cada token nuevo añade un cajón K y uno V en cada capa; la pila solo crece hacia la derecha, nunca se recalcula.</p>
    </Card>
  );
}

export default function StepWhat() {
  return (
    <div className="space-y-4">
      <AttentionRow />
      <KVStack3D />
    </div>
  );
}
