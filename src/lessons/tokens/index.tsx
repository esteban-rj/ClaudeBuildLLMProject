"use client";
import { useEffect, useRef, useState } from "react";
import { Steps } from "@/components/ui";
import Quiz, { type QuizQuestion } from "./Quiz";
import StepTokenizer from "./StepTokenizer";
import StepBpe from "./StepBpe";
import StepEmbed from "./StepEmbed";
import StepSpace from "./StepSpace";
import StepArith from "./StepArith";
import { complete, say, setContext } from "./guide";

const STEPS = ["Tokenizador", "Cómo nace BPE", "Embeddings", "Espacio 3D", "Aritmética", "Reto"];

const INTROS = [
  "Escribe cualquier frase y mira cómo se divide en tokens, cada uno con su ID.",
  "¿De dónde sale el vocabulario? De contar pares de símbolos y fusionar el más frecuente. Mira el algoritmo BPE paso a paso.",
  "Un ID por sí solo no significa nada. Cada ID abre una fila de una tabla: su vector de embedding.",
  "Ahora mira esos vectores como puntos en el espacio. Las palabras parecidas se agrupan. Haz clic en una para ver sus vecinos.",
  "Los vectores guardan relaciones: la dirección de «hombre» a «rey» se puede aplicar a «mujer». Pulsa Siguiente.",
  "Último paso: comprueba lo que aprendiste sobre tokens y embeddings.",
];

const QUESTIONS: QuizQuestion[] = [
  {
    q: "¿Qué hace el algoritmo BPE en cada paso de entrenamiento?",
    options: ["Borra las palabras raras", "Fusiona el par de símbolos vecinos más frecuente en un token nuevo", "Traduce el texto a inglés", "Ordena las palabras alfabéticamente"],
    answer: 1,
    explain: "Así nacen las subpalabras frecuentes como «ción» o «▁gato».",
  },
  {
    q: "¿Qué es un embedding?",
    options: ["Un vector de números asociado a un token", "Un tipo de tokenizador", "El número de letras de una palabra", "La respuesta final del modelo"],
    answer: 0,
    explain: "Es una fila de una tabla: un vector que, tras entrenar, codifica el significado del token.",
  },
  {
    q: "Dos palabras con similitud coseno cercana a 1 significan…",
    options: ["Que tienen las mismas letras", "Que sus vectores apuntan casi en la misma dirección: significados parecidos", "Que son opuestas", "Que tienen el mismo ID"],
    answer: 1,
    explain: "El coseno mide el ángulo entre vectores: ángulo pequeño, significado cercano.",
  },
  {
    q: "¿Por qué se usan subpalabras en vez de palabras enteras?",
    options: ["Porque es más bonito", "Para manejar palabras nuevas o raras con un vocabulario de tamaño razonable", "Porque los modelos no entienden espacios", "Para que el texto sea más largo"],
    answer: 1,
    explain: "Cualquier palabra se puede armar con piezas conocidas, sin vocabulario gigante.",
  },
];

export default function Lesson() {
  const [step, setStep] = useState(0);
  const seen = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!seen.current.has(step)) {
      seen.current.add(step);
      if (step > 0) say(INTROS[step], "explaining");
    }
    if (step === 5) setContext("Paso 6 · Mini-quiz final sobre BPE, embeddings, similitud coseno y subpalabras.");
  }, [step]);

  return (
    <div className="space-y-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      <p className="text-sm text-ivory/70">{INTROS[step]}</p>
      {step === 0 && <StepTokenizer />}
      {step === 1 && <StepBpe />}
      {step === 2 && <StepEmbed />}
      {step === 3 && <StepSpace />}
      {step === 4 && <StepArith />}
      {step === 5 && (
        <Quiz
          questions={QUESTIONS}
          onWrong={(q) => say(`Casi. Pista: ${q.explain}`, "thinking")}
          onAllCorrect={() => {
            complete("tokens");
            say("¡Perfecto! Ya sabes cómo el texto se vuelve números con significado. Con esto estamos listos para la atención.", "happy");
          }}
        />
      )}
      <div className="flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl bg-ivory/5 px-4 py-2 text-sm text-ivory disabled:opacity-30">← Anterior</button>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)} className="rounded-xl bg-clay px-4 py-2 text-sm font-medium text-night disabled:opacity-30">Siguiente →</button>
      </div>
    </div>
  );
}
