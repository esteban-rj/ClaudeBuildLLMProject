"use client";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { FlowDiagram, useRunner } from "./FlowDiagram";
import { PATTERNS, type Rating } from "./patterns";

export function Dots({ level, color = "#D97757" }: { level: number; color?: string }) {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full" style={{ background: i <= level ? color : "rgba(240,238,230,0.15)" }} />
      ))}
    </span>
  );
}

function CostRow({ label, r }: { label: string; r: Rating }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="w-24 shrink-0 text-ivory/60">{label}</span>
      <Dots level={r.level} />
      <span className="text-ivory/70">{r.text}</span>
    </div>
  );
}

export function PatternFicha({ id }: { id: string }) {
  const p = PATTERNS.find((x) => x.id === id);
  if (!p) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="✅ Cuándo usarlo">
        <ul className="list-disc space-y-1 pl-4">{p.when.map((w) => <li key={w}>{w}</li>)}</ul>
      </Card>
      <Card title="👍 Ventajas">
        <ul className="list-disc space-y-1 pl-4">{p.pros.map((w) => <li key={w}>{w}</li>)}</ul>
      </Card>
      <Card title="💸 Costes">
        <div className="space-y-2">
          <CostRow label="Latencia" r={p.costs.latency} />
          <CostRow label="Tokens" r={p.costs.tokens} />
          <CostRow label="Complejidad" r={p.costs.complexity} />
        </div>
      </Card>
      <Card title="⚠️ Riesgos">
        <ul className="list-disc space-y-1 pl-4">{p.risks.map((w) => <li key={w}>{w}</li>)}</ul>
      </Card>
    </div>
  );
}

export default function Gallery({ onFirstRun }: { onFirstRun?: (patternName: string) => void }) {
  const flowPatterns = PATTERNS.filter((p) => p.scenes.length > 0);
  const [pid, setPid] = useState(flowPatterns[0].id);
  const [sceneIdx, setSceneIdx] = useState(0);
  const pattern = flowPatterns.find((p) => p.id === pid) ?? flowPatterns[0];
  const scene = pattern.scenes[Math.min(sceneIdx, pattern.scenes.length - 1)];
  const runner = useRunner(scene.frames.length, 1500);

  const { reset } = runner;
  useEffect(() => {
    reset();
  }, [pid, sceneIdx, reset]);

  const log = runner.idx >= 0 ? scene.frames.slice(0, runner.idx + 1).map((f) => f.log) : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {flowPatterns.map((p) => (
          <button
            key={p.id}
            onClick={() => { setPid(p.id); setSceneIdx(0); }}
            className={`rounded-full px-3 py-1.5 text-xs transition ${p.id === pid ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      <Card title={`${pattern.emoji} ${pattern.name}`} actions={
        <Button onClick={() => { runner.run(); onFirstRun?.(pattern.name); }} disabled={runner.running}>
          {runner.running ? "Ejecutando…" : runner.done ? "▶ Repetir" : "▶ Ejecutar"}
        </Button>
      }>
        <p className="mb-2">{pattern.tagline}</p>
        {pattern.scenes.length > 1 && (
          <div className="mb-2 flex gap-2">
            {pattern.scenes.map((s, i) => (
              <button key={s.name} onClick={() => setSceneIdx(i)} className={`rounded-lg px-3 py-1 text-xs ${i === sceneIdx ? "bg-sand/80 text-night" : "bg-ivory/5 text-ivory/70"}`}>
                {s.name}
              </button>
            ))}
          </div>
        )}
        <p className="mb-2 rounded-lg bg-night/50 px-3 py-2 text-xs text-clay-light">Ejemplo: {scene.example}</p>
        <div className="w-full rounded-xl border border-ivory/10 bg-night/40">
          <FlowDiagram nodes={scene.nodes} edges={scene.edges} frames={scene.frames} frameIdx={runner.idx} height={scene.height ?? 260} packetMs={1100} />
        </div>
        <div className="mt-2 min-h-[3.5rem] space-y-0.5 font-mono text-xs text-ivory/70">
          {log.length === 0 && <span className="text-ivory/40">Pulsa «Ejecutar» y mira viajar el paquete por el diagrama.</span>}
          {log.slice(-3).map((l, i, arr) => (
            <div key={l} className={i === arr.length - 1 ? "text-ivory" : "text-ivory/50"}>
              {i === arr.length - 1 ? "▸ " : "  "}{l}
            </div>
          ))}
        </div>
      </Card>
      <PatternFicha id={pattern.id} />
    </div>
  );
}
