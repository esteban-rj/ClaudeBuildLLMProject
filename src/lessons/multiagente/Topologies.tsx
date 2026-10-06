"use client";
import { useEffect, useState } from "react";
import { Button, Card, PALETTE } from "@/components/ui";
import { FlowDiagram, useRunner, type DEdge, type DNode, type Frame, type Move } from "../arquitecturas/FlowDiagram";

interface Topo {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  nodes: DNode[];
  edges: DEdge[];
  frames: Frame[];
  height: number;
  when: string;
  pros: string;
  cons: string;
}

const mv = (from: string, to: string, label: string, color?: string): Move => ({ from, to, label, color });
const fr = (log: string, moves: Move[], traces: Record<string, string> = {}): Frame => ({ log, moves, traces });
const both = (a: string, b: string, curve = 14): DEdge[] => [{ from: a, to: b, curve }, { from: b, to: a, curve }];

const TOPOS: Topo[] = [
  {
    id: "ow", name: "Orquestador-trabajadores", emoji: "🎯", height: 290,
    blurb: "Un jefe divide la tarea, reparte y junta. Los trabajadores no hablan entre sí. Es lo que usamos para construir esta app.",
    nodes: [
      { id: "o", label: "Orquestador", x: 320, y: 40, kind: "boss", w: 120 },
      { id: "w1", label: "Neurona", x: 90, y: 190, kind: "agent", w: 100 },
      { id: "w2", label: "Atención", x: 250, y: 190, kind: "agent", w: 100 },
      { id: "w3", label: "Tokens", x: 410, y: 190, kind: "agent", w: 100 },
      { id: "w4", label: "Generación", x: 560, y: 190, kind: "agent", w: 100 },
    ],
    edges: ["w1", "w2", "w3", "w4"].flatMap((w) => both("o", w)),
    frames: [
      fr("El orquestador recibe la tarea y la descompone en 4 subtareas.", [mv("o", "w1", "tarea"), mv("o", "w2", "tarea"), mv("o", "w3", "tarea"), mv("o", "w4", "tarea")], { o: "Plan: 4 lecciones independientes" }),
      fr("Cada trabajador la ejecuta en su propio contexto, a la vez.", [], { w1: "Escribiendo lección…", w2: "Escribiendo lección…", w3: "Escribiendo lección…", w4: "Escribiendo lección…" }),
      fr("Devuelven resultados (resúmenes, no todo su trabajo).", [mv("w1", "o", "✓"), mv("w2", "o", "✓"), mv("w3", "o", "✓"), mv("w4", "o", "✓")], { w1: "Hecho: 5 archivos", w2: "Hecho: 6 archivos", w3: "Hecho: 4 archivos", w4: "Hecho: 5 archivos" }),
      fr("El orquestador integra todo en el producto final.", [], { o: "Integrado: app completa ✓" }),
    ],
    when: "Tarea grande que se parte en piezas independientes.",
    pros: "Simple de razonar, paralelismo real, un único punto de control.",
    cons: "El orquestador es un cuello de botella y su contexto se llena si recibe demasiado detalle.",
  },
  {
    id: "h", name: "Jerárquica", emoji: "🏢", height: 330,
    blurb: "Jefes de equipo: el orquestador delega en líderes y cada líder dirige sus propios trabajadores. Escala a proyectos enormes.",
    nodes: [
      { id: "o", label: "Director", x: 320, y: 75, kind: "boss", w: 110, trace: "above" },
      { id: "l1", label: "Líder Frontend", x: 170, y: 150, kind: "llm", w: 120, trace: "none" },
      { id: "l2", label: "Líder Backend", x: 470, y: 150, kind: "llm", w: 120, trace: "none" },
      { id: "w1", label: "UI", x: 90, y: 245, kind: "agent", w: 80 },
      { id: "w2", label: "Estilos", x: 250, y: 245, kind: "agent", w: 80 },
      { id: "w3", label: "API", x: 390, y: 245, kind: "agent", w: 80 },
      { id: "w4", label: "Base de datos", x: 550, y: 245, kind: "agent", w: 100 },
    ],
    edges: [...both("o", "l1"), ...both("o", "l2"), ...both("l1", "w1"), ...both("l1", "w2"), ...both("l2", "w3"), ...both("l2", "w4")],
    frames: [
      fr("El director reparte por áreas.", [mv("o", "l1", "frontend"), mv("o", "l2", "backend")], { o: "Dos áreas: front y back" }),
      fr("Cada líder subdivide y delega.", [mv("l1", "w1", "UI"), mv("l1", "w2", "CSS"), mv("l2", "w3", "API"), mv("l2", "w4", "BD")], {}),
      fr("Los trabajadores hacen su parte.", [], { w1: "Componentes ✓", w2: "Tema oscuro ✓", w3: "3 endpoints ✓", w4: "Esquema ✓" }),
      fr("Los líderes consolidan y suben un resumen.", [mv("w1", "l1", "✓"), mv("w2", "l1", "✓"), mv("w3", "l2", "✓"), mv("w4", "l2", "✓")]),
      fr("El director ve solo dos resúmenes, no todo el detalle.", [mv("l1", "o", "resumen"), mv("l2", "o", "resumen")], { o: "2 resúmenes → entrega final" }),
    ],
    when: "Proyectos muy grandes con áreas bien diferenciadas.",
    pros: "Cada nivel solo ve lo suyo: el contexto del director se mantiene pequeño.",
    cons: "Más capas = más latencia, más tokens y más puntos donde se pierde información.",
  },
  {
    id: "p", name: "Pipeline", emoji: "🏭", height: 220,
    blurb: "Cadena de montaje: cada agente recibe la salida del anterior y la transforma. Es una cadena de prompts, pero con agentes completos.",
    nodes: [
      { id: "a", label: "Investigador", x: 70, y: 80, kind: "agent", w: 110 },
      { id: "b", label: "Redactor", x: 220, y: 80, kind: "agent", w: 100 },
      { id: "c", label: "Revisor", x: 370, y: 80, kind: "agent", w: 100 },
      { id: "d", label: "Publicador", x: 530, y: 80, kind: "agent", w: 110 },
    ],
    edges: [{ from: "a", to: "b" }, { from: "b", to: "c" }, { from: "c", to: "d" }, { from: "c", to: "b", curve: 40, dashed: true, label: "cambios" }],
    frames: [
      fr("El investigador reúne datos.", [], { a: "10 fuentes sobre el tema" }),
      fr("Pasa el dossier al redactor.", [mv("a", "b", "dossier")], { b: "Escribe borrador" }),
      fr("El borrador llega al revisor.", [mv("b", "c", "borrador")], { c: "Hay 2 erratas" }),
      fr("El revisor pide cambios y vuelve atrás.", [mv("c", "b", "cambios", PALETTE.rose)], { b: "Corrige erratas" }),
      fr("Versión limpia al revisor y luego a publicar.", [mv("b", "c", "v2"), mv("c", "d", "aprobado", PALETTE.olive)], { c: "Aprobado ✓", d: "Publicado" }),
    ],
    when: "El trabajo tiene etapas claras y ordenadas.",
    pros: "Muy previsible; cada agente se especializa.",
    cons: "Sin paralelismo: el más lento marca el ritmo y un fallo bloquea todo lo posterior.",
  },
  {
    id: "d", name: "Debate / pares", emoji: "🥊", height: 300,
    blurb: "Dos o más agentes con posturas distintas discuten y un juez decide. Se usa para reducir errores y sesgos en decisiones difíciles.",
    nodes: [
      { id: "a", label: "Agente A", sub: "a favor", x: 110, y: 70, kind: "agent", w: 100 },
      { id: "b", label: "Agente B", sub: "en contra", x: 530, y: 70, kind: "agent", w: 100 },
      { id: "j", label: "Juez", x: 320, y: 215, kind: "boss", w: 100 },
    ],
    edges: [{ from: "a", to: "b", curve: 24 }, { from: "b", to: "a", curve: 24 }, { from: "a", to: "j" }, { from: "b", to: "j" }],
    frames: [
      fr("A defiende: «Migrar a microservicios».", [mv("a", "b", "argumento")], { a: "Escala por equipos" }),
      fr("B contraargumenta.", [mv("b", "a", "réplica")], { b: "Complejidad operativa x3" }),
      fr("A refina su postura con la crítica.", [mv("a", "b", "matiz")], { a: "Solo 2 servicios clave" }),
      fr("Ambos presentan sus posiciones finales al juez.", [mv("a", "j", "postura"), mv("b", "j", "postura")], {}),
      fr("El juez decide con ambos puntos de vista.", [], { j: "Empezar con 2 servicios, no 12" }),
    ],
    when: "Decisiones con trade-offs, verificación de hechos, revisión de código.",
    pros: "Menos alucinaciones y puntos ciegos: se cuestionan entre sí.",
    cons: "Caro (muchas rondas) y puede no converger o ceder por «cortesía».",
  },
  {
    id: "s", name: "Enjambre", emoji: "🐝", height: 340,
    blurb: "Agentes iguales sin jefe fijo: comparten una pizarra y se pasan el trabajo unos a otros según lo que haga falta.",
    nodes: [
      { id: "a1", label: "Agente 1", x: 110, y: 90, kind: "agent", w: 90, trace: "above" },
      { id: "a2", label: "Agente 2", x: 530, y: 90, kind: "agent", w: 90, trace: "above" },
      { id: "a3", label: "Agente 3", x: 110, y: 260, kind: "agent", w: 90 },
      { id: "a4", label: "Agente 4", x: 530, y: 260, kind: "agent", w: 90 },
      { id: "bb", label: "Pizarra", sub: "memoria compartida", x: 320, y: 175, kind: "store", w: 140 },
    ],
    edges: [...both("a1", "bb"), ...both("a2", "bb"), ...both("a3", "bb"), ...both("a4", "bb"), { from: "a2", to: "a4", curve: 20, dashed: true, label: "traspaso" }],
    frames: [
      fr("El agente 1 anota un hallazgo en la pizarra.", [mv("a1", "bb", "escribe")], { a1: "Encontré un bug en login", bb: "bug: login" }),
      fr("El agente 2 lee la pizarra y detecta que le toca.", [mv("bb", "a2", "lee")], { a2: "Es del área de seguridad" }),
      fr("Traspasa a un especialista (handoff).", [mv("a2", "a4", "traspaso")], { a4: "Recibo: arreglo el bug" }),
      fr("El agente 4 deja el resultado en la pizarra.", [mv("a4", "bb", "escribe")], { bb: "bug: login ✓ arreglado" }),
      fr("Los demás se enteran leyendo la pizarra.", [mv("bb", "a1", "lee"), mv("bb", "a3", "lee")], { a3: "Sigo con mi tarea" }),
    ],
    when: "Problemas exploratorios donde no se sabe de antemano quién debe hacer qué.",
    pros: "Flexible y resistente: no hay un jefe que sea punto único de fallo.",
    cons: "Difícil de predecir y depurar; riesgo de bucles y trabajo duplicado.",
  },
];

export default function Topologies({ onPick }: { onPick?: (name: string) => void }) {
  const [id, setId] = useState(TOPOS[0].id);
  const t = TOPOS.find((x) => x.id === id) ?? TOPOS[0];
  const runner = useRunner(t.frames.length, 1500);
  const { reset } = runner;
  useEffect(() => { reset(); }, [id, reset]);
  const log = runner.idx >= 0 ? t.frames[runner.idx].log : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TOPOS.map((x) => (
          <button key={x.id} onClick={() => { setId(x.id); onPick?.(x.name); }} className={`rounded-full px-3 py-1.5 text-xs transition ${x.id === id ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}>
            {x.emoji} {x.name}
          </button>
        ))}
      </div>
      <Card title={`${t.emoji} ${t.name}`} actions={<Button onClick={runner.run} disabled={runner.running}>{runner.running ? "Ejecutando…" : runner.done ? "▶ Repetir" : "▶ Ejecutar"}</Button>}>
        <p className="mb-3">{t.blurb}</p>
        <div className="w-full rounded-xl border border-ivory/10 bg-night/40">
          <FlowDiagram nodes={t.nodes} edges={t.edges} frames={t.frames} frameIdx={runner.idx} height={t.height} packetMs={1100} />
        </div>
        <div className="mt-2 min-h-[1.5rem] font-mono text-xs text-ivory">{log ? `▸ ${log}` : <span className="text-ivory/40">Pulsa «Ejecutar» para ver cómo se comunican.</span>}</div>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg bg-night/50 p-2"><b className="text-olive">Cuándo:</b> {t.when}</div>
          <div className="rounded-lg bg-night/50 p-2"><b className="text-sky">Ventaja:</b> {t.pros}</div>
          <div className="rounded-lg bg-night/50 p-2"><b className="text-rose">Coste:</b> {t.cons}</div>
        </div>
      </Card>
    </div>
  );
}
