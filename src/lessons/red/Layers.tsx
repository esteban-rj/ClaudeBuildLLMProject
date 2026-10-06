"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import Network3D from "./Network3D";

const STAGES = [
  { id: "neurona", label: "Una neurona", sizes: [3, 1], text: "Tres entradas, una neurona, una salida. Ya la conoces: suma ponderada + activación. Los puntitos de luz son las señales viajando." },
  { id: "capa", label: "Una capa", sizes: [3, 4], text: "Si ponemos varias neuronas lado a lado, cada una mira las MISMAS entradas pero con pesos distintos: cada una aprende a fijarse en algo diferente. Eso es una capa." },
  { id: "red", label: "Una red", sizes: [3, 5, 4, 2], text: "Y si la salida de una capa alimenta a la siguiente, tenemos una red. Las capas del medio se llaman ocultas: nadie les dice qué buscar, lo descubren ellas." },
];

export default function Layers() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const [i, setI] = useState(0);
  const st = STAGES[i];
  const params = st.sizes.slice(1).reduce((a, n, l) => a + st.sizes[l] * n + n, 0);

  useEffect(() => {
    setContext(`Paso 1 (de una neurona a una red): el usuario ve "${st.label}" con capas ${st.sizes.join("-")} y ${params} parámetros. Grosor/color de conexión = peso.`);
  }, [st, params, setContext]);

  const pick = (k: number) => {
    setI(k);
    if (k === 2) guide.say("¡Una red de verdad! Cada conexión es un peso que se puede aprender. Gírala con el ratón.", "happy");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Network3D sizes={st.sizes} height={400} />
      <Card title={st.label}>
        <div className="mb-3 flex flex-wrap gap-2">
          {STAGES.map((s, k) => (
            <button key={s.id} onClick={() => pick(k)} className={`rounded-full px-3 py-1 text-xs ${k === i ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <p>{st.text}</p>
        <p className="mt-3 font-mono text-clay-light">Estructura: {st.sizes.join(" → ")}</p>
        <p className="mt-1">Pesos y sesgos (parámetros): <b className="font-mono text-clay">{params}</b></p>
        <p className="mt-3 text-xs text-ivory/50">Estos parámetros son lo que la red «aprende». Más adelante veremos cómo.</p>
      </Card>
    </div>
  );
}
