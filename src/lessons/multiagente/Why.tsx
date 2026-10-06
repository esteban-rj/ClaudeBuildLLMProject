"use client";
import { useState } from "react";
import { Card, PALETTE, Slider } from "@/components/ui";

const WINDOW = 200_000;
const PER_ITEM = 12_000; // tokens de contexto que ocupa cada lección/archivo
const MIN_PER_ITEM = 4; // minutos que tarda un agente en cada uno

function Bar({ label, value, max, color, note }: { label: string; value: number; max: number; color: string; note?: string }) {
  const over = value > max;
  return (
    <div className="mb-2">
      <div className="mb-0.5 flex justify-between text-xs text-ivory/70">
        <span>{label}</span>
        <span className="font-mono" style={{ color: over ? PALETTE.rose : color }}>{note}</span>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full bg-night/70">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: over ? PALETTE.rose : color }} />
      </div>
    </div>
  );
}

export default function Why() {
  const [items, setItems] = useState(14);
  const [agents, setAgents] = useState(5);
  const per = Math.ceil(items / agents);
  const ctxSingle = items * PER_ITEM;
  const ctxMulti = per * PER_ITEM;
  const tSingle = items * MIN_PER_ITEM;
  const tMulti = per * MIN_PER_ITEM + 2;

  return (
    <div className="space-y-3">
      <Card title="🐝 ¿Por qué usar varios agentes?">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-night/50 p-3">
            <h4 className="mb-1 font-semibold text-clay-light">1. El contexto es limitado</h4>
            <p>Un agente lo guarda todo en su ventana de contexto. Si lees 14 archivos de 12.000 tokens cada uno, se acabó el espacio y empieza a olvidar o a confundirse. Un sub-agente trabaja en su propio contexto limpio y solo devuelve un <i>resumen</i>.</p>
          </div>
          <div className="rounded-xl bg-night/50 p-3">
            <h4 className="mb-1 font-semibold text-clay-light">2. El trabajo se puede paralelizar</h4>
            <p>Si las subtareas no dependen unas de otras (por ejemplo, escribir lecciones distintas), pueden hacerse a la vez. Cinco manos tardan casi cinco veces menos que una.</p>
          </div>
        </div>
      </Card>
      <Card title="Pruébalo: un agente solo vs. un equipo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Piezas de trabajo (archivos / lecciones)" value={items} min={2} max={30} step={1} onChange={setItems} format={(v) => `${v}`} />
          <Slider label="Nº de sub-agentes" value={agents} min={1} max={8} step={1} onChange={setAgents} format={(v) => `${v}`} color={PALETTE.sky} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ivory/60">Contexto máximo que debe sostener cada agente</h4>
            <Bar label="1 agente solo" value={ctxSingle} max={WINDOW} color={PALETTE.clay} note={`${(ctxSingle / 1000).toFixed(0)}k / 200k${ctxSingle > WINDOW ? " ¡desborda!" : ""}`} />
            <Bar label={`Cada uno de los ${agents} sub-agentes`} value={ctxMulti} max={WINDOW} color={PALETTE.sky} note={`${(ctxMulti / 1000).toFixed(0)}k / 200k`} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ivory/60">Tiempo total (estimado)</h4>
            <Bar label="1 agente solo" value={tSingle} max={Math.max(tSingle, 1)} color={PALETTE.clay} note={`${tSingle} min`} />
            <Bar label={`${agents} en paralelo`} value={tMulti} max={Math.max(tSingle, 1)} color={PALETTE.sky} note={`${tMulti} min (≈ ${(tSingle / tMulti).toFixed(1)}× más rápido)`} />
          </div>
        </div>
        <p className="mt-3 text-xs text-ivory/60">Supuestos: {PER_ITEM.toLocaleString("es")} tokens y {MIN_PER_ITEM} min por pieza; +2 min para repartir y juntar. Cada sub-agente se encarga de {per} pieza{per > 1 ? "s" : ""}.</p>
      </Card>
    </div>
  );
}
