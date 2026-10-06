"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, PALETTE } from "@/components/ui";
import { trainBPE, showTok } from "./tokenizer";
import { say, setContext } from "./guide";

const CORPUS: [string, number][] = [
  ["▁gato", 4],
  ["▁gatos", 3],
  ["▁pato", 3],
  ["▁patos", 2],
  ["▁dato", 2],
];
const { steps } = trainBPE(CORPUS, 8);
const INITIAL = CORPUS.map(([w, count]) => ({ syms: Array.from(w), count }));

export default function StepBpe() {
  const [k, setK] = useState(0); // merges aplicados
  const [auto, setAuto] = useState(false);
  const told = useRef(false);
  const cur = k === 0 ? INITIAL : steps[k - 1].words;
  const next = steps[k];
  const vocab = new Set<string>();
  cur.forEach((w) => w.syms.forEach((s) => vocab.add(s)));

  useEffect(() => {
    if (!auto || k >= steps.length) return;
    const t = setTimeout(() => setK((v) => v + 1), 1100);
    return () => clearTimeout(t);
  }, [auto, k]);

  useEffect(() => {
    setContext(
      `Paso 2 · Cómo se aprende BPE. Corpus: gato×4, gatos×3, pato×3, patos×2, dato×2 (con ▁ marcando inicio de palabra). Fusiones hechas: ${k}/${steps.length}. ` +
        (next ? `Siguiente fusión: «${showTok(next.pair[0])}»+«${showTok(next.pair[1])}» (aparece ${next.count} veces). ` : "Ya no quedan pares repetidos. ") +
        `Palabras ahora: ${cur.map((w) => w.syms.map(showTok).join(" ")).join(" / ")}.`,
    );
    if (k === 1 && !told.current) {
      told.current = true;
      say("Fíjate: «a»+«t» es el par más repetido, así que se convierte en un token nuevo «at». Y así, fusión a fusión, nacen las subpalabras.", "explaining");
    }
    if (k === steps.length) say("¡Listo! El algoritmo descubrió solo que «▁gato», «▁pato» y la «s» del plural son piezas útiles. Nadie le enseñó gramática: solo contó pares.", "happy");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <Card title="El corpus, símbolo a símbolo">
          <div className="space-y-2">
            {cur.map((w, wi) => (
              <div key={wi} className="flex items-center gap-3">
                <span className="w-8 font-mono text-xs text-ivory/50">×{w.count}</span>
                <div className="flex flex-wrap gap-1">
                  {w.syms.map((s, i) => {
                    const merged = Array.from(s).length > 1 && !(s === "▁");
                    const isNew = k > 0 && s === steps[k - 1].pair[0] + steps[k - 1].pair[1];
                    return (
                      <motion.span
                        layout
                        key={`${wi}-${i}-${s}`}
                        className="rounded-md border px-2 py-1 font-mono text-sm"
                        style={{
                          borderColor: isNew ? PALETTE.clay : merged ? PALETTE.sky : "#F0EEE620",
                          background: isNew ? PALETTE.clay + "55" : merged ? PALETTE.sky + "22" : "#F0EEE60d",
                        }}
                      >
                        {showTok(s)}
                      </motion.span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setK((v) => Math.min(steps.length, v + 1))} disabled={k >= steps.length}>Siguiente fusión</Button>
            <Button variant="outline" onClick={() => { setK(0); setAuto(true); }}>▶ Animar</Button>
            <Button variant="ghost" onClick={() => { setK(0); setAuto(false); }}>Reiniciar</Button>
          </div>
        </Card>
        <Card title={`Vocabulario actual (${vocab.size} tokens)`}>
          <div className="flex flex-wrap gap-1.5">
            {[...vocab].map((s) => (
              <span key={s} className="rounded bg-ivory/10 px-2 py-0.5 font-mono text-xs">{showTok(s)}</span>
            ))}
          </div>
        </Card>
      </div>
      <Card title={next ? `Fusión nº ${k + 1}: ¿qué par se repite más?` : "Entrenamiento terminado"}>
        {next ? (
          <>
            <p className="mb-3">Contamos cuántas veces aparece cada par de símbolos vecinos (ponderado por la frecuencia de cada palabra) y fusionamos el ganador.</p>
            <div className="space-y-2">
              {next.top.map((t, i) => (
                <div key={t.pair.join("|")} className="flex items-center gap-2 text-xs">
                  <span className="w-16 font-mono">{showTok(t.pair[0])} + {showTok(t.pair[1])}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded bg-ivory/10">
                    <div className="h-full" style={{ width: `${(t.count / next.top[0].count) * 100}%`, background: i === 0 ? PALETTE.clay : PALETTE.slate }} />
                  </div>
                  <span className="w-6 text-right font-mono">{t.count}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-ivory/70">
              Ganador: <span className="font-mono text-clay-light">«{showTok(next.pair[0])}» + «{showTok(next.pair[1])}» → «{showTok(next.pair[0] + next.pair[1])}»</span>
            </p>
          </>
        ) : (
          <p>
            Ya no quedan pares que se repitan. El tokenizador real hace esto mismo con millones de textos y miles de fusiones. Para
            tokenizar un texto nuevo solo aplica esas fusiones <b>en el mismo orden</b>. Así los tokens frecuentes (como «▁gato») son
            uno solo y los raros se descomponen.
          </p>
        )}
      </Card>
    </div>
  );
}
