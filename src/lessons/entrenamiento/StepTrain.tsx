"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Slider, Stage, PALETTE } from "@/components/ui";
import { BEST, POINTS, fmt, mse, mseGrad } from "./data";
import { say, setContext } from "./guide";

export const TRAIN_START = { m: -0.5, b: 6 };

const W = 460;
const H = 200;
const PAD = 34;
const LOG_MIN = -1.5;
const LOG_MAX = 3.5;

export default function StepTrain({
  m,
  b,
  setM,
  setB,
}: {
  m: number;
  b: number;
  setM: (v: number) => void;
  setB: (v: number) => void;
}) {
  const [lr, setLr] = useState(0.02);
  const [perTick, setPerTick] = useState(2);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<number[]>(() => [mse(m, b)]);
  const cur = useRef({ m, b });
  const flags = useRef({ div: false, conv: false });

  useEffect(() => {
    cur.current = { m, b };
  }, [m, b]);

  const reset = () => {
    setRunning(false);
    cur.current = { ...TRAIN_START };
    setM(TRAIN_START.m);
    setB(TRAIN_START.b);
    setHistory([mse(TRAIN_START.m, TRAIN_START.b)]);
    flags.current = { div: false, conv: false };
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      let { m: cm, b: cb } = cur.current;
      const losses: number[] = [];
      for (let i = 0; i < perTick; i++) {
        const { gm, gb } = mseGrad(cm, cb);
        cm -= lr * gm;
        cb -= lr * gb;
        losses.push(mse(cm, cb));
      }
      const last = losses[losses.length - 1];
      if (!Number.isFinite(last) || last > 1e9) {
        setRunning(false);
        if (!flags.current.div) {
          flags.current.div = true;
          say("¡Boom! El error se disparó a infinito: la tasa de aprendizaje es tan grande que cada paso se pasa del valle y empeora. Reinicia y baja la tasa.", "surprised");
        }
        setHistory((h) => [...h, 1e9]);
        return;
      }
      cur.current = { m: cm, b: cb };
      setM(cm);
      setB(cb);
      setHistory((h) => [...h, ...losses].slice(-1500));
      if (last < BEST.loss + 0.02 && !flags.current.conv) {
        flags.current.conv = true;
        setRunning(false);
        say(`¡Convergió! La recta aprendió sola: m = ${fmt(cm)}, b = ${fmt(cb)} y pérdida ${fmt(last, 3)}. Sin que yo tocara nada, solo siguiendo el gradiente.`, "happy");
      }
    }, 60);
    return () => clearInterval(id);
  }, [running, lr, perTick, setM, setB]);

  const loss = mse(m, b);
  const epochs = history.length - 1;

  useEffect(() => {
    setContext(
      `Paso 4 · Entrenamiento real de la recta con descenso de gradiente. Tasa de aprendizaje ${fmt(lr, 3)}. Época ${epochs}, m=${fmt(m)}, b=${fmt(b)}, ` +
        `pérdida ${fmt(loss, 3)} (mínimo posible ${fmt(BEST.loss, 3)}). ${running ? "Entrenando." : "Parado."} Con tasa > ~0.033 este problema diverge.`,
    );
  }, [lr, epochs, m, b, loss, running]);

  // gráfico de la recta
  const gx = (x: number) => 20 + (x / 10) * (W - 40);
  const gy = (y: number) => H - 20 - ((y + 1) / 12) * (H - 40);
  // curva de pérdida (escala log)
  const n = history.length;
  const cx = (i: number) => PAD + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD - 10));
  const cy = (v: number) => {
    const l = Math.min(LOG_MAX, Math.max(LOG_MIN, Math.log10(Math.max(v, 1e-9))));
    return 12 + (1 - (l - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (H - 36);
  };
  const path = history.map((v, i) => `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)},${cy(v).toFixed(1)}`).join(" ");

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        <Stage height={230} className="p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
            <line x1={gx(0)} x2={gx(10)} y1={gy(0)} y2={gy(0)} stroke="#F0EEE6" strokeOpacity={0.2} />
            {POINTS.map((p, i) => (
              <circle key={i} cx={gx(p.x)} cy={gy(p.y)} r={4} fill={PALETTE.sand} />
            ))}
            <line x1={gx(0)} y1={gy(BEST.b)} x2={gx(10)} y2={gy(BEST.m * 10 + BEST.b)} stroke={PALETTE.olive} strokeOpacity={0.6} strokeDasharray="5 4" />
            <line x1={gx(0)} y1={gy(b)} x2={gx(10)} y2={gy(m * 10 + b)} stroke={PALETTE.clay} strokeWidth={3} strokeLinecap="round" />
            <text x={W - 10} y={14} textAnchor="end" fontSize={10} fill={PALETTE.olive}>╌ solución exacta</text>
            <text x={W - 10} y={28} textAnchor="end" fontSize={10} fill={PALETTE.clay}>━ tu recta entrenándose</text>
          </svg>
        </Stage>
        <Stage height={230} className="p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
            {[-1, 0, 1, 2, 3].map((e) => (
              <g key={e}>
                <line x1={PAD} x2={W - 10} y1={cy(10 ** e)} y2={cy(10 ** e)} stroke="#F0EEE6" strokeOpacity={0.08} />
                <text x={PAD - 5} y={cy(10 ** e) + 3} fontSize={9} textAnchor="end" fill="#F0EEE6" fillOpacity={0.5}>
                  {e < 0 ? "0.1" : 10 ** e}
                </text>
              </g>
            ))}
            <line x1={PAD} x2={W - 10} y1={cy(BEST.loss)} y2={cy(BEST.loss)} stroke={PALETTE.olive} strokeDasharray="4 3" strokeOpacity={0.7} />
            <path d={path} fill="none" stroke={PALETTE.rose} strokeWidth={2} />
            <text x={PAD + 4} y={H - 4} fontSize={10} fill="#F0EEE6" fillOpacity={0.6}>épocas → {epochs}</text>
            <text x={W - 10} y={12} textAnchor="end" fontSize={10} fill="#F0EEE6" fillOpacity={0.6}>pérdida (escala log)</text>
          </svg>
        </Stage>
      </div>
      <div className="space-y-4">
        <Card title="Entrena la recta del paso 1">
          <p className="mb-3">
            Una <b>época</b> = una pasada por todos los datos + un paso de descenso de gradiente: calculamos ∂MSE/∂m y ∂MSE/∂b y movemos
            la recta un poquito en contra.
          </p>
          <div className="space-y-3">
            <Slider label="Tasa de aprendizaje" value={lr} min={0.001} max={0.05} step={0.001} onChange={setLr} format={(v) => v.toFixed(3)} />
            <Slider label="Épocas por tic" value={perTick} min={1} max={20} step={1} onChange={setPerTick} format={(v) => String(v)} color={PALETTE.sky} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setRunning((r) => !r)}>{running ? "Pausar" : "Entrenar"}</Button>
            <Button variant="ghost" onClick={reset}>Reiniciar</Button>
          </div>
        </Card>
        <Card title="Estado">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div>época: <span className="text-clay-light">{epochs}</span></div>
            <div>pérdida: <span className="text-clay-light">{fmt(loss, 3)}</span></div>
            <div>m: <span className="text-clay-light">{fmt(m, 3)}</span> <span className="text-ivory/40">→ {fmt(BEST.m, 2)}</span></div>
            <div>b: <span className="text-clay-light">{fmt(b, 3)}</span> <span className="text-ivory/40">→ {fmt(BEST.b, 2)}</span></div>
          </div>
          <p className="mt-3">
            La curva baja rápido al principio (pendiente fuerte) y luego se aplana (el valle es casi plano). Prueba una tasa de 0.040: ¡el
            error explota en vez de bajar! Las redes reales hacen exactamente esto, pero con miles de millones de parámetros.
          </p>
        </Card>
      </div>
    </div>
  );
}
