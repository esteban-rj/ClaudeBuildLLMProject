"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { Button, Card, PALETTE, Slider, Stage } from "@/components/ui";
import { FlowDiagram, useRunner, type DEdge, type DNode, type Frame } from "./FlowDiagram";
import { PatternFicha } from "./Gallery";

type V3 = [number, number, number];
interface Doc { id: number; text: string; topic: "cocina" | "finanzas" | "viajes"; pos: V3 }

const TOPIC_COLOR = { cocina: PALETTE.sand, finanzas: PALETTE.olive, viajes: PALETTE.sky };

const DOCS: Doc[] = [
  { id: 0, topic: "cocina", text: "Receta de tortilla: huevos, patata y cebolla", pos: [-2.0, 0.5, 0.2] },
  { id: 1, topic: "cocina", text: "Cómo freír huevos sin que se peguen", pos: [-2.6, 0.2, 0.6] },
  { id: 2, topic: "cocina", text: "Masa de pan casera en 3 pasos", pos: [-2.4, 0.9, -0.3] },
  { id: 3, topic: "cocina", text: "Salsa de tomate natural", pos: [-1.6, 0.1, 0.5] },
  { id: 4, topic: "finanzas", text: "Qué es un fondo indexado", pos: [2.1, 1.1, -1.4] },
  { id: 5, topic: "finanzas", text: "Interés compuesto explicado", pos: [2.6, 0.7, -1.9] },
  { id: 6, topic: "finanzas", text: "Cómo declarar el IRPF", pos: [1.7, 1.5, -1.9] },
  { id: 7, topic: "finanzas", text: "Reclamar un cobro duplicado al banco", pos: [1.4, 0.2, -0.6] },
  { id: 8, topic: "viajes", text: "Qué ver en Lisboa en 2 días", pos: [0.2, -1.0, 1.9] },
  { id: 9, topic: "viajes", text: "Cómo viajar barato en tren", pos: [-0.5, -1.4, 1.5] },
  { id: 10, topic: "viajes", text: "Trámites para viajar a Japón", pos: [0.9, -0.6, 2.4] },
  { id: 11, topic: "viajes", text: "Maletas de cabina: medidas", pos: [0.5, -1.5, 2.3] },
];

const QUERIES: { text: string; pos: V3; answer: string }[] = [
  { text: "¿Cómo hago una tortilla de patatas?", pos: [-1.9, 0.6, 0.0], answer: "Pela y fríe las patatas con cebolla, mézclalas con huevo batido y cuaja la tortilla por los dos lados." },
  { text: "Quiero invertir mis ahorros", pos: [2.0, 1.2, -1.3], answer: "Una opción habitual es un fondo indexado, aprovechando el interés compuesto a largo plazo." },
  { text: "¿Qué visitar en Oporto?", pos: [0.3, -0.9, 1.8], answer: "No tengo nada sobre Oporto, pero sí sobre Lisboa y viajar en tren: podrías combinarlos." },
  { text: "Me cobraron dos veces en un viaje", pos: [1.0, -0.3, 0.5], answer: "Reclama el cobro duplicado a tu banco; guarda el justificante del viaje como prueba." },
];

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const NODES: DNode[] = [
  { id: "q", label: "Consulta", x: 55, y: 55, kind: "io", w: 78 },
  { id: "e", label: "Embedding", x: 175, y: 55, kind: "llm", w: 92 },
  { id: "db", label: "Búsqueda", sub: "vectorial", x: 305, y: 55, kind: "store", w: 106 },
  { id: "c", label: "Contexto", x: 435, y: 55, kind: "gate", w: 96 },
  { id: "a", label: "Respuesta", sub: "LLM", x: 565, y: 55, kind: "llm", w: 86 },
];
const EDGES: DEdge[] = [
  { from: "q", to: "e" }, { from: "e", to: "db" }, { from: "db", to: "c" }, { from: "c", to: "a" },
];

function Query({ target, flying }: { target: V3; flying: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((s, dt) => {
    const g = ref.current;
    if (!g) return;
    const goal: V3 = flying ? target : [0, 3.6, 0];
    const k = 1 - Math.exp(-3 * dt);
    g.position.x += (goal[0] - g.position.x) * k;
    g.position.y += (goal[1] - g.position.y) * k;
    g.position.z += (goal[2] - g.position.z) * k;
    const sc = 1 + Math.sin(s.clock.elapsedTime * 4) * 0.12;
    g.scale.setScalar(sc);
  });
  return (
    <group ref={ref} position={[0, 3.6, 0]}>
      <mesh>
        <octahedronGeometry args={[0.28]} />
        <meshStandardMaterial color={PALETTE.clay} emissive={PALETTE.clay} emissiveIntensity={0.7} />
      </mesh>
      <Html center distanceFactor={9} position={[0, 0.5, 0]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded bg-clay px-1.5 py-0.5 text-[10px] font-semibold text-night">consulta</div>
      </Html>
    </group>
  );
}

function Scene({ qpos, picked, stage, showAll }: { qpos: V3; picked: number[]; stage: number; showAll: boolean }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[5, 6, 5]} intensity={60} />
      <gridHelper args={[10, 10, "#3a3935", "#2a2926"]} position={[0, -2, 0]} />
      {DOCS.map((d) => {
        const isPicked = stage >= 2 && picked.includes(d.id);
        return (
          <group key={d.id} position={d.pos}>
            <mesh scale={isPicked ? 1.5 : 1}>
              <sphereGeometry args={[0.17, 16, 16]} />
              <meshStandardMaterial color={TOPIC_COLOR[d.topic]} emissive={TOPIC_COLOR[d.topic]} emissiveIntensity={isPicked ? 0.9 : 0.15} />
            </mesh>
            {(isPicked || showAll) && (
              <Html center distanceFactor={9} position={[0, 0.38, 0]} style={{ pointerEvents: "none" }}>
                <div className="max-w-[110px] rounded bg-night/80 px-1 py-0.5 text-center text-[8px] leading-tight text-ivory">{d.text}</div>
              </Html>
            )}
          </group>
        );
      })}
      <Query target={qpos} flying={stage >= 1} />
      {stage >= 2 && picked.map((id) => {
        const d = DOCS[id];
        return <Line key={id} points={[qpos, d.pos]} color={PALETTE.clay} lineWidth={2} dashed dashSize={0.15} gapSize={0.1} />;
      })}
      <OrbitControls enablePan={false} minDistance={4} maxDistance={12} autoRotate={stage < 1} autoRotateSpeed={0.8} />
    </>
  );
}

export default function RagStep({ onRun }: { onRun?: () => void }) {
  const [qi, setQi] = useState(0);
  const [k, setK] = useState(2);
  const [showAll, setShowAll] = useState(false);
  const q = QUERIES[qi];

  const ranked = useMemo(
    () => DOCS.map((d) => ({ d, dist: dist(d.pos, q.pos) })).sort((a, b) => a.dist - b.dist),
    [q],
  );
  const top = ranked.slice(0, k);
  const picked = top.map((r) => r.d.id);

  const frames = useMemo((): Frame[] => [
    { log: "Llega la pregunta del usuario en lenguaje natural.", moves: [{ from: "q", to: "e", label: "texto" }], traces: { q: `«${q.text}»` } },
    { log: "Un modelo de embeddings convierte el texto en un vector: un punto en el espacio.", moves: [{ from: "e", to: "db", label: "vector" }], traces: { e: `[${q.pos.map((x) => x.toFixed(1)).join(", ")}]` } },
    { log: `Búsqueda de los ${k} vecinos más cercanos (distancia en el espacio).`, moves: [{ from: "db", to: "c", label: `top-${k}` }], traces: { db: top.map((r) => r.dist.toFixed(2)).join(" · ") } },
    { log: "Los textos recuperados se pegan en el prompt como contexto.", moves: [{ from: "c", to: "a", label: "prompt+contexto" }], traces: { c: top.map((r) => r.d.text.split(" ").slice(0, 3).join(" ")).join(" | ") } },
    { log: "El LLM responde apoyándose en lo recuperado, no solo en lo que memorizó.", moves: [], traces: { a: q.answer } },
  ], [q, k, top]);

  const runner = useRunner(frames.length, 1700, onRun);
  const { reset } = runner;
  useEffect(() => { reset(); }, [qi, k, reset]);

  const stage = runner.idx; // 0..4
  return (
    <div className="space-y-3">
      <Card title="📚 RAG: buscar antes de responder" actions={
        <Button onClick={runner.run} disabled={runner.running}>{runner.running ? "Ejecutando…" : "▶ Ejecutar"}</Button>
      }>
        <p className="mb-2">Cada documento es un punto en un espacio donde los textos con significado parecido quedan cerca (aquí 3 dimensiones; en la realidad son cientos o miles). Elige una consulta y mira qué vecinos recupera.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {QUERIES.map((x, i) => (
            <button key={x.text} onClick={() => setQi(i)} className={`rounded-full px-3 py-1 text-xs ${i === qi ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}>{x.text}</button>
          ))}
        </div>
        <div className="mb-2 w-full rounded-xl border border-ivory/10 bg-night/40">
          <FlowDiagram nodes={NODES} edges={EDGES} frames={frames} frameIdx={runner.idx} height={130} packetMs={1100} />
        </div>
        <div className="mb-3 min-h-[2.5rem] font-mono text-xs text-ivory/80">
          {runner.idx >= 0 ? `▸ ${frames[runner.idx].log}` : <span className="text-ivory/40">Pulsa «Ejecutar» para ver el recorrido.</span>}
        </div>
        <Stage height={340}>
          <Canvas camera={{ position: [5.5, 3.2, 6.5], fov: 50 }}>
            <Scene qpos={q.pos} picked={picked} stage={stage} showAll={showAll} />
          </Canvas>
          <div className="pointer-events-none absolute bottom-2 left-2 flex gap-2 text-[10px]">
            {(Object.keys(TOPIC_COLOR) as (keyof typeof TOPIC_COLOR)[]).map((t) => (
              <span key={t} className="rounded bg-night/70 px-1.5 py-0.5" style={{ color: TOPIC_COLOR[t] }}>● {t}</span>
            ))}
          </div>
        </Stage>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Slider label="Vecinos a recuperar (k)" value={k} min={1} max={5} step={1} onChange={setK} format={(v) => String(v)} />
            <label className="mt-2 flex items-center gap-2 text-xs text-ivory/70">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Mostrar el texto de todos los puntos
            </label>
          </div>
          <div className="space-y-1 text-xs">
            {ranked.slice(0, 5).map((r, i) => (
              <div key={r.d.id} className={`flex justify-between gap-2 rounded px-2 py-1 ${i < k ? "bg-clay/20 text-ivory" : "bg-ivory/5 text-ivory/50"}`}>
                <span>{r.d.text}</span>
                <span className="font-mono">{r.dist.toFixed(2)}</span>
              </div>
            ))}
            <p className="text-ivory/50">Menor distancia = más parecido. Con k alto entra ruido; con k bajo puede faltar información.</p>
          </div>
        </div>
      </Card>
      <PatternFicha id="rag" />
    </div>
  );
}
