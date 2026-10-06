"use client";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { TOKENS, attentionMatrix } from "./math";
import { useSceneContext } from "./bits";

const W = 900;
const BASE = 210;
const xOf = (i: number) => 50 + i * 100;

export default function StepProblem() {
  const guide = useGuide();
  const A = useMemo(() => attentionMatrix(), []);
  const [hover, setHover] = useState(7);
  const [guess, setGuess] = useState<number | null>(null);
  const saidRef = useRef(false);

  const row = A[hover];
  const top = row.map((w, j) => ({ w, j })).sort((a, b) => b.w - a.w)[0];

  useSceneContext(
    `Paso 1 (el problema). Frase: "${TOKENS.join(" ")}". El usuario mira el token "${TOKENS[hover]}"; su atención va sobre todo a "${TOKENS[top.j]}" (${(top.w * 100).toFixed(0)}%). Pesos: ${row.map((w, j) => `${TOKENS[j]}=${(w * 100).toFixed(0)}%`).join(", ")}.`,
  );

  const pick = (i: number) => {
    setHover(i);
    if (i === 7 && !saidRef.current && guess !== null) {
      saidRef.current = true;
      guide.say("¿Lo ves? «estaba» manda casi dos tercios de su atención a «gato». Así el modelo resuelve a quién se refiere.", "surprised");
    }
  };

  const answer = (j: number) => {
    setGuess(j);
    setHover(7);
    saidRef.current = true;
    guide.say(
      j === 1
        ? "¡Exacto! Tú lo sabes porque los gatos se cansan y las calles no. La atención es el mecanismo que le permite al modelo hacer esa conexión."
        : "Mmm, las calles no suelen cansarse. Mira las flechas: el modelo conecta «estaba» con «gato».",
      j === 1 ? "happy" : "thinking",
    );
  };

  return (
    <div className="grid gap-4">
      <Card title="¿Quién estaba cansado?">
        <p>
          Lee la frase: <em className="text-clay-light">«El gato no cruzó la calle porque estaba cansado»</em>. Para ti es obvio quién estaba cansado. Pero un modelo procesa cada palabra como un vector de números…
          ¿cómo sabe que <b>estaba</b> se refiere a <b>gato</b> y no a <b>calle</b>? Necesita que cada palabra pueda <b>mirar a las demás</b> y coger información de ellas. Eso es la <b>atención</b>.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-ivory/60">¿A quién se refiere «estaba»?</span>
          {[1, 5].map((j) => (
            <button
              key={j}
              onClick={() => answer(j)}
              className={`rounded-lg px-3 py-1 font-serif transition ${guess === j ? (j === 1 ? "bg-olive text-night" : "bg-rose text-night") : "bg-ivory/5 hover:bg-ivory/10"}`}
            >
              {TOKENS[j]}
            </button>
          ))}
        </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-ivory/10 bg-gradient-to-b from-night to-panel p-2">
        <svg viewBox={`0 0 ${W} 250`} className="w-full select-none">
          {row.map((w, j) => {
            if (j === hover) return null;
            const x1 = xOf(hover);
            const x2 = xOf(j);
            const h = 30 + Math.abs(x2 - x1) * 0.23;
            const d = `M ${x1} ${BASE - 22} Q ${(x1 + x2) / 2} ${BASE - 22 - h * 1.6} ${x2} ${BASE - 22}`;
            const midY = BASE - 22 - h * 0.8;
            return (
              <g key={j}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke="#D97757"
                  strokeLinecap="round"
                  initial={false}
                  animate={{ strokeWidth: 1 + w * 22, opacity: 0.15 + w * 1.4 }}
                  transition={{ duration: 0.35 }}
                />
                {w > 0.06 && (
                  <text x={(x1 + x2) / 2} y={midY - 4} textAnchor="middle" className="fill-clay-light font-mono" fontSize={15}>
                    {(w * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}
          {TOKENS.map((t, i) => {
            const active = i === hover;
            return (
              <g key={t + i} onMouseEnter={() => pick(i)} onClick={() => pick(i)} className="cursor-pointer">
                <rect x={xOf(i) - 46} y={BASE - 20} width={92} height={40} rx={10} fill={active ? "#D97757" : "rgba(240,238,230,0.06)"} stroke={active ? "#E8A387" : "rgba(240,238,230,0.15)"} />
                <text x={xOf(i)} y={BASE + 6} textAnchor="middle" fontSize={19} className="font-serif" fill={active ? "#141413" : "#F0EEE6"}>
                  {t}
                </text>
                {!active && <rect x={xOf(i) - 30} y={BASE + 24} width={60 * row[i] * 1.5} height={4} rx={2} fill="#E8A387" opacity={0.7} />}
              </g>
            );
          })}
        </svg>
        <p className="px-2 pb-1 text-center text-xs text-ivory/50">Pasa el ratón (o toca) cada palabra. El grosor de cada arco = cuánta atención le presta a esa palabra.</p>
      </div>

      <Card>
        Ahora mismo <b className="text-clay">{TOKENS[hover]}</b> presta más atención a <b className="text-clay">{TOKENS[top.j]}</b> ({(top.w * 100).toFixed(0)}%). Todos los porcentajes de una palabra suman 100%: es un
        «presupuesto» de atención que reparte entre las demás. En los siguientes pasos vas a ver de dónde salen <b>exactamente</b> esos números.
      </Card>
    </div>
  );
}
