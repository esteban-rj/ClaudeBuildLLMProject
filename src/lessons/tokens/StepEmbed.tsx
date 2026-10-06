"use client";
import { useEffect, useState } from "react";
import { Card, Formula } from "@/components/ui";
import { TOKEN_COLORS, showTok, tokenize } from "./tokenizer";
import { setContext } from "./guide";

const DIM = 8;

/** Fila de la tabla de embeddings para un ID (pseudoaleatoria determinista) */
export function embeddingRow(id: number): number[] {
  return Array.from({ length: DIM }, (_, d) => {
    const x = Math.sin(id * 12.9898 + d * 78.233 + 0.5) * 43758.5453;
    return +((x - Math.floor(x)) * 2 - 1).toFixed(2);
  });
}

export default function StepEmbed() {
  const [text, setText] = useState("el gato come pescado");
  const [sel, setSel] = useState(0);
  const toks = tokenize(text).slice(0, 10);
  const s = Math.min(sel, Math.max(0, toks.length - 1));

  useEffect(() => {
    setContext(
      `Paso 3 · Tabla de embeddings (lookup). Texto «${text}». Cada ID de token selecciona una fila de una matriz [vocabulario × ${DIM}]. ` +
        toks.map((t) => `«${showTok(t.text)}»#${t.id} → [${embeddingRow(t.id).join(", ")}]`).join("; ") +
        ". Los valores de esta demo son aleatorios (un modelo recién creado); el entrenamiento los ajusta hasta que adquieren significado.",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const color = (v: number) => (v >= 0 ? `rgba(217,119,87,${0.15 + Math.abs(v) * 0.85})` : `rgba(106,155,204,${0.15 + Math.abs(v) * 0.85})`);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <Card title="Cada ID abre una fila de la tabla">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-4 w-full rounded-xl border border-ivory/15 bg-night/60 p-2 font-mono text-sm text-ivory outline-none focus:border-clay"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-y-1 text-xs">
              <thead>
                <tr className="text-ivory/50">
                  <th className="text-left font-normal">token</th>
                  <th className="text-left font-normal">ID</th>
                  <th className="text-left font-normal">vector de embedding ({DIM} dimensiones)</th>
                </tr>
              </thead>
              <tbody>
                {toks.map((t, i) => {
                  const row = embeddingRow(t.id);
                  const c = TOKEN_COLORS[i % TOKEN_COLORS.length];
                  return (
                    <tr key={i} onClick={() => setSel(i)} className="cursor-pointer" style={{ outline: i === s ? `1px solid ${c}` : undefined }}>
                      <td className="rounded-l-lg px-2 py-1 font-mono text-sm" style={{ background: c + "33" }}>{showTok(t.text)}</td>
                      <td className="px-2 font-mono text-ivory/70">{t.id}</td>
                      <td className="rounded-r-lg">
                        <div className="flex gap-1">
                          {row.map((v, d) => (
                            <div key={d} className="flex h-8 w-11 items-center justify-center rounded font-mono text-[10px] text-ivory" style={{ background: color(v) }}>
                              {v.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {toks.length === 0 && <p className="text-ivory/40">Escribe algo…</p>}
        </Card>
        {toks[s] && (
          <Card title={`Barras del vector de «${showTok(toks[s].text)}»`}>
            <div className="flex h-28 items-center gap-2">
              {embeddingRow(toks[s].id).map((v, d) => (
                <div key={d} className="relative flex h-full flex-1 flex-col items-center">
                  <div className="relative w-full flex-1">
                    <div
                      className="absolute left-1/4 w-1/2 rounded"
                      style={{
                        background: v >= 0 ? "#D97757" : "#6A9BCC",
                        height: `${Math.abs(v) * 50}%`,
                        [v >= 0 ? "bottom" : "top"]: "50%",
                      }}
                    />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-ivory/20" />
                  </div>
                  <span className="mt-1 font-mono text-[9px] text-ivory/50">d{d + 1}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      <div className="space-y-4">
        <Card title="Una tabla de consulta">
          <p>
            Dentro del modelo hay una gran matriz de tamaño <b>vocabulario × dimensión</b>. Dado un ID, el modelo simplemente <b>lee esa
            fila</b>: eso es el embedding. Sin cálculos, solo un lookup.
          </p>
          <Formula>E[{toks[s]?.id ?? "id"}] = [{toks[s] ? embeddingRow(toks[s].id).slice(0, 3).join(", ") : "…"}, …]</Formula>
          <p>
            Aquí cada vector tiene {DIM} números; en un modelo grande son miles (4096, 8192…). Rojo = positivo, azul = negativo.
          </p>
        </Card>
        <Card title="¿Y qué significan esos números?">
          <p>
            Al principio, nada: son aleatorios. Durante el entrenamiento (¡lo que vimos antes!) el gradiente los va moviendo hasta que
            palabras que se usan en contextos parecidos acaban con vectores parecidos. En el siguiente paso verás ese resultado en 3D.
          </p>
        </Card>
      </div>
    </div>
  );
}
