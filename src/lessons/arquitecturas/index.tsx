"use client";
import { useEffect, useRef, useState } from "react";
import { Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import Compare from "./Compare";
import Gallery from "./Gallery";
import Game from "./Game";
import MemoryStep from "./MemoryStep";
import RagStep from "./RagStep";

const STEPS = ["Galería de patrones", "RAG en 3D", "Memoria", "Comparar", "¿Cuál uso?"];

export default function Lesson() {
  const guide = useGuide();
  const [step, setStep] = useState(0);
  const said = useRef<Set<string>>(new Set());

  const sayOnce = (key: string, text: string, mood: Parameters<typeof guide.say>[1] = "explaining") => {
    if (said.current.has(key)) return;
    said.current.add(key);
    guide.say(text, mood);
  };

  useEffect(() => {
    const ctx = [
      "Paso 1: galería de patrones (prompt chaining, routing, parallelization, ReAct, plan-and-execute, evaluator-optimizer) con diagramas animados y fichas.",
      "Paso 2: RAG con búsqueda de vecinos en un espacio 3D de embeddings; el usuario elige consulta y k.",
      "Paso 3: memoria: ventana de contexto limitada, almacén de largo plazo y compactación.",
      "Paso 4: comparativa de dos patrones en un radar (autonomía, coste, latencia, previsibilidad, tareas abiertas).",
      "Paso 5: mini-juego de 5 escenarios para elegir la arquitectura adecuada.",
    ][step];
    guide.setContext(`Lección Arquitecturas de agentes. ${ctx}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="space-y-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      {step === 0 && (
        <>
          <p className="text-sm text-ivory/80">Elige un patrón, pulsa <b>Ejecutar</b> y mira cómo viaja un paquete de información por el diagrama. Debajo tienes su ficha: cuándo usarlo, ventajas, costes y riesgos.</p>
          <Gallery onFirstRun={(n) => sayOnce("g" + n, `Mira ${n}: fíjate en qué nodo decide el modelo y en cuáles manda el código.`, "explaining")} />
        </>
      )}
      {step === 1 && <RagStep onRun={() => sayOnce("rag", "Así recuperamos conocimiento: la consulta se vuelve un punto y buscamos a sus vecinos más cercanos. Cambia k y observa.", "happy")} />}
      {step === 2 && <MemoryStep />}
      {step === 3 && <Compare onPick={(a, b) => guide.setContext(`Comparando los patrones ${a} y ${b} en el radar.`)} />}
      {step === 4 && <Game />}
      <div className="flex justify-between pt-2">
        <button className="text-xs text-ivory/60 hover:text-ivory disabled:opacity-30" disabled={step === 0} onClick={() => setStep(step - 1)}>← Anterior</button>
        <button className="text-xs text-clay hover:text-clay-light disabled:opacity-30" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Siguiente →</button>
      </div>
    </div>
  );
}
