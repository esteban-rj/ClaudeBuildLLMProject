"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { PHRASES, PIECES, softmax } from "./pieces";
import { TowerStage } from "./Tower3D";

const TOK_COLORS = ["#E3C77B", "#6A9BCC", "#9DB37E", "#D97757", "#C46686", "#7FD1C1"];

export function Ignite() {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [run, setRun] = useState(0);
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);
  const phrase = PHRASES[phraseIdx];
  const probs = softmax(phrase.logits);
  const told = useRef(false);

  useEffect(() => {
    gRef.current.setContext(
      `Torre encendida: la frase «${phrase.tokens.join(" ")}» fluye por la torre. ${done ? `Resultado: «${phrase.candidates[0]}» ${(probs[0] * 100).toFixed(0)}%.` : running ? `Pasando por: ${stage >= 0 ? PIECES[stage].name : "…"}` : "Aún no se ha encendido."}`,
    );
  }, [phrase, done, running, stage, probs]);

  const ignite = () => {
    setDone(false);
    setStage(-1);
    setRunning(true);
    setRun((r) => r + 1);
    if (!told.current) {
      told.current = true;
      gRef.current.say("¡Encendemos! Mira cómo cada token, una bolita de color, sube por la torre. El carril blanco del centro es el residual stream: la autopista que lleva la información.", "happy");
    }
  };

  const cur = stage >= 0 ? PIECES[stage] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {PHRASES.map((p, i) => (
          <button
            key={i}
            disabled={running}
            onClick={() => {
              setPhraseIdx(i);
              setDone(false);
              setStage(-1);
            }}
            className={`rounded-full px-3 py-1 text-xs transition disabled:opacity-40 ${i === phraseIdx ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}
          >
            {p.tokens.join(" ")}…
          </button>
        ))}
        <Button onClick={ignite} disabled={running} className="ml-auto">
          {running ? "Fluyendo…" : done ? "⚡ Encender otra vez" : "⚡ ¡Encender!"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {phrase.tokens.map((t, i) => (
          <motion.span
            key={i}
            animate={running ? { y: [0, -4, 0] } : { y: 0 }}
            transition={{ repeat: running ? Infinity : 0, duration: 1, delay: i * 0.1 }}
            className="rounded-lg px-2.5 py-1 font-mono text-sm text-night"
            style={{ background: TOK_COLORS[i % 6] }}
          >
            {t}
          </motion.span>
        ))}
        <span className="rounded-lg border border-dashed border-ivory/40 px-2.5 py-1 font-mono text-sm text-ivory/60">¿?</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <TowerStage
          key={phraseIdx}
          run={run}
          labels
          height={480}
          onStage={(i) => setStage(i)}
          onDone={() => {
            setRunning(false);
            setDone(true);
            gRef.current.say(`Salió la distribución: «${phrase.candidates[0]}» con un ${(probs[0] * 100).toFixed(0)}%. El modelo no sabe la respuesta: reparte probabilidades.`, "surprised");
          }}
        />
        <div className="space-y-3">
          <Card title={cur ? `Ahora: ${cur.name}` : "Qué pasa en la torre"}>
            <div className="min-h-20">{cur ? cur.flow : running ? "Entrando por la base…" : done ? "La torre terminó. Mira las probabilidades de abajo." : "Pulsa «¡Encender!» y sigue las bolitas de colores."}</div>
          </Card>
          <Card title="Siguiente token">
            <div className="space-y-1.5">
              {phrase.candidates.map((c, i) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span className="w-20 truncate font-mono text-ivory">{c}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded bg-ivory/10">
                    <motion.div className="h-full bg-clay" initial={false} animate={{ width: done ? `${probs[i] * 100}%` : "0%" }} transition={{ duration: 0.8, delay: i * 0.06 }} />
                  </div>
                  <span className="w-9 text-right font-mono text-clay-light">{done ? `${(probs[i] * 100).toFixed(0)}%` : "–"}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
