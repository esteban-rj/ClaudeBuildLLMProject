"use client";
import { useRef, useState } from "react";
import { Button, Card, PALETTE, Slider, Stage } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import Swarm3D, { type Phase } from "./Swarm3D";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "En reposo: pulsa «Ejecutar»",
  decompose: "1/3 El orquestador descompone la tarea y reparte",
  work: "2/3 Los sub-agentes trabajan en paralelo, cada uno en su contexto",
  integrate: "3/3 El orquestador integra los resultados",
  done: "¡Completado!",
};

export default function SimStep() {
  const guide = useGuide();
  const [n, setN] = useState(6);
  const [size, setSize] = useState(5);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const said = useRef({ run: false, done: false });

  // Modelo de tiempo y tokens
  const minPerTask = size * 3;
  const tSeq = n * minPerTask;
  const tPar = 1 + minPerTask + 0.5 * n;
  const work = n * size * 10_000;
  const tokSingle = work;
  const tokMulti = work + n * 5_000 + 4_000 + n * 1_500;
  const ctxSingle = n * size * 10_000;

  const onPhase = (p: Phase) => {
    setPhase(p);
    if (p === "done" && !said.current.done) {
      said.current.done = true;
      guide.say(`¡Eso es! Con ${n} sub-agentes el trabajo pasó de ${tSeq} a unos ${tPar.toFixed(0)} minutos, pero gastó más tokens. Así se construyó esta app.`, "happy");
    }
  };

  const run = () => {
    setRunId((r) => r + 1);
    if (!said.current.run) {
      said.current.run = true;
      guide.say("Mira: el orquestador parte la tarea y cada mini-Clawd trabaja en su propia burbuja de contexto, sin ver lo de los demás.", "explaining");
    }
    guide.setContext(`Simulación multi-agente con ${n} sub-agentes y tamaño de tarea ${size}: secuencial ${tSeq} min, paralelo ${tPar.toFixed(0)} min; tokens ${tokSingle / 1000}k vs ${(tokMulti / 1000).toFixed(0)}k.`);
  };

  const speed = tSeq / tPar;
  const extra = (tokMulti / tokSingle - 1) * 100;

  return (
    <div className="space-y-3">
      <Card title="🏗️ Así se hizo esta app" actions={<Button onClick={run} disabled={phase !== "idle" && phase !== "done"}>▶ Ejecutar</Button>}>
        <p className="mb-3">El orquestador (el Clawd grande) recibe: <i>«Construye una app educativa sobre transformers»</i>. Esta app se creó así: <b>6 sub-agentes en paralelo</b>, cada uno creando una lección en su propia carpeta. Las burbujas azules son sus contextos aislados.</p>
        <Stage height={400}>
          <Swarm3D n={n} size={size} runId={runId} onPhase={onPhase} />
          <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-night/80 px-2 py-1 text-[11px] text-ivory/90">{PHASE_LABEL[phase]}</div>
        </Stage>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Slider label="Nº de sub-agentes" value={n} min={1} max={8} step={1} onChange={(v) => { setN(v); setPhase("idle"); }} format={(v) => String(v)} color={PALETTE.sky} />
          <Slider label="Tamaño de cada subtarea" value={size} min={1} max={10} step={1} onChange={(v) => setSize(v)} format={(v) => `${v * 3} min · ${v * 10}k tok`} />
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="⏱️ Tiempo total">
          <div className="space-y-2">
            <MeterRow label="Secuencial (1 agente)" value={tSeq} max={tSeq} color={PALETTE.clay} text={`${tSeq.toFixed(0)} min`} />
            <MeterRow label={`Paralelo (${n})`} value={tPar} max={tSeq} color={PALETTE.sky} text={`${tPar.toFixed(0)} min`} />
          </div>
          <p className="mt-2 text-xs">{n === 1 ? "Con un solo sub-agente no hay ganancia (y pierdes el reparto)." : `≈ ${speed.toFixed(1)}× más rápido. No llega a ${n}× por el reparto inicial y la integración final.`}</p>
        </Card>
        <Card title="🪙 Tokens totales">
          <div className="space-y-2">
            <MeterRow label="1 agente" value={tokSingle} max={tokMulti} color={PALETTE.clay} text={`${(tokSingle / 1000).toFixed(0)}k`} />
            <MeterRow label={`${n} sub-agentes + orquestador`} value={tokMulti} max={tokMulti} color={PALETTE.rose} text={`${(tokMulti / 1000).toFixed(0)}k`} />
          </div>
          <p className="mt-2 text-xs">Gasta un {extra.toFixed(0)}% más: cada sub-agente recibe su briefing y el orquestador lee los resultados. Pero el agente solo necesitaría {(ctxSingle / 1000).toFixed(0)}k de contexto a la vez{ctxSingle > 200_000 ? ", ¡más de lo que cabe!" : "."}</p>
        </Card>
      </div>
    </div>
  );
}

function MeterRow({ label, value, max, color, text }: { label: string; value: number; max: number; color: string; text: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs"><span className="text-ivory/70">{label}</span><span className="font-mono" style={{ color }}>{text}</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-night/70"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} /></div>
    </div>
  );
}
