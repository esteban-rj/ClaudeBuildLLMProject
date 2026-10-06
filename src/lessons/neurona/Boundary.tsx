"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Slider, Formula, PALETTE } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import { accuracy, makeBlobs } from "./math";
import BoundaryPlot from "./BoundaryPlot";
import Surface3D from "./Surface3D";

export default function Boundary() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const pts = useMemo(() => makeBlobs(7, [1.2, 1.0], [-1.0, -1.2]), []);
  const [w1, setW1] = useState(0.4);
  const [w2, setW2] = useState(-1.2);
  const [b, setB] = useState(0.5);
  const acc = accuracy(pts, w1, w2, b);
  const praised = useRef(false);

  useEffect(() => {
    setContext(
      `Paso 4 (frontera de decisión): plano 2D con ${pts.length} puntos (naranjas = clase 1 arriba a la derecha, azules = clase 0 abajo a la izquierda). Neurona con w1=${w1.toFixed(2)}, w2=${w2.toFixed(2)}, b=${b.toFixed(2)}. Recta frontera ${w1.toFixed(2)}·x + ${w2.toFixed(2)}·y + ${b.toFixed(2)} = 0. Aciertos: ${Math.round(acc * 100)}%. También ve la superficie sigmoide en 3D.`,
    );
  }, [pts, w1, w2, b, acc, setContext]);

  const update = (fn: (v: number) => void, v: number, nw1: number, nw2: number, nb: number) => {
    fn(v);
    if (!praised.current && accuracy(pts, nw1, nw2, nb) === 1) {
      praised.current = true;
      guide.say("¡Todos los puntos bien clasificados! Fíjate: la neurona no hace más que trazar una recta y decir «de este lado sí, de este lado no».", "happy");
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={<>Vista desde arriba · <span className={acc === 1 ? "text-olive" : "text-clay"}>{Math.round(acc * 100)}% de aciertos</span></>}>
          <div className="flex justify-center">
            <BoundaryPlot pts={pts} w1={w1} w2={w2} b={b} />
          </div>
          <p className="mt-2 text-xs text-ivory/50">Círculos naranjas = clase 1 · cuadrados azules = clase 0 · los puntos con anillo blanco están mal clasificados.</p>
        </Card>
        <div className="grid gap-4">
          <Surface3D pts={pts} w1={w1} w2={w2} b={b} height={320} />
          <Card title="Ajusta la neurona">
            <div className="grid gap-3">
              <Slider label="w₁ (peso de x)" value={w1} min={-3} max={3} onChange={(v) => update(setW1, v, v, w2, b)} />
              <Slider label="w₂ (peso de y)" value={w2} min={-3} max={3} onChange={(v) => update(setW2, v, w1, v, b)} />
              <Slider label="b (sesgo)" value={b} min={-4} max={4} onChange={(v) => update(setB, v, w1, w2, v)} color={PALETTE.clayLight} />
            </div>
          </Card>
        </div>
      </div>
      <Card title="¿Qué está pasando?">
        <p>
          Con dos entradas (x, y) cada punto del plano es una situación. La neurona calcula z = w₁·x + w₂·y + b y la sigmoide lo convierte en una probabilidad. Donde z = 0 la neurona duda (50%): esos puntos forman una <b className="text-ivory">recta</b>, la frontera de decisión.
        </p>
        <Formula>frontera: {w1.toFixed(2)}·x {w2 >= 0 ? "+" : "−"} {Math.abs(w2).toFixed(2)}·y {b >= 0 ? "+" : "−"} {Math.abs(b).toFixed(2)} = 0</Formula>
        <p className="text-xs text-ivory/60">Los pesos giran la recta y el sesgo la desplaza. En 3D, la superficie es la sigmoide: pesos grandes la hacen más empinada (más segura), pesos pequeños la dejan suave (más dudosa).</p>
      </Card>
    </div>
  );
}
