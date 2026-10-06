"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Slider, Stage, PALETTE } from "@/components/ui";
import { fmt } from "./data";
import { say, setContext } from "./guide";

const X = 2;
const Y = 2;
const LR = 0.1;

interface N {
  id: string;
  x: number;
  y: number;
  label: string;
  fwd: number; // fase en la que aparece su valor
  bwd: number; // fase en la que aparece su gradiente
  value: number;
  grad: number;
  op?: boolean;
}

const PHASES = [
  "Pulsa «Siguiente» para empezar",
  "Hacia delante: a = x · w",
  "Hacia delante: c = a + b",
  "Hacia delante: d = c − y",
  "Hacia delante: L = d²  (¡esa es la pérdida!)",
  "Hacia atrás: ∂L/∂L = 1",
  "Hacia atrás: ∂L/∂d = 2d",
  "Hacia atrás: pasa por la resta y la suma sin cambiar",
  "Hacia atrás: llega a b y a",
  "Hacia atrás: ∂L/∂w = ∂L/∂a · x  → ¡el gradiente que buscábamos!",
];

const loss = (w: number, b: number) => (X * w + b - Y) ** 2;

export default function StepBackprop() {
  const [w, setW] = useState(0.5);
  const [b, setB] = useState(0.3);
  const [phase, setPhase] = useState(0);
  const [auto, setAuto] = useState(false);
  const toldDone = useRef(false);

  const a = X * w;
  const c = a + b;
  const d = c - Y;
  const L = d * d;
  const gd = 2 * d;
  const gw = gd * X;
  const gx = gd * w;
  const eps = 1e-5;
  const numW = (loss(w + eps, b) - loss(w, b)) / eps;

  const nodes: N[] = [
    { id: "x", x: 50, y: 50, label: "x", fwd: 1, bwd: 9, value: X, grad: gx },
    { id: "w", x: 50, y: 135, label: "w", fwd: 1, bwd: 9, value: w, grad: gw },
    { id: "mul", x: 165, y: 92, label: "×", fwd: 1, bwd: 8, value: a, grad: gd, op: true },
    { id: "b", x: 200, y: 215, label: "b", fwd: 2, bwd: 8, value: b, grad: gd },
    { id: "add", x: 290, y: 130, label: "+", fwd: 2, bwd: 7, value: c, grad: gd, op: true },
    { id: "y", x: 400, y: 215, label: "y", fwd: 3, bwd: 7, value: Y, grad: -gd },
    { id: "sub", x: 410, y: 130, label: "−", fwd: 3, bwd: 6, value: d, grad: gd, op: true },
    { id: "sq", x: 530, y: 130, label: "²", fwd: 4, bwd: 5, value: L, grad: 1, op: true },
  ];
  const edges: [string, string, number, number][] = [
    ["x", "mul", 1, 9],
    ["w", "mul", 1, 9],
    ["mul", "add", 2, 8],
    ["b", "add", 2, 8],
    ["add", "sub", 3, 7],
    ["y", "sub", 3, 7],
    ["sub", "sq", 4, 6],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  useEffect(() => {
    if (!auto || phase >= 9) return;
    const t = setTimeout(() => setPhase((p) => p + 1), 900);
    return () => clearTimeout(t);
  }, [auto, phase]);

  useEffect(() => {
    if (phase === 4) say(`Pasada hacia delante terminada: con w = ${fmt(w)} y b = ${fmt(b)} la pérdida es ${fmt(L, 3)}. Ahora vamos hacia atrás a preguntar a cada pieza: «¿cuánto tienes tú de culpa?»`, "explaining");
    if (phase === 9 && !toldDone.current) {
      toldDone.current = true;
      say(`Eso es backpropagation: la regla de la cadena multiplicando derivadas locales de derecha a izquierda. Resultado: ∂L/∂w = ${fmt(gw, 3)}. Subir w aumenta el error, así que w debe bajar.`, "happy");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    setContext(
      `Paso 3 · Backpropagation en el grafo f = (x·w + b − y)² con x=${X}, y=${Y}, w=${fmt(w)}, b=${fmt(b)}. ` +
        `Hacia delante: a=${fmt(a)}, c=${fmt(c)}, d=${fmt(d)}, L=${fmt(L, 3)}. Hacia atrás: ∂L/∂d=${fmt(gd, 3)}, ∂L/∂w=${fmt(gw, 3)}, ∂L/∂b=${fmt(gd, 3)}. ` +
        `Fase de la animación: ${phase}/9 (${PHASES[phase]}). Derivada numérica de comprobación de ∂L/∂w: ${fmt(numW, 3)}.`,
    );
  }, [w, b, phase, a, c, d, L, gd, gw, numW]);

  const step = () => {
    setW((v) => v - LR * gw);
    setB((v) => v - LR * gd);
    setPhase(0);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-3">
        <Stage height={290} className="p-2">
          <svg viewBox="0 0 600 270" className="h-full w-full">
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#F0EEE6" fillOpacity={0.5} />
              </marker>
            </defs>
            {edges.map(([f, t, pf, pb]) => {
              const A = byId[f];
              const B = byId[t];
              const fwdOn = phase >= pf;
              const bwdOn = phase >= pb;
              const active = phase === pf || phase === pb;
              return (
                <g key={f + t}>
                  <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#F0EEE6" strokeOpacity={0.12} strokeWidth={2} />
                  {fwdOn && (
                    <motion.line
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                      stroke={PALETTE.sky}
                      strokeWidth={active && phase <= 4 ? 4 : 2}
                    />
                  )}
                  {bwdOn && (
                    <motion.line
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      x1={B.x} y1={B.y} x2={A.x} y2={A.y}
                      stroke={PALETTE.rose}
                      strokeWidth={active && phase > 4 ? 4 : 2}
                      strokeDasharray="6 4"
                      transform="translate(0,5)"
                    />
                  )}
                </g>
              );
            })}
            {nodes.map((n) => {
              const showV = phase >= n.fwd;
              const showG = phase >= n.bwd;
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={n.op ? 20 : 17} fill={n.op ? PALETTE.panel : PALETTE.night} stroke={n.op ? PALETTE.clay : PALETTE.sand} strokeWidth={2} />
                  <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={n.op ? 18 : 14} fill="#F0EEE6" fontFamily="monospace">
                    {n.label}
                  </text>
                  {showV && (
                    <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={n.x} y={n.y - 27} textAnchor="middle" fontSize={12} fill={PALETTE.sky} fontFamily="monospace">
                      {fmt(n.value)}
                    </motion.text>
                  )}
                  {showG && (
                    <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={n.x} y={n.y + 38} textAnchor="middle" fontSize={12} fill={PALETTE.rose} fontFamily="monospace">
                      ∂ {fmt(n.grad)}
                    </motion.text>
                  )}
                </g>
              );
            })}
            <text x={530} y={84} textAnchor="middle" fontSize={11} fill="#F0EEE6" fillOpacity={0.6}>pérdida L</text>
            <text x={10} y={262} fontSize={11} fill={PALETTE.sky}>━ valores hacia delante</text>
            <text x={190} y={262} fontSize={11} fill={PALETTE.rose}>╌ gradientes hacia atrás (∂L/∂·)</text>
          </svg>
        </Stage>
        <div className="rounded-xl bg-night/60 px-4 py-2 text-center text-sm text-clay-light">{PHASES[phase]}</div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setPhase((p) => Math.min(9, p + 1))} disabled={phase >= 9}>Siguiente</Button>
          <Button variant="outline" onClick={() => { setPhase(0); setAuto(true); }}>▶ Animar todo</Button>
          <Button variant="ghost" onClick={() => { setPhase(0); setAuto(false); }}>Reiniciar</Button>
          <Button variant="ghost" onClick={step} disabled={phase < 9} title="w ← w − 0.1·∂L/∂w">Dar un paso de descenso</Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card title="Un grafo computacional">
          <p className="mb-3">
            Una red es una cadena de operaciones sencillas. Aquí: <span className="font-mono text-clay-light">L = (x·w + b − y)²</span>{" "}
            con x = {X} e y = {Y}. Cambia w y b y mira cómo se recalculan los números.
          </p>
          <div className="space-y-3">
            <Slider label="Peso w" value={w} min={-1} max={2} onChange={(v) => { setW(v); }} />
            <Slider label="Sesgo b" value={b} min={-1} max={2} onChange={setB} color={PALETTE.sky} />
          </div>
        </Card>
        <Card title="La regla de la cadena, con números">
          <p className="mb-2">
            Para saber cuánto influye <b>w</b> en <b>L</b> multiplicamos las derivadas de cada eslabón:
          </p>
          <div className="rounded-lg bg-night/60 p-3 font-mono text-xs leading-6 text-ivory/90">
            <div>∂L/∂w = ∂L/∂d · ∂d/∂c · ∂c/∂a · ∂a/∂w</div>
            <div>
              = <span className="text-rose">2d</span> · <span className="text-sand">1</span> · <span className="text-sand">1</span> · <span className="text-sky">x</span>
            </div>
            <div>
              = 2·({fmt(d)}) · 1 · 1 · {X} = <span className="text-clay-light">{fmt(gw, 3)}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-ivory/60">
            Comprobación: empujar w un poquito y medir cuánto cambia L da {fmt(numW, 3)}. ¡Coincide! Backprop obtiene el mismo número
            sin probar peso por peso, con una sola pasada hacia atrás. Por eso se puede entrenar una red con miles de millones de pesos.
          </p>
        </Card>
      </div>
    </div>
  );
}
