"use client";
import { useMemo, useRef, useState } from "react";
import { Card, Slider } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { useSceneContext } from "../atencion/bits";
import { HEADS, SENTENCE, headMatrix } from "./math";

function Heatmap({ m, color, sel, onSel }: { m: number[][]; color: string; sel: [number, number]; onSel: (c: [number, number]) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-xs">
        <thead>
          <tr>
            <th />
            {SENTENCE.map((t, j) => (
              <th key={j} className="px-1 pb-1 font-serif font-normal text-ivory/60">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              <th className="pr-2 text-right font-serif font-normal text-ivory/60">{SENTENCE[i]}</th>
              {row.map((w, j) => (
                <td key={j}>
                  <button
                    onClick={() => onSel([i, j])}
                    className={`flex h-9 w-11 items-center justify-center rounded font-mono text-[10px] text-ivory ${sel[0] === i && sel[1] === j ? "ring-2 ring-ivory" : ""}`}
                    style={{ background: color, opacity: 0.12 + w * 0.88 }}
                  >
                    {w.toFixed(2)}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StepHeads() {
  const guide = useGuide();
  const [h, setH] = useState(2);
  const [temp, setTemp] = useState(1);
  const [sel, setSel] = useState<[number, number]>([3, 0]);
  const seen = useRef(new Set<number>());
  const head = HEADS[h];
  const m = useMemo(() => headMatrix(head, temp), [head, temp]);

  useSceneContext(`Paso 1 (por qué varias cabezas). Frase: "${SENTENCE.join(" ")}". Cabeza seleccionada: ${head.name} (${head.desc}). Temperatura del softmax ${temp.toFixed(1)}. Celda: "${SENTENCE[sel[0]]}" mira a "${SENTENCE[sel[1]]}" con peso ${m[sel[0]][sel[1]].toFixed(2)}.`);

  const pick = (i: number) => {
    setH(i);
    if (!seen.current.has(i) && seen.current.size === 1) {
      guide.say("¿Ves? La misma frase, pero otra cabeza mira cosas totalmente distintas. Por eso se usan varias a la vez.", "surprised");
    }
    seen.current.add(i);
  };

  return (
    <div className="grid gap-4">
      <Card title="Una sola atención no basta">
        Una palabra necesita enterarse de muchas cosas a la vez: quién es su sujeto, a quién se refiere, qué viene antes... Una única
        atención tiene que mezclarlo todo en un solo reparto de pesos. La solución: <b>varias cabezas</b>, cada una con sus propias
        Q, K y V, que se especializan. Elige una cabeza y mira su mapa (el softmax se calcula de verdad en cada fila).
      </Card>
      <div className="flex flex-wrap gap-2">
        {HEADS.map((x, i) => (
          <button
            key={x.id}
            onClick={() => pick(i)}
            className={`rounded-xl border px-3 py-2 text-sm transition ${i === h ? "text-night" : "border-ivory/10 bg-ivory/5 text-ivory/80 hover:bg-ivory/10"}`}
            style={i === h ? { background: x.color, borderColor: x.color } : undefined}
          >
            {x.emoji} Cabeza {i + 1}: {x.name}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card title={`${head.emoji} ${head.name}`}>
          <Heatmap m={m} color={head.color} sel={sel} onSel={setSel} />
          <p className="mt-2 text-xs text-ivory/60">Fila = quien pregunta, columna = a quién mira. Cada fila suma 1. Haz clic en una celda.</p>
        </Card>
        <div className="grid content-start gap-4">
          <Card title="¿Qué hace esta cabeza?">
            <p>{head.desc}</p>
            <p className="mt-2">
              «<b>{SENTENCE[sel[0]]}</b>» presta un <b style={{ color: head.color }}>{(m[sel[0]][sel[1]] * 100).toFixed(0)}%</b> de su atención a «<b>{SENTENCE[sel[1]]}</b>».
            </p>
            <div className="mt-3">
              <Slider label="Temperatura del softmax (picudo ↔ plano)" value={temp} min={0.3} max={3} step={0.1} onChange={setTemp} format={(v) => v.toFixed(1)} color={head.color} />
            </div>
          </Card>
          <Card title="Todas las cabezas, en una fila">
            <div className="grid gap-1.5">
              {HEADS.map((x) => {
                const row = headMatrix(x)[sel[0]];
                return (
                  <div key={x.id} className="flex items-center gap-2">
                    <span className="w-24 truncate text-xs text-ivory/60">{x.name}</span>
                    <div className="flex flex-1 gap-0.5">
                      {row.map((w, j) => (
                        <div key={j} className="flex h-6 flex-1 items-center justify-center rounded text-[9px] text-ivory" style={{ background: x.color, opacity: 0.12 + w * 0.88 }}>
                          {SENTENCE[j]}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ivory/60">Fila de «{SENTENCE[sel[0]]}» en cada cabeza: cada una la ve distinto.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
