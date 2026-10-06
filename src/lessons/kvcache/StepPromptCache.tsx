"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Formula } from "@/components/ui";
import { say, setContext } from "./clawd";

const SYSTEM = "Eres un asistente legal experto. Responde siempre con rigor y cita los artículos pertinentes. ";
const DOC = "[Contrato de arrendamiento de 40 páginas: cláusulas, anexos, condiciones de rescisión, fianza…] ";
const PREFIX_TOKENS = 6000;
const Q1 = "¿Cuánto dura el contrato?";
const Q2 = "¿Cuál es la fianza?";

// Aproximación: lectura de caché ~10% del precio, prefill ~ 1 ms por 25 tokens
const PRICE = 3; // $ por millón de tokens de entrada (ilustrativo)
const READ_FACTOR = 0.1;

interface Seg {
  text: string;
  tokens: number;
  kind: "prefix" | "tail";
}

function buildSegments(system: string, doc: string, q: string): Seg[] {
  return [
    { text: system, tokens: 1000, kind: "prefix" },
    { text: doc, tokens: PREFIX_TOKENS - 1000, kind: "prefix" },
    { text: q, tokens: 12, kind: "tail" },
  ];
}

/** Devuelve cuántos tokens del prompt B coinciden con el prefijo de A (por segmentos, comparando texto) */
function sharedTokens(a: Seg[], b: Seg[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i].text === b[i].text) sum += a[i].tokens;
    else break;
  }
  return sum;
}

function Request({ title, segs, hit }: { title: string; segs: Seg[]; hit: number }) {
  const total = segs.reduce((s, x) => s + x.tokens, 0);
  return (
    <div className="rounded-xl bg-night/50 p-3">
      <div className="mb-2 flex justify-between text-xs">
        <b className="text-ivory">{title}</b>
        <span className="font-mono text-ivory/60">{total.toLocaleString("es-ES")} tokens</span>
      </div>
      <div className="space-y-1">
        {segs.map((s, i) => {
          const reused = segs.slice(0, i + 1).reduce((a, x) => a + x.tokens, 0) <= hit;
          return (
            <div
              key={i}
              className={`rounded-lg border px-2 py-1 text-xs transition-colors duration-500 ${reused ? "border-olive bg-olive/20 text-ivory" : "border-clay/60 bg-clay/15 text-ivory"}`}
            >
              <span className={`mr-2 font-mono text-[10px] ${reused ? "text-olive" : "text-clay"}`}>{reused ? "✔ REUTILIZADO" : "↻ CALCULADO"}</span>
              {s.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StepPromptCache() {
  const [system, setSystem] = useState(SYSTEM);
  const [sent, setSent] = useState<{ a: Seg[]; b: Seg[] | null }>({ a: [], b: null });
  const [stage, setStage] = useState(0); // 0 nada, 1 primera enviada, 2 segunda enviada
  const said = useRef<Set<string>>(new Set());

  const once = (k: string, t: string, m: Parameters<typeof say>[1]) => {
    if (said.current.has(k)) return;
    said.current.add(k);
    say(t, m);
  };

  const send1 = () => {
    setSent({ a: buildSegments(SYSTEM, DOC, Q1), b: null });
    setStage(1);
    setSystem(SYSTEM);
    once("first", "Primera petición: nada en caché, hay que procesar los 6.000 tokens del prefijo. Se guarda el resultado.", "explaining");
  };
  const send2 = () => {
    const b = buildSegments(system, DOC, Q2);
    setSent((s) => ({ ...s, b }));
    setStage(2);
    const hit = sharedTokens(buildSegments(SYSTEM, DOC, Q1), b);
    if (hit === 0) say("¡Ay! Cambiaste algo al principio y todo lo que viene después deja de coincidir. Caché invalidada: se recalcula todo.", "surprised");
    else once("hit", "¡Acierto de caché! El prefijo idéntico se reutiliza y solo pagas por la pregunta nueva.", "happy");
  };

  const hit = useMemo(() => (stage === 2 && sent.b ? sharedTokens(sent.a, sent.b) : 0), [stage, sent]);
  const totalB = sent.b ? sent.b.reduce((s, x) => s + x.tokens, 0) : 0;
  const fresh = totalB - hit;
  const costFull = (totalB / 1e6) * PRICE;
  const costCached = ((hit * READ_FACTOR + fresh) / 1e6) * PRICE;
  const latFull = totalB / 25;
  const latCached = fresh / 25 + hit / 400;

  useEffect(() => {
    setContext(
      `Paso 5 (prompt caching). Etapa: ${stage === 0 ? "sin enviar" : stage === 1 ? "primera petición enviada" : "segunda petición enviada"}. ` +
        (stage === 2
          ? `Tokens reutilizados: ${hit} de ${totalB}. Coste aprox. ${costCached.toFixed(4)}$ frente a ${costFull.toFixed(4)}$. Latencia aprox. ${latCached.toFixed(0)} ms vs ${latFull.toFixed(0)} ms. El system prompt ${system === SYSTEM ? "no se ha modificado" : "se ha modificado, invalidando el prefijo"}.`
          : "Prefijo largo (system prompt + documento) idéntico en ambas peticiones."),
    );
  }, [stage, hit, totalB, costCached, costFull, latCached, latFull, system]);

  return (
    <div className="space-y-4">
      <Card title="Prompt caching: la KV cache entre peticiones">
        <p>
          Si cada petición empieza con el mismo texto largo (instrucciones, un documento, ejemplos…), ¿para qué recalcular su K y V cada vez? Los proveedores de API guardan la KV cache de ese{" "}
          <b className="text-clay">prefijo</b> unos minutos. Si tu siguiente petición empieza <i>exactamente igual</i>, se reutiliza: más barato y más rápido. Pero ojo: tiene que coincidir{" "}
          <b>desde el primer carácter</b>.
        </p>
      </Card>

      <Card title="Dos peticiones, mismo prefijo">
        <div className="mb-3 flex flex-wrap gap-2">
          <Button onClick={send1}>1. Enviar petición A</Button>
          <Button onClick={send2} disabled={stage === 0} variant="outline">
            2. Enviar petición B
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStage(0);
              setSent({ a: [], b: null });
              setSystem(SYSTEM);
            }}
          >
            Reiniciar
          </Button>
        </div>

        <div className="mb-3 rounded-xl bg-night/50 p-3 text-xs">
          <div className="mb-1 text-ivory/70">System prompt de la petición B (¡edítalo! cambia solo una letra al principio):</div>
          <textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-ivory/10 bg-night p-2 font-mono text-xs text-ivory outline-none focus:border-clay"
          />
          <div className="mt-1 flex gap-2">
            <Button variant="ghost" onClick={() => setSystem("¡" + SYSTEM)}>
              Añadir «¡» al inicio
            </Button>
            <Button variant="ghost" onClick={() => setSystem(SYSTEM + "Sé breve.")}>
              Añadir frase al final
            </Button>
            <Button variant="ghost" onClick={() => setSystem(SYSTEM)}>
              Restaurar
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {stage >= 1 ? <Request title="Petición A" segs={sent.a} hit={0} /> : <div className="rounded-xl bg-night/30 p-6 text-center text-xs text-ivory/40">Aún no has enviado la petición A</div>}
          {stage >= 2 && sent.b ? <Request title="Petición B" segs={sent.b} hit={hit} /> : <div className="rounded-xl bg-night/30 p-6 text-center text-xs text-ivory/40">Aún no has enviado la petición B</div>}
        </div>
      </Card>

      {stage === 2 && (
        <Card title="Resultado de la petición B (cifras aproximadas)">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-night/50 p-3 text-center">
              <div className="text-xs text-ivory/60">Tokens reutilizados</div>
              <div className={`font-serif text-2xl ${hit > 0 ? "text-olive" : "text-rose"}`}>
                {hit.toLocaleString("es-ES")} / {totalB.toLocaleString("es-ES")}
              </div>
            </div>
            <div className="rounded-xl bg-night/50 p-3 text-center">
              <div className="text-xs text-ivory/60">Coste de entrada</div>
              <div className="font-serif text-2xl text-clay">{costCached.toFixed(4)} $</div>
              <div className="text-[11px] text-ivory/50">sin caché: {costFull.toFixed(4)} $ · ahorro {Math.round((1 - costCached / costFull) * 100)}%</div>
            </div>
            <div className="rounded-xl bg-night/50 p-3 text-center">
              <div className="text-xs text-ivory/60">Latencia al 1.er token</div>
              <div className="font-serif text-2xl text-sky">≈ {latCached.toFixed(0)} ms</div>
              <div className="text-[11px] text-ivory/50">sin caché: ≈ {latFull.toFixed(0)} ms</div>
            </div>
          </div>
          <Formula>coste = reutilizados × 10% + nuevos × 100% (precio de ejemplo: {PRICE} $ / millón de tokens)</Formula>
          <p className="text-xs text-ivory/60">
            {hit === 0
              ? "El primer bloque ya no coincide, así que ni él ni nada de lo que va detrás se puede reutilizar: la caché funciona por prefijo."
              : hit < PREFIX_TOKENS
                ? "Solo se reutiliza hasta donde coincide el texto. A partir del primer cambio, todo se recalcula."
                : "Prefijo completo reutilizado. Consejo: pon lo fijo (instrucciones, documentos) al principio y lo variable al final."}
          </p>
        </Card>
      )}

      <Card title="Reglas de oro">
        <ul className="list-disc space-y-1 pl-5">
          <li>El prefijo debe ser <b>idéntico token a token</b>; un solo carácter distinto al inicio invalida todo lo que sigue.</li>
          <li>Lo estático (system prompt, herramientas, documentos) va primero; lo que cambia (la pregunta) va al final.</li>
          <li>La caché caduca tras unos minutos sin usarse, y suele haber un mínimo de longitud de prefijo.</li>
          <li>Las cifras de coste y latencia de aquí son ilustrativas; consulta la documentación de tu proveedor para los valores reales.</li>
        </ul>
      </Card>
    </div>
  );
}
