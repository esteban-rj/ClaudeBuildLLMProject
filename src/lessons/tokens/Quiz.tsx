"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui";

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

/** Mini-quiz: feedback inmediato por pregunta y aviso al acertarlas todas. */
export default function Quiz({
  questions,
  onAllCorrect,
  onWrong,
}: {
  questions: QuizQuestion[];
  onAllCorrect: () => void;
  onWrong?: (q: QuizQuestion) => void;
}) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [done, setDone] = useState(false);
  const correct = picked.filter((p, i) => p === questions[i].answer).length;

  const pick = (qi: number, oi: number) => {
    if (picked[qi] === questions[qi].answer) return;
    const next = picked.map((p, i) => (i === qi ? oi : p));
    setPicked(next);
    if (oi !== questions[qi].answer) onWrong?.(questions[qi]);
    const allOk = next.every((p, i) => p === questions[i].answer);
    if (allOk && !done) {
      setDone(true);
      onAllCorrect();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ivory/10">
          <motion.div className="h-full bg-clay" animate={{ width: `${(correct / questions.length) * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-ivory/70">
          {correct}/{questions.length}
        </span>
      </div>
      {questions.map((q, qi) => {
        const p = picked[qi];
        const ok = p === q.answer;
        return (
          <Card key={q.q} title={<span className="text-base">{qi + 1}. {q.q}</span>}>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const chosen = p === oi;
                const style = chosen
                  ? oi === q.answer
                    ? "border-olive bg-olive/25 text-ivory"
                    : "border-rose bg-rose/20 text-ivory"
                  : "border-ivory/10 bg-ivory/5 hover:border-clay/60";
                return (
                  <button
                    key={o}
                    onClick={() => pick(qi, oi)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${style}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            {p !== null && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 text-sm ${ok ? "text-olive" : "text-rose"}`}
              >
                {ok ? "¡Correcto! " : "Casi… "}
                <span className="text-ivory/75">{ok ? q.explain : "Piénsalo otra vez y prueba otra opción."}</span>
              </motion.p>
            )}
          </Card>
        );
      })}
      {done && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border border-clay/50 bg-clay/15 p-5 text-center"
        >
          <div className="text-3xl">🏆</div>
          <p className="mt-1 font-serif text-lg text-ivory">¡Lección completada!</p>
        </motion.div>
      )}
    </div>
  );
}
