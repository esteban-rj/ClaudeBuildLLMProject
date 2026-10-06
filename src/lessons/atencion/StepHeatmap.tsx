"use client";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { TOKENS, attentionMatrix } from "./math";
import { useSceneContext } from "./bits";

export default function StepHeatmap() {
  const guide = useGuide();
  const [causal, setCausal] = useState(false);
  const [cell, setCell] = useState<[number, number]>([7, 1]);
  const said = useRef(false);
  const A = useMemo(() => attentionMatrix(causal), [causal]);
  const [i, j] = cell;

  useSceneContext(
    `Paso 4 (mapa de atención N×N, ${TOKENS.length}×${TOKENS.length}). Máscara causal ${causal ? "ACTIVADA (cada token solo ve los anteriores y a sí mismo)" : "desactivada (cada token ve a todos)"}. Celda seleccionada: fila "${TOKENS[i]}" mira a columna "${TOKENS[j]}" con peso ${(A[i][j] * 100).toFixed(1)}%.`,
  );

  const toggle = () => {
    const c = !causal;
    setCausal(c);
    if (c && !said.current) {
      said.current = true;
      guide.say("¡Máscara causal activada! Un modelo que genera texto no puede mirar palabras que todavía no ha escrito, así que tapamos el triángulo de arriba con menos infinito.", "surprised");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="overflow-x-auto rounded-2xl border border-ivory/10 bg-night/60 p-3">
        <div className="mx-auto w-fit">
          <div className="flex">
            <div className="w-16 shrink-0 sm:w-20" />
            {TOKENS.map((t, c) => (
              <div key={t + c} className={`flex h-16 w-8 items-end justify-center pb-1 sm:w-11 ${c === j ? "text-clay" : "text-ivory/60"}`}>
                <span className="origin-bottom-left translate-x-2 -rotate-45 whitespace-nowrap font-serif text-[11px]">{t}</span>
              </div>
            ))}
          </div>
          {TOKENS.map((t, r) => (
            <div key={t + r} className="flex">
              <div className={`flex w-16 shrink-0 items-center justify-end pr-2 font-serif text-[11px] sm:w-20 ${r === i ? "text-clay" : "text-ivory/60"}`}>{t}</div>
              {A[r].map((w, c) => {
                const masked = causal && c > r;
                return (
                  <motion.button
                    key={c}
                    onMouseEnter={() => setCell([r, c])}
                    onClick={() => setCell([r, c])}
                    className={`relative m-px flex h-8 w-8 items-center justify-center rounded font-mono text-[9px] sm:h-11 sm:w-11 sm:text-[10px] ${r === i && c === j ? "ring-2 ring-sand" : ""}`}
                    initial={false}
                    animate={{ backgroundColor: masked ? "rgba(20,20,19,0.9)" : `rgba(217,119,87,${0.05 + Math.min(1, w * 1.6) * 0.95})` }}
                    transition={{ duration: 0.4, delay: masked ? (c - r) * 0.03 : 0 }}
                  >
                    {masked ? <span className="text-ivory/25">−∞</span> : <span className={w > 0.35 ? "text-night" : "text-ivory/80"}>{Math.round(w * 100)}</span>}
                  </motion.button>
                );
              })}
            </div>
          ))}
          <p className="mt-2 text-center text-[11px] text-ivory/50">Filas = quién pregunta (Query) · Columnas = a quién mira (Key) · números en %</p>
        </div>
      </div>

      <div className="grid content-start gap-3">
        <Card title="El mapa completo">
          <p>
            Si hacemos el cálculo del paso anterior para <b>todos</b> los tokens a la vez obtenemos una matriz {TOKENS.length}×{TOKENS.length}. Cada fila suma 100%. En una GPU esto es una sola multiplicación de matrices:
            Q·Kᵀ.
          </p>
          <div className="mt-3 rounded-lg bg-night/60 p-2 text-center">
            <span className="font-serif text-clay">{TOKENS[i]}</span> → <span className="font-serif text-sky">{TOKENS[j]}</span>
            <div className="font-mono text-2xl text-sand">{causal && j > i ? "bloqueado" : `${(A[i][j] * 100).toFixed(1)}%`}</div>
          </div>
        </Card>
        <Card title="Máscara causal">
          <Button onClick={toggle} variant={causal ? "primary" : "outline"} className="w-full">
            {causal ? "🔒 Máscara causal activada" : "Activar máscara causal"}
          </Button>
          <p className="mt-2 text-xs text-ivory/70">
            Un modelo como Claude genera texto palabra a palabra. Al entrenarlo, si «estaba» pudiera ver «cansado» estaría haciendo trampa: ¡copiaría la respuesta! Por eso ponemos <span className="font-mono">−∞</span>{" "}
            en todo lo que está a la derecha de la diagonal antes del softmax (e<sup>−∞</sup> = 0). Fíjate: las filas se renormalizan y «El» solo puede mirarse a sí mismo (100%).
          </p>
        </Card>
      </div>
    </div>
  );
}
