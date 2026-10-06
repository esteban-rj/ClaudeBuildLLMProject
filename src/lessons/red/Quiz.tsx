"use client";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";

const QUESTIONS = [
  { q: "¿Por qué una sola neurona no puede resolver XOR?", opts: ["Porque tiene pocos pesos", "Porque solo puede trazar una frontera recta", "Porque la sigmoide no sirve"], ok: 1, why: "Una neurona separa con una recta, y en XOR las clases están en esquinas opuestas." },
  { q: "¿Qué hace que una red con capas ocultas pueda aprender formas complejas?", opts: ["Activaciones no lineales entre capas", "Que use números más grandes", "Que tenga solo una capa"], ok: 0, why: "Sin no linealidad, apilar capas equivale a una sola recta. Las activaciones doblan el espacio." },
  { q: "En el forward pass, la información...", opts: ["Va hacia atrás para corregir errores", "Viaja capa a capa hacia adelante hasta la salida", "Se queda en la primera capa"], ok: 1, why: "El forward pass calcula la salida; lo de ir hacia atrás es la backpropagation (próxima lección)." },
  { q: "¿Cuántos parámetros tiene una red 2 → 3 → 1?", opts: ["6", "9", "13"], ok: 2, why: "Capa 1: 2·3 + 3 = 9. Capa 2: 3·1 + 1 = 4. Total 13." },
];

export default function Quiz() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const [ans, setAns] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const [done, setDone] = useState(false);
  const score = ans.filter((a, i) => a === QUESTIONS[i].ok).length;

  useEffect(() => {
    setContext(`Paso 5 (quiz final de redes neuronales): ${done ? `terminado, ${score}/${QUESTIONS.length} correctas` : "en curso"}.`);
  }, [done, score, setContext]);

  const submit = () => {
    setDone(true);
    if (score >= 3) {
      guide.say(`¡${score} de ${QUESTIONS.length}! Ya entiendes las redes. Falta saber cómo aprenden sus pesos: ¡siguiente parada, el entrenamiento!`, "happy");
      guide.complete("red");
    } else {
      guide.say(`Sacaste ${score} de ${QUESTIONS.length}. Casi. Revisa las explicaciones y vuelve a intentarlo, necesitas 3 para completar.`, "thinking");
    }
  };

  return (
    <Card title="Mini reto: ¿lo has entendido?">
      <div className="grid gap-5">
        {QUESTIONS.map((q, i) => (
          <div key={q.q}>
            <p className="mb-2 font-medium text-ivory">{i + 1}. {q.q}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {q.opts.map((o, k) => {
                const sel = ans[i] === k;
                const style = done ? (k === q.ok ? "border-olive bg-olive/20" : sel ? "border-rose bg-rose/20" : "border-ivory/10") : sel ? "border-clay bg-clay/20" : "border-ivory/10 hover:border-ivory/30";
                return (
                  <button key={o} disabled={done} onClick={() => setAns(ans.map((a, j) => (j === i ? k : a)))} className={`rounded-xl border px-3 py-2 text-left text-xs ${style}`}>
                    {o}
                  </button>
                );
              })}
            </div>
            {done && <p className="mt-1 text-xs text-ivory/60">{q.why}</p>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        {!done ? (
          <Button onClick={submit} disabled={ans.some((a) => a === null)}>Comprobar</Button>
        ) : (
          <>
            <span className="text-sm">Puntuación: <b className={score >= 3 ? "text-olive" : "text-clay"}>{score}/{QUESTIONS.length}</b></span>
            {score < 3 && <Button variant="outline" onClick={() => { setAns(QUESTIONS.map(() => null)); setDone(false); }}>Reintentar</Button>}
          </>
        )}
      </div>
    </Card>
  );
}
