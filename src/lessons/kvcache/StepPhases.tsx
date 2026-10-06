"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Slider } from "@/components/ui";
import { say, setContext } from "./clawd";

const OUT_TOKENS = 8;

export default function StepPhases() {
  const [promptLen, setPromptLen] = useState(12);
  const [t, setT] = useState(0); // 0 = parado; avanza en "ticks"
  const [playing, setPlaying] = useState(false);
  const said = useRef<Set<string>>(new Set());

  // Duración relativa: prefill = 1 paso grande en paralelo; decode = 1 paso pequeño por token
  const prefillTicks = 6;
  const total = prefillTicks + OUT_TOKENS;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((v) => {
        if (v >= total) {
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, 550);
    return () => clearInterval(id);
  }, [playing, total]);

  useEffect(() => {
    const once = (k: string, text: string, mood: Parameters<typeof say>[1]) => {
      if (said.current.has(k)) return;
      said.current.add(k);
      say(text, mood);
    };
    if (t === 1) once("pre", "Fase prefill: leo todo tu prompt de golpe, todos los tokens en paralelo. La GPU va a tope y se llena la caché.", "explaining");
    if (t === prefillTicks + 1) once("dec", "Ahora viene el decode: un token por paso, leyendo la caché entera cada vez. Aquí la GPU espera más a la memoria que al cálculo.", "thinking");
  }, [t]);

  const inPrefill = t > 0 && t <= prefillTicks;
  const decoded = Math.max(0, t - prefillTicks);
  const phase = t === 0 ? "parado" : inPrefill ? "prefill" : t >= total ? "terminado" : "decode";

  useEffect(() => {
    setContext(`Paso 3 (prefill vs decode). Prompt de ${promptLen} tokens. Fase actual: ${phase}. Tokens generados: ${decoded} de ${OUT_TOKENS}. El prefill procesa el prompt en paralelo (limitado por cómputo); el decode va token a token (limitado por ancho de banda de memoria).`);
  }, [promptLen, phase, decoded]);

  const reset = () => {
    setPlaying(false);
    setT(0);
  };

  const promptTokens = Array.from({ length: promptLen }, (_, i) => i);

  return (
    <div className="space-y-4">
      <Card title="Dos fases, dos personalidades">
        <p>
          Cuando le mandas un prompt a un modelo pasan dos cosas muy distintas. <b className="text-sky">Prefill</b>: procesa todo tu prompt a la vez (los tokens ya se conocen, así que se puede en paralelo) y
          rellena la caché. <b className="text-clay">Decode</b>: genera la respuesta <i>de uno en uno</i>, porque cada token depende del anterior. El prefill es cuestión de potencia de cálculo; el decode,
          de leer la caché de memoria una y otra vez.
        </p>
      </Card>

      <Card
        title="Timeline"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (t >= total) setT(0);
                setPlaying((p) => !p);
              }}
            >
              {playing ? "Pausar" : t >= total ? "Repetir" : t === 0 ? "Enviar prompt" : "Continuar"}
            </Button>
            <Button variant="ghost" onClick={reset}>
              Reiniciar
            </Button>
          </div>
        }
      >
        <div className="mb-4 max-w-sm">
          <Slider label="Tokens en el prompt" value={promptLen} min={4} max={24} step={1} format={(v) => `${v}`} onChange={(v) => { setPromptLen(v); reset(); }} color="#6A9BCC" />
        </div>

        <div className="mb-1 flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 ${inPrefill ? "bg-sky text-night" : "bg-ivory/5 text-ivory/50"}`}>PREFILL</span>
          <span className={`rounded-full px-2 py-0.5 ${phase === "decode" || phase === "terminado" ? "bg-clay text-night" : "bg-ivory/5 text-ivory/50"}`}>DECODE</span>
          <span className="ml-auto font-mono text-ivory/60">fase: {phase}</span>
        </div>

        {/* Prompt: todos se encienden a la vez */}
        <div className="rounded-xl bg-night/50 p-3">
          <div className="mb-2 text-xs text-ivory/60">Prompt ({promptLen} tokens) → se procesan <b>todos a la vez</b></div>
          <div className="flex flex-wrap gap-1">
            {promptTokens.map((i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-md transition-all duration-500"
                style={{
                  background: t === 0 ? "rgba(240,238,230,0.08)" : "#6A9BCC",
                  opacity: t === 0 ? 1 : inPrefill ? 0.5 + 0.5 * Math.abs(Math.sin(t + i * 0.2)) : 0.9,
                  transform: inPrefill ? "scale(1.12)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded bg-ivory/10">
            <div className="h-full bg-sky transition-all duration-500" style={{ width: `${(Math.min(t, prefillTicks) / prefillTicks) * 100}%` }} />
          </div>
        </div>

        {/* Decode: uno a uno */}
        <div className="mt-3 rounded-xl bg-night/50 p-3">
          <div className="mb-2 text-xs text-ivory/60">Respuesta → un token por paso, cada uno lee la caché</div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: OUT_TOKENS }, (_, i) => (
              <div
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] transition-all duration-300"
                style={{ background: i < decoded ? "#D97757" : "rgba(240,238,230,0.08)", color: "#141413", transform: i === decoded - 1 ? "scale(1.2)" : "scale(1)" }}
              >
                {i < decoded ? i + 1 : ""}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-night/50 p-3">
            <div className="text-ivory/60">Caché guardada</div>
            <div className="font-mono text-lg text-olive">{t === 0 ? 0 : (inPrefill ? Math.round((t / prefillTicks) * promptLen) : promptLen + decoded)} tokens</div>
          </div>
          <div className="rounded-xl bg-night/50 p-3">
            <div className="text-ivory/60">Tiempo hasta el primer token (TTFT)</div>
            <div className="font-mono text-lg text-sky">≈ prefill</div>
          </div>
        </div>
      </Card>

      <Card title="¿Por qué importa?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Un prompt largo alarga el <b>primer token</b> (prefill), pero no cada token siguiente.</li>
          <li>El decode es lento por token porque cada paso lee <i>toda</i> la caché de la memoria de la GPU.</li>
          <li>Si el prefill de un prefijo ya está guardado de otra petición, te lo ahorras. Eso es el <b className="text-clay">prompt caching</b> (paso 5).</li>
        </ul>
      </Card>
    </div>
  );
}
