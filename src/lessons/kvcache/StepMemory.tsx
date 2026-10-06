"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Formula, Slider } from "@/components/ui";
import { setContext } from "./clawd";

const PRESETS = [
  { name: "Modelo pequeño (MHA)", layers: 32, heads: 32, kv: 32, dh: 128, hint: "Cada cabeza tiene sus propias K y V (Multi-Head Attention clásico)." },
  { name: "Modelo mediano (GQA)", layers: 32, heads: 32, kv: 8, dh: 128, hint: "GQA: 8 grupos de K/V compartidos por 32 cabezas de Query." },
  { name: "Modelo grande (GQA)", layers: 80, heads: 64, kv: 8, dh: 128, hint: "80 capas con 8 cabezas KV: la caché sigue siendo enorme con contextos largos." },
  { name: "MQA extremo", layers: 32, heads: 32, kv: 1, dh: 128, hint: "MQA: una sola K y V para todas las cabezas. Mínima memoria, algo menos de calidad." },
];

const BYTES = [
  { label: "fp32 (4 B)", v: 4 },
  { label: "fp16/bf16 (2 B)", v: 2 },
  { label: "int8 / fp8 (1 B)", v: 1 },
];

function human(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

export default function StepMemory() {
  const [layers, setLayers] = useState(32);
  const [heads, setHeads] = useState(32);
  const [kv, setKv] = useState(8);
  const [dh, setDh] = useState(128);
  const [tokens, setTokens] = useState(8000);
  const [bytes, setBytes] = useState(2);

  const kvSafe = Math.min(kv, heads);
  const perToken = 2 * layers * kvSafe * dh * bytes;
  const total = perToken * tokens;
  const mha = 2 * layers * heads * dh * bytes * tokens;
  const gpu = 80e9;

  const mode = kvSafe === heads ? "MHA" : kvSafe === 1 ? "MQA" : "GQA";

  useEffect(() => {
    setContext(`Paso 4 (memoria). ${layers} capas, ${heads} cabezas Q, ${kvSafe} cabezas KV (${mode}), d_head=${dh}, ${tokens} tokens, ${bytes} bytes/valor. Por token: ${human(perToken)}. Total: ${human(total)} (${((total / gpu) * 100).toFixed(1)}% de una GPU de 80 GB). Con MHA sería ${human(mha)}.`);
  }, [layers, heads, kvSafe, mode, dh, tokens, bytes, perToken, total, mha]);

  const bars = useMemo(() => [1000, 8000, 32000, 128000].map((n) => ({ n, b: perToken * n })), [perToken]);

  return (
    <div className="space-y-4">
      <Card title="¿Cuánta memoria ocupa la caché?">
        <p>
          La caché no es gratis: guarda dos vectores (K y V) por token, por capa y por cabeza KV. Crece <b>linealmente con la longitud del contexto</b> y, en conversaciones largas, puede pesar
          más que el propio modelo. Mueve los sliders o elige un modelo de ejemplo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.name}
              variant="ghost"
              onClick={() => {
                setLayers(p.layers);
                setHeads(p.heads);
                setKv(p.kv);
                setDh(p.dh);
              }}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Parámetros">
          <div className="space-y-3">
            <Slider label="Capas" value={layers} min={4} max={96} step={1} format={(v) => `${v}`} onChange={setLayers} />
            <Slider label="Cabezas de Query" value={heads} min={1} max={64} step={1} format={(v) => `${v}`} onChange={(v) => { setHeads(v); if (kv > v) setKv(v); }} />
            <Slider label="Cabezas KV (GQA/MQA)" value={kvSafe} min={1} max={heads} step={1} format={(v) => `${v} · ${mode}`} onChange={setKv} color="#6A9BCC" />
            <Slider label="d_head (dimensión por cabeza)" value={dh} min={32} max={256} step={32} format={(v) => `${v}`} onChange={setDh} />
            <Slider label="Tokens de contexto" value={tokens} min={500} max={200000} step={500} format={(v) => v.toLocaleString("es-ES")} onChange={setTokens} color="#788C5D" />
            <div>
              <div className="mb-1 text-xs text-ivory/70">Precisión (bytes por valor)</div>
              <div className="flex flex-wrap gap-2">
                {BYTES.map((b) => (
                  <Button key={b.v} variant={bytes === b.v ? "primary" : "ghost"} onClick={() => setBytes(b.v)}>
                    {b.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Resultado">
          <Formula>2 × {layers} × {kvSafe} × {dh} × {tokens.toLocaleString("es-ES")} × {bytes}</Formula>
          <div className="my-3 text-center">
            <div className="font-serif text-4xl text-clay">{human(total)}</div>
            <div className="text-xs text-ivory/60">{human(perToken)} por token · una sola conversación</div>
          </div>
          <div className="mb-1 flex justify-between text-xs text-ivory/60">
            <span>Frente a una GPU de 80 GB</span>
            <span className="font-mono">{((total / gpu) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded bg-ivory/10">
            <div className="h-full transition-all duration-300" style={{ width: `${Math.min(100, (total / gpu) * 100)}%`, background: total > gpu ? "#C46686" : "#D97757" }} />
          </div>
          {total > gpu && <p className="mt-1 text-xs text-rose">¡No cabe en una GPU de 80 GB!</p>}
          <div className="mt-4 space-y-1">
            {bars.map((b) => (
              <div key={b.n} className="flex items-center gap-2 text-xs">
                <span className="w-16 text-right font-mono text-ivory/60">{b.n >= 1000 ? `${b.n / 1000}k` : b.n}</span>
                <div className="h-3 rounded bg-sky/70" style={{ width: `${Math.min(100, (b.b / gpu) * 100)}%`, minWidth: 2 }} />
                <span className="font-mono text-ivory/70">{human(b.b)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="MHA, GQA y MQA: compartir K y V para ahorrar">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "MHA", t: "Multi-Head", d: "Cada cabeza de Query tiene su propia K y V. Máxima calidad, máxima memoria." },
            { n: "GQA", t: "Grouped-Query", d: "Grupos de cabezas Q comparten una K y V. Es lo que usan muchos modelos modernos: casi misma calidad con mucha menos caché." },
            { n: "MQA", t: "Multi-Query", d: "Todas las cabezas comparten una sola K y V. Caché mínima, pero puede perder algo de calidad." },
          ].map((m) => (
            <div key={m.n} className={`rounded-xl p-3 text-xs ${m.n === mode ? "border border-clay bg-clay/10" : "bg-night/50"}`}>
              <div className="font-serif text-base text-ivory">{m.n} <span className="text-xs text-ivory/50">{m.t}</span></div>
              <p className="mt-1">{m.d}</p>
            </div>
          ))}
        </div>
        <Formula>
          Con tu configuración {mode}: {human(total)} · Con MHA sería {human(mha)} → ahorro ×{(mha / total).toFixed(1)}
        </Formula>
      </Card>
    </div>
  );
}
