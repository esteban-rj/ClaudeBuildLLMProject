"use client";
import { useRef, useState } from "react";
import { Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import StepProblem from "./StepProblem";
import StepQKV from "./StepQKV";
import StepCalc from "./StepCalc";
import StepHeatmap from "./StepHeatmap";
import Step3D from "./Step3D";
import Quiz, { type QuizQuestion } from "./Quiz";

const STEPS = ["El problema", "Q, K y V", "El cálculo", "Mapa y máscara", "Vista 3D", "Reto"];

const QUESTIONS: QuizQuestion[] = [
  {
    q: "¿Para qué sirve la Query de un token?",
    options: ["Para guardar su contenido", "Para expresar lo que busca en los demás tokens", "Para numerar su posición", "Para normalizar el vector"],
    correct: 1,
    why: "La Query es la pregunta; la Key es la etiqueta y el Value el contenido.",
  },
  {
    q: "¿Por qué se divide el producto punto Q·K entre √d_k?",
    options: ["Para que sea más rápido", "Para evitar que el softmax se vuelva demasiado picudo", "Para que los pesos sumen 1", "Para ocultar tokens futuros"],
    correct: 1,
    why: "Sin escalar, los productos punto crecen con d_k y el softmax se satura casi en un solo token.",
  },
  {
    q: "¿Qué hace la máscara causal?",
    options: ["Impide que un token mire a los tokens futuros", "Elimina las palabras funcionales", "Duplica la atención al primer token", "Hace los pesos negativos"],
    correct: 0,
    why: "Pone −∞ en las posiciones futuras antes del softmax, así su peso es 0.",
  },
  {
    q: "La salida de la atención para un token es...",
    options: ["La Query más grande", "Una suma de los Values ponderada por los pesos de atención", "El promedio simple de todas las Keys", "El token con más peso, sin más"],
    correct: 1,
    why: "Salida = Σ pesos · Values: cada token se mezcla con la información de aquellos a los que atiende.",
  },
];

export default function Lesson() {
  const guide = useGuide();
  const [step, setStep] = useState(0);
  const spoken = useRef(new Set<number>());

  const go = (i: number) => {
    setStep(i);
    if (spoken.current.has(i)) return;
    spoken.current.add(i);
    const lines: Record<number, [string, "explaining" | "thinking" | "happy" | "surprised"]> = {
      1: ["Cada token se transforma en tres vectores: Query, Key y Value. Piensa en una biblioteca: pregunta, etiqueta y contenido.", "explaining"],
      2: ["Ahora hacemos las cuentas de verdad: producto punto, escalado, softmax y suma ponderada. Prueba el deslizador de escala.", "thinking"],
      3: ["Todas las atenciones juntas forman un mapa N por N. Activa la máscara causal y mira cómo desaparece el futuro.", "explaining"],
      4: ["¡Vamos a 3D! Cada haz de luz es atención: más brillo, más peso. Arrastra para girar la escena.", "surprised"],
      5: ["¡Hora del reto! Demuéstrame que dominas la self-attention.", "happy"],
    };
    const l = lines[i];
    if (l) guide.say(l[0], l[1]);
  };

  return (
    <div className="grid gap-4">
      <Steps steps={STEPS} current={step} onChange={go} />
      {step === 0 && <StepProblem />}
      {step === 1 && <StepQKV />}
      {step === 2 && <StepCalc />}
      {step === 3 && <StepHeatmap />}
      {step === 4 && <Step3D />}
      {step === 5 && <Quiz lessonId="atencion" questions={QUESTIONS} winText="¡Perfecto! Ya entiendes la self-attention: preguntar con Q, comparar con K, y mezclar V según los pesos del softmax." />}
    </div>
  );
}
