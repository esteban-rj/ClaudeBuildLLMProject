"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Formula, PALETTE } from "@/components/ui";
import { say, setContext } from "./clawd";

const WORDS = ["El", "gato", "negro", "duerme", "sobre", "la", "alfombra", "roja", "y", "sueña", "con", "peces", "muy", "dorados", "."];
const MAX = WORDS.length;
const LAYERS = 4;

/** Operaciones de K,V acumuladas tras procesar n tokens */
const costNoCache = (n: number) => (LAYERS * n * (n + 1)) / 2;
const costCache = (n: number) => LAYERS * n;

function Grid({ n, cached }: { n: number; cached: boolean }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `3.2rem repeat(${MAX}, minmax(1.35rem, 1fr))` }}>
        {Array.from({ length: LAYERS }, (_, li) => LAYERS - 1 - li).map((l) => (
          <Row key={l} l={l} n={n} cached={cached} />
        ))}
        <div />
        {WORDS.map((w, t) => (
          <div key={w + t} className={`truncate text-center text-[9px] ${t < n ? "text-ivory/80" : "text-ivory/20"}`} title={w}>
            {w}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ l, n, cached }: { l: number; n: number; cached: boolean }) {
  return (
    <>
      <div className="flex items-center text-[10px] text-ivory/50">capa {l + 1}</div>
      {WORDS.map((w, t) => {
        if (t >= n) return <div key={t} className="h-5 rounded-[4px] border border-dashed border-ivory/10" />;
        const isNew = t === n - 1;
        // Sin caché: TODAS las celdas se recalculan (re-montamos con key nueva => destello).
        // Con caché: solo la columna nueva destella; el resto queda guardado.
        const key = cached ? `c-${t}` : `nc-${n}-${t}`;
        const restColor = cached && !isNew ? "rgba(120,140,93,0.55)" : "rgba(217,119,87,0.45)";
        return (
          <motion.div
            key={key}
            title={`${w} · capa ${l + 1}`}
            className="h-5 rounded-[4px]"
            initial={{ backgroundColor: "#FFE2C9", scale: 1.25 }}
            animate={{ backgroundColor: restColor, scale: 1 }}
            transition={{ duration: 0.6, delay: cached ? 0 : (t / Math.max(1, n)) * 0.25 }}
          />
        );
      })}
    </>
  );
}

function CostChart({ n }: { n: number }) {
  const W = 520;
  const H = 200;
  const pad = { l: 44, r: 70, t: 12, b: 30 };
  const maxY = costNoCache(MAX);
  const x = (i: number) => pad.l + ((i - 1) / (MAX - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / maxY) * (H - pad.t - pad.b);
  const path = (f: (i: number) => number, upTo: number) =>
    Array.from({ length: upTo }, (_, i) => i + 1)
      .map((i, k) => `${k === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(f(i)).toFixed(1)}`)
      .join(" ");
  const ticks = [0, 120, 240, 360, 480];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Coste acumulado con y sin caché">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#F0EEE6" strokeOpacity={0.07} />
          <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#F0EEE6" fillOpacity={0.5}>
            {t}
          </text>
        </g>
      ))}
      <text x={(W - pad.r + pad.l) / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#F0EEE6" fillOpacity={0.5}>
        tokens generados
      </text>
      {[1, 5, 10, 15].map((i) => (
        <text key={i} x={x(i)} y={H - pad.b + 13} textAnchor="middle" fontSize={10} fill="#F0EEE6" fillOpacity={0.5}>
          {i}
        </text>
      ))}
      {/* Curvas completas (fantasma) */}
      <path d={path(costNoCache, MAX)} fill="none" stroke={PALETTE.clay} strokeOpacity={0.2} strokeDasharray="4 4" strokeWidth={2} />
      <path d={path(costCache, MAX)} fill="none" stroke={PALETTE.olive} strokeOpacity={0.25} strokeDasharray="4 4" strokeWidth={2} />
      {/* Progreso real */}
      {n >= 1 && (
        <>
          <path d={path(costNoCache, n)} fill="none" stroke={PALETTE.clay} strokeWidth={2.5} />
          <path d={path(costCache, n)} fill="none" stroke={PALETTE.olive} strokeWidth={2.5} />
          <circle cx={x(n)} cy={y(costNoCache(n))} r={4} fill={PALETTE.clay} />
          <circle cx={x(n)} cy={y(costCache(n))} r={4} fill={PALETTE.olive} />
        </>
      )}
      <text x={W - pad.r + 6} y={y(costNoCache(MAX)) + 4} fontSize={11} fill={PALETTE.clay}>
        sin caché
      </text>
      <text x={W - pad.r + 6} y={y(costCache(MAX)) + 4} fontSize={11} fill={PALETTE.olive}>
        con caché
      </text>
    </svg>
  );
}

export default function StepProblem() {
  const [n, setN] = useState(1);
  const [auto, setAuto] = useState(false);
  const said = useRef<Set<string>>(new Set());
  const running = auto && n < MAX;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setN((v) => Math.min(MAX, v + 1)), 750);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const once = (k: string, text: string, mood: Parameters<typeof say>[1]) => {
      if (said.current.has(k)) return;
      said.current.add(k);
      say(text, mood);
    };
    if (n === 2) once("first", "Mira la izquierda: para el segundo token ya recalculamos también el primero. A la derecha, el primero ya estaba guardado en verde.", "explaining");
    if (n === 8) once("mid", `Con 8 tokens: ${costNoCache(8)} cálculos sin caché contra ${costCache(8)} con caché. ¡La izquierda crece como un triángulo!`, "surprised");
    if (n === MAX) once("end", `Final: ${costNoCache(MAX)} contra ${costCache(MAX)}. Eso es coste cuadrático frente a lineal. Con miles de tokens la diferencia es brutal.`, "happy");
  }, [n]);

  useEffect(() => {
    setContext(
      `Paso 1 (el problema). Se han generado ${n} de ${MAX} tokens ("${WORDS.slice(0, n).join(" ")}"), con ${LAYERS} capas. ` +
        `Cálculos de K/V acumulados: sin caché ${costNoCache(n)} (cuadrático, en este paso ${n * LAYERS}), con caché ${costCache(n)} (lineal, en este paso ${LAYERS}).`,
    );
  }, [n]);

  const reset = () => {
    setAuto(false);
    setN(1);
  };

  return (
    <div className="space-y-4">
      <Card title="Generar token a token… ¿recalculando todo?">
        <p>
          Un modelo de lenguaje escribe <b>un token cada vez</b>. Para elegir el siguiente, cada capa calcula la atención entre el token nuevo y todos los anteriores, y para eso necesita
          las <b className="text-sky">Keys (K)</b> y los <b className="text-olive">Values (V)</b> de todos ellos. Si no guardamos nada, en cada paso hay que volver a calcular K y V de
          <i> todo</i> el texto. Cada celda de abajo es «calcular K y V de un token en una capa». Destella cuando se calcula.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setN((v) => Math.min(MAX, v + 1))} disabled={n >= MAX}>
          Generar siguiente token
        </Button>
        <Button variant="outline" onClick={() => setAuto((a) => !a)} disabled={n >= MAX}>
          {running ? "Pausar" : "Auto"}
        </Button>
        <Button variant="ghost" onClick={reset}>
          Reiniciar
        </Button>
        <span className="ml-auto text-xs text-ivory/60">
          Texto: <span className="font-mono text-ivory">{WORDS.slice(0, n).join(" ")}</span>
          <span className="animate-pulse text-clay">▍</span>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={<span className="text-clay">Sin caché</span>} actions={<span className="font-mono text-xs text-clay">este paso: {n * LAYERS} · total: {costNoCache(n)}</span>}>
          <Grid n={n} cached={false} />
          <p className="mt-2 text-xs text-ivory/60">Cada paso recalcula todas las columnas: 1 + 2 + 3 + … + n columnas → crece como n²/2.</p>
        </Card>
        <Card title={<span className="text-olive">Con KV cache</span>} actions={<span className="font-mono text-xs text-olive">este paso: {LAYERS} · total: {costCache(n)}</span>}>
          <Grid n={n} cached />
          <p className="mt-2 text-xs text-ivory/60">Solo se calcula la columna del token nuevo; las verdes se leen de la memoria. Crece como n.</p>
        </Card>
      </div>

      <Card title="Coste acumulado (cálculos de K y V)">
        <CostChart n={n} />
        <Formula>
          sin caché = {LAYERS}·n(n+1)/2 = {costNoCache(n)} &nbsp;|&nbsp; con caché = {LAYERS}·n = {costCache(n)} &nbsp;→&nbsp; ahorro ×{(costNoCache(n) / costCache(n)).toFixed(1)}
        </Formula>
        <p className="text-xs text-ivory/60">
          Con 15 tokens el ahorro es ×8. Con una respuesta de 1.000 tokens sería ×500: por eso todos los modelos modernos usan KV cache.
        </p>
      </Card>
    </div>
  );
}
