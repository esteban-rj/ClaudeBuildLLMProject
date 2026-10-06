"use client";
import { useRef, useState } from "react";
import { Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import Quiz, { type QuizQuestion } from "../atencion/Quiz";
import StepHeads from "./StepHeads";
import StepMechanics from "./StepMechanics";
import StepPosition from "./StepPosition";

const STEPS = ["Varias cabezas", "Mecánica en 3D", "Posición", "Reto"];

const QUESTIONS: QuizQuestion[] = [
  {
    q: "Con d_model = 512 y h = 8 cabezas, ¿cuánto vale d_k?",
    options: ["512", "64", "8", "4096"],
    correct: 1,
    why: "d_k = d_model / h = 512 / 8 = 64.",
  },
  {
    q: "¿Qué hace la matriz W_O?",
    options: ["Calcula el softmax", "Mezcla las cabezas concatenadas y devuelve d_model dimensiones", "Añade la posición", "Enmascara el futuro"],
    correct: 1,
    why: "Tras concatenar las cabezas, W_O las combina en un único vector de tamaño d_model.",
  },
  {
    q: "¿Por qué hace falta codificación posicional?",
    options: ["Para ahorrar memoria", "Porque la atención por sí sola no distingue el orden de los tokens", "Para que haya más cabezas", "Para evitar el softmax"],
    correct: 1,
    why: "Sin posición, permutar las palabras permuta las salidas pero no cambia lo que cada token calcula.",
  },
  {
    q: "¿Qué propiedad tiene RoPE?",
    options: ["Suma un vector fijo al embedding", "El producto Q·K depende solo de la distancia relativa entre posiciones", "Elimina la necesidad de Keys", "Solo funciona con una cabeza"],
    correct: 1,
    why: "Rota Q y K según su posición; al multiplicarlos los ángulos se restan y queda m − n.",
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
    if (i === 1) guide.say("Vamos a ver cómo se parte el vector entre cabezas y se vuelve a unir. Juega con d_model y h.", "explaining");
    if (i === 2) guide.say("Ahora el problema del orden: la atención no sabe quién va primero. Mira cómo lo arreglan.", "thinking");
    if (i === 3) guide.say("¡Último reto! Demuestra lo que sabes de cabezas y posición.", "happy");
  };
  return (
    <div className="grid gap-4">
      <Steps steps={STEPS} current={step} onChange={go} />
      {step === 0 && <StepHeads />}
      {step === 1 && <StepMechanics />}
      {step === 2 && <StepPosition />}
      {step === 3 && <Quiz lessonId="multihead" questions={QUESTIONS} winText="¡Genial! Varias cabezas para mirar de muchas formas, W_O para unirlas y posición para no perder el orden." />}
    </div>
  );
}
