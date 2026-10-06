"use client";
import { useEffect, useState } from "react";
import { Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import Anatomy from "./Anatomy";
import Calculator from "./Calculator";
import Activations from "./Activations";
import Boundary from "./Boundary";
import Challenge from "./Challenge";

const STEPS = ["Anatomía", "Calculadora", "Activaciones", "Frontera", "Reto"];
const NARRATION = [
  "",
  "Ahora hagamos cuentas de verdad: multiplica, suma y mira qué decide la neurona.",
  "La activación decide cómo se transforma la suma. Compara las cuatro formas más famosas.",
  "Con dos entradas, la neurona traza una recta en el plano. Intenta separar las dos clases.",
  "¡Hora del reto! Sepárame esos puntos con al menos un 90% de aciertos.",
];

export default function Lesson() {
  const guide = useGuide();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (NARRATION[step]) guide.say(NARRATION[step], "explaining");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="grid gap-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      {step === 0 && <Anatomy />}
      {step === 1 && <Calculator />}
      {step === 2 && <Activations />}
      {step === 3 && <Boundary />}
      {step === 4 && <Challenge />}
    </div>
  );
}
