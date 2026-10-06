"use client";
import { useEffect, useState } from "react";
import { Card, Slider, PALETTE } from "@/components/ui";
import { useGuideStore } from "@/lib/guide-store";

type Part = "entrada" | "peso" | "suma" | "activacion" | "salida";

const PARTS: { id: Part; bio: string; art: string; text: string; color: string }[] = [
  { id: "entrada", bio: "Dendritas", art: "Entradas (x)", color: PALETTE.sky, text: "Las dendritas reciben señales de otras neuronas. En la neurona artificial son simplemente números: x₁, x₂, x₃." },
  { id: "peso", bio: "Sinapsis", art: "Pesos (w)", color: PALETTE.sand, text: "Cada sinapsis puede ser fuerte o débil, excitadora o inhibidora. En la artificial, cada entrada se multiplica por un peso: grande = importa mucho, negativo = resta." },
  { id: "suma", bio: "Cuerpo celular", art: "Suma ponderada + sesgo (Σ)", color: PALETTE.clay, text: "El cuerpo celular acumula todas las señales. La artificial suma x·w de cada entrada y añade un sesgo b, una especie de «predisposición»." },
  { id: "activacion", bio: "Umbral de disparo", art: "Función de activación (f)", color: PALETTE.rose, text: "La neurona biológica solo dispara si la carga supera un umbral. La artificial pasa la suma por una función f que decide cuánto «se enciende»." },
  { id: "salida", bio: "Axón", art: "Salida (y)", color: PALETTE.olive, text: "El axón lleva el disparo a otras neuronas. La salida y de la neurona artificial se convierte en la entrada de las siguientes." },
];

const DENDRITES = [
  "M10,60 C40,70 60,100 95,135",
  "M15,150 C40,150 60,150 92,150",
  "M10,240 C40,230 60,200 95,165",
];
const AXON = "M135,150 C170,150 200,150 290,150";

export default function Anatomy() {
  const [part, setPart] = useState<Part>("entrada");
  const [stim, setStim] = useState(0.7);
  const setContext = useGuideStore((s) => s.setSceneContext);
  const fires = stim >= 0.5;
  const info = PARTS.find((p) => p.id === part)!;
  const hl = (p: Part) => (part === p ? info.color : undefined);

  useEffect(() => {
    setContext(`Paso 1 (anatomía): comparando neurona biológica y artificial. Parte resaltada: ${info.bio} ↔ ${info.art}. Fuerza del estímulo ${stim.toFixed(2)} (umbral 0.5): ${fires ? "la neurona dispara" : "no llega al umbral, no dispara"}.`);
  }, [info, stim, fires, setContext]);

  const dur = 1.6 - stim; // estímulos más fuertes viajan más rápido

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Neurona biológica">
          <svg viewBox="0 0 320 300" className="w-full">
            {DENDRITES.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={hl("entrada") ?? "#8A8A85"} strokeWidth={part === "entrada" ? 5 : 3} strokeLinecap="round" className="cursor-pointer" onClick={() => setPart("entrada")} />
            ))}
            {[[95, 135], [92, 150], [95, 165]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={part === "peso" ? 7 : 5} fill={hl("peso") ?? "#b5a77a"} className="cursor-pointer" onClick={() => setPart("peso")} />
            ))}
            <circle cx={112} cy={150} r={30} fill={fires ? "#3a2a22" : "#2a2925"} stroke={hl("suma") ?? hl("activacion") ?? "#8A8A85"} strokeWidth={part === "suma" || part === "activacion" ? 5 : 2} className="cursor-pointer" onClick={() => setPart(part === "suma" ? "activacion" : "suma")} />
            <circle cx={112} cy={150} r={9} fill={PALETTE.clay} opacity={0.3 + stim * 0.7} />
            <path d={AXON} fill="none" stroke={hl("salida") ?? "#8A8A85"} strokeWidth={part === "salida" ? 6 : 4} className="cursor-pointer" onClick={() => setPart("salida")} />
            {[175, 215, 255].map((x) => (
              <rect key={x} x={x - 14} y={143} width={28} height={14} rx={7} fill="#4a4842" pointerEvents="none" />
            ))}
            {["M290,150 L310,125", "M290,150 L315,150", "M290,150 L310,175"].map((d) => (
              <path key={d} d={d} stroke={hl("salida") ?? "#8A8A85"} strokeWidth={3} />
            ))}
            {DENDRITES.map((d, i) => (
              <circle key={`p${i}-${dur.toFixed(1)}`} r={4} fill={PALETTE.sky}>
                <animateMotion dur={`${dur}s`} begin={`${i * 0.25}s`} repeatCount="indefinite" path={d} />
              </circle>
            ))}
            {fires && (
              <circle key={`ax-${dur.toFixed(1)}`} r={6} fill={PALETTE.clay}>
                <animateMotion dur={`${dur}s`} begin="0.5s" repeatCount="indefinite" path={AXON} />
              </circle>
            )}
            <text x={112} y={205} textAnchor="middle" fill="#F0EEE6" fontSize={12} opacity={0.7}>{fires ? "¡Dispara!" : "Silencio…"}</text>
          </svg>
        </Card>

        <Card title="Neurona artificial">
          <svg viewBox="0 0 320 300" className="w-full">
            {[60, 150, 240].map((y, i) => (
              <g key={y}>
                <line x1={52} y1={y} x2={185} y2={150} stroke={hl("peso") ?? "#8A8A85"} strokeWidth={part === "peso" ? 5 : 2.5} className="cursor-pointer" onClick={() => setPart("peso")} />
                <text x={110} y={y + (150 - y) * 0.45 - 6} fill={PALETTE.sand} fontSize={13} fontFamily="monospace">w{"₁₂₃"[i]}</text>
                <circle cx={36} cy={y} r={18} fill="#2a2925" stroke={hl("entrada") ?? "#8A8A85"} strokeWidth={part === "entrada" ? 4 : 2} className="cursor-pointer" onClick={() => setPart("entrada")} />
                <text x={36} y={y + 5} textAnchor="middle" fill="#F0EEE6" fontSize={14} pointerEvents="none">x{"₁₂₃"[i]}</text>
                <circle key={`ap${i}-${dur.toFixed(1)}`} r={4} fill={PALETTE.sky}>
                  <animateMotion dur={`${dur}s`} begin={`${i * 0.25}s`} repeatCount="indefinite" path={`M52,${y} L185,150`} />
                </circle>
              </g>
            ))}
            <g className="cursor-pointer" onClick={() => setPart("suma")}>
              <path d="M185,110 A40,40 0 0 0 185,190 Z" fill={fires ? "#3a2a22" : "#2a2925"} stroke={hl("suma") ?? "#8A8A85"} strokeWidth={part === "suma" ? 4 : 2} />
              <text x={170} y={157} textAnchor="middle" fill="#F0EEE6" fontSize={22}>Σ</text>
            </g>
            <g className="cursor-pointer" onClick={() => setPart("activacion")}>
              <path d="M185,110 A40,40 0 0 1 185,190 Z" fill={fires ? "#4a2e22" : "#2a2925"} stroke={hl("activacion") ?? "#8A8A85"} strokeWidth={part === "activacion" ? 4 : 2} />
              <text x={202} y={157} textAnchor="middle" fill="#F0EEE6" fontSize={20} fontStyle="italic">f</text>
            </g>
            <line x1={225} y1={150} x2={300} y2={150} stroke={hl("salida") ?? "#8A8A85"} strokeWidth={part === "salida" ? 5 : 3} className="cursor-pointer" onClick={() => setPart("salida")} />
            <polygon points="300,143 314,150 300,157" fill={hl("salida") ?? "#8A8A85"} />
            <text x={270} y={140} textAnchor="middle" fill="#F0EEE6" fontSize={14}>y</text>
            {fires && (
              <circle key={`aout-${dur.toFixed(1)}`} r={6} fill={PALETTE.clay}>
                <animateMotion dur={`${dur}s`} begin="0.5s" repeatCount="indefinite" path="M225,150 L300,150" />
              </circle>
            )}
            <text x={185} y={215} textAnchor="middle" fill="#F0EEE6" fontSize={12} opacity={0.7}>y = f(w₁x₁ + w₂x₂ + w₃x₃ + b)</text>
          </svg>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card title="¿Qué es cada pieza?">
          <div className="mb-3 flex flex-wrap gap-2">
            {PARTS.map((p) => (
              <button key={p.id} onClick={() => setPart(p.id)} className={`rounded-full px-3 py-1 text-xs transition ${part === p.id ? "text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`} style={part === p.id ? { background: p.color } : undefined}>
                {p.bio} ↔ {p.art}
              </button>
            ))}
          </div>
          <p>{info.text}</p>
          <p className="mt-2 text-xs text-ivory/50">Pista: también puedes hacer clic directamente en los dibujos.</p>
        </Card>
        <Card title="Estimula la neurona">
          <Slider label="Fuerza del estímulo" value={stim} min={0} max={1} onChange={setStim} />
          <p className="mt-3">
            Umbral: <span className="font-mono text-clay">0.50</span>. {fires ? "Supera el umbral: la señal sale por el axón." : "No llega al umbral: las señales entran, pero nada sale."}
          </p>
          <p className="mt-2 text-xs text-ivory/50">La neurona artificial es una caricatura matemática de la real: mucho más simple, pero si juntas miles de millones, ¡pasan cosas asombrosas!</p>
        </Card>
      </div>
    </div>
  );
}
