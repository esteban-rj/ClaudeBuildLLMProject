"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Slider, Formula } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { TowerStage } from "./Tower3D";

const V = 50257;
const CTX = 1024;

function fmt(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e11 ? 0 : 1)} B`;
  return `${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)} M`;
}

const MODELS: { name: string; layers?: number; d?: number; params?: number; note: string }[] = [
  { name: "GPT-2 small", layers: 12, d: 768, params: 124e6, note: "El paper original decía 117 M; después se corrigió a 124 M." },
  { name: "GPT-2 XL", layers: 48, d: 1600, params: 1.5e9, note: "OpenAI, 2019." },
  { name: "Llama 3 8B", layers: 32, d: 4096, params: 8e9, note: "Meta, 2024." },
  { name: "GPT-3", layers: 96, d: 12288, params: 175e9, note: "OpenAI, 2020." },
  { name: "Llama 3.1 405B", layers: 126, d: 16384, params: 405e9, note: "Meta, 2024." },
  { name: "Claude", note: "Anthropic no publica los detalles de su arquitectura ni su tamaño." },
];

export function Scale() {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [n, setN] = useState(1);
  const [d, setD] = useState(768);
  const told = useRef(0);

  const block = 12 * d * d + 13 * d;
  const emb = V * d + CTX * d;
  const total = emb + n * block + 2 * d;
  const maxLog = Math.log10(405e9);

  useEffect(() => {
    gRef.current.setContext(`Apilando bloques: N=${n} bloques, d_model=${d}. Parámetros ≈ ${fmt(total)} (embeddings ${fmt(emb)}, bloques ${fmt(n * block)}).`);
  }, [n, d, total, emb, block]);

  useEffect(() => {
    if (n >= 12 && told.current < 1) {
      told.current = 1;
      gRef.current.say("¡12 bloques y 768 dimensiones: eso es exactamente GPT-2 small, unos 124 millones de parámetros! Los modelos grandes solo son más altos y más anchos.", "happy");
    } else if (n >= 20 && told.current < 2) {
      told.current = 2;
      gRef.current.say("¡Qué torre! Y aun así GPT-3 tiene 96 bloques, y con d=12288. Más bloques significa pensar con más pasos; más ancho significa recordar más cosas.", "surprised");
    }
  }, [n]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        <TowerStage n={n} height={500} />
        <div className="space-y-3">
          <Card title="Apila bloques">
            <Slider label="Nº de bloques (N×)" value={n} min={1} max={24} step={1} onChange={setN} format={(v) => `${v}×`} />
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              <span className="text-ivory/60">Ancho d_model:</span>
              {[256, 512, 768, 1024, 2048].map((x) => (
                <button key={x} onClick={() => setD(x)} className={`rounded-full px-2.5 py-0.5 ${x === d ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}>
                  {x}
                </button>
              ))}
            </div>
            <Formula>params ≈ {fmt(emb)} + N × {fmt(block)}</Formula>
            <div className="text-center font-serif text-3xl text-clay-light">{fmt(total)}</div>
            <div className="text-center text-xs text-ivory/60">parámetros (vocabulario 50.257, contexto 1.024)</div>
            <p className="mt-2 text-xs text-ivory/70">
              Cada bloque tiene ≈ 12·d² parámetros: 4·d² en la atención (Q, K, V y salida) y 8·d² en el MLP. Todos los bloques son <b>iguales</b> pero con pesos distintos.
            </p>
          </Card>
        </div>
      </div>
      <Card title="Comparación con modelos reales (cifras públicas)">
        <div className="space-y-2">
          {MODELS.map((m) => (
            <button
              key={m.name}
              disabled={!m.layers}
              onClick={() => {
                if (m.layers) {
                  setN(Math.min(24, m.layers));
                  const dd = [256, 512, 768, 1024, 2048].reduce((a, b) => (Math.abs(b - (m.d ?? 768)) < Math.abs(a - (m.d ?? 768)) ? b : a));
                  setD(dd);
                }
              }}
              className="block w-full rounded-lg bg-ivory/5 p-2 text-left transition enabled:hover:bg-ivory/10"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="w-32 font-medium text-ivory">{m.name}</span>
                {m.layers ? (
                  <>
                    <span className="w-24 font-mono text-ivory/70">{m.layers} capas</span>
                    <span className="w-24 font-mono text-ivory/70">d = {m.d}</span>
                    <div className="h-2.5 min-w-24 flex-1 overflow-hidden rounded bg-ivory/10">
                      <div className="h-full bg-clay" style={{ width: `${(Math.log10(m.params!) - 7) / (maxLog - 7) * 100}%` }} />
                    </div>
                    <span className="w-16 text-right font-mono text-clay-light">{fmt(m.params!)}</span>
                  </>
                ) : (
                  <span className="text-ivory/60">🔒 {m.note}</span>
                )}
              </div>
              {m.layers && <div className="mt-0.5 text-[11px] text-ivory/50">{m.note} (clic para cargar la torre{m.layers > 24 ? ", limitada a 24×" : ""})</div>}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ivory/50">Barras en escala logarítmica. Las cifras de los modelos de Meta y OpenAI son las publicadas por sus autores.</p>
      </Card>
    </div>
  );
}
