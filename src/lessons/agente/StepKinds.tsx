"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { setContext } from "./clawd";

type Node = { label: string; kind: "user" | "llm" | "tool" | "code" | "out" };
const COLORS: Record<Node["kind"], string> = { user: "#6A9BCC", llm: "#D97757", tool: "#788C5D", code: "#8A8A85", out: "#E3C77B" };

interface Diagram {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  control: string;
  /** secuencia de nodos que se iluminan */
  seq: Node[];
  /** aristas extra: bucle */
  loop?: boolean;
}

const DIAGRAMS: Diagram[] = [
  {
    id: "chatbot",
    title: "Chatbot",
    emoji: "💬",
    blurb: "Pregunta → modelo → respuesta. Un solo disparo: el modelo responde con lo que sabe y ahí acaba.",
    control: "Control: ninguno, una sola llamada.",
    seq: [
      { label: "Usuario", kind: "user" },
      { label: "LLM", kind: "llm" },
      { label: "Respuesta", kind: "out" },
    ],
  },
  {
    id: "workflow",
    title: "Workflow",
    emoji: "🏭",
    blurb: "Una cadena de pasos que TÚ dejaste escrita en el código: resumir → traducir → enviar. El modelo rellena cada paso, pero no decide el camino.",
    control: "Control: lo decide el programador (camino fijo).",
    seq: [
      { label: "Usuario", kind: "user" },
      { label: "LLM: resume", kind: "llm" },
      { label: "Código: filtra", kind: "code" },
      { label: "LLM: traduce", kind: "llm" },
      { label: "Respuesta", kind: "out" },
    ],
  },
  {
    id: "agente",
    title: "Agente",
    emoji: "🤖",
    blurb: "El modelo decide en cada vuelta: ¿uso una herramienta? ¿cuál? ¿ya he terminado? El camino no está escrito de antemano; se descubre sobre la marcha.",
    control: "Control: lo decide el modelo (bucle dinámico).",
    loop: true,
    seq: [
      { label: "Usuario", kind: "user" },
      { label: "LLM piensa", kind: "llm" },
      { label: "Herramienta", kind: "tool" },
      { label: "LLM piensa", kind: "llm" },
      { label: "Otra herramienta", kind: "tool" },
      { label: "LLM piensa", kind: "llm" },
      { label: "Respuesta", kind: "out" },
    ],
  },
];

function Flow({ d, active }: { d: Diagram; active: boolean }) {
  const [i, setI] = useState(-1);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI((v) => (v + 1) % (d.seq.length + 2)), 700);
    return () => clearInterval(id);
  }, [active, d.seq.length]);
  const cur = active ? i : -1;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {d.seq.map((n, k) => (
        <div key={k} className="flex items-center gap-1.5">
          <div
            className="rounded-lg px-2 py-1 text-xs font-medium text-night transition-all duration-300"
            style={{ background: COLORS[n.kind], opacity: cur === k ? 1 : cur > k ? 0.75 : 0.35, transform: cur === k ? "scale(1.12)" : "scale(1)", boxShadow: cur === k ? `0 0 14px ${COLORS[n.kind]}` : "none" }}
          >
            {n.label}
          </div>
          {k < d.seq.length - 1 && <span className="text-ivory/40">→</span>}
        </div>
      ))}
      {d.loop && <span className="ml-1 rounded-full border border-clay/50 px-2 py-0.5 text-[10px] text-clay">↻ repite hasta terminar</span>}
    </div>
  );
}

export default function StepKinds() {
  const [sel, setSel] = useState(2);
  useEffect(() => {
    const d = DIAGRAMS[sel];
    setContext(`Paso 1 (chatbot vs workflow vs agente). El usuario mira el diagrama de "${d.title}": ${d.blurb} ${d.control}`);
  }, [sel]);

  return (
    <div className="space-y-4">
      <Card title="Tres formas de usar un LLM">
        <p>
          La diferencia no está en el modelo, sino en <b>quién lleva el volante</b>. Pulsa cada tarjeta para ver su diagrama animado.
        </p>
      </Card>
      <div className="grid gap-3">
        {DIAGRAMS.map((d, i) => (
          <button key={d.id} onClick={() => setSel(i)} className={`rounded-2xl border p-4 text-left transition ${sel === i ? "border-clay bg-clay/10" : "border-ivory/10 bg-panel/80 hover:border-clay/50"}`}>
            <div className="mb-1 flex items-center gap-2 font-serif text-lg text-ivory">
              <span>{d.emoji}</span> {d.title}
            </div>
            <p className="mb-3 text-sm text-ivory/75">{d.blurb}</p>
            <Flow d={d} active={sel === i} />
            <p className="mt-3 text-xs text-clay">{d.control}</p>
          </button>
        ))}
      </div>
      <Card title="Regla práctica">
        <p>
          Si los pasos son siempre los mismos, usa un <b>workflow</b>: es más barato, rápido y predecible. Si no sabes de antemano cuántos pasos o qué herramientas harán falta, ahí brilla el{" "}
          <b className="text-clay">agente</b>… a cambio de más coste, más latencia y menos previsibilidad.
        </p>
      </Card>
    </div>
  );
}
