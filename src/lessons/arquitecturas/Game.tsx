"use client";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";

interface Scenario { text: string; options: string[]; correct: number; why: string; wrong: Record<number, string> }

const SCENARIOS: Scenario[] = [
  {
    text: "Tu empresa recibe miles de mensajes: unos de facturación, otros de fallos técnicos, otros de ventas. Cada tipo necesita respuestas y herramientas distintas.",
    options: ["Routing", "ReAct", "Evaluator-optimizer", "Memoria de largo plazo"],
    correct: 0,
    why: "Un clasificador envía cada mensaje a su especialista: prompts cortos, herramientas propias y modelos baratos para lo fácil.",
    wrong: { 1: "ReAct funcionaría, pero gastarías muchos tokens improvisando algo que ya sabes categorizar de antemano.", 2: "Evaluar y mejorar sirve para pulir un texto, no para repartir tipos de mensajes.", 3: "La memoria ayuda a recordar, pero aquí el problema es decidir a quién le toca cada mensaje." },
  },
  {
    text: "Quieres generar un informe en pasos fijos: esquema, comprobar con código que tiene 3 secciones, y después redactar cada sección.",
    options: ["Swarm de agentes libres", "Prompt chaining con puertas", "RAG", "ReAct"],
    correct: 1,
    why: "Los pasos son conocidos y se pueden validar entre medias: una cadena con puertas de validación es simple y muy previsible.",
    wrong: { 0: "Un enjambre es un cañón para una mosca y perderías previsibilidad.", 2: "RAG recupera conocimiento; aquí no falta información, falta orden.", 3: "ReAct decide sobre la marcha; tú ya sabes los pasos, así que mejor fijarlos." },
  },
  {
    text: "Un asistente debe investigar una pregunta abierta en internet. No se sabe cuántas búsquedas hacen falta; cada resultado decide la siguiente.",
    options: ["Prompt chaining", "Routing", "ReAct", "Voting"],
    correct: 2,
    why: "Pensar → buscar → observar → volver a pensar. Cuando cada paso depende del anterior y no sabes cuántos habrá, el bucle ReAct es lo natural.",
    wrong: { 0: "Una cadena fija no puede decidir cuántas búsquedas hacer.", 1: "No hay categorías claras entre las que elegir.", 3: "Votar repite lo mismo varias veces; aquí lo que hace falta es avanzar paso a paso." },
  },
  {
    text: "Hay que migrar una app a otro framework: pasos largos y dependientes entre sí. Si uno falla, el resto del plan cambia.",
    options: ["Parallelization (sectioning)", "RAG", "Plan-and-execute con replanificación", "Routing"],
    correct: 2,
    why: "Un plan global evita despistes, el ejecutor lo cumple paso a paso, y si algo falla se replanifica. Además el ejecutor puede ser un modelo más barato.",
    wrong: { 0: "Los pasos dependen unos de otros, no se pueden hacer a la vez.", 1: "RAG ayudaría a consultar documentación, pero no estructura el trabajo.", 3: "No es un problema de clasificar entradas." },
  },
  {
    text: "Un chatbot interno debe responder preguntas sobre 10.000 documentos de la empresa que cambian cada semana, y citar la fuente.",
    options: ["Reentrenar el modelo cada semana", "Evaluator-optimizer", "Prompt chaining", "RAG"],
    correct: 3,
    why: "Recuperar los fragmentos relevantes por similitud y dárselos al modelo: se actualiza reindexando, cita fuentes y no cabe todo en el contexto de todos modos.",
    wrong: { 0: "Reentrenar es carísimo y lento; los datos cambian cada semana.", 1: "Pulir respuestas no aporta el conocimiento que falta.", 2: "Una cadena no resuelve de dónde sacar la información." },
  },
];

export default function Game() {
  const guide = useGuide();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const sc = SCENARIOS[i];

  const choose = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    if (n === sc.correct) {
      setScore((s) => s + 1);
      guide.say(`¡Exacto! ${sc.why}`, "happy");
    } else {
      guide.say(`${sc.wrong[n] ?? "No exactamente."} La mejor opción era ${sc.options[sc.correct]}. ${sc.why}`, "thinking");
    }
  };

  const next = () => {
    if (i + 1 >= SCENARIOS.length) {
      setFinished(true);
      guide.complete("arquitecturas");
      const final = score;
      guide.say(final >= 4 ? `¡Increíble, ${final} de ${SCENARIOS.length}! Ya sabes elegir la arquitectura adecuada. Ahora, ¿y si un solo agente no basta? Vamos con los sistemas multi-agente.` : `Has acertado ${final} de ${SCENARIOS.length}. Repasa la galería y vuelve a intentarlo cuando quieras. ¡Lección completada!`, final >= 4 ? "happy" : "explaining");
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  const restart = () => { setI(0); setPicked(null); setScore(0); setFinished(false); };

  if (finished) {
    return (
      <Card title="🏁 Resultado">
        <p className="text-lg text-ivory">Acertaste {score} de {SCENARIOS.length}.</p>
        <p className="mt-1">{score >= 4 ? "¡Ojo clínico de arquitecto de agentes! 🏆" : "Buen intento: vuelve a la galería o la comparativa y repite."}</p>
        <Button className="mt-3" variant="outline" onClick={restart}>Jugar otra vez</Button>
      </Card>
    );
  }

  return (
    <Card title={`🎮 ¿Qué arquitectura usarías? (${i + 1}/${SCENARIOS.length})`} actions={<span className="text-xs text-ivory/60">Aciertos: {score}</span>}>
      <p className="mb-3 rounded-xl bg-night/50 p-3 text-ivory">{sc.text}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sc.options.map((o, n) => {
          const state = picked === null ? "" : n === sc.correct ? "border-olive bg-olive/20" : n === picked ? "border-rose bg-rose/20" : "opacity-50";
          return (
            <button key={o} onClick={() => choose(n)} className={`rounded-xl border border-ivory/10 bg-ivory/5 px-3 py-2.5 text-left text-sm text-ivory transition hover:bg-ivory/10 ${state}`}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 rounded-xl border border-clay/30 bg-clay/10 p-3 text-sm">
          <p className="mb-1 font-semibold text-clay-light">{picked === sc.correct ? "¡Correcto!" : "Casi…"}</p>
          <p>{picked === sc.correct ? sc.why : `${sc.wrong[picked] ?? ""} La respuesta era «${sc.options[sc.correct]}». ${sc.why}`}</p>
          <Button className="mt-3" onClick={next}>{i + 1 >= SCENARIOS.length ? "Ver resultado" : "Siguiente escenario →"}</Button>
        </div>
      )}
    </Card>
  );
}
