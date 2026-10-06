"use client";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Formula, Slider } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { DK, K, Q, TOKENS, V, attendRow, fmt } from "./math";
import { TokenPicker, VecCells, useSceneContext } from "./bits";

const STAGES = [
  { name: "Producto punto", text: "Comparamos la Query del token con la Key de cada token (incluido él mismo) multiplicando componente a componente y sumando. Número alto = encajan bien." },
  { name: "Escalar por √d_k", text: `Dividimos entre √d_k = √${DK} = ${Math.sqrt(DK)}. Con vectores de miles de dimensiones los productos punto se hacen enormes y el softmax se volvería todo-o-nada; escalar lo mantiene estable.` },
  { name: "Softmax", text: "Convertimos las puntuaciones en porcentajes: eˣ de cada una dividido entre la suma de todas. Todo positivo y suma 1. Mueve la temperatura para ver cómo cambia." },
  { name: "Suma ponderada de V", text: "El nuevo vector del token es la mezcla de los Values de todos, cada uno multiplicado por su peso. ¡El token ha absorbido información de quien le importaba!" },
];

export default function StepCalc() {
  const guide = useGuide();
  const [tok, setTok] = useState(7);
  const [stage, setStage] = useState(0);
  const [temp, setTemp] = useState(1);
  const said = useRef<Set<string>>(new Set());
  const calc = useMemo(() => attendRow(tok, temp), [tok, temp]);
  const best = calc.weights.indexOf(Math.max(...calc.weights));
  const sumExp = calc.scaled.reduce((s, x) => s + Math.exp(x), 0);

  useSceneContext(
    `Paso 3 (cálculo paso a paso). Query de "${TOKENS[tok]}" = [${Q[tok].map((v) => fmt(v)).join(", ")}]. Etapa ${stage + 1}/4: ${STAGES[stage].name}. Temperatura extra T=${temp.toFixed(2)} (se divide por √d_k·T). Productos punto: ${calc.raw.map((r, j) => `${TOKENS[j]}=${fmt(r)}`).join(", ")}. Pesos softmax: ${calc.weights.map((w, j) => `${TOKENS[j]}=${(w * 100).toFixed(1)}%`).join(", ")}. Salida=[${calc.out.map((v) => fmt(v)).join(", ")}].`,
  );

  const sayOnce = (key: string, text: string, mood: Parameters<typeof guide.say>[1] = "explaining") => {
    if (said.current.has(key)) return;
    said.current.add(key);
    guide.say(text, mood);
  };

  const next = () => {
    const s = Math.min(3, stage + 1);
    setStage(s);
    if (s === 2) sayOnce("softmax", "Softmax convierte cualquier lista de números en porcentajes que suman 100. Los grandes se hacen aún más grandes.");
    if (s === 3) sayOnce("sum", "Y aquí la magia: el nuevo vector es una mezcla de los Values, sobre todo del token al que más atención presta.", "happy");
  };

  const onTemp = (t: number) => {
    setTemp(t);
    if (t < 0.4) sayOnce("cold", "Con temperatura baja el softmax se vuelve picudo: casi toda la atención va a un solo token.", "surprised");
    if (t > 2.4) sayOnce("hot", "Con temperatura alta se aplana: el token reparte su atención casi por igual y pierde el foco.", "thinking");
  };

  const maxAbsRaw = Math.max(...calc.raw.map(Math.abs), 1);

  return (
    <div className="grid gap-4">
      <Card title="La fórmula, sin miedo">
        <Formula>Atención(Q, K, V) = softmax( Q·Kᵀ / √d_k ) · V</Formula>
        <p>Vamos a calcularla de verdad para un token, operación por operación. Elige qué token pregunta:</p>
        <div className="mt-2">
          <TokenPicker tokens={TOKENS} value={tok} onChange={setTok} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {STAGES.map((s, i) => (
            <button key={s.name} onClick={() => setStage(i)} className={`rounded-full px-3 py-1 text-xs transition ${i === stage ? "bg-sky text-night" : i < stage ? "bg-sky/20 text-sky" : "bg-ivory/5 text-ivory/50"}`}>
              {String.fromCharCode(97 + i)}) {s.name}
            </button>
          ))}
          {stage < 3 && (
            <Button onClick={next} className="ml-auto">
              Siguiente operación →
            </Button>
          )}
        </div>
        <p className="mt-2 text-ivory/70">{STAGES[stage].text}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto rounded-2xl border border-ivory/10 bg-night/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-ivory/60">
            <VecCells v={Q[tok]} label="q" color="#D97757" max={3} size="sm" />
            <span>← Query de «{TOKENS[tok]}»</span>
          </div>
          <table className="w-full min-w-[560px] text-xs">
            <thead>
              <tr className="text-left text-ivory/50">
                <th className="py-1 font-normal">token</th>
                <th className="font-normal text-sky">Key kⱼ</th>
                <th className="font-normal">q·kⱼ</th>
                <th className={`font-normal ${stage < 1 ? "opacity-20" : ""}`}>÷ √d_k·T</th>
                <th className={`w-[30%] font-normal ${stage < 2 ? "opacity-20" : ""}`}>softmax</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((t, j) => (
                <tr key={t + j} className={`border-t border-ivory/5 ${j === best && stage >= 2 ? "bg-clay/10" : ""}`}>
                  <td className="py-1 font-serif text-sm text-ivory">{t}</td>
                  <td>
                    <VecCells v={K[j]} max={3} size="sm" />
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <div className="h-2 rounded bg-sky/60" style={{ width: `${(Math.abs(calc.raw[j]) / maxAbsRaw) * 40}px` }} />
                      <span className="font-mono">{fmt(calc.raw[j])}</span>
                    </div>
                  </td>
                  <td className={`font-mono transition ${stage < 1 ? "opacity-20" : ""}`}>{fmt(calc.scaled[j])}</td>
                  <td className={`transition ${stage < 2 ? "opacity-20" : ""}`}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 flex-1 rounded bg-ivory/5">
                        <motion.div className="h-3 rounded bg-clay" initial={false} animate={{ width: `${(stage >= 2 ? calc.weights[j] : 0) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
                      </div>
                      <span className="w-11 text-right font-mono">{(calc.weights[j] * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stage === 0 && (
            <Formula>
              q·k({TOKENS[best]}) = {Q[tok].map((q, i) => `${fmt(q, 1)}·${fmt(K[best][i], 1)}`).join(" + ")} = {fmt(calc.raw[best])}
            </Formula>
          )}
          {stage === 2 && (
            <Formula>
              peso({TOKENS[best]}) = e^{fmt(calc.scaled[best])} / Σ eˣ = {fmt(Math.exp(calc.scaled[best]))} / {fmt(sumExp)} = {(calc.weights[best] * 100).toFixed(1)}%
            </Formula>
          )}
        </div>

        <div className="grid content-start gap-3">
          <Card title="Temperatura">
            <Slider label="T (escala extra)" value={temp} min={0.15} max={3} step={0.05} onChange={onTemp} />
            <p className="mt-2 text-xs text-ivory/60">Dividimos las puntuaciones entre √d_k·T. T = 1 es la atención estándar. T pequeña → más picudo; T grande → más plano.</p>
            <p className="mt-2 text-xs">
              Máximo: <b className="text-clay">{TOKENS[best]}</b> con {(calc.weights[best] * 100).toFixed(1)}%
            </p>
          </Card>
          <Card title="Resultado">
            {stage < 3 ? (
              <p className="text-xs text-ivory/50">Llega a la operación d) para ver el nuevo vector.</p>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-1.5">
                {TOKENS.map((t, j) =>
                  calc.weights[j] > 0.05 ? (
                    <div key={t + j} className="flex items-center gap-1 text-[10px]">
                      <span className="w-12 text-right font-mono text-ivory/60">{(calc.weights[j] * 100).toFixed(0)}%·</span>
                      <VecCells v={V[j]} max={2} size="sm" />
                      <span className="truncate font-serif text-ivory/50">{t}</span>
                    </div>
                  ) : null,
                )}
                <div className="text-center text-[10px] text-ivory/40">+ el resto (pesos pequeños)</div>
                <div className="border-t border-ivory/10 pt-2">
                  <VecCells v={calc.out} label="nuevo" color="#E3C77B" max={1.5} size="sm" />
                </div>
                <p className="text-[11px] text-ivory/60">
                  {best === 1 && tok !== 1 && calc.weights[1] > 0.4
                    ? `Compáralo con el Value de «gato»: el nuevo «${TOKENS[tok]}» ha ganado mucho en la dimensión «ser vivo». ¡Ahora «sabe» que va de un gato!`
                    : calc.weights[best] > 0.4
                    ? `El nuevo «${TOKENS[tok]}» ha absorbido sobre todo el Value de «${TOKENS[best]}».`
                    : `El nuevo «${TOKENS[tok]}» es una mezcla bastante repartida: su Query no encaja especialmente con ninguna Key.`}
                </p>
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
