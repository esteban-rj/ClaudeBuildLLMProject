"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Slider } from "@/components/ui";
import { say, setContext } from "./clawd";

const RISKS = [
  { t: "Bucles infinitos", d: "El agente repite la misma llamada porque no avanza. Solución: límite de pasos y detección de repeticiones." },
  { t: "Costes disparados", d: "Cada vuelta relee todo el contexto. Solución: presupuesto máximo de tokens/dinero." },
  { t: "Acciones irreversibles", d: "Borrar archivos, enviar emails, pagar. Solución: confirmación humana antes de actuar." },
  { t: "Errores en cadena", d: "Un dato malo en el paso 2 contamina los siguientes. Solución: verificar resultados y permitir rectificar." },
];

interface Line { text: string; tone: "ok" | "warn" | "bad" }

export default function StepStop() {
  const [maxSteps, setMaxSteps] = useState(6);
  const [stuck, setStuck] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [step, setStep] = useState(0);
  const [stopped, setStopped] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const said = useRef(false);

  // Respuesta natural: si no está atascado, termina en el paso 3
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setStep((s) => {
        const n = s + 1;
        if (!stuck && n === 3) {
          setLines((l) => [...l, { text: `Paso ${n}: «Ya tengo la respuesta» → final (el modelo decide parar).`, tone: "ok" }]);
          setStopped("El modelo terminó por sí mismo (condición de parada natural).");
          setRunning(false);
          return n;
        }
        setLines((l) => [...l, { text: `Paso ${n}: ${stuck ? "search_web('precio del vuelo') → sin resultados… reintento" : n === 1 ? "get_weather('Madrid')" : "calculator('…')"}`, tone: stuck ? "warn" : "ok" }]);
        if (n >= maxSteps) {
          setLines((l) => [...l, { text: `⛔ Límite de ${maxSteps} pasos alcanzado: el programa corta el bucle.`, tone: "bad" }]);
          setStopped(`El límite de pasos (${maxSteps}) evitó un bucle infinito.`);
          setRunning(false);
        }
        return n;
      });
    }, 700);
    return () => clearInterval(id);
  }, [running, stuck, maxSteps]);

  useEffect(() => {
    if (stopped && stuck && !said.current) {
      said.current = true;
      say("¿Ves? El agente se atascó repitiendo lo mismo y fue el límite de pasos, escrito por una persona, lo que lo frenó. Nunca dejes un agente sin tope.", "explaining");
    }
  }, [stopped, stuck]);

  const start = () => {
    setLines([]);
    setStep(0);
    setStopped(null);
    setRunning(true);
  };

  /* Confirmación humana */
  const [decision, setDecision] = useState<"pending" | "yes" | "no" | null>(null);

  useEffect(() => {
    setContext(`Paso 5 (parada y riesgos). Simulación: límite de pasos=${maxSteps}, agente atascado=${stuck ? "sí" : "no"}, pasos ejecutados=${step}, resultado=${stopped ?? "en curso/sin ejecutar"}. Confirmación humana para borrar archivos: ${decision ?? "no iniciada"}.`);
  }, [maxSteps, stuck, step, stopped, decision]);

  return (
    <div className="space-y-4">
      <Card title="¿Cuándo para un agente?">
        <p>
          Un bucle sin condición de parada es un bucle infinito con factura. Hay tres formas de acabar: el modelo <b className="text-olive">decide que ya terminó</b> (da la respuesta final), tu programa{" "}
          <b className="text-clay">le pone un tope</b> (pasos, tokens, tiempo) o un <b className="text-sky">humano interviene</b>.
        </p>
      </Card>

      <Card title="Simulador: límite de pasos">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Slider label="Máximo de pasos" value={maxSteps} min={2} max={10} step={1} format={(v) => `${v}`} onChange={setMaxSteps} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={stuck} onChange={(e) => setStuck(e.target.checked)} style={{ accentColor: "#D97757" }} />
              Simular un agente atascado (repite la misma búsqueda)
            </label>
            <Button onClick={start} disabled={running}>{running ? "Ejecutando…" : "Ejecutar agente"}</Button>
          </div>
          <div className="min-h-[9rem] rounded-xl bg-night/60 p-3 font-mono text-xs">
            {lines.length === 0 && <span className="text-ivory/40">La traza aparecerá aquí.</span>}
            {lines.map((l, i) => (
              <div key={i} className={l.tone === "ok" ? "text-olive" : l.tone === "warn" ? "text-sand" : "text-rose"}>{l.text}</div>
            ))}
            {stopped && <div className="mt-2 border-t border-ivory/10 pt-2 text-ivory">{stopped}</div>}
          </div>
        </div>
      </Card>

      <Card title="Confirmación humana">
        <p className="mb-3">Para acciones peligrosas o irreversibles, el agente propone y una persona dispone. Pruébalo:</p>
        <div className="rounded-xl border border-rose/50 bg-rose/10 p-3 text-sm">
          <div className="mb-2 font-mono text-xs text-rose">🛠 El agente quiere ejecutar: <b>delete_files(&quot;/proyecto/*.tmp&quot;)</b> — 214 archivos</div>
          {decision === null || decision === "pending" ? (
            <div className="flex gap-2">
              <Button onClick={() => { setDecision("yes"); say("Aprobado: se ejecuta. Fíjate en que fuiste tú quien tomó la decisión, no el modelo.", "explaining"); }}>Aprobar</Button>
              <Button variant="outline" onClick={() => { setDecision("no"); say("Rechazado. El agente recibe «el usuario denegó la acción» como resultado y puede buscar otra alternativa.", "explaining"); }}>Rechazar</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className={decision === "yes" ? "text-olive" : "text-rose"}>{decision === "yes" ? "✔ Ejecutado tras tu aprobación." : "✘ Denegado: el agente lo recibe como observación y replantea."}</span>
              <Button variant="ghost" onClick={() => setDecision(null)}>Repetir</Button>
            </div>
          )}
        </div>
      </Card>

      <Card title="Riesgos habituales y cómo mitigarlos">
        <div className="grid gap-3 sm:grid-cols-2">
          {RISKS.map((r) => (
            <div key={r.t} className="rounded-xl bg-night/50 p-3 text-xs">
              <div className="font-serif text-sm text-ivory">{r.t}</div>
              <p className="mt-1">{r.d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
