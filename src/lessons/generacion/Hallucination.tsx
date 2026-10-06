"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Formula, Slider } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { sampleIndex, softmaxT } from "./model";

interface Cand {
  text: string;
  logit: number;
  truth: boolean;
}
interface Prompt {
  q: string;
  note: string;
  cands: Cand[];
  fix: string;
  truthText: string;
}

const PROMPTS: Prompt[] = [
  {
    q: "La capital de Australia es…",
    note: "Ejemplo con números ilustrativos: Sídney sale mucho en textos sobre Australia, así que «suena» más probable que la respuesta correcta.",
    cands: [
      { text: "Sídney", logit: 3.0, truth: false },
      { text: "Canberra", logit: 2.6, truth: true },
      { text: "Melbourne", logit: 1.6, truth: false },
      { text: "Perth", logit: 0.4, truth: false },
    ],
    fix: "Dar el dato en el contexto (RAG / buscador)",
    truthText: "La capital es Canberra.",
  },
  {
    q: "Colón llegó a América en el año…",
    note: "Un dato que aparece millones de veces en los textos: aquí lo probable y lo verdadero coinciden.",
    cands: [
      { text: "1492", logit: 4.2, truth: true },
      { text: "1429", logit: 1.3, truth: false },
      { text: "1942", logit: 1.0, truth: false },
      { text: "1592", logit: 0.7, truth: false },
    ],
    fix: "Dar el dato en el contexto (RAG / buscador)",
    truthText: "Fue en 1492.",
  },
  {
    q: "El libro «Los vientos de Marlena», de Carlos Vidal, trata de…",
    note: "Este libro NO existe (lo he inventado). Aun así el modelo siempre produce una distribución, y cada opción «suena» bien.",
    cands: [
      { text: "una familia en el exilio", logit: 2.9, truth: false },
      { text: "un amor imposible", logit: 2.6, truth: false },
      { text: "un detective retirado", logit: 2.0, truth: false },
      { text: "No conozco ese libro", logit: 0.9, truth: true },
    ],
    fix: "Entrenar al modelo para que diga «no lo sé»",
    truthText: "El libro no existe: lo correcto era reconocer que no lo conoce.",
  },
];

export function Hallucination() {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [pi, setPi] = useState(0);
  const [fix, setFix] = useState(false);
  const [T, setT] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [mode, setMode] = useState<"greedy" | "sample">("sample");
  const told = useRef({ wrong: false, right: false });
  const pr = PROMPTS[pi];
  const logits = pr.cands.map((c) => c.logit + (fix && c.truth ? 4 : 0));
  const probs = softmaxT(logits, T);
  const cands = pr.cands;

  useEffect(() => {
    gRef.current.setContext(
      `Alucinaciones: pregunta «${pr.q}». ${cands.map((c, i) => `${c.text} ${(probs[i] * 100).toFixed(0)}%${c.truth ? " (verdadera)" : ""}`).join("; ")}. ${fix ? "Con la ayuda activada." : "Sin ayuda."} ${picked !== null ? `Elegida: ${cands[picked].text}.` : ""}`,
    );
  });

  const choose = () => {
    const i = mode === "greedy" ? probs.indexOf(Math.max(...probs)) : sampleIndex(probs, Math.random());
    setPicked(i);
    if (!cands[i].truth && !told.current.wrong) {
      told.current.wrong = true;
      gRef.current.say("¿Ves? Eligió lo que suena probable, no lo que es verdad. A eso le llamamos alucinación: texto fluido y seguro, pero falso.", "surprised");
    } else if (cands[i].truth && !told.current.right) {
      told.current.right = true;
      gRef.current.say("Esta vez acertó… pero fíjate: no ‘sabía’ que acertaba, solo era lo más probable. Prueba con la pregunta del libro inventado.", "thinking");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setPi(i);
              setPicked(null);
              setFix(false);
            }}
            className={`rounded-full px-3 py-1 text-xs transition ${i === pi ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}
          >
            Pregunta {i + 1}
          </button>
        ))}
      </div>
      <Card title={`«${pr.q}»`}>
        <p className="mb-3 text-xs text-ivory/60">{pr.note}</p>
        <div className="space-y-2">
          {cands.map((c, i) => (
            <div key={c.text} className={`rounded-lg p-2 ${picked === i ? "bg-clay/15 ring-1 ring-clay" : "bg-ivory/5"}`}>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-44 truncate text-ivory">{c.text}</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-ivory/10">
                  <motion.div className="h-full" style={{ background: c.truth ? "#788C5D" : "#D97757" }} animate={{ width: `${probs[i] * 100}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-clay-light">{(probs[i] * 100).toFixed(0)}%</span>
                <span className="w-6 text-center">{picked === i ? (c.truth ? "✅" : "❌") : ""}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Slider label="Temperatura" value={T} min={0.1} max={2} step={0.05} onChange={setT} />
          <div className="flex items-end gap-2">
            <Button variant={mode === "sample" ? "primary" : "ghost"} onClick={() => setMode("sample")}>Muestrear</Button>
            <Button variant={mode === "greedy" ? "primary" : "ghost"} onClick={() => setMode("greedy")}>Greedy</Button>
            <Button variant="outline" onClick={choose}>🎲 Que el modelo elija</Button>
          </div>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-ivory/80">
          <input type="checkbox" checked={fix} onChange={(e) => { setFix(e.target.checked); setPicked(null); }} style={{ accentColor: "#788C5D" }} />
          {pr.fix}
          <span className="text-ivory/50">(sube +4 el logit de la respuesta verdadera)</span>
        </label>
        {picked !== null && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg bg-night/60 p-3 text-xs">
            {cands[picked].truth ? "El modelo eligió la opción verdadera, pero por ser probable, no porque la verificara." : `El modelo respondió con seguridad: «${cands[picked].text}». Falso. Verdad: ${pr.truthText}`}
          </motion.div>
        )}
      </Card>
      <Card title="La idea clave">
        <Formula>elige lo probable ≠ elige lo verdadero</Formula>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>El modelo solo aprendió a predecir qué texto suele venir después. No tiene un «verificador de hechos» interno.</li>
          <li>Siempre hay que repartir 100% de probabilidad entre algo, así que casi siempre «responde», aunque no sepa.</li>
          <li>Ayudas: darle fuentes en el contexto, herramientas (buscador, calculadora), entrenarlo para decir «no lo sé», y verificar lo importante.</li>
        </ul>
      </Card>
    </div>
  );
}
