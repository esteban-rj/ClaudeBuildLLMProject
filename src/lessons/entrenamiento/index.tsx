"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Steps } from "@/components/ui";
import Quiz, { type QuizQuestion } from "./Quiz";
import StepLoss from "./StepLoss";
import StepLandscape from "./StepLandscape";
import StepBackprop from "./StepBackprop";
import StepTrain, { TRAIN_START } from "./StepTrain";
import { complete, say, setContext } from "./guide";

const STEPS = ["La pérdida", "El paisaje", "Backpropagation", "Entrenar de verdad", "Reto"];

const INTROS = [
  "Primero, ¿cómo sabe una red que se equivoca? Con una función de pérdida. Mueve m y b para ajustar la recta a los puntos y mira cómo cambia el error.",
  "Ahora imagina todas las combinaciones de pesos como un paisaje: la altura es el error. Suelta la bolita y juega con la tasa de aprendizaje.",
  "Para bajar la montaña hace falta saber la pendiente de cada peso. Backpropagation la calcula hacia atrás con la regla de la cadena. Pulsa Siguiente.",
  "Hora de juntarlo todo: entrenemos de verdad la recta del primer paso con descenso de gradiente, época a época.",
  "¡Último paso! Un mini-reto para comprobar que ya entiendes cómo aprende una red.",
];

const QUESTIONS: QuizQuestion[] = [
  {
    q: "¿Qué mide la función de pérdida?",
    options: ["Cuánto tarda la red en entrenar", "Cuánto se equivoca la red en sus predicciones", "Cuántos pesos tiene la red", "La velocidad del ordenador"],
    answer: 1,
    explain: "Es un número: cuanto más bajo, mejor predice la red. Entrenar es minimizarlo.",
  },
  {
    q: "Con una tasa de aprendizaje demasiado alta, ¿qué suele pasar?",
    options: ["Aprende más rápido siempre", "Los pasos se pasan del valle y el error rebota o diverge", "No pasa nada especial", "La red se vuelve más pequeña"],
    answer: 1,
    explain: "Los pasos gigantes saltan de una pared del valle a la otra, y a veces cada salto es peor que el anterior.",
  },
  {
    q: "¿Para qué sirve backpropagation?",
    options: ["Para generar texto", "Para calcular el gradiente de la pérdida respecto a cada peso con la regla de la cadena", "Para borrar datos", "Para elegir el tamaño del vocabulario"],
    answer: 1,
    explain: "Recorre el grafo hacia atrás multiplicando derivadas locales y da el gradiente de todos los pesos de una pasada.",
  },
  {
    q: "La bolita se detuvo en un valle que no es el más profundo. ¿Cómo se llama eso?",
    options: ["Mínimo global", "Mínimo local", "Época", "Sobreajuste"],
    answer: 1,
    explain: "El gradiente es cero ahí, pero existe un valle mejor más lejos. Empezar desde otro punto puede ayudar.",
  },
];

export default function Lesson() {
  const [step, setStep] = useState(0);
  const [m, setM] = useState(TRAIN_START.m);
  const [b, setB] = useState(TRAIN_START.b);
  const seen = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!seen.current.has(step)) {
      seen.current.add(step);
      if (step > 0) say(INTROS[step], "explaining");
    }
    if (step === 4) setContext("Paso 5 · Mini-quiz final sobre función de pérdida, tasa de aprendizaje, backpropagation y mínimos locales.");
  }, [step]);

  return (
    <div className="space-y-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      <p className="text-sm text-ivory/70">{INTROS[step]}</p>
      {step === 0 && <StepLoss m={m} b={b} setM={setM} setB={setB} />}
      {step === 1 && <StepLandscape />}
      {step === 2 && <StepBackprop />}
      {step === 3 && <StepTrain m={m} b={b} setM={setM} setB={setB} />}
      {step === 4 && (
        <Quiz
          questions={QUESTIONS}
          onWrong={(q) => say(`Mmm, no exactamente. Pista: ${q.explain}`, "thinking")}
          onAllCorrect={() => {
            complete("entrenamiento");
            say("¡Lo lograste! Ya sabes cómo aprende una red: mide el error, calcula gradientes con backprop y baja la montaña paso a paso. Siguiente parada: los tokens.", "happy");
          }}
        />
      )}
      <div className="flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl bg-ivory/5 px-4 py-2 text-sm text-ivory disabled:opacity-30">← Anterior</button>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)} className="rounded-xl bg-clay px-4 py-2 text-sm font-medium text-night disabled:opacity-30">Siguiente →</button>
      </div>
      {step === 0 && (
        <Card title="💡 Idea clave">Entrenar una red es <b>minimizar una función de pérdida</b>. Todo lo demás son trucos para hacerlo bien y rápido.</Card>
      )}
    </div>
  );
}
