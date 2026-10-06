"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { complete, say, setContext } from "./clawd";

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  ok: string;
  ko: string;
}

export function Quiz({ lessonId, questions, title = "Reto final" }: { lessonId: string; questions: QuizQuestion[]; title?: string }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const doneRef = useRef(false);

  const answered = answers.filter((a) => a !== null).length;
  const correct = answers.filter((a, i) => a === questions[i].correct).length;
  const allDone = answered === questions.length;

  useEffect(() => {
    setContext(
      `Quiz final: ${answered}/${questions.length} respondidas, ${correct} correctas. ` +
        questions.map((q, i) => `P${i + 1}: "${q.q}" -> ${answers[i] === null ? "sin responder" : answers[i] === q.correct ? "bien" : `mal (eligió "${q.options[answers[i] as number]}")`}`).join("; "),
    );
  }, [answers, answered, correct, questions]);

  const choose = (qi: number, oi: number) => {
    if (answers[qi] !== null) return;
    const next = answers.map((a, i) => (i === qi ? oi : a));
    setAnswers(next);
    const q = questions[qi];
    const nowAnswered = next.filter((a) => a !== null).length;
    const nowCorrect = next.filter((a, i) => a === questions[i].correct).length;
    if (nowAnswered === questions.length && !doneRef.current) {
      doneRef.current = true;
      complete(lessonId);
      if (nowCorrect === questions.length) say(`¡Pleno! ${nowCorrect} de ${questions.length}. Lección completada, eres un crack.`, "happy");
      else say(`${oi === q.correct ? "¡Bien!" : "Casi."} Has acertado ${nowCorrect} de ${questions.length}. Lección completada; repasa las que fallaste cuando quieras.`, "happy");
      return;
    }
    say(oi === q.correct ? q.ok : q.ko, oi === q.correct ? "happy" : "thinking");
  };

  const reset = () => setAnswers(questions.map(() => null));

  return (
    <Card
      title={title}
      actions={
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-clay">
            {correct}/{questions.length}
          </span>
          {answered > 0 && (
            <Button variant="ghost" onClick={reset}>
              Reintentar
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={q.q}>
            <p className="mb-2 font-medium text-ivory">
              {qi + 1}. {q.q}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const a = answers[qi];
                const picked = a === oi;
                const isRight = oi === q.correct;
                const cls =
                  a === null
                    ? "border-ivory/10 bg-ivory/5 hover:border-clay/60 hover:bg-clay/10"
                    : isRight
                      ? "border-olive bg-olive/20 text-ivory"
                      : picked
                        ? "border-rose bg-rose/20 text-ivory"
                        : "border-ivory/5 bg-ivory/[0.02] opacity-50";
                return (
                  <button key={o} disabled={a !== null} onClick={() => choose(qi, oi)} className={`rounded-xl border px-3 py-2 text-left text-sm transition ${cls}`}>
                    {o}
                  </button>
                );
              })}
            </div>
            {answers[qi] !== null && <p className={`mt-2 text-xs ${answers[qi] === q.correct ? "text-olive" : "text-rose"}`}>{answers[qi] === q.correct ? q.ok : q.ko}</p>}
          </div>
        ))}
        {allDone && (
          <div className="rounded-xl border border-clay/40 bg-clay/10 p-3 text-center text-ivory">
            {correct === questions.length ? "¡Perfecto! Lección completada." : `Lección completada con ${correct}/${questions.length}. ¡Pulsa Reintentar para ir a por el pleno!`}
          </div>
        )}
      </div>
    </Card>
  );
}
