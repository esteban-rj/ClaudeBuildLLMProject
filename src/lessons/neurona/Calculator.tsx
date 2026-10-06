"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, Slider, Formula, PALETTE } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import { ACTS, ACT_ORDER, type ActName } from "./math";

const INPUTS = [
  { name: "¿Hace sol?", fmt: (v: number) => `${Math.round(v * 100)}%` },
  { name: "Temperatura", fmt: (v: number) => `${Math.round(15 + v * 20)} °C` },
  { name: "¿Tengo deberes?", fmt: (v: number) => (v > 0.66 ? "muchos" : v > 0.33 ? "algunos" : "pocos") },
];

const f2 = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);

export default function Calculator() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const [x, setX] = useState([0.8, 0.6, 0.3]);
  const [w, setW] = useState([1.5, 2.0, -2.5]);
  const [b, setB] = useState(-1.0);
  const [act, setAct] = useState<ActName>("sigmoide");
  const saidOn = useRef(false);
  const saidOff = useRef(false);

  const prods = x.map((xi, i) => xi * w[i]);
  const sum = prods.reduce((a, c) => a + c, 0);
  const z = sum + b;
  const y = ACTS[act].fn(z);
  const yNorm = act === "relu" ? Math.min(1, y / 3) : act === "tanh" ? (y + 1) / 2 : y;
  const decision = act === "tanh" ? y > 0 : act === "relu" ? y > 0 : y >= 0.5;

  useEffect(() => {
    setContext(
      `Paso 2 (calculadora): ejemplo "¿vamos a la playa?". Entradas x=[${x.map((v) => v.toFixed(2)).join(", ")}] (sol, temperatura, deberes), pesos w=[${w.map((v) => v.toFixed(2)).join(", ")}], sesgo b=${b.toFixed(2)}. Suma ponderada=${sum.toFixed(3)}, z=${z.toFixed(3)}, activación ${ACTS[act].label}, salida y=${y.toFixed(3)} → ${decision ? "va a la playa" : "se queda en casa"}.`,
    );
  }, [x, w, b, act, sum, z, y, decision, setContext]);

  // Comentarios puntuales de Clawd (solo una vez cada uno)
  const comment = (nextZ: number) => {
    if (nextZ < -1.5 && !saidOff.current) {
      saidOff.current = true;
      guide.say("Uy, la suma se ha ido muy a negativo: la neurona dice que ni hablar de playa.", "surprised");
    } else if (nextZ > 2.5 && !saidOn.current) {
      saidOn.current = true;
      guide.say("¡Mira cómo se enciende! Con esa suma tan alta la neurona está casi segura: ¡a la playa!", "happy");
    }
  };
  const zFor = (nx: number[], nw: number[], nb: number) => nx.reduce((a, xi, i) => a + xi * nw[i], 0) + nb;

  const setXi = (i: number, v: number) => {
    const nx = x.map((o, j) => (j === i ? v : o));
    setX(nx);
    comment(zFor(nx, w, b));
  };
  const setWi = (i: number, v: number) => {
    const nw = w.map((o, j) => (j === i ? v : o));
    setW(nw);
    comment(zFor(x, nw, b));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Card title="¿Vamos a la playa? 🏖️">
        <svg viewBox="0 0 360 260" className="w-full">
          {[50, 130, 210].map((cy, i) => {
            const wi = w[i];
            const col = wi >= 0 ? PALETTE.clay : PALETTE.sky;
            return (
              <g key={cy}>
                <line x1={70} y1={cy} x2={230} y2={130} stroke={col} strokeWidth={1 + Math.abs(wi) * 2.5} opacity={0.35 + Math.min(0.65, Math.abs(wi) / 3)} />
                <text x={150} y={cy + (130 - cy) * 0.5 - 8} textAnchor="middle" fill={col} fontSize={12} fontFamily="monospace">×{wi.toFixed(2)}</text>
                <circle cx={45} cy={cy} r={24} fill={`rgba(106,155,204,${0.15 + x[i] * 0.6})`} stroke="#6A9BCC" strokeWidth={2} />
                <text x={45} y={cy + 4} textAnchor="middle" fill="#F0EEE6" fontSize={12} fontFamily="monospace">{x[i].toFixed(2)}</text>
              </g>
            );
          })}
          <motion.circle cx={250} cy={130} r={36} stroke={PALETTE.clay} strokeWidth={3} animate={{ fill: `rgba(217,119,87,${0.1 + yNorm * 0.85})` }} transition={{ duration: 0.2 }} />
          <text x={250} y={126} textAnchor="middle" fill="#F0EEE6" fontSize={12}>z={z.toFixed(2)}</text>
          <text x={250} y={143} textAnchor="middle" fill="#F0EEE6" fontSize={12}>y={y.toFixed(2)}</text>
          <line x1={286} y1={130} x2={330} y2={130} stroke={PALETTE.clay} strokeWidth={3} />
          <text x={250} y={195} textAnchor="middle" fill="#E8A387" fontSize={11}>sesgo b = {b.toFixed(2)}</text>
          <text x={345} y={135} textAnchor="middle" fontSize={20}>{decision ? "🏖️" : "🏠"}</text>
        </svg>
        <div className="mt-2 rounded-xl bg-night/50 p-3 font-mono text-xs leading-6">
          {prods.map((p, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="text-ivory/60">{INPUTS[i].name}</span>
              <span>
                <span className="text-sky">{x[i].toFixed(2)}</span> × <span className={w[i] >= 0 ? "text-clay" : "text-sky"}>{w[i].toFixed(2)}</span> = <b>{f2(p)}</b>
              </span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-ivory/10 pt-1">
            <span className="text-ivory/60">suma + sesgo</span>
            <span>
              {sum.toFixed(2)} {f2(b)} = <b className="text-clay-light">z = {z.toFixed(2)}</b>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ivory/60">activación</span>
            <span>
              {ACTS[act].label}({z.toFixed(2)}) = <b className="text-clay">{y.toFixed(3)}</b>
            </span>
          </div>
        </div>
        <p className="mt-3 text-center text-base text-ivory">{decision ? "¡A la playa!" : "Mejor me quedo en casa."}</p>
      </Card>

      <div className="grid gap-4">
        <Card title="Entradas (la situación)">
          <div className="grid gap-3">
            {INPUTS.map((inp, i) => (
              <Slider key={inp.name} label={inp.name} value={x[i]} min={0} max={1} onChange={(v) => setXi(i, v)} format={() => `${x[i].toFixed(2)} · ${inp.fmt(x[i])}`} color={PALETTE.sky} />
            ))}
          </div>
        </Card>
        <Card title="Pesos y sesgo (la personalidad)">
          <div className="grid gap-3">
            {["Peso del sol w₁", "Peso de la temperatura w₂", "Peso de los deberes w₃"].map((l, i) => (
              <Slider key={l} label={l} value={w[i]} min={-3} max={3} onChange={(v) => setWi(i, v)} />
            ))}
            <Slider label="Sesgo b (ganas de salir de base)" value={b} min={-3} max={3} onChange={(v) => { setB(v); comment(zFor(x, w, v)); }} color={PALETTE.clayLight} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACT_ORDER.map((a) => (
              <button key={a} onClick={() => setAct(a)} className={`rounded-full px-3 py-1 text-xs ${act === a ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70"}`}>
                {ACTS[a].label}
              </button>
            ))}
          </div>
          <Formula>z = x₁·w₁ + x₂·w₂ + x₃·w₃ + b → y = f(z)</Formula>
          <p className="text-xs text-ivory/50">Un peso negativo (azul) significa «esto me quita las ganas». Prueba a poner los deberes al máximo.</p>
        </Card>
      </div>
    </div>
  );
}
