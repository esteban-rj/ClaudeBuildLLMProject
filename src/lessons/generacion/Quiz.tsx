"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";

const QS = [
  { q: "Pones la temperatura casi a 0 (T = 0,1). ¿Qué ocurre?", o: ["El modelo se vuelve muy creativo", "Casi siempre elige la palabra más probable (greedy)", "Se apaga", "Elige palabras al azar"], a: 1, why: "Dividir entre una T pequeña exagera las diferencias: gana el favorito casi siempre." },
  { q: "¿Qué hace softmax?", o: ["Ordena las palabras alfabéticamente", "Convierte logits en probabilidades que suman 1", "Borra las palabras raras", "Cuenta los tokens"], a: 1, why: "Exponencia cada logit y divide entre la suma: todo positivo y total 1." },
  { q: "Con top-p = 0,9, ¿qué se conserva?", o: ["Las 9 primeras palabras", "Las más probables hasta acumular el 90%", "El 90% de las palabras al azar", "Solo la más probable"], a: 1, why: "Es el «núcleo» de probabilidad; el resto se tacha y se renormaliza." },
  { q: "¿Por qué un LLM puede alucinar?", o: ["Porque miente a propósito", "Porque elige lo probable, no comprueba si es verdadero", "Porque tiene poca memoria RAM", "Porque la temperatura es siempre 2"], a: 1, why: "Solo predice texto verosímil; sin fuentes ni verificación puede sonar seguro y estar equivocado." },
];

export function Quiz() {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [ans, setAns] = useState<(number | null)[]>(QS.map(() => null));
  const done = ans.every((a) => a !== null);
  const score = ans.filter((a, i) => a === QS[i].a).length;
  const finished = useRef(false);

  useEffect(() => {
    gRef.current.setContext(`Quiz de generación: ${ans.filter((a) => a !== null).length}/4 respondidas, ${score} correctas.`);
  }, [ans, score]);

  useEffect(() => {
    if (done && !finished.current) {
      finished.current = true;
      if (score >= 3) {
        gRef.current.say(`¡${score} de 4! Ya sabes cómo un modelo elige cada palabra: logits, softmax, temperatura, top-k y top-p. ¡Lección completada!`, "happy");
        gRef.current.complete("generacion");
      } else gRef.current.say(`Has sacado ${score} de 4. Repasa los pasos y vuelve a intentarlo, ¡tú puedes!`, "thinking");
    }
  }, [done, score]);

  const choose = (qi: number, oi: number) => {
    if (ans[qi] !== null) return;
    setAns(ans.map((a, i) => (i === qi ? oi : a)));
    gRef.current.say(oi === QS[qi].a ? "¡Correcto! " + QS[qi].why : "Casi. " + QS[qi].why, oi === QS[qi].a ? "happy" : "thinking");
  };

  return (
    <div className="space-y-3">
      {QS.map((q, qi) => (
        <Card key={qi} title={`${qi + 1}. ${q.q}`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.o.map((o, oi) => {
              const chosen = ans[qi] === oi;
              const show = ans[qi] !== null;
              const cls = show ? (oi === q.a ? "border-olive bg-olive/20" : chosen ? "border-rose bg-rose/20" : "border-ivory/10 opacity-50") : "border-ivory/10 hover:border-clay";
              return (
                <button key={oi} onClick={() => choose(qi, oi)} className={`rounded-xl border p-2 text-left text-xs transition ${cls}`}>
                  {o}
                </button>
              );
            })}
          </div>
          {ans[qi] !== null && <p className="mt-2 text-xs text-ivory/60">{q.why}</p>}
        </Card>
      ))}
      {done && (
        <Card title={score >= 3 ? "🎉 ¡Lección completada!" : "Casi…"}>
          Puntuación: {score}/4.{" "}
          {score < 3 && (
            <Button variant="outline" onClick={() => { finished.current = false; setAns(QS.map(() => null)); }}>Reintentar</Button>
          )}
        </Card>
      )}
    </div>
  );
}
