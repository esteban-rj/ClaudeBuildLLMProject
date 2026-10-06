"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Slider } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import Network3D from "./Network3D";
import { countParams } from "./nn";

const MODELS = [
  { name: "Tu red de juguete", n: 0 },
  { name: "Perceptrón para dígitos (784-128-10)", n: countParams([784, 128, 10]) },
  { name: "GPT-2 (2019)", n: 1.5e9 },
  { name: "GPT-3 (2020)", n: 175e9 },
  { name: "Modelos frontera actuales (estimado, cientos de miles de millones o más)", n: 1e12 },
];

const fmt = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(n >= 1e11 ? 0 : 1)} mil millones` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} millones` : n.toLocaleString("es"));

export default function DepthWidth() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const [layers, setLayers] = useState(2);
  const [width, setWidth] = useState(4);
  const sizes = useMemo(() => [2, ...Array.from({ length: layers }, () => width), 1], [layers, width]);
  const params = countParams(sizes);
  const said = useRef(false);

  useEffect(() => {
    setContext(`Paso 4 (profundidad y anchura): ${layers} capas ocultas de ${width} neuronas → estructura ${sizes.join("-")}, ${params} parámetros. Comparación con GPT-3 (175 mil millones).`);
    if (!said.current && layers >= 5 && width >= 7) {
      said.current = true;
      guide.say(`Ya tienes ${params} parámetros... y aun así GPT-3 tiene unos 175 mil millones. ¡Son millones de veces más!`, "surprised");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, width, params, sizes, setContext]);

  const rows = MODELS.map((m, i) => (i === 0 ? { ...m, n: params } : m));
  const maxLog = Math.log10(1e12);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Network3D sizes={sizes} seed={5} height={400} />
      <div className="grid content-start gap-4">
        <Card title="Diseña tu red">
          <div className="grid gap-3">
            <Slider label="Capas ocultas (profundidad)" value={layers} min={1} max={5} step={1} onChange={setLayers} format={(v) => String(v)} />
            <Slider label="Neuronas por capa (anchura)" value={width} min={1} max={8} step={1} onChange={setWidth} format={(v) => String(v)} />
          </div>
          <p className="mt-3 font-mono text-clay-light">{sizes.join(" → ")}</p>
          <p className="mt-1">Parámetros: <b className="font-mono text-clay">{params.toLocaleString("es")}</b></p>
          <p className="mt-2 text-xs text-ivory/50">Más anchura = más cosas distintas por capa. Más profundidad = composiciones más abstractas (bordes → formas → objetos).</p>
        </Card>
        <Card title="Y los modelos gigantes">
          <div className="grid gap-2">
            {rows.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-xs"><span>{m.name}</span><span className="font-mono text-clay">{fmt(m.n)}</span></div>
                <div className="h-2 rounded-full bg-ivory/10">
                  <div className="h-2 rounded-full bg-clay" style={{ width: `${Math.max(2, (Math.log10(Math.max(1, m.n)) / maxLog) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ivory/50">Escala logarítmica: cada «salto» de la barra es ×10.</p>
        </Card>
      </div>
    </div>
  );
}
