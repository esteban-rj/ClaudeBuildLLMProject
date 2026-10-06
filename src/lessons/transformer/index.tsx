"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { Workshop } from "./Workshop";
import { Ignite } from "./Ignite";
import { Scale } from "./Scale";
import { Architectures } from "./Architectures";

const STEPS = ["Taller de construcción", "¡Encender!", "Apilar bloques", "Encoder vs decoder", "Reto final"];

const BLURBS = [
  "Cada pieza tiene su forma y su color. Colócalas de abajo arriba en el orden correcto: clic en la pieza o arrástrala hasta la torre. Si te equivocas, te doy una pista.",
  "Una torre apagada no sirve de nada. Dale una frase y mira cómo cada token sube capa por capa hasta salir como una predicción del siguiente token.",
  "Un transformer real repite el mismo bloque muchas veces. Súbelo y mira cómo crece la torre, y con ella el número de parámetros.",
  "No todos los transformers miran igual. Compara tres familias: las que leen, las que escriben y las que hacen ambas cosas.",
  "Ahora sin pistas y contra reloj: reconstruye la torre de memoria. Cada error resta 5 segundos.",
];

export default function Lesson() {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    gRef.current.setContext(`Lección «Construye un transformer», paso ${step + 1}: ${STEPS[step]}.`);
    if (step > 0) gRef.current.say(BLURBS[step], "explaining");
  }, [step]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-clay/30 bg-gradient-to-r from-clay/20 to-transparent p-4">
        <div className="font-serif text-2xl text-ivory">¡Vamos a construir un transformer! 🏗️</div>
        <p className="mt-1 text-sm text-ivory/70">{BLURBS[step]}</p>
      </div>
      <Steps steps={STEPS} current={step} onChange={setStep} />
      {step === 0 && (
        <Card title="Taller de construcción">
          <Workshop mode="guided" />
          <NextHint onNext={() => setStep(1)} label="Siguiente: ¡Encender!" />
        </Card>
      )}
      {step === 1 && (
        <Card title="Torre completa: ¡Encender!">
          <Ignite />
          <NextHint onNext={() => setStep(2)} label="Siguiente: apilar bloques" />
        </Card>
      )}
      {step === 2 && (
        <>
          <Scale />
          <NextHint onNext={() => setStep(3)} label="Siguiente: encoder vs decoder" />
        </>
      )}
      {step === 3 && (
        <>
          <Architectures />
          <NextHint onNext={() => setStep(4)} label="Siguiente: reto final" />
        </>
      )}
      {step === 4 && (
        <Card title="Reto final: ¡contra reloj!">
          <Workshop mode="challenge" />
        </Card>
      )}
    </div>
  );
}

function NextHint({ onNext, label }: { onNext: () => void; label: string }) {
  return (
    <div className="mt-3 flex justify-end">
      <button onClick={onNext} className="rounded-xl bg-clay px-4 py-2 text-sm font-medium text-night transition hover:bg-clay-light active:scale-95">
        {label} →
      </button>
    </div>
  );
}
