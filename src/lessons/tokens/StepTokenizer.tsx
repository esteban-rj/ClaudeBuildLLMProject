"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Formula } from "@/components/ui";
import { TOKEN_COLORS, VOCAB_SIZE, showTok, tokenize } from "./tokenizer";
import { say, setContext } from "./guide";

const EXAMPLES = [
  "El gato come pescado",
  "Hola, ¿cómo estás?",
  "anticonstitucionalmente",
  "La inteligencia artificial es genial",
  "Hello world 😀",
];

export default function StepTokenizer() {
  const [text, setText] = useState("El gato come pescado");
  const toks = tokenize(text);
  const chars = Array.from(text).length;
  const ratio = toks.length ? chars / toks.length : 0;
  const told = useRef({ long: false, fb: false });

  useEffect(() => {
    setContext(
      `Paso 1 · Tokenizador BPE. Texto: «${text}» → ${toks.length} tokens (${chars} caracteres, ${ratio.toFixed(2)} caracteres/token). ` +
        `Tokens: ${toks.map((t) => `«${showTok(t.text)}»#${t.id}`).join(" ")}. Vocabulario de ${VOCAB_SIZE} tokens. · representa el espacio previo.`,
    );
    if (!told.current.fb && toks.some((t) => t.fallback)) {
      told.current.fb = true;
      say("Ese símbolo no está en mi vocabulario, así que lo codifico carácter a carácter (o byte a byte). Por eso un tokenizador nunca se queda sin respuesta.", "thinking");
    } else if (!told.current.long && toks.length > 0 && ratio >= 4) {
      told.current.long = true;
      say("¡Mira qué eficiente! Las palabras comunes caben en un solo token. Las raras se rompen en trocitos.", "happy");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <Card title="Escribe y mira cómo se trocea">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-ivory/15 bg-night/60 p-3 font-mono text-sm text-ivory outline-none focus:border-clay"
            placeholder="Escribe algo en español…"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <Button key={e} variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => setText(e)}>{e}</Button>
            ))}
          </div>
        </Card>
        <Card title="Tokens e IDs">
          <div className="flex min-h-24 flex-wrap gap-2">
            {toks.map((t, i) => {
              const color = t.fallback ? "#8A8A85" : TOKEN_COLORS[i % TOKEN_COLORS.length];
              return (
                <motion.div
                  key={`${i}-${t.text}-${text.length}`}
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="rounded-lg border px-2 py-1 text-center"
                  style={{ borderColor: color, background: color + "26" }}
                >
                  <div className="font-mono text-base text-ivory">{showTok(t.text)}</div>
                  <div className="font-mono text-[10px]" style={{ color }}>{t.fallback ? `byte ${t.id - 100000}` : `#${t.id}`}</div>
                </motion.div>
              );
            })}
            {toks.length === 0 && <span className="text-ivory/40">Escribe algo arriba…</span>}
          </div>
          <p className="mt-3 text-xs text-ivory/60">El punto «·» marca un espacio antes de la palabra. Los tokens grises no estaban en el vocabulario: se codifican por su código Unicode.</p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Texto → números">
          <p>
            Una red solo entiende números. El tokenizador parte el texto en <b>tokens</b> (trozos frecuentes de palabras) y cada token
            tiene un <b>ID</b> en un vocabulario fijo. Este vocabulario tiene {VOCAB_SIZE} tokens; el de un modelo real, entre 30.000 y
            200.000.
          </p>
          <Formula>{chars} caracteres → {toks.length} tokens</Formula>
          <Formula>{ratio ? ratio.toFixed(2) : "–"} caracteres por token</Formula>
          <p>
            Lo que ve el modelo es la lista de IDs: <span className="font-mono text-clay-light">[{toks.slice(0, 8).map((t) => t.id).join(", ")}{toks.length > 8 ? ", …" : ""}]</span>
          </p>
        </Card>
        <Card title="¿Por qué no letras o palabras enteras?">
          <p>
            Con letras, las secuencias serían larguísimas. Con palabras enteras, el vocabulario sería enorme y fallaría con palabras
            nuevas. Las <b>subpalabras</b> son el punto medio: «anticonstitucionalmente» se escribe con piezas que ya conoce.
          </p>
        </Card>
      </div>
    </div>
  );
}
