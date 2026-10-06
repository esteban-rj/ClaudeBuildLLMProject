"use client";
import { useEffect, useRef, useState } from "react";
import { Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import Comms from "./Comms";
import Quiz from "./Quiz";
import SimStep from "./SimStep";
import Topologies from "./Topologies";
import Why from "./Why";

const STEPS = ["¿Por qué varios?", "Simulación 3D", "Topologías", "Comunicación y fallos", "Quiz final"];

export default function Lesson() {
  const guide = useGuide();
  const [step, setStep] = useState(0);
  const said = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ctx = [
      "Paso 1: por qué varios agentes (límite de contexto y paralelismo); el usuario compara 1 agente vs N.",
      "Paso 2: simulación 3D con un orquestador Clawd y sub-agentes que trabajan en paralelo; sliders de nº de agentes y tamaño de tarea; compara tiempo y tokens.",
      "Paso 3: topologías (orquestador-trabajadores, jerárquica, pipeline, debate, enjambre) con diagramas animados.",
      "Paso 4: comunicación y fallos: reintentos, conflictos al editar el mismo archivo, contexto aislado vs compartido, modelo potente vs rápido.",
      "Paso 5: quiz final de 5 preguntas; completa el mapa.",
    ][step];
    guide.setContext(`Lección Sistemas multi-agente. ${ctx}`);
    if (step === 3 && !said.current.has("c")) {
      said.current.add("c");
      guide.say("Coordinar agentes es difícil: fallan, se pisan los archivos y cada contexto es una burbuja. Juega con los tres ejemplos.", "explaining");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="space-y-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      {step === 0 && <Why />}
      {step === 1 && <SimStep />}
      {step === 2 && <Topologies onPick={(n) => guide.setContext(`Mirando la topología ${n}.`)} />}
      {step === 3 && <Comms />}
      {step === 4 && <Quiz />}
      <div className="flex justify-between pt-2">
        <button className="text-xs text-ivory/60 hover:text-ivory disabled:opacity-30" disabled={step === 0} onClick={() => setStep(step - 1)}>← Anterior</button>
        <button className="text-xs text-clay hover:text-clay-light disabled:opacity-30" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Siguiente →</button>
      </div>
    </div>
  );
}
