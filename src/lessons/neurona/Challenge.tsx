"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Slider, Button, PALETTE } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import { accuracy, bestLine, makeBlobs, makeXor } from "./math";
import BoundaryPlot from "./BoundaryPlot";

export default function Challenge() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const [mode, setMode] = useState<"reto" | "xor">("reto");
  const blobs = useMemo(() => makeBlobs(21, [1.3, -1.0], [-1.2, 1.1], 20, 0.8), []);
  const xor = useMemo(() => makeXor(5), []);
  const best = useMemo(() => bestLine(xor), [xor]);
  const [w1, setW1] = useState(0);
  const [w2, setW2] = useState(0.3);
  const [b, setB] = useState(0);
  const won = useRef(false);
  const xorSaid = useRef(false);

  const pts = mode === "reto" ? blobs : xor;
  const acc = accuracy(pts, w1, w2, b);

  useEffect(() => {
    setContext(
      mode === "reto"
        ? `Paso 5 (reto): separar dos nubes de puntos con una neurona, meta 90%. w1=${w1.toFixed(2)}, w2=${w2.toFixed(2)}, b=${b.toFixed(2)}, aciertos ${Math.round(acc * 100)}%.`
        : `Paso 5 (XOR): puntos en las 4 esquinas con patrón XOR. Una sola neurona no puede separarlos; la mejor recta posible acierta ${Math.round(best.acc * 100)}%. Aciertos actuales ${Math.round(acc * 100)}%. Esto motiva las redes con capa oculta.`,
    );
  }, [mode, w1, w2, b, acc, best.acc, setContext]);

  const check = (nw1: number, nw2: number, nb: number) => {
    if (mode === "reto" && !won.current && accuracy(blobs, nw1, nw2, nb) >= 0.9) {
      won.current = true;
      guide.say("¡Reto superado! Más del 90% de aciertos. Ya sabes lo que hace una neurona: una recta que separa. Ahora mira el truco final: el famoso XOR.", "happy");
      guide.complete("neurona");
    }
  };

  const goXor = () => {
    setMode("xor");
    setW1(0.5);
    setW2(0.5);
    setB(0);
    if (!xorSaid.current) {
      xorSaid.current = true;
      guide.say("Ahora prueba con XOR: naranja en las esquinas «opuestas». Intenta lo que quieras, ninguna recta lo separa bien. ¡Por eso existen las redes con varias capas!", "thinking");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={<>{mode === "reto" ? "Reto: separa los puntos" : "El muro del XOR"} · <span className={acc >= 0.9 ? "text-olive" : "text-clay"}>{Math.round(acc * 100)}%</span></>}>
        <div className="flex justify-center">
          <BoundaryPlot pts={pts} w1={w1} w2={w2} b={b} />
        </div>
        <p className="mt-2 text-xs text-ivory/50">
          {mode === "reto" ? "Meta: 90% o más de aciertos." : `La mejor recta posible que encontré probando miles acierta solo ${Math.round(best.acc * 100)}%.`}
        </p>
      </Card>
      <div className="grid content-start gap-4">
        <Card title="Pesos y sesgo">
          <div className="grid gap-3">
            <Slider label="w₁" value={w1} min={-3} max={3} onChange={(v) => { setW1(v); check(v, w2, b); }} />
            <Slider label="w₂" value={w2} min={-3} max={3} onChange={(v) => { setW2(v); check(w1, v, b); }} />
            <Slider label="b (sesgo)" value={b} min={-4} max={4} onChange={(v) => { setB(v); check(w1, w2, v); }} color={PALETTE.clayLight} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {mode === "reto" ? (
              <Button onClick={goXor} variant="outline">Probar con XOR →</Button>
            ) : (
              <>
                <Button onClick={() => { setW1(best.w1); setW2(best.w2); setB(best.b); }} variant="ghost">Poner la mejor recta</Button>
                <Button onClick={() => { setMode("reto"); setW1(0); setW2(0.3); setB(0); }} variant="ghost">← Volver al reto</Button>
              </>
            )}
          </div>
        </Card>
        {mode === "xor" && (
          <Card title="Gancho para la siguiente lección">
            Una sola neurona solo puede dibujar una recta, y XOR necesita separar las esquinas diagonales. La solución: poner varias neuronas en capas. Eso es una <b className="text-ivory">red neuronal</b>, y es lo que viene ahora.
          </Card>
        )}
      </div>
    </div>
  );
}
