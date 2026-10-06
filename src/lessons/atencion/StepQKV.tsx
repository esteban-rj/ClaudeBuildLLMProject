"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, Formula } from "@/components/ui";
import { DIMS, K, Q, TOKENS, V, WK, WQ, WV, X, fmt } from "./math";
import { MatrixView, TokenPicker, VecCells, useSceneContext } from "./bits";

const KINDS = [
  { id: "Q", name: "Query", color: "#D97757", W: WQ, M: Q, emoji: "🔎", what: "Lo que busco", desc: "La pregunta que el token lanza a los demás. «estaba» pregunta: ¿quién es el ser vivo del que hablamos?" },
  { id: "K", name: "Key", color: "#6A9BCC", W: WK, M: K, emoji: "🏷️", what: "Mi etiqueta", desc: "Lo que cada token anuncia de sí mismo, como el lomo de un libro. «gato» anuncia: soy un ser vivo." },
  { id: "V", name: "Value", color: "#788C5D", W: WV, M: V, emoji: "📦", what: "Mi contenido", desc: "La información que el token entrega si alguien le presta atención: el contenido del libro." },
] as const;

export default function StepQKV() {
  const [tok, setTok] = useState(7);
  const [kind, setKind] = useState(0);
  const k = KINDS[kind];
  const out = k.M[tok];

  useSceneContext(
    `Paso 2 (Q, K, V). Token seleccionado "${TOKENS[tok]}", embedding x=[${X[tok].map((v) => fmt(v)).join(", ")}]. Viendo la matriz W_${k.id}; resultado ${k.id}=[${out.map((v) => fmt(v)).join(", ")}]. Dimensiones del embedding de juguete: ${DIMS.join(", ")}.`,
  );

  return (
    <div className="grid gap-4">
      <Card title="La biblioteca de los tokens">
        <p>
          Imagina una biblioteca. Tú llegas con una <b className="text-clay">pregunta</b> (Query), cada libro tiene una <b className="text-sky">etiqueta</b> en el lomo (Key) y, dentro, su <b className="text-olive">contenido</b> (Value).
          Comparas tu pregunta con las etiquetas y te llevas sobre todo el contenido de los libros que mejor encajan. En la atención, <b>cada token hace los tres papeles a la vez</b>.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {KINDS.map((kk, i) => (
            <button
              key={kk.id}
              onClick={() => setKind(i)}
              className={`rounded-xl border p-3 text-left transition ${i === kind ? "bg-ivory/10" : "bg-ivory/[0.03] hover:bg-ivory/5"}`}
              style={{ borderColor: i === kind ? kk.color : "rgba(240,238,230,0.1)" }}
            >
              <div className="font-serif text-base" style={{ color: kk.color }}>
                {kk.emoji} {kk.name} · {kk.what}
              </div>
              <div className="mt-1 text-xs text-ivory/70">{kk.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card title={`De embedding a ${k.name}`}>
        <p className="mb-3">
          Elige un token. Su embedding <span className="font-mono">x</span> (4 números, uno por «rasgo») se multiplica por una matriz aprendida <span className="font-mono" style={{ color: k.color }}>W_{k.id}</span> y sale su{" "}
          <span style={{ color: k.color }}>{k.name}</span>. Las matrices son las mismas para todos los tokens: lo que cambia es el embedding.
        </p>
        <TokenPicker tokens={TOKENS} value={tok} onChange={setTok} />
        <div className="mt-4 flex flex-col items-center gap-4 lg:flex-row lg:justify-center">
          <div>
            <div className="mb-1 flex gap-0.5 pl-[46px] text-[9px] text-ivory/40">
              {DIMS.map((d) => (
                <span key={d} className="w-11 truncate text-center" title={d}>
                  {d}
                </span>
              ))}
            </div>
            <VecCells v={X[tok]} label="x" max={1} />
          </div>
          <span className="font-mono text-xl text-ivory/50">×</span>
          <MatrixView m={k.W} label={`W_${k.id}`} color={k.color} />
          <span className="font-mono text-xl text-ivory/50">=</span>
          <motion.div key={`${tok}-${kind}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <VecCells v={out} label={k.id.toLowerCase()} color={k.color} max={3} />
          </motion.div>
        </div>
        <Formula>
          {k.id.toLowerCase()}[j] = Σᵢ x[i] · W_{k.id}[i][j] → por ejemplo {k.id.toLowerCase()}[0] = {X[tok].map((x, i) => `${fmt(x, 1)}·${fmt(k.W[i][0], 1)}`).join(" + ")} = {fmt(out[0])}
        </Formula>
        <p className="text-xs text-ivory/60">
          Fíjate en <b>W_Q</b>: la fila «acción/estado» tiene un 3.4 en la primera columna. Significa que un verbo como «estaba» acaba con una Query que <i>busca seres vivos</i>. Y <b>W_K</b> hace que «gato» anuncie
          justo eso en su Key. En un modelo real estas matrices no se escriben a mano: se aprenden durante el entrenamiento y tienen miles de dimensiones.
        </p>
      </Card>

      <Card title="Todos a la vez">
        <div className="grid gap-3 overflow-x-auto sm:grid-cols-3">
          {KINDS.map((kk) => (
            <div key={kk.id}>
              <div className="mb-1 font-mono text-xs" style={{ color: kk.color }}>
                {kk.id} = X · W_{kk.id}
              </div>
              <div className="grid gap-0.5">
                {TOKENS.map((t, i) => (
                  <div key={t + i} className={`flex items-center gap-1 rounded ${i === tok ? "ring-1 ring-clay" : ""}`}>
                    <span className="w-14 shrink-0 truncate text-right font-serif text-[11px] text-ivory/60">{t}</span>
                    <VecCells v={kk.M[i]} max={3} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
