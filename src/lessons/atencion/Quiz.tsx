"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import { useSceneContext } from "./bits";

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  why: string;
}

export default function Quiz({ lessonId, questions, winText }: { lessonId: string; questions: QuizQuestion[]; winText: string }) {
  const guide = useGuide();
  const done = useGuideStore((s) => s.completed.includes(lessonId));
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [won, setWon] = useState(false);
  const score = answers.filter((a, i) => a === questions[i].correct).length;
  const answered = answers.filter((a) => a !== null).length;

  useSceneContext(`Reto final: ${answered}/${questions.length} preguntas respondidas, ${score} correctas. Preguntas: ${questions.map((q, i) => `${i + 1}) ${q.q} [${answers[i] === null ? "sin responder" : answers[i] === q.correct ? "bien" : "mal"}]`).join(" ")}`);

  const answer = (qi: number, oi: number) => {
    if (answers[qi] === questions[qi].correct) return;
    const next = answers.map((a, i) => (i === qi ? oi : a));
    setAnswers(next);
    const ok = oi === questions[qi].correct;
    const total = next.filter((a, i) => a === questions[i].correct).length;
    if (ok && total === questions.length) {
      setWon(true);
      guide.complete(lessonId);
      guide.say(winText, "happy");
    } else if (!ok) {
      guide.say(`Casi. ${questions[qi].why}`, "thinking");
    }
  };

  return (
    <div className="grid gap-4">
      <Card title="🏆 Reto final" actions={<span className="font-mono text-sm text-clay">{score}/{questions.length}</span>}>
        Responde bien todas las preguntas para completar la lección. Si fallas, Clawd te da una pista y puedes volver a intentarlo.
      </Card>
      {questions.map((q, qi) => {
        const a = answers[qi];
        const ok = a === q.correct;
        return (
          <Card key={q.q} title={`${qi + 1}. ${q.q}`}>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const chosen = a === oi;
                return (
                  <button
                    key={o}
                    onClick={() => answer(qi, oi)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${chosen ? (oi === q.correct ? "border-olive bg-olive/20 text-ivory" : "border-rose bg-rose/15 text-ivory") : "border-ivory/10 bg-ivory/[0.03] hover:bg-ivory/10"}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            {ok && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-olive">
                ✓ {q.why}
              </motion.p>
            )}
          </Card>
        );
      })}
      {(won || done) && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-clay/50 bg-clay/15 p-5 text-center">
          <div className="text-4xl">🎉</div>
          <div className="mt-1 font-serif text-xl text-clay-light">¡Lección completada!</div>
          {done && !won && <p className="mt-1 text-xs text-ivory/60">Ya la habías completado antes. ¡Repasar nunca sobra!</p>}
          {won && (
            <Button variant="ghost" className="mt-3" onClick={() => { setAnswers(questions.map(() => null)); setWon(false); }}>
              Repetir el reto
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
