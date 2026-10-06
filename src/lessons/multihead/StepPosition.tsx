"use client";
import { useMemo, useRef, useState } from "react";
import { Button, Card, Formula, Slider } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { VecCells, useSceneContext } from "../atencion/bits";
import { EMB, dot, pe, peVec, rot, selfAttend } from "./math";

const S1 = ["perro", "muerde", "hombre"];
const S2 = ["hombre", "muerde", "perro"];
const D_PE = 32;
const POS = 24;

function OrderDemo() {
  const guide = useGuide();
  const [withPos, setWithPos] = useState(false);
  const said = useRef(false);
  const o1 = useMemo(() => selfAttend(S1, withPos), [withPos]);
  const o2 = useMemo(() => selfAttend(S2, withPos), [withPos]);
  const a = o1[1];
  const b = o2[1];
  const diff = Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
  const toggle = () => {
    const v = !withPos;
    setWithPos(v);
    if (v && !said.current) {
      said.current = true;
      guide.say("Sin posición, «el perro muerde al hombre» y «el hombre muerde al perro» daban lo mismo. ¡Con la posición ya se distinguen!", "surprised");
    }
  };
  return (
    <Card title="1. Sin posición, la atención es ciega al orden" actions={<Button variant={withPos ? "primary" : "outline"} onClick={toggle}>{withPos ? "Con posición ✓" : "Añadir posición"}</Button>}>
      La atención compara tokens por contenido, no por sitio. Mira la salida de «muerde» en dos frases con las mismas palabras en distinto orden:
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 font-serif text-ivory">{S1.join(" ")}</div>
          <VecCells v={a} label="salida" color="#D97757" size="sm" max={1.5} />
        </div>
        <div>
          <div className="mb-1 font-serif text-ivory">{S2.join(" ")}</div>
          <VecCells v={b} label="salida" color="#6A9BCC" size="sm" max={1.5} />
        </div>
      </div>
      <p className="mt-2">
        Diferencia entre las dos salidas: <b className={diff < 1e-9 ? "text-rose" : "text-olive"}>{diff.toFixed(4)}</b>{" "}
        {diff < 1e-9 ? "→ idénticas: el modelo no sabe quién muerde a quién." : "→ distintas: ahora el orden importa."}
      </p>
      <p className="mt-1 text-xs text-ivory/50">Embeddings de juguete d=4: perro {JSON.stringify(EMB.perro)}, muerde, hombre. La posición se suma antes de la atención.</p>
    </Card>
  );
}

function SinusoidHeatmap() {
  const [pos, setPos] = useState(5);
  const cell = 9;
  const v = peVec(pos, D_PE);
  return (
    <Card title="2. Sinusoidal: un «código de barras» único por posición">
      Cada posición recibe un vector de senos y cosenos con frecuencias distintas: las primeras dimensiones oscilan rápido, las últimas lento (como las agujas de un reloj). Se <b>suma</b> al embedding.
      <Formula>PE(pos, 2i) = sin(pos / 10000^(2i/d)) · PE(pos, 2i+1) = cos(…)</Formula>
      <div className="overflow-x-auto">
        <svg width={D_PE * cell + 40} height={POS * cell + 24} role="img" aria-label="Mapa de calor de la codificación sinusoidal">
          <text x={40} y={10} fontSize={9} fill="#F0EEE6" opacity={0.6}>dimensión →</text>
          {Array.from({ length: POS }, (_, p) =>
            Array.from({ length: D_PE }, (_, d) => {
              const val = pe(p, d, D_PE);
              return <rect key={`${p}-${d}`} x={40 + d * cell} y={16 + p * cell} width={cell - 1} height={cell - 1} rx={1} fill={val >= 0 ? "#D97757" : "#6A9BCC"} opacity={0.1 + Math.abs(val) * 0.9} onClick={() => setPos(p)} className="cursor-pointer" />;
            }),
          )}
          <rect x={38} y={15 + pos * cell} width={D_PE * cell + 3} height={cell + 1} fill="none" stroke="#F0EEE6" strokeWidth={1.5} />
          {[0, 5, 10, 15, 20].map((p) => <text key={p} x={4} y={24 + p * cell} fontSize={9} fill="#F0EEE6" opacity={0.6}>pos {p}</text>)}
        </svg>
      </div>
      <div className="mt-3 max-w-sm">
        <Slider label="Posición seleccionada" value={pos} min={0} max={POS - 1} step={1} onChange={setPos} format={(x) => String(x)} />
      </div>
      <div className="mt-2 overflow-x-auto">
        <VecCells v={v.slice(0, 8)} label={`PE(${pos})`} color="#E3C77B" size="sm" max={1} />
        <p className="mt-1 text-xs text-ivory/50">(primeras 8 de {D_PE} dimensiones; naranja positivo, azul negativo)</p>
      </div>
    </Card>
  );
}

function RopeDemo() {
  const guide = useGuide();
  const [m, setM] = useState(3);
  const [n, setN] = useState(1);
  const [shift, setShift] = useState(0);
  const said = useRef(false);
  const theta = 0.35;
  const q: [number, number] = [1, 0.4];
  const k: [number, number] = [0.9, 0.6];
  const qr = rot(q, m * theta);
  const kr = rot(k, n * theta);
  const d0 = dot(qr, kr);
  const d1 = dot(rot(q, (m + shift) * theta), rot(k, (n + shift) * theta));
  const C = 100;
  const sc = 70;
  const arrow = (v: [number, number], color: string, label: string) => (
    <g>
      <line x1={C} y1={C} x2={C + v[0] * sc} y2={C - v[1] * sc} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <circle cx={C + v[0] * sc} cy={C - v[1] * sc} r={5} fill={color} />
      <text x={C + v[0] * sc + 7} y={C - v[1] * sc - 7} fontSize={11} fill={color}>{label}</text>
    </g>
  );
  const onShift = (v: number) => {
    setShift(v);
    if (v !== 0 && !said.current) {
      said.current = true;
      guide.say("Mira: al mover las dos posiciones a la vez, el producto punto no cambia. RoPE solo «siente» la distancia relativa entre tokens.", "happy");
    }
  };
  return (
    <Card title="3. RoPE: en vez de sumar, girar">
      RoPE gira cada par de dimensiones de Q y K un ángulo proporcional a su posición. Al hacer el producto punto, los giros se restan y solo importa la <b>distancia</b> m − n.
      <div className="mt-3 grid gap-4 md:grid-cols-[220px_1fr]">
        <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[220px] rounded-xl bg-night/60">
          <circle cx={C} cy={C} r={sc} fill="none" stroke="#F0EEE6" opacity={0.12} />
          <line x1={0} y1={C} x2={200} y2={C} stroke="#F0EEE6" opacity={0.1} />
          <line x1={C} y1={0} x2={C} y2={200} stroke="#F0EEE6" opacity={0.1} />
          {arrow(qr, "#D97757", `q@${m}`)}
          {arrow(kr, "#6A9BCC", `k@${n}`)}
        </svg>
        <div className="grid content-start gap-3">
          <Slider label="Posición de la Query (m)" value={m} min={0} max={20} step={1} onChange={setM} format={(x) => String(x)} />
          <Slider label="Posición de la Key (n)" value={n} min={0} max={20} step={1} onChange={setN} format={(x) => String(x)} color="#6A9BCC" />
          <div className="rounded-lg bg-night/60 p-2 font-mono text-xs">
            q·k = {d0.toFixed(4)} &nbsp; (distancia m−n = {m - n})
          </div>
          <Slider label="Desplazar ambas posiciones en…" value={shift} min={-10} max={10} step={1} onChange={onShift} format={(x) => (x > 0 ? `+${x}` : String(x))} color="#788C5D" />
          <div className="rounded-lg bg-night/60 p-2 font-mono text-xs">
            tras desplazar: q·k = {d1.toFixed(4)} {Math.abs(d0 - d1) < 1e-9 ? "✓ igual" : "≠"}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function StepPosition() {
  useSceneContext("Paso 3 (codificación posicional): demo de que la atención sin posición no distingue el orden ('perro muerde hombre' vs 'hombre muerde perro'), mapa sinusoidal posición×dimensión que se suma al embedding, y RoPE que rota Q y K según su posición para que el producto punto dependa solo de la distancia relativa.");
  return (
    <div className="grid gap-4">
      <OrderDemo />
      <SinusoidHeatmap />
      <RopeDemo />
    </div>
  );
}
