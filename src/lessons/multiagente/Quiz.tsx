"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button, Card, PALETTE } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";

interface Q { q: string; options: string[]; correct: number; why: string }
const QUESTIONS: Q[] = [
  { q: "¿Cuál es una razón clave para usar sub-agentes?", options: ["Que cada uno tenga su propio contexto limpio y puedan trabajar en paralelo", "Que el modelo sea más inteligente por tener más agentes", "Gastar menos tokens en total", "Evitar escribir prompts"], correct: 0, why: "Aíslan el contexto y permiten paralelismo. Pero ojo: en total gastan MÁS tokens, no menos." },
  { q: "Lanzas 6 sub-agentes en paralelo con tareas de 20 min cada una. Aproximadamente, ¿cuánto tarda?", options: ["120 min", "20 min más el reparto y la integración", "6 min", "Lo mismo que uno solo, siempre"], correct: 1, why: "Tardas lo del más lento (~20 min) más el coste de repartir e integrar. Secuencial serían 120." },
  { q: "¿Por qué cada sub-agente tuvo su propia carpeta al construir esta app?", options: ["Por orden estético", "Para evitar que dos agentes pisen el mismo archivo", "Porque lo exige Next.js", "Para gastar menos memoria"], correct: 1, why: "Si dos agentes escriben el mismo archivo, uno sobrescribe al otro. Carpetas separadas = sin conflictos." },
  { q: "¿Qué topología usarías para un flujo investigar → redactar → revisar → publicar?", options: ["Enjambre", "Debate", "Pipeline", "Jerárquica"], correct: 2, why: "Etapas ordenadas, cada una consume la salida de la anterior: un pipeline." },
  { q: "¿Cómo repartirías modelos entre orquestador y sub-agentes?", options: ["El más barato para el orquestador y el más potente para todos los demás", "Potente para orquestar e integrar, rápido y barato para las tareas acotadas", "Siempre el mismo para que sea justo", "Da igual, el coste no cambia"], correct: 1, why: "Planificar e integrar son decisiones difíciles pero con pocos tokens; la ejecución gasta muchos tokens y se puede hacer con un modelo más rápido." },
];

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    x: ((i * 53) % 100) - 50,
    y: -120 - ((i * 29) % 120),
    r: (i * 47) % 360,
    c: [PALETTE.clay, PALETTE.sky, PALETTE.olive, PALETTE.rose, PALETTE.sand][i % 5],
    d: (i % 6) * 0.05,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center">
      {bits.map((b, i) => (
        <motion.span key={i} className="absolute h-2.5 w-2.5 rounded-sm" style={{ background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x * 8, y: [0, b.y, 260], opacity: [1, 1, 0], rotate: b.r * 2 }}
          transition={{ duration: 2.4, delay: b.d, ease: "easeOut" }} />
      ))}
    </div>
  );
}

export default function Quiz() {
  const guide = useGuide();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = QUESTIONS[i];

  const choose = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    if (n === q.correct) { setScore((s) => s + 1); guide.say(`¡Correcto! ${q.why}`, "happy"); }
    else guide.say(`No exactamente. ${q.why}`, "thinking");
  };
  const next = () => {
    if (i + 1 >= QUESTIONS.length) {
      setFinished(true);
      guide.complete("multiagente");
      guide.say("¡Mapa completado! Has recorrido desde una sola neurona hasta sistemas de agentes que construyen apps. Y esta misma app nació así: un orquestador y seis sub-agentes. ¡Gracias por aprender conmigo!", "happy");
    } else { setI(i + 1); setPicked(null); }
  };
  const restart = () => { setI(0); setPicked(null); setScore(0); setFinished(false); };

  if (finished) {
    return (
      <Card className="relative overflow-hidden text-center">
        <Confetti />
        <div className="py-6">
          <div className="text-5xl">🎉🐝🗺️</div>
          <h3 className="mt-3 font-serif text-2xl text-clay">¡Mapa completado!</h3>
          <p className="mt-2 text-ivory">Acertaste {score} de {QUESTIONS.length} preguntas.</p>
          <p className="mx-auto mt-2 max-w-md">De una neurona a un equipo de agentes: ya conoces todo el camino. Y recuerda, esta app la construyó un orquestador con 6 sub-agentes.</p>
          <Button className="mt-4" variant="outline" onClick={restart}>Repetir el quiz</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`🧩 Quiz final (${i + 1}/${QUESTIONS.length})`} actions={<span className="text-xs text-ivory/60">Aciertos: {score}</span>}>
      <p className="mb-3 text-base text-ivory">{q.q}</p>
      <div className="grid gap-2">
        {q.options.map((o, n) => {
          const st = picked === null ? "" : n === q.correct ? "border-olive bg-olive/20" : n === picked ? "border-rose bg-rose/20" : "opacity-50";
          return <button key={o} onClick={() => choose(n)} className={`rounded-xl border border-ivory/10 bg-ivory/5 px-3 py-2.5 text-left text-sm text-ivory transition hover:bg-ivory/10 ${st}`}>{o}</button>;
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 rounded-xl border border-clay/30 bg-clay/10 p-3 text-sm">
          <p>{q.why}</p>
          <Button className="mt-3" onClick={next}>{i + 1 >= QUESTIONS.length ? "Terminar 🎉" : "Siguiente →"}</Button>
        </div>
      )}
    </Card>
  );
}
