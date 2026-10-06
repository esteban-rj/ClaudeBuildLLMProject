"use client";
import { useState } from "react";
import { Steps } from "@/components/ui";
import { Quiz, type QuizQuestion } from "./Quiz";
import StepKinds from "./StepKinds";
import StepLoop from "./StepLoop";
import StepRing3D from "./StepRing3D";
import StepAnatomy from "./StepAnatomy";
import StepStop from "./StepStop";

const STEPS = ["Chatbot, workflow, agente", "El bucle", "El anillo 3D", "Anatomía de una herramienta", "Parada y riesgos", "Reto"];

const QUESTIONS: QuizQuestion[] = [
  {
    q: "¿Qué distingue a un agente de un workflow?",
    options: ["Usa un modelo más grande", "El modelo decide el camino en cada vuelta", "No usa herramientas", "Solo responde una vez"],
    correct: 1,
    ok: "¡Eso es! En un workflow el camino lo fija el código; en un agente lo decide el modelo.",
    ko: "La clave es quién decide los pasos: en el agente, el modelo, de forma dinámica.",
  },
  {
    q: "Cuando el modelo pide una herramienta, ¿quién la ejecuta?",
    options: ["El propio modelo, internamente", "Tu código, que devuelve un tool_result", "El usuario a mano", "Nadie, es simulado"],
    correct: 1,
    ok: "Correcto: el modelo solo emite el tool_use; tu programa la ejecuta y devuelve el resultado.",
    ko: "El modelo solo pide la llamada (tool_use). La ejecuta tu código y devuelve un tool_result.",
  },
  {
    q: "¿Por qué una herramienta que devuelve una página web entera es un problema?",
    options: ["Porque es ilegal", "Llena la ventana de contexto", "Porque el modelo se olvida de la herramienta", "No es ningún problema"],
    correct: 1,
    ok: "Sí: el resultado entra al contexto y consume tokens en cada vuelta siguiente.",
    ko: "Los resultados se añaden al contexto y se releen en cada vuelta, llenando la ventana.",
  },
  {
    q: "¿Qué protección evita que un agente atascado gaste sin fin?",
    options: ["Subir la temperatura", "Un límite máximo de pasos", "Quitarle las herramientas", "Pedirle que sea amable"],
    correct: 1,
    ok: "Exacto: un tope de pasos (o de tokens) es la red de seguridad básica.",
    ko: "Lo básico es un límite de pasos/tokens escrito en tu programa, no en el prompt.",
  },
];

export default function Lesson() {
  const [step, setStep] = useState(0);
  return (
    <div className="space-y-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      {step === 0 && <StepKinds />}
      {step === 1 && <StepLoop />}
      {step === 2 && <StepRing3D />}
      {step === 3 && <StepAnatomy />}
      {step === 4 && <StepStop />}
      {step === 5 && <Quiz lessonId="agente" questions={QUESTIONS} />}
    </div>
  );
}
