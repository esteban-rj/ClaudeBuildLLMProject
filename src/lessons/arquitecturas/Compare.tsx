"use client";
import { useState } from "react";
import { Card, PALETTE } from "@/components/ui";
import { Dots } from "./Gallery";
import { AXES, PATTERNS } from "./patterns";

const COLORS = [PALETTE.clay, PALETTE.sky];

function Radar({ a, b }: { a: (typeof PATTERNS)[number]; b: (typeof PATTERNS)[number] }) {
  const cx = 160, cy = 150, R = 100;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const pt = (i: number, v: number): [number, number] => [cx + Math.cos(ang(i)) * R * (v / 5), cy + Math.sin(ang(i)) * R * (v / 5)];
  const poly = (p: (typeof PATTERNS)[number]) => AXES.map((ax, i) => pt(i, p.scores[ax.key]).join(",")).join(" ");
  return (
    <svg viewBox="0 0 320 300" className="mx-auto w-full max-w-sm">
      {[1, 2, 3, 4, 5].map((lv) => (
        <polygon key={lv} points={AXES.map((_, i) => pt(i, lv).join(",")).join(" ")} fill="none" stroke={PALETTE.ivory} strokeOpacity={0.12} />
      ))}
      {AXES.map((ax, i) => {
        const [x, y] = pt(i, 5.9);
        return (
          <g key={ax.key}>
            <line x1={cx} y1={cy} x2={pt(i, 5)[0]} y2={pt(i, 5)[1]} stroke={PALETTE.ivory} strokeOpacity={0.12} />
            <text x={x} y={y + 3} textAnchor="middle" fontSize={10} fill={PALETTE.ivory} fillOpacity={0.75}>{ax.label}</text>
          </g>
        );
      })}
      {[a, b].map((p, k) => (
        <polygon key={p.id + k} points={poly(p)} fill={COLORS[k]} fillOpacity={0.22} stroke={COLORS[k]} strokeWidth={2} style={{ transition: "all .4s" }} />
      ))}
      {[a, b].map((p, k) => AXES.map((ax, i) => {
        const [x, y] = pt(i, p.scores[ax.key]);
        return <circle key={`${p.id}${k}${ax.key}`} cx={x} cy={y} r={3} fill={COLORS[k]} />;
      }))}
    </svg>
  );
}

export default function Compare({ onPick }: { onPick?: (a: string, b: string) => void }) {
  const [sel, setSel] = useState<[string, string]>(["chaining", "react"]);
  const a = PATTERNS.find((p) => p.id === sel[0])!;
  const b = PATTERNS.find((p) => p.id === sel[1])!;

  const toggle = (id: string) => {
    if (sel.includes(id)) return;
    const next: [string, string] = [sel[1], id];
    setSel(next);
    onPick?.(next[0], next[1]);
  };

  return (
    <Card title="⚖️ Compara dos patrones">
      <p className="mb-3">Elige dos patrones (el último que toques sustituye al más antiguo). Más en «Coste» y «Latencia» es peor; más en «Autonomía» y «Tareas abiertas» es más libertad (y más riesgo).</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {PATTERNS.map((p) => {
          const k = sel.indexOf(p.id);
          return (
            <button key={p.id} onClick={() => toggle(p.id)} className={`rounded-full px-3 py-1.5 text-xs transition ${k >= 0 ? "text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`} style={k >= 0 ? { background: COLORS[k] } : undefined}>
              {p.emoji} {p.name}
            </button>
          );
        })}
      </div>
      <div className="grid items-center gap-4 md:grid-cols-2">
        <Radar a={a} b={b} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                <th className="py-1 pr-2 text-ivory/50">Eje</th>
                <th className="py-1 pr-2" style={{ color: COLORS[0] }}>{a.name}</th>
                <th className="py-1" style={{ color: COLORS[1] }}>{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {AXES.map((ax) => (
                <tr key={ax.key} className="border-t border-ivory/10" title={ax.hint}>
                  <td className="py-1.5 pr-2 text-ivory/70">{ax.label}</td>
                  <td className="pr-2"><Dots level={a.scores[ax.key]} color={COLORS[0]} /></td>
                  <td><Dots level={b.scores[ax.key]} color={COLORS[1]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 space-y-2 text-xs text-ivory/70">
            {[a, b].map((p, k) => (
              <p key={p.id}><b style={{ color: COLORS[k] }}>{p.name}:</b> {p.tagline}</p>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
