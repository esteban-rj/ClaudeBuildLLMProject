"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Slider } from "@/components/ui";
import { say, setContext } from "./clawd";

const WINDOW = 8000; // ventana de ejemplo pequeña para que se vea cómo se llena

const DEFINITION = {
  name: "get_weather",
  description: "Devuelve el tiempo actual de una ciudad. Úsala cuando el usuario pregunte por el clima.",
  input_schema: {
    type: "object",
    properties: { city: { type: "string", description: "Nombre de la ciudad, p. ej. Madrid" } },
    required: ["city"],
  },
};

const TOOL_USE = { type: "tool_use", id: "toolu_01A", name: "get_weather", input: { city: "Madrid" } };

interface Msg {
  role: string;
  label: string;
  color: string;
  tokens: number;
  json?: unknown;
}

export default function StepAnatomy() {
  const [shown, setShown] = useState(1);
  const [resultTokens, setResultTokens] = useState(150);

  const msgs: Msg[] = useMemo(
    () => [
      { role: "system", label: "Instrucciones + definición de herramientas", color: "#8A8A85", tokens: 900, json: DEFINITION },
      { role: "user", label: "¿Qué tiempo hará en Madrid?", color: "#6A9BCC", tokens: 12 },
      { role: "assistant", label: "tool_use: get_weather", color: "#D97757", tokens: 45, json: TOOL_USE },
      { role: "user", label: "tool_result (lo devuelve tu código)", color: "#788C5D", tokens: resultTokens, json: { type: "tool_result", tool_use_id: "toolu_01A", content: "11 °C, lluvia ligera…" } },
      { role: "assistant", label: "Respuesta final", color: "#E3C77B", tokens: 60 },
    ],
    [resultTokens],
  );

  const used = msgs.slice(0, shown).reduce((s, m) => s + m.tokens, 0);
  const pct = (used / WINDOW) * 100;
  const danger = pct > 80;

  useEffect(() => {
    if (danger) say("Cuidado: el contexto está casi lleno. Un resultado de herramienta enorme puede comerse la ventana y el agente pierde espacio para pensar.", "surprised");
  }, [danger]);

  useEffect(() => {
    setContext(`Paso 4 (anatomía de una llamada). Mensajes en contexto: ${shown}/${msgs.length}. Tokens usados: ${used} de ${WINDOW} (${pct.toFixed(0)}%). Tamaño del tool_result: ${resultTokens} tokens. Una herramienta se define con name, description e input_schema; el modelo responde con un bloque tool_use y tu código devuelve un tool_result.`);
  }, [shown, used, pct, resultTokens, msgs.length]);

  return (
    <div className="space-y-4">
      <Card title="1. Defines la herramienta">
        <p className="mb-2">
          El modelo no ve tu código: solo una <b>descripción</b>. Con tres campos le dices cómo se llama, para qué sirve y qué argumentos acepta (un JSON Schema). Una buena descripción es la mitad del trabajo.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-night/70 p-3 font-mono text-xs text-clay-light">{JSON.stringify(DEFINITION, null, 2)}</pre>
      </Card>

      <Card title="2. El diálogo y la ventana de contexto" actions={
        <div className="flex gap-2">
          <Button onClick={() => setShown((s) => Math.min(msgs.length, s + 1))} disabled={shown >= msgs.length}>Añadir mensaje</Button>
          <Button variant="ghost" onClick={() => setShown(1)}>Reiniciar</Button>
        </div>
      }>
        <div className="space-y-2">
          {msgs.slice(0, shown).map((m, i) => (
            <div key={i} className="rounded-xl border bg-night/40 p-2" style={{ borderColor: m.color + "99" }}>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: m.color }} className="font-medium uppercase">{m.role}</span>
                <span className="font-mono text-ivory/60">+{m.tokens} tokens</span>
              </div>
              <div className="text-sm text-ivory">{m.label}</div>
              {i > 0 && m.json !== undefined && i !== 0 && <pre className="mt-1 overflow-x-auto font-mono text-[11px] text-ivory/70">{JSON.stringify(m.json)}</pre>}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-ivory/70">
            <span>Ventana de contexto (ejemplo: {WINDOW.toLocaleString("es-ES")} tokens)</span>
            <span className="font-mono" style={{ color: danger ? "#C46686" : "#D97757" }}>{used.toLocaleString("es-ES")} ({pct.toFixed(0)}%)</span>
          </div>
          <div className="flex h-4 overflow-hidden rounded bg-ivory/10">
            {msgs.slice(0, shown).map((m, i) => (
              <div key={i} className="h-full transition-all duration-500" style={{ width: `${(m.tokens / WINDOW) * 100}%`, background: m.color }} title={`${m.role}: ${m.tokens}`} />
            ))}
          </div>
        </div>

        <div className="mt-4 max-w-md">
          <Slider label="Tamaño del tool_result (p. ej. una página web entera)" value={resultTokens} min={50} max={7000} step={50} format={(v) => `${v} tokens`} onChange={setResultTokens} color="#788C5D" />
        </div>
        <p className="mt-2 text-xs text-ivory/60">
          Cada vuelta del bucle añade más mensajes: el modelo relee <i>todo</i> cada vez. Por eso se resumen o recortan los resultados largos, y por eso el prompt caching (lección anterior) ayuda tanto a los agentes.
        </p>
      </Card>
    </div>
  );
}
