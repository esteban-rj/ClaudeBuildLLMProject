"use client";
import { useEffect, useState } from "react";
import { Card, Slider, Button, Formula } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import { sigmoid } from "./nn";

// Red 2-3-1 con pesos fijos (ReLU oculta, sigmoide salida) para poder seguir cada cuenta
const W1 = [[1, -1], [0.5, 1], [-1, 0.5]];
const B1 = [0, -0.5, 0.2];
const W2 = [1.2, -0.8, 1.5];
const B2 = -0.3;
const f = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

export default function ForwardPass() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const [x, setX] = useState([0.8, 0.5]);
  const [stage, setStage] = useState(0);

  const z1 = W1.map((r, j) => r[0] * x[0] + r[1] * x[1] + B1[j]);
  const h = z1.map((z) => Math.max(0, z));
  const z2 = W2.reduce((s, w, j) => s + w * h[j], B2);
  const y = sigmoid(z2);

  useEffect(() => {
    setContext(`Paso 2 (forward pass 2-3-1): entradas x=(${x[0].toFixed(2)}, ${x[1].toFixed(2)}), oculta h=(${h.map((v) => v.toFixed(2)).join(", ")}) con ReLU, salida=${y.toFixed(3)}. Etapa mostrada: ${stage}/2.`);
  }, [x, h, y, stage, setContext]);

  const next = () => {
    const s = Math.min(2, stage + 1);
    setStage(s);
    if (s === 2) guide.say(`¡Salida de la red: ${y.toFixed(2)}! Todo el forward pass son multiplicaciones, sumas y una activación, capa tras capa.`, "happy");
  };

  const nodeY = (n: number, i: number) => 50 + (i - (n - 1) / 2) * 70;
  const xs = [60, 230, 400];
  const vals: (number | null)[][] = [x, stage >= 1 ? h : [null, null, null], stage >= 2 ? [y] : [null]];
  const sizes = [2, 3, 1];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Una red 2 → 3 → 1">
        <svg viewBox="0 0 460 200" className="w-full">
          {W1.map((r, j) => r.map((w, i) => (
            <line key={`a${j}${i}`} x1={xs[0]} y1={nodeY(2, i)} x2={xs[1]} y2={nodeY(3, j)} stroke={w >= 0 ? "#D97757" : "#6A9BCC"} strokeWidth={1 + Math.abs(w) * 2.5} opacity={stage >= 1 ? 0.9 : 0.35} />
          )))}
          {W2.map((w, j) => (
            <line key={`b${j}`} x1={xs[1]} y1={nodeY(3, j)} x2={xs[2]} y2={nodeY(1, 0)} stroke={w >= 0 ? "#D97757" : "#6A9BCC"} strokeWidth={1 + Math.abs(w) * 2.5} opacity={stage >= 2 ? 0.9 : 0.35} />
          ))}
          {sizes.map((n, l) => Array.from({ length: n }, (_, i) => {
            const v = vals[l][i];
            return (
              <g key={`${l}${i}`}>
                <circle cx={xs[l]} cy={nodeY(n, i)} r={22} fill={v === null ? "#1F1E1B" : "#2a2926"} stroke={v === null ? "#555" : "#F0EEE6"} strokeWidth={2} />
                <text x={xs[l]} y={nodeY(n, i) + 4} textAnchor="middle" fontSize={12} fill="#F0EEE6" fontFamily="monospace">{v === null ? "?" : v.toFixed(2)}</text>
              </g>
            );
          }))}
          <text x={xs[0]} y={14} textAnchor="middle" fontSize={11} fill="#8A8A85">entrada</text>
          <text x={xs[1]} y={14} textAnchor="middle" fontSize={11} fill="#8A8A85">oculta (ReLU)</text>
          <text x={xs[2]} y={14} textAnchor="middle" fontSize={11} fill="#8A8A85">salida (sigmoide)</text>
        </svg>
        <div className="grid gap-3">
          <Slider label="x₁" value={x[0]} min={-1} max={1} onChange={(v) => setX([v, x[1]])} />
          <Slider label="x₂" value={x[1]} min={-1} max={1} onChange={(v) => setX([x[0], v])} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={next} disabled={stage >= 2}>Siguiente capa →</Button>
          <Button onClick={() => setStage(0)} variant="ghost">Reiniciar</Button>
        </div>
      </Card>
      <Card title="Las cuentas, una por una">
        <p className="mb-2">Cada neurona oculta: <b className="text-ivory">z = w₁·x₁ + w₂·x₂ + b</b>, y luego ReLU = max(0, z).</p>
        {stage === 0 && <p className="text-ivory/60">Pulsa «Siguiente capa» para calcular la capa oculta. Antes puedes mover las entradas.</p>}
        {stage >= 1 && W1.map((r, j) => (
          <Formula key={j}>
            h{j + 1} = max(0, {f(r[0])}·{f(x[0])} + {f(r[1])}·{f(x[1])} {B1[j] < 0 ? "−" : "+"} {Math.abs(B1[j]).toFixed(2)}) = max(0, {f(z1[j])}) = {h[j].toFixed(2)}
          </Formula>
        ))}
        {stage >= 2 && (
          <>
            <p className="mt-2">La salida repite la receta con las h como entradas, y la sigmoide:</p>
            <Formula>z = {W2.map((w, j) => `${f(w)}·${h[j].toFixed(2)}`).join(" + ")} {B2 < 0 ? "−" : "+"} {Math.abs(B2).toFixed(2)} = {f(z2)}</Formula>
            <Formula>y = σ({f(z2)}) = {y.toFixed(3)}</Formula>
          </>
        )}
        <p className="mt-3 text-xs text-ivory/50">Esto es el «forward pass»: la información solo va hacia adelante, capa a capa. Mueve las entradas y verás cómo cambia todo.</p>
      </Card>
    </div>
  );
}
