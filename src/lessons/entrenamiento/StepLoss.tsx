"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Formula, Slider, Stage, Button, PALETTE } from "@/components/ui";
import { BEST, POINTS, fmt, mse } from "./data";
import { say, setContext } from "./guide";

// Coordenadas del gráfico
const W = 460;
const H = 320;
const PAD = 36;
const X_MAX = 10;
const Y_MIN = -1;
const Y_MAX = 11;
const sx = (x: number) => PAD + (x / X_MAX) * (W - PAD * 1.5);
const sy = (y: number) => H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD * 1.5);
const unitY = (H - PAD * 1.5) / (Y_MAX - Y_MIN); // píxeles por unidad vertical

export default function StepLoss({
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
  const [squares, setSquares] = useState(false);
  const solved = useRef(false);
  const loss = mse(m, b);
  const residuals = POINTS.map((p) => m * p.x + b - p.y);
  const maxBar = Math.max(4, loss);

  useEffect(() => {
    setContext(
      `Paso 1 · Función de pérdida. Recta del usuario: y = ${fmt(m)}·x + ${fmt(b)}. ` +
        `Error cuadrático medio (MSE) = ${fmt(loss, 3)} sobre 12 puntos. ` +
        `La mejor recta posible es y = ${fmt(BEST.m)}·x + ${fmt(BEST.b)} con MSE = ${fmt(BEST.loss, 3)}. ` +
        `Cuadrados visibles: ${squares ? "sí" : "no"}.`,
    );
  }, [m, b, loss, squares]);

  useEffect(() => {
    if (!solved.current && loss < BEST.loss + 0.12) {
      solved.current = true;
      say(
        `¡Qué buena puntería! Tu error es ${fmt(loss, 3)}, casi el mínimo posible (${fmt(BEST.loss, 3)}). Eso que acabas de hacer a mano es justo lo que una red hace sola al entrenar.`,
        "happy",
      );
    }
  }, [loss]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Stage height={360} className="p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
          <defs>
            <clipPath id="plot-clip">
              <rect x={PAD} y={PAD / 2} width={W - PAD * 1.5} height={H - PAD * 1.5} />
            </clipPath>
          </defs>
          {/* rejilla */}
          {Array.from({ length: 11 }, (_, i) => (
            <g key={`gx${i}`}>
              <line x1={sx(i)} x2={sx(i)} y1={sy(Y_MIN)} y2={sy(Y_MAX)} stroke="#F0EEE6" strokeOpacity={0.06} />
              <text x={sx(i)} y={H - PAD + 14} fontSize={9} fill="#F0EEE6" fillOpacity={0.45} textAnchor="middle">
                {i}
              </text>
            </g>
          ))}
          {Array.from({ length: 12 }, (_, i) => i + Y_MIN).map((v) => (
            <g key={`gy${v}`}>
              <line x1={sx(0)} x2={sx(X_MAX)} y1={sy(v)} y2={sy(v)} stroke="#F0EEE6" strokeOpacity={v === 0 ? 0.25 : 0.06} />
              {v % 2 === 0 && (
                <text x={PAD - 6} y={sy(v) + 3} fontSize={9} fill="#F0EEE6" fillOpacity={0.45} textAnchor="end">
                  {v}
                </text>
              )}
            </g>
          ))}
          <text x={W - PAD / 2} y={H - 6} fontSize={10} fill="#F0EEE6" fillOpacity={0.6} textAnchor="end">
            horas de estudio (x)
          </text>
          <text x={PAD} y={12} fontSize={10} fill="#F0EEE6" fillOpacity={0.6}>
            nota (y)
          </text>

          <g clipPath="url(#plot-clip)">
            {/* cuadrados del error */}
            {squares &&
              POINTS.map((p, i) => {
                const e = residuals[i];
                const side = Math.abs(e) * unitY;
                const top = Math.max(p.y, p.y + e);
                return (
                  <rect
                    key={`sq${i}`}
                    x={sx(p.x)}
                    y={sy(top)}
                    width={side}
                    height={side}
                    fill={PALETTE.rose}
                    fillOpacity={0.18}
                    stroke={PALETTE.rose}
                    strokeOpacity={0.5}
                  />
                );
              })}
            {/* barras de error */}
            {POINTS.map((p, i) => (
              <line
                key={`r${i}`}
                x1={sx(p.x)}
                x2={sx(p.x)}
                y1={sy(p.y)}
                y2={sy(p.y + residuals[i])}
                stroke={residuals[i] > 0 ? PALETTE.rose : PALETTE.sky}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            ))}
            {/* la recta */}
            <line x1={sx(0)} y1={sy(b)} x2={sx(X_MAX)} y2={sy(m * X_MAX + b)} stroke={PALETTE.clay} strokeWidth={3} strokeLinecap="round" />
          </g>
          {POINTS.map((p, i) => (
            <circle key={`p${i}`} cx={sx(p.x)} cy={sy(p.y)} r={5} fill={PALETTE.sand} stroke={PALETTE.night} strokeWidth={1.5} />
          ))}
        </svg>
      </Stage>

      <div className="space-y-4">
        <Card title="Ajusta la recta">
          <p className="mb-3">
            Tenemos 12 alumnos: cuántas horas estudiaron y qué nota sacaron. Queremos una recta{" "}
            <span className="font-mono text-clay-light">ŷ = m·x + b</span> que prediga la nota. ¿Cómo sabemos si una recta es
            buena? <b>Midiendo cuánto se equivoca.</b>
          </p>
          <div className="space-y-3">
            <Slider label="Pendiente m" value={m} min={-1} max={2.5} onChange={setM} />
            <Slider label="Ordenada b" value={b} min={-3} max={7} onChange={setB} color={PALETTE.sky} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setSquares((s) => !s)}>
              {squares ? "Ocultar cuadrados" : "Ver los errores al cuadrado"}
            </Button>
          </div>
        </Card>
        <Card title="La función de pérdida (MSE)">
          <Formula>MSE = (1/12) · Σ (ŷᵢ − yᵢ)²</Formula>
          <Formula>
            = <span className="text-ivory">{fmt(loss, 3)}</span>
          </Formula>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-ivory/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (loss / maxBar) * 100)}%`,
                background: loss < BEST.loss + 0.12 ? PALETTE.olive : PALETTE.clay,
              }}
            />
          </div>
          <p className="mt-3">
            Cada barra discontinua es un error (predicción − realidad). Lo elevamos al cuadrado para que los errores negativos no
            cancelen a los positivos y para castigar más los errores grandes. Un error de 2 cuenta <b>4</b>; uno de 3, <b>9</b>.
          </p>
          <p className="mt-2 text-ivory/60">
            🎯 Reto: baja el error por debajo de {fmt(BEST.loss + 0.12, 2)}. (El mínimo posible es {fmt(BEST.loss, 3)}.)
          </p>
        </Card>
      </div>
    </div>
  );
}
