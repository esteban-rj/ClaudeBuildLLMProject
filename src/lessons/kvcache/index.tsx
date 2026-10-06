"use client";
import { useState } from "react";
import { Steps } from "@/components/ui";
import { Quiz, type QuizQuestion } from "./Quiz";
import StepProblem from "./StepProblem";
import StepWhat from "./StepWhat";
import StepPhases from "./StepPhases";
import StepMemory from "./StepMemory";
import StepPromptCache from "./StepPromptCache";

const STEPS = ["El problema", "Qué se guarda", "Prefill vs decode", "Memoria", "Prompt caching", "Reto"];

const QUESTIONS: QuizQuestion[] = [
  {
    q: "¿Qué guarda el KV cache?",
    options: ["Las Queries de todos los tokens", "Las Keys y Values de los tokens anteriores", "Los pesos del modelo", "Las probabilidades de salida"],
    correct: 1,
    ok: "¡Exacto! K y V se reutilizan en cada paso; la Q solo sirve una vez.",
    ko: "Se guardan las Keys y Values. La Query de un token solo se usa para su propia salida.",
  },
  {
    q: "Sin caché, el coste total de generar n tokens crece como…",
    options: ["Lineal, n", "Constante", "Cuadrático, n²", "Logarítmico"],
    correct: 2,
    ok: "Sí: 1 + 2 + … + n = n(n+1)/2. Con caché pasa a ser lineal.",
    ko: "Recalcular todo el texto en cada paso suma 1+2+…+n, que es cuadrático.",
  },
  {
    q: "¿Qué técnica reduce más la memoria de la caché compartiendo K y V entre cabezas?",
    options: ["Subir la temperatura", "GQA / MQA", "Añadir más capas", "Usar fp32"],
    correct: 1,
    ok: "¡Bien! GQA y MQA usan menos cabezas KV que cabezas de Query.",
    ko: "Es GQA/MQA: menos cabezas KV, menos memoria.",
  },
  {
    q: "Cambias una sola letra al principio de tu system prompt. ¿Qué pasa con el prompt caching?",
    options: ["Nada, sigue funcionando", "Solo se recalcula esa letra", "Se invalida todo lo que viene después", "Se cobra el doble"],
    correct: 2,
    ok: "Correcto: la caché es por prefijo; todo lo posterior deja de coincidir.",
    ko: "La caché funciona por prefijo exacto: un cambio al inicio invalida todo lo posterior.",
  },
];

export default function Lesson() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      {step === 0 && <StepProblem />}
      {step === 1 && <StepWhat />}
      {step === 2 && <StepPhases />}
      {step === 3 && <StepMemory />}
      {step === 4 && <StepPromptCache />}
      {step === 5 && <Quiz lessonId="kvcache" questions={QUESTIONS} />}
    </div>
  );
}
