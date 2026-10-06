"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";

type Mode = "bert" | "gpt" | "t5";

function Matrix({ title, rows, cols, allowed, color, rowLabel, colLabel }: { title: string; rows: string[]; cols: string[]; allowed: (i: number, j: number) => boolean; color: string; rowLabel: string; colLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const cell = 34;
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-ivory">{title}</div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-[10px]">
          <thead>
            <tr>
              <th className="text-left font-normal text-ivory/40">{rowLabel} ↓ / {colLabel} →</th>
              {cols.map((c, j) => (
                <th key={j} className="font-mono font-normal text-ivory/60" style={{ width: cell }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
                <td className={`pr-2 text-right font-mono ${hover === i ? "text-clay-light" : "text-ivory/60"}`}>{r}</td>
                {cols.map((_, j) => {
                  const ok = allowed(i, j);
                  return (
                    <td key={j}>
                      <motion.div
                        animate={{ opacity: ok ? 1 : 0.9, scale: hover === i && ok ? 1.1 : 1 }}
                        className="flex items-center justify-center rounded"
                        style={{ height: 24, width: cell, background: ok ? color : "rgba(240,238,230,0.06)", outline: hover === i ? "1px solid rgba(240,238,230,0.6)" : "none" }}
                      >
                        {!ok && <span className="text-ivory/30">✕</span>}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const INFO: Record<Mode, { name: string; sub: string; color: string; who: string; how: string; use: string; say: string }> = {
  bert: {
    name: "Encoder (BERT)",
    sub: "Mira en las dos direcciones",
    color: "#6A9BCC",
    who: "BERT, RoBERTa",
    how: "Cada token puede ver TODOS los demás, los de antes y los de después. Entiende muy bien el texto, pero no está hecho para escribir.",
    use: "Clasificar, buscar, rellenar huecos («El gato [MASK] en la alfombra» → «duerme»).",
    say: "Un encoder lo ve todo a la vez, como leer una frase entera con un rotulador. Es genial para entender, pero no sirve para escribir palabra a palabra.",
  },
  gpt: {
    name: "Decoder (GPT, Claude)",
    sub: "Solo mira hacia atrás",
    color: "#D97757",
    who: "GPT, Llama, y la familia de modelos de chat como Claude",
    how: "Máscara causal: cada token solo ve a los anteriores (la parte de arriba a la derecha está tapada), porque al generar el futuro todavía no existe. Predice el siguiente token y repite.",
    use: "Generar texto, código, conversar. Es la arquitectura de los asistentes actuales.",
    say: "El decoder lleva una máscara causal: no puede mirar hacia delante. Esa es justo la torre que construimos, y es la arquitectura de los chatbots como yo.",
  },
  t5: {
    name: "Encoder-decoder (T5)",
    sub: "Uno lee, otro escribe",
    color: "#9DB37E",
    who: "T5, BART, los traductores clásicos",
    how: "El encoder lee la entrada completa. El decoder escribe la salida token a token y, con atención cruzada, consulta lo que leyó el encoder.",
    use: "Traducir, resumir: entrada y salida bien separadas.",
    say: "El encoder-decoder son dos torres: una lee y otra escribe, conectadas por atención cruzada. Perfecto para traducir.",
  },
};

export function Architectures() {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [mode, setMode] = useState<Mode>("gpt");
  const seen = useRef<Set<Mode>>(new Set());
  const info = INFO[mode];

  useEffect(() => {
    gRef.current.setContext(`Comparando arquitecturas: el usuario mira ${info.name}. ${info.how}`);
  }, [mode, info]);

  const pick = (m: Mode) => {
    setMode(m);
    if (!seen.current.has(m)) {
      seen.current.add(m);
      gRef.current.say(INFO[m].say, "explaining");
    }
  };

  const bert = ["El", "gato", "[MASK]", "en", "la", "alfombra"];
  const gpt = ["El", "gato", "se", "sentó", "en", "la"];
  const enc = ["Traduce:", "El", "gato", "duerme"];
  const dec = ["The", "cat", "sleeps"];

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(INFO) as Mode[]).map((m) => (
          <button key={m} onClick={() => pick(m)} className={`rounded-2xl border p-3 text-left transition ${m === mode ? "border-clay bg-clay/10" : "border-ivory/10 bg-panel/80 hover:border-ivory/30"}`}>
            <div className="mb-2 flex items-end gap-1.5">
              {m === "t5" ? (
                <>
                  <Tower color={INFO.bert.color} h={44} />
                  <span className="pb-4 text-xs text-ivory/50">→</span>
                  <Tower color={INFO.gpt.color} h={44} />
                </>
              ) : (
                <Tower color={INFO[m].color} h={m === "bert" ? 44 : 44} />
              )}
            </div>
            <div className="font-serif text-ivory">{INFO[m].name}</div>
            <div className="text-xs text-ivory/60">{INFO[m].sub}</div>
          </button>
        ))}
      </div>

      <Card title={`${info.name}: ${info.sub}`}>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <p>{info.how}</p>
            <p><b className="text-clay-light">Ejemplos:</b> {info.who}.</p>
            <p><b className="text-clay-light">Sirve para:</b> {info.use}</p>
            <p className="text-xs text-ivory/50">Pasa el ratón (o toca) una fila para ver qué tokens puede mirar. Color = puede mirar; ✕ = tapado.</p>
          </div>
          <div className="space-y-4">
            {mode === "bert" && <Matrix title="Atención del encoder (todos con todos)" rows={bert} cols={bert} allowed={() => true} color={info.color} rowLabel="quien mira" colLabel="mirado" />}
            {mode === "gpt" && <Matrix title="Atención del decoder (máscara causal)" rows={gpt} cols={gpt} allowed={(i, j) => j <= i} color={info.color} rowLabel="quien mira" colLabel="mirado" />}
            {mode === "t5" && (
              <>
                <Matrix title="1) Encoder: lee la entrada entera" rows={enc} cols={enc} allowed={() => true} color={INFO.bert.color} rowLabel="entrada" colLabel="entrada" />
                <Matrix title="2) Decoder: escribe mirando solo atrás" rows={dec} cols={dec} allowed={(i, j) => j <= i} color={INFO.gpt.color} rowLabel="salida" colLabel="salida" />
                <Matrix title="3) Atención cruzada: el decoder consulta al encoder" rows={dec} cols={enc} allowed={() => true} color={info.color} rowLabel="salida" colLabel="entrada" />
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Tower({ color, h }: { color: string; h: number }) {
  return (
    <div className="flex flex-col-reverse gap-0.5" style={{ height: h }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="w-9 flex-1 rounded-sm" style={{ background: color, opacity: 0.45 + i * 0.15 }} />
      ))}
    </div>
  );
}
