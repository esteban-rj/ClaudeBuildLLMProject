"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { say, setContext } from "./clawd";
import { runTool, TOOL_DEFS, type ToolName } from "./tools";

type Ev =
  | { kind: "thought"; text: string; narr: string }
  | { kind: "call"; tool: ToolName; args: Record<string, string>; narr: string }
  | { kind: "result"; data: Record<string, unknown>; narr: string }
  | { kind: "final"; text: string; narr: string };

interface Task {
  id: string;
  prompt: string;
  build: () => Ev[];
}

const call = (tool: ToolName, args: Record<string, string>, narr: string): Ev[] => [
  { kind: "call", tool, args, narr },
  { kind: "result", data: runTool(tool, args), narr: "Esto lo ejecuta tu programa, no el modelo: el resultado vuelve al contexto como una observación." },
];

const TASKS: Task[] = [
  {
    id: "tiempo",
    prompt: "¿Qué tiempo hará en Madrid y qué me pongo?",
    build: () => [
      { kind: "thought", text: "Necesito saber el tiempo actual en Madrid. No lo sé de memoria, así que usaré get_weather.", narr: "Primero pienso: ¿puedo responder ya? No, me falta un dato. Necesito una herramienta." },
      ...call("get_weather", { city: "Madrid" }, "Decido llamar a una herramienta. Escribo la llamada como JSON; yo no la ejecuto, solo la pido."),
      { kind: "thought", text: "11 °C y lluvia ligera (3,2 mm). Recomendaré abrigo ligero e impermeable o paraguas. Ya tengo todo.", narr: "Observo el resultado y razono con él. Con esto ya puedo contestar." },
      { kind: "final", text: "En Madrid hacen unos 11 °C con lluvia ligera. Ponte un abrigo medio, calzado que aguante el agua y lleva paraguas ☔.", narr: "Como ya no necesito más herramientas, doy la respuesta final y el bucle termina." },
    ],
  },
  {
    id: "propina",
    prompt: "Calcula el 15% de propina de 87,40€ entre 3",
    build: () => {
      const tip = runTool("calculator", { expression: "87.40 * 0.15" }).result as number;
      const each = runTool("calculator", { expression: `${tip} / 3` }).result as number;
      return [
        { kind: "thought", text: "Primero la propina: 15% de 87,40. Los modelos fallamos a veces en aritmética, mejor uso la calculadora.", narr: "Los LLM no son calculadoras fiables; delegar en una herramienta evita errores." },
        ...call("calculator", { expression: "87.40 * 0.15" }, "Primera llamada: calcular la propina."),
        { kind: "thought", text: `La propina total es ${tip.toFixed(2).replace(".", ",")} €. Ahora hay que dividirla entre 3.`, narr: "Un resultado me lleva a otra acción: así se encadenan los pasos." },
        ...call("calculator", { expression: `${tip} / 3` }, "Segunda llamada, que depende del resultado de la primera."),
        { kind: "final", text: `La propina del 15% son ${tip.toFixed(2).replace(".", ",")} €, es decir ${each.toFixed(2).replace(".", ",")} € por persona (sin contar la cuenta).`, narr: "Listo. Ojo: la calculadora ha calculado de verdad, no es un resultado de mentira." },
      ];
    },
  },
  {
    id: "autor",
    prompt: "Busca el autor de Cien años de soledad y su año de nacimiento",
    build: () => [
      { kind: "thought", text: "Dos datos encadenados: primero el autor, luego su nacimiento. Empiezo buscando el libro.", narr: "Veo que la tarea tiene dos partes y que la segunda depende de la primera." },
      ...call("search_web", { query: "autor de Cien años de soledad" }, "Busco el libro para averiguar quién lo escribió."),
      { kind: "thought", text: "El autor es Gabriel García Márquez. Ahora necesito su fecha de nacimiento.", narr: "Ahora sé el nombre; sin él no podría haber hecho la segunda búsqueda." },
      ...call("search_web", { query: "Gabriel García Márquez fecha de nacimiento" }, "Segunda búsqueda, ya con el nombre."),
      { kind: "final", text: "«Cien años de soledad» la escribió Gabriel García Márquez, que nació en 1927 (6 de marzo, en Aracataca, Colombia).", narr: "Tengo los dos datos, así que respondo. Fíjate: el bucle duró dos vueltas porque la tarea lo pedía." },
    ],
  },
];

const STYLE: Record<Ev["kind"], { label: string; cls: string; icon: string }> = {
  thought: { label: "Pensamiento", cls: "border-sky/50 bg-sky/10", icon: "💭" },
  call: { label: "Llamada a herramienta", cls: "border-clay/60 bg-clay/10", icon: "🛠️" },
  result: { label: "Resultado", cls: "border-olive/60 bg-olive/10", icon: "📥" },
  final: { label: "Respuesta final", cls: "border-sand/60 bg-sand/10", icon: "✅" },
};

export default function StepLoop() {
  const [ti, setTi] = useState(0);
  const [shown, setShown] = useState(0);
  const [auto, setAuto] = useState(false);
  const [events, setEvents] = useState<Ev[]>(() => TASKS[0].build());
  const said = useRef<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  const task = TASKS[ti];
  const finished = shown >= events.length;
  const running = auto && !finished;

  const pick = (i: number) => {
    setTi(i);
    setEvents(TASKS[i].build());
    setShown(0);
    setAuto(false);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setShown((s) => Math.min(events.length, s + 1)), 1800);
    return () => clearInterval(id);
  }, [running, events.length]);

  // Clawd narra cada fase recién mostrada
  useEffect(() => {
    if (shown === 0) return;
    const ev = events[shown - 1];
    const key = `${task.id}-${shown}`;
    if (said.current === key) return;
    said.current = key;
    say(ev.narr, ev.kind === "final" ? "happy" : ev.kind === "thought" ? "thinking" : "explaining");
  }, [shown, events, task.id]);

  useEffect(() => {
    const last = shown > 0 ? events[shown - 1] : null;
    setContext(
      `Paso 2 (bucle agéntico). Tarea elegida: "${task.prompt}". Pasos mostrados: ${shown}/${events.length}. ` +
        (last ? `Último paso (${STYLE[last.kind].label}): ${JSON.stringify(last.kind === "call" ? { tool: last.tool, args: last.args } : last.kind === "result" ? last.data : last.text)}.` : "Aún no ha empezado.") +
        " Herramientas: get_weather, calculator (calcula de verdad), search_web (simulada).",
    );
  }, [shown, events, task]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [shown]);

  return (
    <div className="space-y-4">
      <Card title="El bucle agéntico en acción">
        <p>
          Elige una tarea y mira la traza paso a paso: <b className="text-sky">pensamiento</b> → <b className="text-clay">llamada a herramienta</b> → <b className="text-olive">resultado</b> → … → <b className="text-sand">respuesta final</b>.
          En cada vuelta el modelo ve <i>todo</i> lo anterior y decide qué hacer.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TASKS.map((t, i) => (
            <Button key={t.id} variant={i === ti ? "primary" : "ghost"} onClick={() => pick(i)}>
              {t.prompt}
            </Button>
          ))}
        </div>
      </Card>

      <Card
        title="Traza del agente"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShown((s) => Math.min(events.length, s + 1))} disabled={finished}>
              Siguiente paso
            </Button>
            <Button variant="outline" onClick={() => setAuto((a) => !a)} disabled={finished}>
              {running ? "Pausar" : "Auto"}
            </Button>
            <Button variant="ghost" onClick={() => pick(ti)}>
              Reiniciar
            </Button>
          </div>
        }
      >
        <div className="mb-3 rounded-xl bg-sky/15 px-3 py-2 text-sm text-ivory">👤 {task.prompt}</div>
        <div className="space-y-2">
          {events.slice(0, shown).map((ev, i) => {
            const s = STYLE[ev.kind];
            return (
              <div key={i} className={`rounded-xl border px-3 py-2 ${s.cls}`} style={{ animation: "fadeIn .4s" }}>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ivory/60">
                  {s.icon} {s.label}
                  {ev.kind === "call" && <span className="ml-2 normal-case text-clay">{TOOL_DEFS[ev.tool].icon} {ev.tool}</span>}
                </div>
                {(ev.kind === "thought" || ev.kind === "final") && <p className="text-sm text-ivory">{ev.text}</p>}
                {ev.kind === "call" && (
                  <pre className="overflow-x-auto font-mono text-xs text-clay-light">{JSON.stringify({ type: "tool_use", name: ev.tool, input: ev.args }, null, 2)}</pre>
                )}
                {ev.kind === "result" && <pre className="overflow-x-auto font-mono text-xs text-olive">{JSON.stringify({ type: "tool_result", content: ev.data }, null, 2)}</pre>}
              </div>
            );
          })}
          {shown === 0 && <p className="py-6 text-center text-xs text-ivory/40">Pulsa «Siguiente paso» para empezar.</p>}
          <div ref={endRef} />
        </div>
        {finished && <p className="mt-3 text-center text-xs text-olive">Bucle terminado en {events.filter((e) => e.kind === "call").length} llamada(s) a herramienta. Prueba otra tarea.</p>}
      </Card>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
