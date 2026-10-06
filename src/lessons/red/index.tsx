"use client";
import { useEffect, useState } from "react";
import { Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import Layers from "./Layers";
import ForwardPass from "./ForwardPass";
import Xor from "./Xor";
import DepthWidth from "./DepthWidth";
import Quiz from "./Quiz";

const STEPS = ["Neurona → red", "Forward pass", "Resolver XOR", "Profundidad", "Quiz"];
const NARRATION = [
  "",
  "Vamos a calcular a mano lo que hace una red pequeña. Mueve las entradas y avanza capa a capa.",
  "Ahora el reto pendiente: XOR. Pulsa entrenar y mira cómo la red dobla su frontera.",
  "¿Más capas o más neuronas? Juega con los deslizadores y compara con los modelos gigantes.",
  "¡Último paso! Un mini quiz para comprobar que lo tienes claro.",
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
      {step === 0 && <Layers />}
      {step === 1 && <ForwardPass />}
      {step === 2 && <Xor />}
      {step === 3 && <DepthWidth />}
      {step === 4 && <Quiz />}
    </div>
  );
}
