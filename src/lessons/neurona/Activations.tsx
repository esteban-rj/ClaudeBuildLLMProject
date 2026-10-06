"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Slider, Button, Formula, PALETTE } from "@/components/ui";
import { useGuideStore } from "@/lib/guide-store";
import { ACTS, ACT_ORDER, type ActName } from "./math";

const W = 420;
const H = 260;
const PAD = 30;
const Z_MIN = -6;
const Z_MAX = 6;

const COLORS: Record<ActName, string> = { escalon: PALETTE.sand, sigmoide: PALETTE.clay, relu: PALETTE.olive, tanh: PALETTE.sky };

export default function Activations() {
  const setContext = useGuideStore((s) => s.setSceneContext);
  const [act, setAct] = useState<ActName>("sigmoide");
  const [z, setZ] = useState(1);
  const [auto, setAuto] = useState(false);
  const t0 = useRef(0);

  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    const loop = (t: number) => {
      if (!t0.current) t0.current = t;
      setZ(Math.sin((t - t0.current) / 1400) * 5.5);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      t0.current = 0;
    };
  }, [auto]);

  const info = ACTS[act];
  const [yLo, yHi] = info.range;
  const sx = (v: number) => PAD + ((v - Z_MIN) / (Z_MAX - Z_MIN)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yLo) / (yHi - yLo)) * (H - 2 * PAD);

  let d = "";
  for (let i = 0; i <= 240; i++) {
    const zz = Z_MIN + (i / 240) * (Z_MAX - Z_MIN);
    const yy = Math.min(yHi, Math.max(yLo, info.fn(zz)));
    // corte vertical en el escalón para que se vea el salto
    d += `${i === 0 ? "M" : act === "escalon" && zz >= 0 && zz - (Z_MAX - Z_MIN) / 240 < 0 ? "M" : "L"}${sx(zz).toFixed(1)},${sy(yy).toFixed(1)} `;
  }
  const y = info.fn(z);
  const yc = Math.min(yHi, Math.max(yLo, y));

  useEffect(() => {
    setContext(
      `Paso 3 (funciones de activación): viendo ${info.label}. z=${z.toFixed(2)} → ${ACT_ORDER.map((a) => `${ACTS[a].label}=${ACTS[a].fn(z).toFixed(3)}`).join(", ")}.`,
    );
  }, [info, z, setContext]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Card
        title={`Activación: ${info.label}`}
        actions={
          <Button variant={auto ? "primary" : "ghost"} onClick={() => setAuto((a) => !a)}>
            {auto ? "Pausar" : "Animar z"}
          </Button>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {ACT_ORDER.map((a) => (
            <button key={a} onClick={() => setAct(a)} className="rounded-full px-3 py-1 text-xs transition" style={act === a ? { background: COLORS[a], color: "#141413" } : { background: "rgba(240,238,230,0.05)", color: "rgba(240,238,230,0.7)" }}>
              {ACTS[a].label}
            </button>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-night/40">
          {[-6, -4, -2, 0, 2, 4, 6].map((v) => (
            <g key={v}>
              <line x1={sx(v)} x2={sx(v)} y1={PAD} y2={H - PAD} stroke="#F0EEE6" opacity={v === 0 ? 0.35 : 0.08} />
              <text x={sx(v)} y={H - 10} textAnchor="middle" fill="#F0EEE6" opacity={0.5} fontSize={10}>{v}</text>
            </g>
          ))}
          {[yLo, 0, yHi].filter((v, i, arr) => arr.indexOf(v) === i).map((v) => (
            <line key={v} x1={PAD} x2={W - PAD} y1={sy(v)} y2={sy(v)} stroke="#F0EEE6" opacity={v === 0 ? 0.35 : 0.08} />
          ))}
          {[1, -1].filter((v) => v > yLo && v < yHi).map((v) => (
            <g key={v}>
              <line x1={PAD} x2={W - PAD} y1={sy(v)} y2={sy(v)} stroke={COLORS[act]} strokeDasharray="4 4" opacity={0.3} />
              <text x={PAD - 6} y={sy(v) + 4} textAnchor="end" fill="#F0EEE6" opacity={0.5} fontSize={10}>{v}</text>
            </g>
          ))}
          <text x={PAD - 6} y={sy(0) + 4} textAnchor="end" fill="#F0EEE6" opacity={0.5} fontSize={10}>0</text>
          <path d={d} fill="none" stroke={COLORS[act]} strokeWidth={3} />
          <line x1={sx(z)} x2={sx(z)} y1={sy(0)} y2={sy(yc)} stroke="#F0EEE6" strokeDasharray="3 3" opacity={0.6} />
          <line x1={PAD} x2={sx(z)} y1={sy(yc)} y2={sy(yc)} stroke="#F0EEE6" strokeDasharray="3 3" opacity={0.4} />
          <circle cx={sx(z)} cy={sy(yc)} r={8} fill={COLORS[act]} stroke="#141413" strokeWidth={2} />
          <text x={W - PAD} y={PAD - 8} textAnchor="end" fill="#F0EEE6" fontSize={12}>f({z.toFixed(2)}) = {y.toFixed(3)}</text>
          <text x={W - PAD} y={H - 10} textAnchor="end" fill="#F0EEE6" opacity={0.5} fontSize={10}>z →</text>
        </svg>
        <div className="mt-3">
          <Slider label="Suma de entrada z" value={z} min={-6} max={6} onChange={(v) => { setAuto(false); setZ(v); }} />
        </div>
      </Card>

      <div className="grid gap-4">
        <Card title="¿Para qué sirve?">
          <Formula>{info.formula}</Formula>
          <p>{info.desc}</p>
        </Card>
        <Card title={`Las cuatro con z = ${z.toFixed(2)}`}>
          <div className="grid gap-2">
            {ACT_ORDER.map((a) => {
              const v = ACTS[a].fn(z);
              const [lo, hi] = ACTS[a].range;
              const pct = ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100;
              return (
                <button key={a} onClick={() => setAct(a)} className="text-left">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: COLORS[a] }}>{ACTS[a].label}</span>
                    <span className="font-mono">{v.toFixed(3)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-ivory/10">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[a] }} />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ivory/50">¿Por qué no usar f(z) = z y ya? Porque sin una curva «doblada», apilar neuronas sería como apilar rectas: seguirías teniendo una recta. La no linealidad es el ingrediente secreto.</p>
        </Card>
      </div>
    </div>
  );
}
